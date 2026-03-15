import os, sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rooms.models import Room, Bed, Booking, Allocation
from datetime import date, timedelta
import traceback

User = get_user_model()

# Find or create an active resident user
resident = User.objects.filter(role='resident').first()
if not resident:
    resident = User.objects.create_user(email='debugres@example.com', password='pw', role='resident', full_name='Debug Resident')

admin = User.objects.filter(role='admin').first()
if not admin:
    admin = User.objects.create_user(email='debugadmin@example.com', password='pw', role='admin', full_name='Debug Admin')

print(f"Resident: {resident.email}")
print(f"Admin: {admin.email}")

# --- Test 1: Resident creates a booking ---
c = APIClient()
c.force_authenticate(user=resident)

payload = {
    'preferred_room_type': 'single',
    'move_in_date': (date.today() + timedelta(days=30)).isoformat(),
    'duration_months': 3
}
print("\n--- TEST 1: Resident creates booking ---")
try:
    resp = c.post('/api/rooms/bookings/', payload, format='json')
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.content.decode()}")
except Exception as e:
    print("EXCEPTION:")
    traceback.print_exc()

# --- Test 2: Admin approves the booking ---
booking = Booking.objects.filter(resident=resident, status='pending').first()
if booking:
    room = Room.objects.filter(room_type='single').first()
    if not room:
        room = Room.objects.create(room_number='DEBUG101', floor=1, room_type='single', total_beds=1, rent_amount=5000)
        Bed.objects.create(room=room, bed_number=1)
    bed = room.beds.filter(is_occupied=False).first()
    if not bed:
        print("\nNo free bed available for approval test.")
    else:
        ac = APIClient()
        ac.force_authenticate(user=admin)
        print(f"\n--- TEST 2: Admin approves booking {booking.id} with bed {bed.id} ---")
        try:
            resp2 = ac.post(f'/api/rooms/admin/bookings/{booking.id}/approve/', {'bed_id': str(bed.id)}, format='json')
            print(f"Status: {resp2.status_code}")
            print(f"Response: {resp2.content.decode()}")
        except Exception as e:
            print("EXCEPTION:")
            traceback.print_exc()
else:
    print("\nNo pending booking found to approve. Skipping Test 2.")
