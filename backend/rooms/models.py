import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Room(models.Model):
    ROOM_TYPES = [('single', 'Single'), ('double', 'Double'), ('triple', 'Triple')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_number = models.CharField(max_length=20, unique=True)
    floor = models.PositiveIntegerField()
    room_type = models.CharField(max_length=10, choices=ROOM_TYPES)
    total_beds = models.PositiveIntegerField()
    rent_amount = models.DecimalField(max_digits=10, decimal_places=2)
    photos = models.JSONField(default=list, blank=True)  # list of media paths
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['floor', 'room_number']

    def available_beds(self):
        return self.beds.filter(is_occupied=False).count()

    def __str__(self):
        return f'Room {self.room_number} ({self.room_type})'


class Bed(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.PositiveIntegerField()
    is_occupied = models.BooleanField(default=False)

    class Meta:
        unique_together = ('room', 'bed_number')
        ordering = ['bed_number']

    def __str__(self):
        return f'{self.room.room_number} - Bed {self.bed_number}'


class RoomPhoto(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='room_photos')
    image = models.ImageField(upload_to='room_photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    # Denormalized from room.room_type for backward compat (auto-filled on save)
    preferred_room_type = models.CharField(max_length=10, choices=Room.ROOM_TYPES, blank=True)
    move_in_date = models.DateField()
    duration_months = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto-populate preferred_room_type from the linked room
        if self.room and not self.preferred_room_type:
            self.preferred_room_type = self.room.room_type
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']


class Allocation(models.Model):
    QR_STATUS_CHOICES = [
        ('pending_movein', 'Pending Move-in'),
        ('active', 'Active'),
        ('deactivated_payment', 'Deactivated - Payment'),
        ('deactivated_admin', 'Deactivated - Admin'),
        ('deactivated_vacated', 'Deactivated - Vacated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='allocations')
    bed = models.ForeignKey(Bed, on_delete=models.PROTECT, related_name='allocations')
    booking = models.OneToOneField(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True)
    qr_status = models.CharField(max_length=30, choices=QR_STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def is_qr_active(self):
        return self.qr_status == 'active'
