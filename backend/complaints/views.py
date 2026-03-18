from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Complaint, ComplaintMessage
from .serializers import ComplaintSerializer, ComplaintCreateSerializer, ComplaintMessageSerializer
from accounts.views import IsAdmin
from notifications_app.utils import create_notification, send_email_async


class ResidentComplaintListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return ComplaintCreateSerializer if self.request.method == 'POST' else ComplaintSerializer

    def get_queryset(self):
        return Complaint.objects.filter(resident=self.request.user)

    def perform_create(self, serializer):
        complaint = serializer.save(resident=self.request.user)
        create_notification(
            recipient_role='admin',
            message=f'New complaint [{complaint.complaint_id}] from {self.request.user.full_name}: {complaint.get_category_display()}'
        )


class ResidentComplaintDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        return Complaint.objects.filter(resident=self.request.user)


class ComplaintMessageCreateView(generics.CreateAPIView):
    """POST /api/complaints/<pk>/messages/ — Add a follow-up message."""
    serializer_class = ComplaintMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        complaint = Complaint.objects.get(pk=self.kwargs['pk'])
        role = self.request.user.role
        msg = serializer.save(complaint=complaint, sender_role=role)
        if role == 'resident':
            create_notification(
                recipient_role='admin',
                message=f'Follow-up on complaint [{complaint.complaint_id}] from {self.request.user.full_name}'
            )
        else:
            create_notification(
                recipient_role='resident',
                recipient_id=complaint.resident.id,
                message=f'Admin replied to your complaint [{complaint.complaint_id}]'
            )


class AdminComplaintListView(generics.ListAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Complaint.objects.select_related('resident')
        for f in ['status', 'category', 'priority']:
            val = self.request.query_params.get(f)
            if val:
                qs = qs.filter(**{f: val})
        return qs


class AdminComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = ComplaintSerializer
    permission_classes = [IsAdmin]
    queryset = Complaint.objects.all()

    def perform_update(self, serializer):
        old_status = self.get_object().status
        complaint = serializer.save()
        if old_status != complaint.status:
            send_email_async(
                subject=f'Complaint [{complaint.complaint_id}] Status Updated',
                message=f'Hi {complaint.resident.full_name},\n\nYour complaint status has been updated to: {complaint.get_status_display()}\n\nAdmin Notes: {complaint.admin_notes or "None"}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[complaint.resident.email],
            )
            create_notification(
                recipient_role='resident',
                recipient_id=complaint.resident.id,
                message=f'Your complaint [{complaint.complaint_id}] status changed to {complaint.get_status_display()}'
            )
