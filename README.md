# Smart Hostel Management System

A comprehensive, full-stack Hostel Management System built with **Django REST Framework** (Backend) and **React + Vite + Tailwind CSS** (Frontend).

This system handles everything from resident registration and strict 2FA authentication, to room bookings, payments, complaints, QR-code gate access, and admin analytics.

---

## Features

### 1. Authentication & Security
- **Role-Based Access**: Specialized views and capabilities for `admin` and `resident` roles.
- **Mandatory 2FA**: TOTP-based two-factor authentication (Google Authenticator / Authy) enforced for all users.
- **Secure Password Recovery**: Gmail SMTP integration for password reset emails.
- **JWT Authentication**: Access tokens (24h) and refresh tokens (7d) with rotation and blacklisting.

### 2. Room & Booking Management
- **Admin Inventory Control**: Create and manage rooms (AC/Non-AC, Single/Double/Triple) and track individual bed occupancy.
- **Resident Room Browsing**: Residents browse available rooms filtered by type, view photos and details.
- **Booking Approval Flow**: Admins approve or reject booking requests. Approval auto-allocates a bed, generates a QR code, and sends email + in-app notification.

### 3. QR Code Gate Security
- **Resident QR Codes**: Dynamic QR codes generated on booking approval. Accessible from the resident's profile dashboard.
- **QR Status Tracking**: QR codes can be `active`, `deactivated_payment` (overdue rent), or `deactivated_admin`.
- **Webcam Gate Scanner**: Admin-only tool using the device camera to scan QR codes (`jsQR`).
- **Scan Logging**: Every scan is logged with timestamp, result (Access Granted / Payment Overdue / Unknown / Deactivated), and reason.

### 4. Payments
- **Payment Records**: Tracks monthly rent payments per resident with statuses: `pending`, `paid`, `overdue`.
- **UPI QR Code Upload**: Admin can upload a UPI payment QR image for residents to scan and pay.
- **Automated Reminders**: Configurable scheduled reminders (day-of-month, hour) that email overdue residents and deactivate their gate QR.
- **Manual Trigger**: Admin can manually fire reminders at any time.
- **Mark as Paid**: Admin can mark individual payments as paid and auto-reactivate the resident's gate QR.

### 5. Complaints
- **Complaint Submission**: Residents raise complaints with category (maintenance, noise, cleanliness, security, other), description, and optional photo.
- **Auto-generated IDs**: Each complaint gets a unique ID like `CMP-0001`.
- **Lifecycle Management**: Status flow: `pending` → `in_progress` → `resolved` (managed by admin).
- **Priority Levels**: low, medium, high, urgent.
- **Threaded Messaging**: Admin and resident can exchange messages within a complaint thread.
- **Email Notifications**: Resident is notified by email when complaint status changes.

### 6. Admin Dashboard & Analytics
- **Stats Overview**: Live counts for total rooms, occupied beds, pending bookings, active residents, and revenue.
- **Analytics Charts**: Recharts-powered visualizations — occupancy by floor (stacked bar), revenue over 6 months (line), complaints by status (bar).
- **User Management**: View all residents, reset 2FA, deactivate accounts.
- **Notification Center**: Role-based in-app notifications for both admin and residents.

### 7. Responsive & Modern UI
- **Glassmorphism Dark Theme**: Sleek, dark-themed UI with glass-effect cards.
- **Mobile-Friendly Sidebar**: Slide-in hamburger navigation for mobile devices.
- **Real-time Feedback**: Toasts, inline loaders, and API error surfacing.

---

## Tech Stack

| Layer     | Technology                                                                 |
|-----------|----------------------------------------------------------------------------|
| Backend   | Python 3.12, Django 6.0.3, Django REST Framework, SimpleJWT, django-otp  |
| Database  | SQLite (development)                                                       |
| Frontend  | React 19, Vite 8, Tailwind CSS 4, React Router 7, Axios                  |
| Charts    | Recharts 3                                                                 |
| QR Codes  | qrcode (backend generation), jsQR (frontend scanning)                      |
| Auth      | TOTP / pyotp, JWT (access + refresh)                                       |
| Testing   | pytest-django (backend), vitest (frontend)                                 |

---

## Project Structure

```
HostelManagement/
├── backend/                    # Django REST API
│   ├── accounts/               # User model, auth, 2FA, admin stats
│   ├── rooms/                  # Rooms, beds, bookings, allocations
│   ├── payments/               # Payments, UPI QR, reminders
│   ├── complaints/             # Complaints, messages
│   ├── gate/                   # Gate scan logging
│   ├── notifications_app/      # In-app notification system
│   ├── hostel/                 # Django settings & root URL config
│   ├── tests/                  # pytest test suite (20+ tests)
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example            # Environment variable template
├── frontend/                   # React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── resident/       # Resident-facing pages
│       │   ├── admin/          # Admin-facing pages
│       │   └── shared/         # Shared pages (Notifications)
│       ├── context/            # Auth context
│       ├── components/         # Shared UI components
│       └── api.js              # Axios instance with JWT interceptors
├── package.json                # Root scripts (runs both servers concurrently)
├── run-backend.js              # Cross-platform Django server launcher
├── README.md
└── SETUP.md                    # Step-by-step setup guide
```

---

## Quick Start

See [SETUP.md](./SETUP.md) for full setup instructions.

**TL;DR** (after initial setup):
```bash
npm install   # from project root
npm run dev   # starts Django on :8000 and Vite on :5173
```

**Demo credentials** (after `python manage.py seed_demo`):
- Admin: `admin@demo.com` / `password123`
- Resident: `resident@demo.com` / `password123`
