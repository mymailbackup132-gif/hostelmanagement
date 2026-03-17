import uuid
import qrcode
import io
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Payment(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('paid', 'Paid'), ('overdue', 'Overdue')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    month_label = models.CharField(max_length=20, blank=True)  # e.g. "March 2026"
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f'{self.resident.full_name} - {self.month_label} ({self.status})'


class UPIQRCode(models.Model):
    """Admin uploads a static UPI QR image."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    image = models.ImageField(upload_to='upi_qr/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-uploaded_at']

    def save(self, *args, **kwargs):
        # Deactivate all previous ones
        UPIQRCode.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class ReminderSchedule(models.Model):
    """Singleton config: admin sets what time daily reminders run."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    enabled = models.BooleanField(default=False)
    remind_hour = models.PositiveSmallIntegerField(default=9)     # 0-23
    remind_minute = models.PositiveSmallIntegerField(default=0)   # 0-59
    last_run_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Reminder Schedule'

    @classmethod
    def get_singleton(cls):
        existing = cls.objects.first()
        if existing:
            return existing
        return cls.objects.create()
