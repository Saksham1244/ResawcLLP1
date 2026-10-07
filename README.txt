================================================================================
RESAWC LLP — STUDIO MANAGEMENT & ENTERPRISE CRM PLATFORM
================================================================================

Welcome to Resawc LLP's internal workspace repository.
This system is an all-in-one production, finance, marketing, and workforce
management platform built specifically for post-production, cinematography,
and video editing studios.

--------------------------------------------------------------------------------
1. PROJECT STRUCTURE
--------------------------------------------------------------------------------
d:\Resawc LLP\
  ├── web-app/            Next.js 14 Web Application (Admin & Team Dashboard)
  │    ├── prisma/        Neon PostgreSQL Schema & Client
  │    ├── src/app/       Pages, Components, and REST API Endpoints
  │    ├── e2e/           Playwright End-to-End Test Suite (21 Tests)
  │    └── .github/       GitHub Actions CI/CD Pipeline
  ├── mobile-app/         React Native Expo Mobile App (Attendance & Tasks)
  └── desktop-agent/      Python Desktop PC Tracker Background Service

--------------------------------------------------------------------------------
2. SYSTEM MODULES & CAPABILITIES
--------------------------------------------------------------------------------

[PHASE 1: AUTHENTICATION & ACCESS CONTROL]
- Secure JWT token authentication with bcrypt password encryption.
- Forgot Password self-service flow.
- Strict Role-Based Access Control (Admin, Marketing, Photo Editor, Video Editor).
- Admin Exemption: Admins (Mukul & Mukesh) are exempt from punch-in, late mark,
  and tracking penalties.

[PHASE 2: ATTENDANCE & WORKFORCE MANAGEMENT]
- Geofenced mobile and web attendance locked to South Extension I, New Delhi.
- Automatic late marking (15-min grace period) and half-day penalty rules.
- Overtime request and leave application approval workflows.
- Standalone attendance terminal at /attendance.

[PHASE 3: CLIENT 360 & EDITING JOBS PRODUCTION PIPELINE]
- Client 360 profiles with company details, rate cards, and billing history.
- Visual Kanban editing pipeline (Pending, Assigned, In Progress, QC, Approved, Delivered).
- Task Folder (Raw Files) linking: Attach cloud links (Google Drive, Dropbox) directly to jobs.
- Automatic Editor Queue Push: Assigning an editor instantly creates a linked task in /dashboard/tasks.
- Work Deliverables Submission: Editors submit finished outputs and notes directly.
- Admin Real-Time QC Notification: Instantly alerts admins with deliverables link for approval or revision.

[PHASE 4: MARKETING & LEAD MANAGEMENT CRM]
- Lead pipeline (New, Contacted, Qualified, Interested, Converted).
- Automated round-robin lead distribution across sales representatives.
- Interaction logger for Calls, Emails, and Meetings with reminder dates.
- One-click lead conversion into Client 360 with custom rate cards.

[PHASE 5: FINANCE, 18% GST INVOICING & PAYROLL]
- Tax invoicing with 18% GST (CGST 9% + SGST 9% intra-state Delhi / IGST 18% inter-state).
- All transactions standardized in Indian Rupees (INR ₹).
- Automated payroll calculation based on attendance, overtime additions, and late deductions.
- Printable PDF payslips with company seal and salary breakdown.
- Business analytics, revenue trends, and GST tax audit logs.
- Centralized Activity Timeline at /dashboard/activity.

[GST PORTAL & GOVERNMENT E-INVOICING SETTINGS]
- Accessible directly under /dashboard/settings -> "GST Portal" tab.
- Configured for Resawc LLP (GSTIN: 07AABCR1234F1Z5, PAN: AABCR1234F, 07-Delhi).
- GSP API connectivity: Government NIC Direct API, ClearTax, Masters India, and Sandbox.
- Automated E-Invoicing (IRN & QR code) and E-Way Bill generation (₹50,000 threshold).
- Primary SAC Code: 998314 (Photography & Video Editing Services).
- Export under LUT: 0% IGST zero-rated international billing (ARN: AD070326001234X).
- One-click GSTR-1 Sales JSON export for direct portal upload.

[SERVICES & RATE MASTER (ADMIN SETTINGS)]
- Accessible under /dashboard/settings -> "Services & Rates" tab (Admin only).
- Allows adding, editing, and managing new billable services anytime.
- Each service includes: Name, Category (Photo, Video, Retainer, Creative, Other), Billing Unit (img, min, reel, video, hr, month, project), Standard Default Rate in INR (₹), and GST SAC code (998314).
- All configured services automatically propagate to:
  * "Configure Client Rate Card" modal under Invoicing (/dashboard/finance).
  * "Client Contract Rate Card" tab under Client 360 (/dashboard/clients/[id]).
  * Production job queues and GST Invoices.

--------------------------------------------------------------------------------
3. DEFAULT LOGIN CREDENTIALS
--------------------------------------------------------------------------------
Admin (Full Access):
  Email:    mukul@resawc.com
  Password: Admin@1234

Admin (Full Access):
  Email:    mukesh@resawc.com
  Password: Admin@1234

Marketing:
  Email:    pooja@resawc.com
  Password: Admin@1234

Photo Editor:
  Email:    vikram@resawc.com
  Password: Admin@1234

Video Editor:
  Email:    aman@resawc.com
  Password: Admin@1234

Video Editor:
  Email:    rahul@resawc.com
  Password: Admin@1234

--------------------------------------------------------------------------------
4. HOW TO RUN THE PROJECT
--------------------------------------------------------------------------------
Web Application:
  cd web-app
  npm install
  npm run dev
  -> Access at http://localhost:3000

Database Migration (Neon PostgreSQL):
  cd web-app
  npx prisma db push
  npx prisma generate

Run Automated Playwright E2E Tests:
  cd web-app
  npx playwright test
  -> Full suite of 21 tests covering all phases and visual regression.

Desktop PC Tracker:
  cd desktop-agent
  pip install -r requirements.txt
  python agent.py

--------------------------------------------------------------------------------
5. GIT BRANCHING & TESTING
--------------------------------------------------------------------------------
Branch Name for Testing:
  feature/production-gst-testing

This branch includes all features, database models, GST portal integration,
and verified test suites.
================================================================================
