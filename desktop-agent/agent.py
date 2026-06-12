import sys
import os
import json
import time
import threading
import ctypes
import psutil
import requests
import winreg
from urllib.parse import urlparse, parse_qs
import tkinter as tk
from tkinter import messagebox

# Configuration
API_URL = "https://resawc-llp-1-rt4y.vercel.app/api/monitor/sync"
CONFIG_FILE = os.path.join(os.path.expanduser("~"), ".resawc-agent.json")
PROTOCOL = "resawc-agent"

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_uint),
        ("dwTime", ctypes.c_uint)
    ]

def get_idle_time():
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
        return millis / 1000.0
    return 0

def get_active_window_info():
    hwnd = ctypes.windll.user32.GetForegroundWindow()
    if not hwnd:
        return None, None
    
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
        
    return name, title

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_config(user_id):
    with open(CONFIG_FILE, 'w') as f:
        json.dump({"userId": user_id}, f)

def register_protocol():
    exe_path = os.path.abspath(sys.argv[0])
    # If running from python, we want to register the python path
    if exe_path.endswith('.py'):
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
        print(f"Registered protocol {PROTOCOL}://")
    except Exception as e:
        print(f"Failed to register protocol: {e}")

def sync_loop(user_id):
    print(f"Started monitoring for user: {user_id}")
    while True:
        try:
            idle_seconds = get_idle_time()
            app_name, app_title = get_active_window_info()
            
            status = "Active"
            if idle_seconds > 60:
                status = "Idle"
            
            payload = {
                "userId": user_id,
                "status": status,
                "currentApp": app_name,
                "appTitle": app_title,
                "idleTime": f"{int(idle_seconds // 60)}m {int(idle_seconds % 60)}s"
            }
            
            requests.post(API_URL, json=payload, timeout=5)
        except Exception as e:
            print(f"Sync error: {e}")
        
        time.sleep(10)

def show_login_ui():
    root = tk.Tk()
    root.title("Resawc Agent Login")
    root.geometry("400x200")
    
    tk.Label(root, text="Resawc PC Agent", font=("Helvetica", 16, "bold")).pack(pady=20)
    tk.Label(root, text="Please enter your User ID or login via the website.").pack(pady=5)
    
    entry = tk.Entry(root, width=40)
    entry.pack(pady=10)
    
    def on_submit():
        uid = entry.get().strip()
        if uid:
            save_config(uid)
            root.destroy()
            start_tracking(uid)
        else:
            messagebox.showwarning("Error", "User ID cannot be empty")
            
    tk.Button(root, text="Start Tracking", command=on_submit, bg="#6366f1", fg="white").pack(pady=5)
    root.mainloop()

def start_tracking(user_id):
    # Hide console window if possible, but keep simple for now
    thread = threading.Thread(target=sync_loop, args=(user_id,), daemon=True)
    thread.start()
    
    # Keep main thread alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    register_protocol()
    
    # Check if launched via URI
    user_id = None
    if len(sys.argv) > 1 and sys.argv[1].startswith(f"{PROTOCOL}://"):
        uri = sys.argv[1]
        parsed = urlparse(uri)
        qs = parse_qs(parsed.query)
        if "userId" in qs:
            user_id = qs["userId"][0]
            save_config(user_id)
            print(f"Logged in via web as {user_id}")
    
    if not user_id:
        config = load_config()
        user_id = config.get("userId")
        
    if user_id:
        start_tracking(user_id)
    else:
        show_login_ui()
