# Setup & Development Guide

This guide covers getting the Hostel Management System up and running for local development.

## 🛠 Prerequisites
*   [Node.js](https://nodejs.org/) (v16+)
*   [Python](https://www.python.org/) 3.12+ (or 3.9+)
*   `sqlite3`
---

## 🚀 One-Command Start

If you already have your virtual environment set up, you can run both the frontend and backend servers concurrently using the root npm script:

```bash
# In the root project directory:
npm install        # Installs concurrently
npm run dev
```

This will run Django on `http://127.0.0.1:8000` and Vite on `http://localhost:5173/`.

---

## 🔧 Initial Environment Setup

If you are setting this up for the very first time, follow the steps below to configure the backend and frontend separately.

### 1. Backend (Django REST Framework)
The backend uses Python's isolated virtual environments.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Database Migrations & Demo Data:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**(Optional) Seed the database with Demo Data:**
If you want to quickly test the application without creating rooms from scratch:
```bash
python manage.py seed_demo
```
*This will create an Admin (`admin@demo.com`), a Resident (`resident@demo.com`), both with password `password123`, and 5 pre-configured rooms with beds.*

**(Optional) Create an empty Superuser manually:**
```bash
python manage.py createsuperuser
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
```

---

## 🧪 Running Tests
We enforce strict testing for the backend APIs. To run the full test suite across the implemented modules:

```bash
# From the backend directory:
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## 📷 Camera / QR Gate Access
The Admin **Gate Scanner** feature uses the device webcam context via `jsQR`. 
Because browsers strictly enforce HTTPS for camera access, you **must access the frontend via `localhost`** (e.g., `http://localhost:5173`) to use the camera. If you access it via a network IP, the scanner will disable the camera and require manual token entry.
