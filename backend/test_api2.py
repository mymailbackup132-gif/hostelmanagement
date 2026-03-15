import requests
import json

import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import datetime

User = get_user_model()
res = User.objects.filter(role='resident').first()
token = str(RefreshToken.for_user(res).access_token)
url = 'http://127.0.0.1:8000/api/rooms/bookings/'

# Using exact frontend payload structure
data = {
    "preferred_room_type": "single",
    "move_in_date": (datetime.date.today() + datetime.timedelta(days=10)).isoformat(),
    "duration_months": "1"
}

resp = requests.post(url, json=data, headers={"Authorization": f"Bearer {token}"})
print(resp.status_code)
print(resp.text)
