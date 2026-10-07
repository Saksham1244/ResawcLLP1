# Resawc LLP — Studio Management & Enterprise CRM Platform

Welcome to the **Resawc LLP** internal workspace repository. This project is a comprehensive, production-grade enterprise platform designed specifically for video editing, wedding cinematography, photography post-production, marketing pipelines, and team operations.

---

## 🌟 Architecture & Monorepo Structure

```
d:\Resawc LLP\
├── web-app/               # Next.js 14 Web Application (Desktop & Admin Dashboard)
│   ├── prisma/            # Neon PostgreSQL Schema & Client
│   ├── src/app/           # App Router Pages & API Routes
│   │   ├── dashboard/     # Management Dashboard (Overview, Clients, Jobs, Finance, Payroll, Leads, Tasks, Attendance, Monitor, Team, Activity, Settings)
│   │   ├── attendance/    # Standalone Geofenced Attendance Portal
│   │   ├── login/         # Authentication & Access Control
│   │   └── api/           # Secured REST Endpoints (Rate-limited, JWT-protected)
│   ├── e2e/               # Playwright End-to-End Test Suite (21 Tests)
│   └── .github/workflows/ # GitHub Actions CI/CD Pipeline
├── mobile-app/            # React Native Expo Application (Field attendance & tasks)
└── desktop-agent/         # Python Windows PC Productivity Background Service
```

---

## 🚀 Key Modules & System Capabilities

### 1. Authentication & Security (Phase 1)
- **JWT & BCrypt**: 8-hour sessions with token validation and password hashing.
- **Role-Based Access Control (RBAC)**:
  - **Admin** (`Mukul`, `Mukesh`): Full authority over finance, GST, payroll, rates, team, and activity logs.
  - **Marketing** (`Pooja`): Pipeline management, lead conversion, follow-ups.
  - **Editors** (`Vikram`, `Aman`, `Rahul`): Task queue, deliverable submission, personal attendance.
- **Admin Exemptions**: Admins are exempt from biometric/punch-in requirements, late penalties, and desktop idle tracking.

### 2. Attendance & Workforce Management (Phase 2)
- **Geofenced Attendance**: GPS-based verification locked to the South Extension I office (*The Christian Paradise, Bhaskar Bhawan, 1882 H Block, New Delhi*).
- **Automated Late Marking**: 15-minute grace period with configurable half-day penalty rules.
- **Overtime & Leave Workflow**: Submission, admin approval, and auto-integration into monthly payroll.

### 3. Production Pipeline & Task Automation (Phase 3)
- **Editing Jobs Pipeline**: Visual Kanban tracking across `PENDING`, `ASSIGNED`, `IN_PROGRESS`, `QC`, `APPROVED`, and `DELIVERED`.
- **Raw Files Task Folder Linking**: Put cloud folder links (Google Drive, Dropbox, OneDrive) directly into job cards.
- **Auto-Push to Editor's Task Queue**: Assigning an editor automatically generates a linked task in `/dashboard/tasks` with deadline, priority, and direct access to raw footage.
- **Work Deliverable Submission**: Editors submit finished deliverable links and revision notes directly from their task queue.
- **Admin Real-Time QC Notification**: Instantly alerts admins (`Mukul` / `Mukesh`) with deliverables link for one-click approval or revision request.

### 4. Marketing & Lead CRM (Phase 4)
- **Lead Pipeline**: Stage tracking (`NEW`, `CONTACTED`, `QUALIFIED`, `INTERESTED`, `CONVERTED`).
- **Automated Round-Robin Distribution**: Fair lead allocation across marketing reps.
- **Interaction Logging**: Call, Email, and Meeting outcome logs with reminder dates.
- **One-Click Client Conversion**: Converts won leads into Client 360° accounts and initializes client-specific rate cards.

### 5. Finance, 18% GST Invoicing & Payroll (Phase 5)
- **18% GST Invoicing**: Standard Indian tax regime (CGST 9% + SGST 9% for intra-state Delhi; IGST 18% for inter-state).
- **Client Rate Cards**: Per-photo and per-minute video editing pricing tiers.
- **Automated Payroll Engine**: Computes basic earned pay, attendance proration, overtime additions, late deductions, and net salary.
- **One-Click Payslip Generation**: Clean, printable Indian payslips with company seals.
- **Centralized Activity Timeline** (`/dashboard/activity`): Real-time audit log of all system actions.

### 6. Government GST Portal & E-Invoicing System
- **Location**: Configured directly in `/dashboard/settings` under the **GST Portal** tab.
- **Business Details**: Legal Name (`Resawc LLP`), Trade Name (`Resawc Creative Media`), GSTIN (`07AABCR1234F1Z5`), PAN (`AABCR1234F`), State (`07 - Delhi`).
- **GST Suvidha Provider (GSP)**: Direct API support for Government NIC (`einvoice1.gst.gov.in`), ClearTax, Masters India, and Sandbox.
- **E-Invoicing & E-Way Bill**: Automated IRN / QR code generation and E-Way bill threshold management (₹50,000 standard).
- **SAC Code `998314`**: Standard Service Accounting Code for photography and video post-production services.
- **Export under LUT**: Zero-rated 0% IGST billing for overseas international clients under approved Letter of Undertaking (`AD070326001234X`).
- **GSTR-1 Sales JSON Export**: One-click download of monthly sales data formatted for direct upload to the official GST portal.

---

## 🧪 Testing & Quality Assurance

### Testing Stack
- **Functional & Regression**: Playwright E2E Suite (`web-app/e2e/`)
- **Visual Testing**: Percy / Applitools visual regression snapshots
- **Automated CI/CD**: GitHub Actions workflow (`.github/workflows/e2e-tests.yml`)

### Test Coverage (21/21 Tests Passing — 100% Green)
| Suite | Tests | Status |
| :--- | :--- | :--- |
| `auth.spec.ts` | Login, Logout, Forgot Password, Branding | ✅ PASS |
| `dashboard.spec.ts` | Overview, Leads, Tasks, Team, Attendance | ✅ PASS |
| `production-finance.spec.ts` | Jobs Pipeline, Raw Files Link, 18% GST Invoices, Payroll, Client 360°, Analytics, Activity Timeline | ✅ PASS |
| `visual-regression.spec.ts` | Visual layouts of Login, Overview, Finance, Reports, Timeline | ✅ PASS |

---

## 🛠️ Installation & Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- PostgreSQL / Neon Cloud Database
- Python 3.10+ (for Desktop Agent)

### 1. Database Setup
Ensure `DATABASE_URL` is set in `web-app/.env`:
```bash
cd web-app
npx prisma db push
npx prisma generate
```

### 2. Run Web Application
```bash
cd web-app
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
cd web-app
npx playwright test
```

### 4. Run Desktop Agent (Optional)
```bash
cd desktop-agent
pip install -r requirements.txt
python agent.py
```

---

## 👥 Default Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | Mukul | `mukul@resawc.com` | `Admin@1234` |
| **Admin** | Mukesh | `mukesh@resawc.com` | `Admin@1234` |
| **Marketing** | Pooja | `pooja@resawc.com` | `Admin@1234` |
| **Photo Editor** | Vikram | `vikram@resawc.com` | `Admin@1234` |
| **Video Editor** | Aman | `aman@resawc.com` | `Admin@1234` |
| **Video Editor** | Rahul | `rahul@resawc.com` | `Admin@1234` |

---

## 🛠️ Services & Rate Master Catalog (Admin Settings)
- **Settings Path**: `/dashboard/settings?tab=services` -> **Services & Rates**
- **Dynamic Catalog**: Add, edit, toggle, or delete any billable company service (Photo Culling, Color Correction, Retouching, Video Editing, Reels/Shorts, Monthly Retainers, Drone Video Editing, Album Design, Teasers, etc.).
- **Per-Service Attributes**: Service Name, Category (`PHOTO`, `VIDEO`, `RETAINER`, `CREATIVE`, `OTHER`), Billing Unit (`img`, `min`, `reel`, `video`, `hr`, `month`, `project`), Default Rate (INR ₹), and SAC Code (`998314`).
- **Dynamic Client Rate Cards**: Any service defined in Settings automatically appears with custom price fields in:
  1. **Configure Client Rate Card** modal (`/dashboard/finance`).
  2. **Client Contract Rate Card** tab (`/dashboard/clients/[id]`).
  3. **Editing Jobs Pipeline** and **GST Tax Invoicing**.

---

## 🌿 Git Branches & Testing Branch
- **`main`**: Production trunk.
- **`feature/production-gst-testing`**: Dedicated branch containing all Phase 1-5 implementations, GST Portal settings, Services & Rate Master, Raw Files folder linking, and the complete E2E test suite.
