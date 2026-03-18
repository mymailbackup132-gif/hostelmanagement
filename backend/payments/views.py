from datetime import date
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Payment, UPIQRCode, ReminderSchedule
from .serializers import PaymentSerializer, UPIQRSerializer, ReminderScheduleSerializer
from accounts.views import IsAdmin
from rooms.models import Allocation
from notifications_app.utils import create_notification, send_email_async

User = get_user_model()


class UPIQRDisplayView(APIView):
    """GET /api/payments/upi-qr/ — Resident gets the current active UPI QR."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            qr = UPIQRCode.objects.filter(is_active=True).latest('uploaded_at')
            return Response({'qr_image': request.build_absolute_uri(qr.image.url), 'uploaded_at': qr.uploaded_at})
        except UPIQRCode.DoesNotExist:
            return Response({'detail': 'No UPI QR uploaded yet.'}, status=404)


class ResidentPaymentHistoryView(generics.ListAPIView):
    """GET /api/payments/my/ — Resident's own payment history."""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(resident=self.request.user)


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Payment.objects.select_related('resident')
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return qs


class AdminMarkPaidView(APIView):
    """POST /api/payments/<pk>/paid/ — Admin marks payment as paid."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=404)

        if payment.status == 'paid':
            return Response({'detail': 'Already marked as paid.'})

        payment.status = 'paid'
        payment.paid_date = date.today()
        payment.save()

        # Re-activate gate QR if it was deactivated due to payment
        try:
            alloc = Allocation.objects.filter(
                resident=payment.resident,
                qr_status='deactivated_payment'
            ).latest('start_date')
            alloc.qr_status = 'active'
            alloc.save(update_fields=['qr_status'])
        except Allocation.DoesNotExist:
            pass

        create_notification(
            recipient_role='resident',
            recipient_id=payment.resident.id,
            message=f'Payment of ₹{payment.amount} for {payment.month_label} confirmed. QR reactivated.'
        )
        return Response({'detail': 'Payment marked as paid.'})


class AdminUPIQRUploadView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided.'}, status=400)
        qr = UPIQRCode.objects.create(image=image, is_active=True)
        return Response({'detail': 'UPI QR uploaded.', 'id': str(qr.id)})


class ReminderScheduleView(APIView):
    """GET/PATCH /api/payments/reminder-schedule/ — Admin views & updates the schedule config."""
    permission_classes = [IsAdmin]

    def get(self, request):
        schedule = ReminderSchedule.get_singleton()
        return Response(ReminderScheduleSerializer(schedule).data)

    def patch(self, request):
        schedule = ReminderSchedule.get_singleton()
        serializer = ReminderScheduleSerializer(schedule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminTriggerRemindersView(APIView):
    """POST /api/payments/trigger-reminders/ — Admin manually runs the reminder job now.
    Sends payment status emails to ALL residents with any payments."""
    permission_classes = [IsAdmin]

    def post(self, request):
        today = date.today()
        overdue_count = 0

        # 1. Mark overdue + deactivate QR for past-due payments
        for payment in Payment.objects.filter(status='pending', due_date__lt=today):
            payment.status = 'overdue'
            payment.save(update_fields=['status'])
            try:
                alloc = Allocation.objects.filter(
                    resident=payment.resident, qr_status='active'
                ).latest('start_date')
                alloc.qr_status = 'deactivated_payment'
                alloc.save(update_fields=['qr_status'])
            except Exception:
                pass
            create_notification(
                recipient_role='resident',
                recipient_id=payment.resident.id,
                message=f'Your payment of ₹{payment.amount} for {payment.month_label} is overdue. Gate QR deactivated.'
            )
            overdue_count += 1

        # 2. Send payment summary email to every resident who has payments
        emailed = 0
        residents_with_payments = User.objects.filter(
            role='resident', is_active=True, payments__isnull=False
        ).distinct()

        for resident in residents_with_payments:
            resident_payments = Payment.objects.filter(resident=resident).order_by('due_date')
            if not resident_payments.exists():
                continue

            pending_list = resident_payments.filter(status='pending')
            overdue_list = resident_payments.filter(status='overdue')

            lines = [f'Dear {resident.full_name},\n']
            if overdue_list.exists():
                lines.append('⚠️  OVERDUE PAYMENTS:')
                for p in overdue_list:
                    lines.append(f'  • {p.month_label}: ₹{p.amount} (was due {p.due_date}) — OVERDUE, gate QR deactivated')
                lines.append('')
            if pending_list.exists():
                lines.append('📅  UPCOMING PAYMENTS:')
                for p in pending_list:
                    lines.append(f'  • {p.month_label}: ₹{p.amount} due on {p.due_date}')
                lines.append('')

            paid_list = resident_payments.filter(status='paid')
            if paid_list.exists():
                lines.append('✅  PAID:')
                for p in paid_list:
                    lines.append(f'  • {p.month_label}: ₹{p.amount} — paid on {p.paid_date}')
                lines.append('')

            lines.append('Please clear any overdue dues immediately to restore gate access.\n')
            lines.append('— Hostel Management')

            # Send email in background
            send_email_async(
                subject='HostelMS — Your Payment Summary',
                message='\n'.join(lines),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[resident.email],
            )
            emailed += 1

        # 3. Update last_run_at
        schedule = ReminderSchedule.get_singleton()
        schedule.last_run_at = timezone.now()
        schedule.save(update_fields=['last_run_at'])

        return Response({
            'detail': f'Done. {overdue_count} overdue payment(s) processed. Payment summary sent to {emailed} resident(s).'
        })


class ResidentRecordPaymentView(APIView):
    """POST /api/payments/<pk>/record/ — Resident notifies admin they have paid."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk, resident=request.user)
        except Payment.DoesNotExist:
            return Response({'detail': 'Payment not found.'}, status=404)

        if payment.status == 'paid':
            return Response({'detail': 'This payment is already marked as paid.'}, status=400)

        create_notification(
            recipient_role='admin',
            message=f'{request.user.full_name} has recorded payment of ₹{payment.amount} for {payment.month_label}. Please verify and mark as paid.'
        )
        return Response({'detail': 'Payment recorded. Admin has been notified and will confirm your payment shortly.'})


class AdminSendResidentReminderView(APIView):
    """POST /api/payments/admin/remind/<user_id>/ — Send payment reminder to a single resident."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            resident = User.objects.get(pk=pk, role='resident')
        except User.DoesNotExist:
            return Response({'detail': 'Resident not found.'}, status=404)

        resident_payments = Payment.objects.filter(resident=resident).order_by('due_date')
        if not resident_payments.exists():
            return Response({'detail': 'No payment records found for this resident.'}, status=404)

        today = date.today()
        pending_list = resident_payments.filter(status='pending')
        overdue_list = resident_payments.filter(status='overdue')

        lines = [f'Dear {resident.full_name},\n']
        if overdue_list.exists():
            lines.append('⚠️  OVERDUE PAYMENTS:')
            for p in overdue_list:
                lines.append(f'  • {p.month_label}: ₹{p.amount} (was due {p.due_date}) — gate QR deactivated')
            lines.append('')
        if pending_list.exists():
            lines.append('📅  UPCOMING PAYMENTS:')
            for p in pending_list:
                days_left = (p.due_date - today).days
                lines.append(f'  • {p.month_label}: ₹{p.amount} due on {p.due_date} ({days_left} days remaining)')
            lines.append('')

        if not overdue_list.exists() and not pending_list.exists():
            lines.append('All your payments are up to date. Thank you!')
        else:
            lines.append('Please clear any outstanding dues at the earliest.\n')

        lines.append('— Hostel Management')

        send_email_async(
            subject='HostelMS — Payment Reminder',
            message='\n'.join(lines),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[resident.email],
        )

        create_notification(
            recipient_role='resident',
            recipient_id=resident.id,
            message='The admin has sent you a payment reminder. Please check your email.'
        )
        return Response({'detail': f'Payment reminder sent to {resident.email}.'})

