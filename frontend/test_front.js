import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path.join to ensure correct separators on Windows
const dbPath = path.join(__dirname, '..', 'backend', 'db.sqlite3');
const db = new sqlite3.verbose().Database(dbPath);

console.log(`Connecting to database at: ${dbPath}`);

db.get("SELECT 'access_' || id as token FROM accounts_user LIMIT 1", async (err, row) => {
  if (err || !row) {
    console.error("Error or no user found:", err || "User table might be empty");
    db.close();
    return;
  }
  
  const token = row.token;
  console.log("Using token:", token);

  try {
    const res = await fetch('http://localhost:5173/api/rooms/bookings/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            preferred_room_type: 'single',
            move_in_date: '2026-08-01',
            duration_months: 1
        })
    });
    
    console.log("Status:", res.status);
    console.log("Response:", await res.text());
  } catch (e) {
    console.log("Fetch error:", e);
  } finally {
    db.close();
  }
});
