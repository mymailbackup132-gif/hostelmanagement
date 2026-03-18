import threading
from django.core.mail import send_mail
from .models import Notification


def create_notification(recipient_role, message, recipient_id=None):
    """Utility to create in-app notifications."""
    Notification.objects.create(
        recipient_role=recipient_role,
        message=message,
        recipient_id=recipient_id,
    )


def send_email_async(subject, message, from_email, recipient_list):
    """Helper to send email in a background thread to avoid worker timeouts."""
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            import traceback
            print(f"Async email sending failed: {e}")
            traceback.print_exc()

    thread = threading.Thread(target=_send)
    thread.start()
