import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ScanLog(models.Model):
    RESULT_CHOICES = [('success', 'Success'), ('failed', 'Failed')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    resident = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scan_logs'
    )
    qr_token = models.UUIDField()
    scan_time = models.DateTimeField(auto_now_add=True)
    result = models.CharField(max_length=10, choices=RESULT_CHOICES)
    reason = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-scan_time']
