# Setup & Development Guide

This guide covers everything you need to get the Hostel Management System running from scratch on your local machine.

---

## Prerequisites

Before you begin, make sure you have the following installed:

| Tool       | Version   | Download                          |
|------------|-----------|-----------------------------------|
| Python     | 3.12+     | https://www.python.org/downloads/ |
| Node.js    | 18+       | https://nodejs.org/               |
| npm        | 9+ (bundled with Node.js) | —               |
| Git        | Any       | https://git-scm.com/              |

> SQLite is bundled with Python — no separate installation needed.

---

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd HostelManagement
```

---

## Step 2: Backend Setup (Django)

All backend commands run from inside the `backend/` directory.

### 2.1 Create and activate a Python virtual environment

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# macOS / Linux:
source .venv/bin/activate

# Windows (Command Prompt):
.venv\Scripts\activate.bat

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
```

You should see `(.venv)` at the start of your terminal prompt when active.

### 2.2 Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
# Django secret key — generate a new one for production
SECRET_KEY='django-insecure-your-secret-key-here'

# Gmail SMTP credentials for sending emails (password resets, reminders, notifications)
# Use a Gmail App Password if your Google account has 2FA enabled:
# https://myaccount.google.com/apppasswords
EMAIL_HOST_USER='your-email@gmail.com'
EMAIL_HOST_PASSWORD='your-app-password'

# URL of your frontend (used in password reset links)
FRONTEND_URL='http://localhost:5173'
```

> Email is used for: booking rejection notices, payment overdue reminders, complaint status updates, and password resets. If you skip this for local development, email operations will silently fail but the app will still work.

### 2.4 Run database migrations

```bash
python manage.py migrate
```

This creates all database tables. You should see a series of `OK` messages for each migration.

### 2.5 (Optional) Seed demo data

To populate the database with demo users, rooms, bookings, payments, and complaints:

```bash
python manage.py seed_demo
```

This creates:
- **Admin user**: `admin@demo.com` / `password123`
- **Resident user**: `resident@demo.com` / `password123`
- 5 rooms with multiple beds
- Sample bookings (pending, approved, rejected)
- Sample payments (paid, pending, overdue)
- Sample complaints with messages
- A UPI QR placeholder

> Running `seed_demo` multiple times is safe — it checks for existing data before creating.

### 2.6 (Optional) Create a superuser manually

If you prefer to create your own admin without demo data:

```bash
python manage.py createsuperuser
```

### 2.7 Start the Django development server

```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000`.

---

## Step 3: Frontend Setup (React + Vite)

Open a new terminal. Frontend commands run from inside the `frontend/` directory.

### 3.1 Install Node dependencies

```bash
cd frontend
npm install
```

### 3.2 Start the Vite dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## One-Command Start (After Initial Setup)

Once you've done the initial setup (virtual env created, dependencies installed, `.env` configured, migrations run), you can start both servers at once from the **project root**:

```bash
# From the project root (HostelManagement/):
npm install   # Only needed once — installs the `concurrently` package
npm run dev   # Starts both Django (:8000) and Vite (:5173) concurrently
```

> This uses `run-backend.js` to activate the virtual environment and start Django in a cross-platform way.

---

## Step 4: 2FA Setup (First Login)

This app enforces two-factor authentication (TOTP) for all users. On first login:

1. Log in with your email and password at `http://localhost:5173/login`.
2. You will be redirected to the **2FA setup** page.
3. Scan the QR code shown on screen using **Google Authenticator**, **Authy**, or any TOTP app.
4. Enter the 6-digit code to verify and complete setup.
5. On subsequent logins, you will be prompted for your TOTP code after entering your password.

> If a user loses access to their authenticator app, an admin can reset their 2FA from the **Admin > Users** page.

---

## Step 5: First Use — Admin Workflow

Once logged in as admin:

1. **Create rooms** (Admin > Rooms > Add Room) — set room number, floor, type, beds, and rent.
2. **Review bookings** (Admin > Bookings) — approve or reject resident booking requests.
3. **Upload UPI QR** (Admin > Payments) — upload a UPI payment QR image for residents to scan.
4. **Configure reminders** (Admin > Payments) — enable automated payment reminders and set the schedule.
5. **View analytics** (Admin > Analytics) — see occupancy, revenue, and complaint charts.

---

## Step 6: First Use — Resident Workflow

Once logged in as a resident:

1. **Browse rooms** (Rooms) — view available rooms and submit a booking request.
2. **View allocation** (Profile) — after your booking is approved, view your room, bed, and QR code.
3. **View payments** (Payments) — see payment status and scan the UPI QR to pay.
4. **Raise a complaint** (Complaints) — submit issues and track resolution with admin messages.

---

## Running Tests

The backend has a pytest test suite covering all major modules.

```bash
cd backend

# Activate virtual environment first:
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows

# Run all tests with verbose output:
pytest tests/ -v

# Run tests for a specific module:
pytest tests/payments/ -v
pytest tests/complaints/ -v
pytest tests/rooms/ -v
pytest tests/accounts/ -v
pytest tests/gate/ -v
```

All tests use an isolated in-memory SQLite database — no impact on your development data.

---

## Camera / QR Gate Scanner

The Admin **Gate Scanner** page uses the device webcam via `jsQR`.

- **Requirement**: Browser must be served over `localhost` or HTTPS for camera access.
- Access the app at `http://localhost:5173` (not via a network IP) when using the gate scanner.
- If accessed over a network IP, the scanner disables the camera and falls back to manual token entry.

---

## Project URLs Reference

| URL                              | Description                              |
|----------------------------------|------------------------------------------|
| `http://localhost:5173`          | React frontend                           |
| `http://127.0.0.1:8000`          | Django API root                          |
| `http://127.0.0.1:8000/api/auth/`       | Auth endpoints (login, register, 2FA)    |
| `http://127.0.0.1:8000/api/rooms/`      | Room and booking endpoints               |
| `http://127.0.0.1:8000/api/payments/`   | Payment endpoints                        |
| `http://127.0.0.1:8000/api/complaints/` | Complaint endpoints                      |
| `http://127.0.0.1:8000/api/gate/`       | Gate scan endpoints                      |
| `http://127.0.0.1:8000/api/notifications/` | Notification endpoints              |
| `http://127.0.0.1:8000/media/`          | Uploaded media (profile photos, QR codes) |

---

## Troubleshooting

### `ModuleNotFoundError: No module named 'dotenv'`
The virtual environment is missing `python-dotenv`. Run:
```bash
pip install python-dotenv
```

### `django.db.utils.OperationalError: no such table`
Migrations haven't been applied. Run:
```bash
python manage.py migrate
```

### `CORS` errors in the browser
The backend has `CORS_ALLOW_ALL_ORIGINS = True` for development. If you see CORS errors, ensure the Django server is running on `http://127.0.0.1:8000` and the frontend is hitting that exact URL.

### Camera not working on Gate Scanner
Access the app via `http://localhost:5173` not via an IP address. Browsers block camera access on non-localhost HTTP.

### Email not sending
Check your `.env` for correct Gmail credentials. If your Google account uses 2FA, you must create an **App Password** at https://myaccount.google.com/apppasswords and use that (not your regular password).

### Port already in use
If port 8000 or 5173 is busy:
```bash
# Kill the process using port 8000:
lsof -ti:8000 | xargs kill -9    # macOS/Linux

# Or start Django on a different port:
python manage.py runserver 8080
```

---

## Environment Variables Reference

| Variable            | Required | Default                   | Description                                    |
|---------------------|----------|---------------------------|------------------------------------------------|
| `SECRET_KEY`        | Yes      | —                         | Django secret key. Use a long, random string.  |
| `EMAIL_HOST_USER`   | No       | —                         | Gmail address for sending emails.              |
| `EMAIL_HOST_PASSWORD` | No     | —                         | Gmail App Password (not your account password).|
| `FRONTEND_URL`      | No       | `http://localhost:5173`   | Used in password reset links sent by email.    |

---

## Demo Credentials

After running `python manage.py seed_demo`:

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Admin    | admin@demo.com       | password123 |
| Resident | resident@demo.com    | password123 |

> Both accounts have 2FA pre-configured in the demo seeder. You will still be prompted for a TOTP code on login — use the TOTP secret shown during first setup, or reset 2FA from the admin panel.
