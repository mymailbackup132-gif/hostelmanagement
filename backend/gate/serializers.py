from rest_framework import serializers
from .models import ScanLog


class ScanLogSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.full_name', read_only=True, default='Unknown')

    class Meta:
        model = ScanLog
        fields = ['id', 'resident', 'resident_name', 'qr_token', 'scan_time', 'result', 'reason']


class GateScanResultSerializer(serializers.Serializer):
    qr_token = serializers.UUIDField()
