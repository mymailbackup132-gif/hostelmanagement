import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import json

User = get_user_model()
usr = User.objects.filter(role='resident').first()
if usr:
    refresh = RefreshToken.for_user(usr)
    # Add claims matching views logic
    refresh['user_id'] = str(usr.id)
    refresh['email'] = usr.email
    refresh['role'] = usr.role
    print(str(refresh.access_token))
else:
    print("No resident found")
