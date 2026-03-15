import requests

# 1. Login to get token (using a dummy resident or creating one if needed)
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
res = User.objects.filter(role='resident').first()

if not res:
    res = User.objects.create_user(email='testres@example.com', password='password123', full_name='Test Resident', role='resident')
    print("Created test resident")

from rest_framework_simplejwt.tokens import RefreshToken
token = str(RefreshToken.for_user(res).access_token)

resp = requests.post('http://127.0.0.1:8000/api/rooms/bookings/', json={
    "preferred_room_type": "single",
    "move_in_date": "2026-08-01",
    "duration_months": 3
}, headers={"Authorization": f"Bearer {token}"})

print(resp.status_code)
print(resp.text)
