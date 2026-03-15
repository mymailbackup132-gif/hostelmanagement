import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

CATEGORY_CHOICES = [
    ('maintenance', 'Maintenance'), ('cleanliness', 'Cleanliness'),
    ('noise', 'Noise'), ('electrical', 'Electrical'),
    ('plumbing', 'Plumbing'), ('staff', 'Staff'), ('other', 'Other'),
]

PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

STATUS_CHOICES = [
    ('submitted', 'Submitted'), ('pending', 'Pending'),
    ('in_progress', 'In Progress'), ('resolved', 'Resolved'),
]


class Complaint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    complaint_id = models.CharField(max_length=20, unique=True, editable=False)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    photo = models.ImageField(upload_to='complaint_photos/', null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='submitted')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='low')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.complaint_id:
            count = Complaint.objects.count() + 1
            self.complaint_id = f'CMP-{count:04d}'
        super().save(*args, **kwargs)


class ComplaintMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='messages')
    sender_role = models.CharField(max_length=10, choices=[('resident', 'Resident'), ('admin', 'Admin')])
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']
