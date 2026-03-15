import os, sys
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rooms.models import Room, Bed, Booking
import traceback

User = get_user_model()
admin = User.objects.filter(role='admin').first()
if not admin:
    admin = User.objects.create_user(email='testadmin7@example.com', password='pw', role='admin', full_name='Admin')

booking = Booking.objects.filter(status='pending').first()
if booking:
    room = Room.objects.filter(room_type=booking.preferred_room_type).first()
    if not room:
        room = Room.objects.create(room_number='X103', floor=1, room_type=booking.preferred_room_type, total_beds=1, rent_amount=100)
        Bed.objects.create(room=room, bed_number=1)
    
    bed = room.beds.filter(is_occupied=False).first()
    if not bed:
         print("No free beds!")
         sys.exit(0)
    
    print(f"Testing approve for booking {booking.id} with bed {bed.id}...")
    c = APIClient()
    c.force_authenticate(user=admin)
    try:
        resp = c.post(f'/api/rooms/admin/bookings/{booking.id}/approve/', {'bed_id': str(bed.id)}, format='json')
        print("Status:", resp.status_code)
        print("Content:", resp.content.decode('utf-8'))
    except Exception as e:
        traceback.print_exc()
else:
    print("No pending bookings to approve.")
