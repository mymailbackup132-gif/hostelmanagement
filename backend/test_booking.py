import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hostel.settings')
django.setup()

from django.contrib.auth import get_user_model
from rooms.serializers import BookingCreateSerializer

User = get_user_model()
usr = User.objects.filter(role='resident').first()
if not usr:
    print("No resident found. Please register one first.")
else:
    print(f"Testing booking for {usr.email}")
    data = {"preferred_room_type": "single", "move_in_date": "2026-04-01", "duration_months": 3}
    serializer = BookingCreateSerializer(data=data)
    if serializer.is_valid():
        try:
            booking = serializer.save(resident=usr)
            print("Booking created:", booking.id)
            from notifications_app.utils import create_notification
            create_notification(recipient_role='admin', message=f'New booking request from {usr.full_name}')
            print("Notification created")
        except Exception as e:
            import traceback
            traceback.print_exc()
    else:
        print("Serializer errors:", serializer.errors)
