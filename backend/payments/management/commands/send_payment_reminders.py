from datetime import date
from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from payments.models import Payment, ReminderSchedule
from rooms.models import Allocation


class Command(BaseCommand):
    help = 'Send payment overdue reminders and deactivate gate QR for unpaid residents'

    def handle(self, *args, **kwargs):
        today = date.today()
        overdue_payments = Payment.objects.filter(status='pending', due_date__lt=today).select_related('resident')
        count: int = 0

        for payment in overdue_payments:
            # Mark as overdue
            payment.status = 'overdue'
            payment.save(update_fields=['status'])

            # Deactivate the resident's gate QR
            try:
                alloc = Allocation.objects.filter(
                    resident=payment.resident,
                    qr_status='active'
                ).latest('start_date')
                alloc.qr_status = 'deactivated_payment'
                alloc.save(update_fields=['qr_status'])
                self.stdout.write(f'  Deactivated QR for {payment.resident.email}')
            except Allocation.DoesNotExist:
                pass

            # Send overdue reminder email
            try:
                send_mail(
                    subject='Rent Payment Overdue — Hostel Management',
                    message=(
                        f'Dear {payment.resident.full_name},\n\n'
                        f'Your rent of ₹{payment.amount} for {payment.month_label} was due on {payment.due_date}.\n'
                        f'Your gate access QR has been temporarily deactivated.\n'
                        f'Please clear your dues at the earliest.\n\n'
                        f'— Hostel Management'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[payment.resident.email],
                    fail_silently=False,
                )
                self.stdout.write(self.style.SUCCESS(f'  Email sent to {payment.resident.email}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  Email failed for {payment.resident.email}: {e}'))

            count += 1

        # Update the scheduler's last_run_at
        schedule = ReminderSchedule.get_singleton()
        schedule.last_run_at = timezone.now()
        schedule.save(update_fields=['last_run_at'])

        self.stdout.write(self.style.SUCCESS(f'\nDone. {count} overdue payment(s) processed.'))
