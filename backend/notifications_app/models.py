import uuid
from django.db import models


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_role = models.CharField(max_length=10, choices=[('admin', 'Admin'), ('resident', 'Resident')])
    recipient_id = models.UUIDField(null=True, blank=True)  # None = broadcast to all of that role
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
