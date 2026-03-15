# Smart Hostel Management System

A comprehensive, full-stack Hostel Management System built with **Django REST Framework** (Backend) and **React + Vite + Tailwind CSS** (Frontend). 

This system handles everything from resident registration, strict 2FA authentication, and room bookings to QR-code based gate access and scan logging.

## 🚀 Features Implemented (Phases 1-3)

### 1. Authentication & Security
*   **Role-Based Access**: Specialized views and capabilities for `admin` and `resident` roles.
*   **Mandatory 2FA**: Integration with Google Authenticator / Authy using Time-Based One-Time Passwords (TOTP) for all users.
*   **Secure Password Recovery**: Gmail SMTP integration for password resets.

### 2. Room & Booking Management
*   **Admin Inventory Control**: Create and manage Hostel Rooms (AC/Non-AC, Single/Double) and track specific Bed occupancy.
*   **Resident Room Browsing**: Residents can browse available rooms and submit booking requests.
*   **Booking Approval Flow**: Admins can approve or reject bookings. Approvals automatically allocate a bed to the resident and trigger email notifications.

### 3. QR Code Gate Security
*   **Resident QR Codes**: Dynamic, secure QR codes generated for residents upon successful room allocation. Accessible via their Profile Dashboard.
*   **Webcam Gate Scanner**: An Admin-only dashboard tool utilizing the device camera to scan resident QR codes securely (`jsQR`).
*   **Scan Logging**: Every entry scan is logged with a timestamp, success/failure result, and reason (e.g., Access Granted, Unknown QR, Payment Overdue).

### 4. Responsive & Modern UI
*   **Glassmorphism Aesthetics**: Built with a sleek, dark-themed UI.
*   **Mobile-Friendly Sidebar**: A fully responsive slide-in hamburger navigation menu for mobile devices.
*   **Real-time Feedback**: Interactive loaders, Toast notifications, and specific error surfacing from the API.

## 💻 Tech Stack
*   **Backend**: Python, Django, Django REST Framework, SQLite (Development), PyOTP (2FA)
*   **Frontend**: React, Vite, Tailwind CSS, jsQR, React Router, Axios, Lucide Icons

## 📝 Setup & Development
Please refer to [SETUP.md](./SETUP.md) for complete instructions on configuring your environment and running the development servers.
