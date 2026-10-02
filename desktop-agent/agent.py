import sys
import os
import json
import time
import threading
import ctypes
from urllib.parse import urlparse, parse_qs
import tkinter as tk
from tkinter import messagebox

import psutil
import requests
import winreg

# ─── Configuration ─────────────────────────────────────────────────────────────
AGENT_SECRET = "fe3f34420dd77f7a20018c30023aefe55d0a9663467991a40ec4b594e23e4d97"
ENDPOINTS = [
    "http://localhost:3000/api/monitor/sync",
    "https://resawc-llp-1-rt4y.vercel.app/api/monitor/sync",
]
ATTENDANCE_ENDPOINTS = [
    "http://localhost:3000/api/attendance",
    "https://resawc-llp-1-rt4y.vercel.app/api/attendance",
]
CONFIG_FILE = os.path.join(os.path.expanduser("~"), ".resawc-agent.json")
PROTOCOL = "resawc-agent"
MUTEX_NAME = "ResawcDesktopAgentSingleInstanceMutex"
STARTUP_REG_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
STARTUP_ENTRY_NAME = "ResawcDesktopAgent"

# Global state for UI updates
app_state = {
    "user_id": "",
    "status": "Initializing...",
    "connected_server": "None",
    "current_app": "Detecting...",
    "idle_time": "0s",
    "last_sync": "Never",
    "checkin_status": "",
    "running": True,
}

_mutex = None


def is_already_running():
    global _mutex
    _mutex = ctypes.windll.kernel32.CreateMutexW(None, True, MUTEX_NAME)
    ERROR_ALREADY_EXISTS = 183
    return ctypes.windll.kernel32.GetLastError() == ERROR_ALREADY_EXISTS


# ─── Windows Telemetry Helpers ─────────────────────────────────────────────────
class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_uint),
        ("dwTime", ctypes.c_uint),
    ]


def get_idle_time():
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        try:
            now_ticks = ctypes.windll.kernel32.GetTickCount64()
            millis = (now_ticks & 0xFFFFFFFF) - lii.dwTime
            if millis < 0:
                millis += 0x100000000
            return max(0, millis / 1000.0)
        except AttributeError:
            millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
            return max(0, millis / 1000.0)
    return 0


def get_active_window_info():
    hwnd = ctypes.windll.user32.GetForegroundWindow()
    if not hwnd:
        return "Desktop", "Desktop"

    length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
    buf = ctypes.create_unicode_buffer(length + 1)
    ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
    title = buf.value

    pid = ctypes.c_ulong()
    ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    try:
        process = psutil.Process(pid.value)
        name = process.name()
    except Exception:
        name = "Unknown"

    return name or "Desktop", title or "Unknown"


# ─── Config Persistence ───────────────────────────────────────────────────────
def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_config(user_id):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump({"userId": user_id}, f)
    except Exception as e:
        print(f"Error saving config: {e}")


# ─── Protocol Handler Registration ───────────────────────────────────────────
def register_protocol():
    exe_path = os.path.abspath(sys.argv[0])
    if exe_path.endswith(".py"):
        command = f'"{sys.executable}" "{exe_path}" "%1"'
    else:
        command = f'"{exe_path}" "%1"'

    try:
        key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, rf"Software\Classes\{PROTOCOL}")
        winreg.SetValue(key, "", winreg.REG_SZ, f"URL:{PROTOCOL} Protocol")
        winreg.SetValueEx(key, "URL Protocol", 0, winreg.REG_SZ, "")

        icon_key = winreg.CreateKey(key, "DefaultIcon")
        winreg.SetValue(icon_key, "", winreg.REG_SZ, f"{exe_path},1")

        command_key = winreg.CreateKey(key, r"shell\open\command")
        winreg.SetValue(command_key, "", winreg.REG_SZ, command)

        winreg.CloseKey(key)
        print(f"Registered protocol {PROTOCOL}:// to {command}")
    except Exception as e:
        print(f"Failed to register protocol: {e}")


# ─── Windows Startup Registration ────────────────────────────────────────────
def register_startup():
    """Add agent to Windows startup so it auto-launches on PC login."""
    exe_path = os.path.abspath(sys.argv[0])
    if exe_path.endswith(".py"):
        command = f'"{sys.executable}" "{exe_path}"'
    else:
        command = f'"{exe_path}"'

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_REG_KEY, 0, winreg.KEY_SET_VALUE)
        winreg.SetValueEx(key, STARTUP_ENTRY_NAME, 0, winreg.REG_SZ, command)
        winreg.CloseKey(key)
        print(f"[Startup] Registered to auto-launch: {command}")
    except Exception as e:
        print(f"[Startup] Failed to register startup: {e}")


def unregister_startup():
    """Remove agent from Windows startup."""
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, STARTUP_REG_KEY, 0, winreg.KEY_SET_VALUE)
        winreg.DeleteValue(key, STARTUP_ENTRY_NAME)
        winreg.CloseKey(key)
        print("[Startup] Removed from auto-launch.")
    except FileNotFoundError:
        pass
    except Exception as e:
        print(f"[Startup] Failed to remove startup: {e}")


# ─── System Check-In on Agent Launch ────────────────────────────────────────
def record_system_checkin(user_id: str):
    """Called once on startup — records systemLoginTime in attendance if not already set today."""
    if not user_id:
        return

    now = time.localtime()
    date_str = time.strftime("%Y-%m-%d", now)
    time_str = time.strftime("%I:%M %p", now)

    payload = {
        "userId": user_id,
        "date": date_str,
        "timeIn": time_str,
        "source": "system",
    }

    for url in ATTENDANCE_ENDPOINTS:
        try:
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    msg = f"System check-in recorded at {time_str}"
                    app_state["checkin_status"] = msg
                    print(f"[Attendance] {msg}")
                    return
                else:
                    err = data.get("error", "Unknown error")
                    # If mobile check-in is required first, show message
                    app_state["checkin_status"] = f"⚠ {err}"
                    print(f"[Attendance] Check-in warning: {err}")
                    return
            elif resp.status_code == 404:
                # No mobile check-in found yet for today
                app_state["checkin_status"] = "⚠ Mark attendance from phone first!"
                print("[Attendance] No mobile check-in found — phone check-in required first.")
                return
        except requests.RequestException:
            continue  # Try next endpoint

    app_state["checkin_status"] = "⚠ Could not connect to attendance server"
    print("[Attendance] Could not reach attendance server on startup.")


# ─── Telemetry Sync Engine ────────────────────────────────────────────────────
def post_telemetry(payload):
    """Posts telemetry trying localhost first, falling back to Vercel, and supporting multiple token variants."""
    auth_tokens = [AGENT_SECRET, "undefined"]

    for url in ENDPOINTS:
        for token in auth_tokens:
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                }
                resp = requests.post(url, json=payload, headers=headers, timeout=4)
                if resp.status_code == 200:
                    short_url = "localhost:3000" if "localhost" in url else "Vercel Cloud"
                    return resp, short_url
                elif resp.status_code == 429:
                    return resp, url
                elif resp.status_code == 403:
                    # Try next token fallback
                    continue
                else:
                    break
            except requests.RequestException:
                # Target endpoint not reachable; try next endpoint
                break

    return None, None


def sync_loop():
    backoff_seconds = 10

    while app_state["running"]:
        # Dynamically reload user ID if changed via web browser login
        cfg = load_config()
        active_user = cfg.get("userId") or app_state["user_id"]
        if active_user:
            app_state["user_id"] = active_user

        if not app_state["user_id"]:
            time.sleep(2)
            continue

        try:
            idle_seconds = get_idle_time()
            app_name, app_title = get_active_window_info()

            status = "Active"
            if idle_seconds > 60:
                status = "Idle"

            idle_str = f"{int(idle_seconds // 60)}m {int(idle_seconds % 60)}s"

            payload = {
                "userId": app_state["user_id"],
                "status": status,
                "currentApp": app_name,
                "appTitle": app_title,
                "idleTime": idle_str,
            }

            app_state["current_app"] = f"{app_name} ({app_title[:25]}...)" if len(app_title) > 25 else f"{app_name} ({app_title})"
            app_state["idle_time"] = idle_str

            resp, target_name = post_telemetry(payload)

            if resp is not None and resp.status_code == 200:
                app_state["status"] = "Active & Syncing"
                app_state["connected_server"] = target_name
                app_state["last_sync"] = time.strftime("%I:%M:%S %p")
                backoff_seconds = 10
            elif resp is not None and resp.status_code == 429:
                retry_after = int(resp.headers.get("Retry-After", backoff_seconds))
                app_state["status"] = f"Rate limited (Retry in {retry_after}s)"
                time.sleep(retry_after)
                backoff_seconds = min(60, backoff_seconds * 2)
                continue
            else:
                app_state["status"] = "Connecting..."
                time.sleep(backoff_seconds)
                backoff_seconds = min(60, backoff_seconds * 2)
                continue

        except Exception as e:
            app_state["status"] = f"Sync Warning: {str(e)[:30]}"
            time.sleep(backoff_seconds)
            backoff_seconds = min(60, backoff_seconds * 2)
            continue

        time.sleep(10)


# ─── Modern GUI Interface ─────────────────────────────────────────────────────
def run_app_gui(initial_user_id=None):
    root = tk.Tk()
    root.title("Resawc Desktop Agent")
    root.geometry("420x360")
    root.resizable(False, False)
    root.configure(bg="#F8FAFC")

    # Font configs
    font_title = ("Segoe UI", 13, "bold")
    font_bold = ("Segoe UI", 9, "bold")
    font_normal = ("Segoe UI", 9)
    font_mono = ("Consolas", 8)

    # Header Card
    header = tk.Frame(root, bg="#1A56DB", height=60)
    header.pack(fill="x", side="top")

    lbl_logo = tk.Label(header, text="◆  Resawc Desktop Agent", bg="#1A56DB", fg="#FFFFFF", font=font_title)
    lbl_logo.pack(pady=14, padx=16, anchor="w")

    # Status Container
    content = tk.Frame(root, bg="#FFFFFF", highlightbackground="#E2E8F0", highlightthickness=1)
    content.pack(fill="both", expand=True, padx=16, pady=12)

    def make_row(parent, label_text):
        row = tk.Frame(parent, bg="#FFFFFF")
        row.pack(fill="x", padx=12, pady=5)
        lbl = tk.Label(row, text=label_text, width=14, anchor="w", bg="#FFFFFF", fg="#64748B", font=font_normal)
        lbl.pack(side="left")
        val = tk.Label(row, text="--", anchor="w", bg="#FFFFFF", fg="#0F172A", font=font_bold)
        val.pack(side="left", fill="x", expand=True)
        return val

    lbl_status_val = make_row(content, "Service Status:")
    lbl_server_val = make_row(content, "Sync Target:")
    lbl_user_val = make_row(content, "User ID:")
    lbl_user_val.configure(font=font_mono)
    lbl_app_val = make_row(content, "Current App:")
    lbl_idle_val = make_row(content, "Idle Time:")
    lbl_sync_val = make_row(content, "Last Sync:")
    lbl_checkin_val = make_row(content, "Attendance:")

    # Footer Action Buttons
    btn_frame = tk.Frame(root, bg="#F8FAFC")
    btn_frame.pack(fill="x", padx=16, pady=(0, 12))

    def on_switch_user():
        input_win = tk.Toplevel(root)
        input_win.title("Switch User ID")
        input_win.geometry("340x160")
        input_win.resizable(False, False)
        input_win.configure(bg="#FFFFFF")
        input_win.grab_set()

        tk.Label(input_win, text="Enter Assigned User ID:", font=font_bold, bg="#FFFFFF", fg="#0F172A").pack(pady=(16, 6))
        entry = tk.Entry(input_win, width=32, font=font_normal)
        entry.insert(0, app_state["user_id"])
        entry.pack(pady=6)

        def save_and_close():
            new_id = entry.get().strip()
            if new_id:
                app_state["user_id"] = new_id
                save_config(new_id)
                input_win.destroy()
            else:
                messagebox.showwarning("Error", "User ID cannot be empty.")

        tk.Button(input_win, text="Save & Connect", command=save_and_close, bg="#1A56DB", fg="#FFFFFF", font=font_bold, relief="flat", padx=10, pady=4).pack(pady=10)

    def on_hide():
        root.withdraw()
        # Bring back if user runs agent again
        time.sleep(0.5)

    def on_quit():
        app_state["running"] = False
        root.destroy()
        sys.exit(0)

    btn_switch = tk.Button(btn_frame, text="Switch User", command=on_switch_user, bg="#F1F5F9", fg="#334155", font=font_normal, relief="solid", bd=1, padx=8, pady=4)
    btn_switch.pack(side="left")

    btn_hide = tk.Button(btn_frame, text="Minimize", command=on_hide, bg="#F1F5F9", fg="#334155", font=font_normal, relief="solid", bd=1, padx=8, pady=4)
    btn_hide.pack(side="left", padx=8)

    btn_stop = tk.Button(btn_frame, text="Stop & Exit", command=on_quit, bg="#FEE2E2", fg="#DC2626", font=font_normal, relief="solid", bd=1, padx=8, pady=4)
    btn_stop.pack(side="right")

    # Periodic UI Updater
    def update_ui():
        lbl_status_val.config(
            text=app_state["status"],
            fg="#059669" if "Active" in app_state["status"] else "#D97706"
        )
        lbl_server_val.config(text=app_state["connected_server"])
        lbl_user_val.config(text=app_state["user_id"] or "(Not Set)")
        lbl_app_val.config(text=app_state["current_app"])
        lbl_idle_val.config(text=app_state["idle_time"])
        lbl_sync_val.config(text=app_state["last_sync"])
        checkin_txt = app_state["checkin_status"] or "Pending..."
        checkin_color = "#059669" if "recorded" in checkin_txt else ("#DC2626" if "⚠" in checkin_txt else "#D97706")
        lbl_checkin_val.config(text=checkin_txt, fg=checkin_color)

        if app_state["running"]:
            root.after(1000, update_ui)

    root.after(500, update_ui)

    # If no user ID is configured, pop up the user ID modal immediately
    if not app_state["user_id"]:
        root.after(200, on_switch_user)

    root.protocol("WM_DELETE_WINDOW", on_quit)
    root.mainloop()


# ─── Main Entry Point ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Register Windows protocol handler for browser login redirect
    register_protocol()

    # Auto-register to Windows startup so agent launches on PC login
    register_startup()

    # Parse potential URI command line (resawc-agent://login?userId=...)
    uri_user_id = None
    if len(sys.argv) > 1 and sys.argv[1].startswith(f"{PROTOCOL}://"):
        try:
            uri = sys.argv[1]
            parsed = urlparse(uri)
            qs = parse_qs(parsed.query)
            if "userId" in qs:
                uri_user_id = qs["userId"][0]
                save_config(uri_user_id)
                print(f"[Protocol] Saved userId={uri_user_id} from URI")
        except Exception as e:
            print(f"[Protocol] Parse error: {e}")

    # Check if another instance is already running
    if is_already_running():
        print("Another instance of Resawc Agent is already active. Updated configuration.")
        # If launched via URI, the config file is now updated, which the running instance auto-detects
        sys.exit(0)

    # Initial user configuration resolution
    saved_cfg = load_config()
    target_user_id = uri_user_id or saved_cfg.get("userId", "")
    app_state["user_id"] = target_user_id

    # ── Auto system check-in on startup ──────────────────────────────────────
    # If we have a user ID, immediately try to record systemLoginTime in attendance.
    # This requires mobile check-in to have already happened — if not, agent shows a warning.
    if target_user_id:
        checkin_thread = threading.Thread(
            target=record_system_checkin,
            args=(target_user_id,),
            daemon=True
        )
        checkin_thread.start()

    # Start telemetry worker thread
    sync_thread = threading.Thread(target=sync_loop, daemon=True)
    sync_thread.start()

    # Start GUI
    run_app_gui(target_user_id)
