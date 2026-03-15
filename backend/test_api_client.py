import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
import datetime
User = get_user_model()

c = Client()
u = User.objects.filter(email='testres@example.com').first()
if not u:
    u = User.objects.create_user(email='testres@example.com', password='pw', role='resident', full_name='Test')
c.force_login(u)

resp = c.post('/api/rooms/bookings/', {
    "preferred_room_type": "single",
    "move_in_date": (datetime.date.today() + datetime.timedelta(days=10)).isoformat(),
    "duration_months": "1"
}, content_type='application/json')
print("Status:", resp.status_code)
print("Content:", resp.content)
