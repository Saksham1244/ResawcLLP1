# Resawc LLP - Team Management & CRM System

Welcome to the **Resawc LLP** internal workspace repository. This project serves as an all-in-one platform for managing the editing team, client leads, tasks, attendance, and PC productivity tracking.

## 🌟 Project Structure

This monorepo is divided into three main components:

### 1. Web Application (`/web-app`)
A Next.js-based web application deployed on Vercel. 
- **Purpose**: Acts as the central dashboard for Admins, Marketing, and Editing (Production) teams.
- **Features**:
  - Live Dashboard (Active Leads, Pending Tasks)
  - Task Assignment & Workflow Management
  - Client Leads Tracking
  - Real-time Attendance & Geofencing logs
  - PC Productivity Monitoring Dashboard
- **Tech Stack**: Next.js, React, Tailwind CSS, Prisma, Neon (PostgreSQL)

### 2. Mobile Application (`/mobile-app`)
An Expo-based React Native application designed for the production team on the go.
- **Purpose**: Allows editors to check their assigned tasks and mark their geofenced attendance.
- **Features**:
  - Task tracking tailored to the Editor role
  - GPS-based Attendance Logging (Geofenced to the South Extension I office)
  - Lead view (Read-only depending on role)
- **Tech Stack**: React Native, Expo, Lucide Icons

### 3. PC Tracker Agent (`/desktop-agent`)
A lightweight Python-based background service for team members' PCs.
- **Purpose**: Monitors work activity to ensure productivity during working hours.
- **Features**:
  - Tracks Active vs Idle time
  - Application title tracking (e.g., Photoshop, Premiere Pro, Skype, WhatsApp Web, WeTransfer)
  - Automatically calculates and syncs a strict "Productivity Score" based on productive apps versus total time
- **Tech Stack**: Python, Tkinter, psutil

## 🚀 Getting Started

### Database Setup
The project uses **Neon (PostgreSQL)**. Ensure your `DATABASE_URL` is set in the `.env` file of the `web-app`. Run `npx prisma db push` to sync the schema.

### Running the Web App
```bash
cd web-app
npm install
npm run dev
```

### Running the Mobile App
```bash
cd mobile-app
npm install
npx expo start
```
*Note: The mobile app can also be built as a PWA and deployed to the web app's public directory.*

### Running the Desktop Agent
```bash
cd desktop-agent
pip install psutil requests
python agent.py
```

## 🔒 Roles & Access
The system enforces strict role-based access control (RBAC):
- **Admin**: Full access to all leads, tasks, and system-wide PC productivity tracking.
- **Marketing**: Can view and manage their assigned leads and related tasks.
- **Editor / Production**: Can view their assigned editing tasks and mark attendance. (Cannot see other members' tasks).

## 📍 Office Geofence
Attendance marking via the mobile app is geofenced to **The Christian Paradise, Bhaskar Bhawan, 1882 H Block, South Extension I, New Delhi**. Ensure location permissions are granted on the mobile device to successfully log attendance.
