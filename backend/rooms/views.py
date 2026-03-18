import io
import base64
import qrcode
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Room, Bed, Booking, Allocation, RoomPhoto
from .serializers import (
    RoomSerializer, RoomDetailSerializer, BookingSerializer,
    BookingCreateSerializer, AllocationSerializer,
    AdminBookingApprovalSerializer, RoomCreateSerializer
)
from accounts.views import IsAdmin
from notifications_app.utils import create_notification, send_email_async

User = get_user_model()


# ── Public / Resident Room Views ─────────────────────────────────────────────

class RoomListView(generics.ListAPIView):
    """GET /api/rooms/ — Authenticated residents browse available rooms."""
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Room.objects.all()
        room_type = self.request.query_params.get('type')
        if room_type:
            qs = qs.filter(room_type=room_type)
        return qs


class RoomDetailView(generics.RetrieveAPIView):
    serializer_class = RoomDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Room.objects.all()


# ── Booking ──────────────────────────────────────────────────────────────────

class BookingCreateView(generics.CreateAPIView):
    """POST /api/rooms/bookings/ — Resident creates a booking request."""
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not request.user.profile_complete:
            return Response(
                {'detail': 'Please complete your profile (upload profile photo and ID proof) before booking a room.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        booking = serializer.save(resident=self.request.user)
        create_notification(
            recipient_role='admin',
            message=f'New booking request from {self.request.user.full_name}'
        )
        return booking


class ResidentBookingListView(generics.ListAPIView):
    """GET /api/rooms/bookings/my/ — Resident's own bookings."""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(resident=self.request.user)


class BookingCancelView(APIView):
    """POST /api/rooms/bookings/<pk>/cancel/ — Resident cancels a pending booking."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, resident=request.user, status='pending')
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found or not cancellable.'}, status=404)
        booking.status = 'cancelled'
        booking.save()
        return Response({'detail': 'Booking cancelled.'})


# ── Admin Room Management ────────────────────────────────────────────────────

class AdminRoomListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        return RoomCreateSerializer if self.request.method == 'POST' else RoomSerializer

    def get_queryset(self):
        return Room.objects.all()

    def perform_create(self, serializer):
        room = serializer.save()
        # Auto-create beds
        for i in range(1, room.total_beds + 1):
            Bed.objects.create(room=room, bed_number=i)


class AdminRoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    serializer_class = RoomDetailSerializer
    queryset = Room.objects.all()


class AdminRoomPhotoUploadView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            room = Room.objects.get(pk=pk)
        except Room.DoesNotExist:
            return Response({'detail': 'Room not found.'}, status=404)
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided.'}, status=400)
        photo = RoomPhoto.objects.create(room=room, image=image)
        return Response({'id': str(photo.id), 'url': request.build_absolute_uri(photo.image.url)})


class AdminBookingListView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        qs = Booking.objects.select_related('resident')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminBookingApproveView(APIView):
    """POST /api/rooms/admin/bookings/<pk>/approve/ — Approve and auto-assign a bed."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=404)

        if booking.status != 'pending':
            return Response({'detail': f'Booking is already {booking.status}.'}, status=400)

        if not booking.room:
            return Response({'detail': 'Booking has no room assigned. Cannot approve.'}, status=400)

        # Auto-pick the first available bed in the requested room
        bed = booking.room.beds.filter(is_occupied=False).first()
        if not bed:
            return Response(
                {'detail': f'No available beds in Room {booking.room.room_number}. Please reject this booking or free up a bed first.'},
                status=400
            )

        # Create allocation — QR active only from move-in date
        from datetime import date as _date
        initial_qr_status = 'active' if booking.move_in_date <= _date.today() else 'pending_movein'
        alloc = Allocation.objects.create(
            resident=booking.resident,
            bed=bed,
            booking=booking,
            start_date=booking.move_in_date,
            qr_status=initial_qr_status,
        )
        # Generate QR code image
        qr_data = str(alloc.qr_token)
        img = qrcode.make(qr_data)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        alloc.qr_code.save(f'qr_{alloc.id}.png', ContentFile(buf.getvalue()), save=True)

        # Update booking and bed status
        booking.status = 'approved'
        booking.save()
        bed.is_occupied = True
        bed.save()

        # Notify resident
        create_notification(
            recipient_role='resident',
            recipient_id=booking.resident.id,
            message=f'Your booking has been approved! Room: {bed.room.room_number}, Bed: {bed.bed_number}'
        )

        return Response({'detail': 'Booking approved and allocation created.', 'allocation_id': str(alloc.id)})



class AdminBookingRejectView(APIView):
    """POST /api/rooms/admin/bookings/<pk>/reject/ — Reject with reason."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({'detail': 'Booking not found.'}, status=404)
        reason = request.data.get('reason', 'No reason provided.')
        booking.status = 'rejected'
        booking.rejection_reason = reason
        booking.save()

        send_email_async(
            'Booking Request Rejected',
            f'Hi {booking.resident.full_name},\n\nYour booking request has been rejected.\nReason: {reason}\n\nPlease contact the hostel admin for more information.',
            settings.DEFAULT_FROM_EMAIL,
            [booking.resident.email]
        )
        return Response({'detail': 'Booking rejected and resident notified.'})


class ResidentAllocationView(generics.RetrieveAPIView):
    """GET /api/rooms/allocation/ — Get current resident's allocation (room + QR)."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AllocationSerializer

    def get_object(self):
        return Allocation.objects.filter(
            resident=self.request.user,
            qr_status__in=['active', 'pending_movein']
        ).latest('start_date')
