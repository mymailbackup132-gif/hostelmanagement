from .models import Notification


def create_notification(recipient_role, message, recipient_id=None):
    """Utility to create in-app notifications."""
    Notification.objects.create(
        recipient_role=recipient_role,
        message=message,
        recipient_id=recipient_id,
    )
