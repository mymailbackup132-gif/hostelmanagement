import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rooms.models import Room, Bed, Booking

User = get_user_model()
admin = User.objects.filter(role='admin').first()
if not admin:
    admin = User.objects.create_user(email='testadmin@example.com', password='pw', role='admin', full_name='Admin')

booking = Booking.objects.filter(status='pending').first()
if booking:
    room = Room.objects.filter(room_type=booking.preferred_room_type).first()
    if not room:
        room = Room.objects.create(room_number='X101', floor=1, room_type=booking.preferred_room_type, total_beds=1, rent_amount=100)
        Bed.objects.create(room=room, bed_number=1)
    bed = room.beds.filter(is_occupied=False).first()
    
    c = Client()
    c.force_login(admin)
    
    resp = c.post(f'/api/rooms/admin/bookings/{booking.id}/approve/', {'bed_id': str(bed.id)}, content_type='application/json')
    print("Status:", resp.status_code)
    try:
        print("Content:", resp.content.decode('utf-8'))
    except Exception as e:
         print(e)
else:
    print("No pending bookings to approve.")
