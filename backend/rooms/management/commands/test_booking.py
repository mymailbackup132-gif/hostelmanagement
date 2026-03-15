from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
import datetime

User = get_user_model()

class Command(BaseCommand):
    def handle(self, *args, **options):
        client = APIClient()
        user = User.objects.filter(role='resident').first()
        if not user:
            user = User.objects.create_user(email='testres@example.com', password='pw', full_name='Test Res', role='resident')
            
        client.force_authenticate(user=user)
        
        url = '/api/rooms/bookings/'
        # Same payload structure as React frontend
        data = {
            "preferred_room_type": "single",
            "move_in_date": (datetime.date.today() + datetime.timedelta(days=10)).isoformat(),
            "duration_months": "1"
        }
        
        resp = client.post(url, data, format='json')
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.content.decode('utf-8')}")
