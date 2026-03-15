from datetime import date
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Payment, UPIQRCode
from .serializers import PaymentSerializer, UPIQRSerializer
from accounts.views import IsAdmin
from rooms.models import Allocation
from notifications_app.utils import create_notification

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
