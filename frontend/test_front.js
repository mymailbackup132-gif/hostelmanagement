import fs from 'fs'

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../backend/db.sqlite3');

db.get("SELECT 'access_' || id as token FROM accounts_user LIMIT 1", async (err, row) => {
  if (err || !row) return console.log(err || "No user");
  
  // This isn't a real JWT, my node test needs a real JWT. 
  // Let me just test the proxy route directly using a dummy token to see if it even reaches Django 
  // and gets a 401 instead of a 500 or hanging.
  
  try {
    const res = await fetch('http://localhost:5173/api/rooms/bookings/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake'
        },
        body: JSON.stringify({
            preferred_room_type: 'single',
            move_in_date: '2026-08-01',
            duration_months: 1
        })
    });
    
    console.log("Status:", res.status)
    console.log("Response:", await res.text())
  } catch (e) {
    console.log("Fetch error:", e)
  }
});
