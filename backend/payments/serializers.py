from rest_framework import serializers
from .models import Payment, UPIQRCode, ReminderSchedule


class PaymentSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.full_name', read_only=True)

    class Meta:
        model = Payment
        fields = ['id', 'resident', 'resident_name', 'due_date', 'amount', 'status', 'paid_date', 'month_label', 'created_at']
        read_only_fields = ['id', 'resident', 'created_at']


class UPIQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = UPIQRCode
        fields = ['id', 'image', 'uploaded_at', 'is_active']


class ReminderScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderSchedule
        fields = ['id', 'enabled', 'remind_hour', 'remind_minute', 'last_run_at', 'updated_at']
        read_only_fields = ['id', 'last_run_at', 'updated_at']
