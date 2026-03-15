from rest_framework import serializers
from .models import Complaint, ComplaintMessage


class ComplaintMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintMessage
        fields = ['id', 'sender_role', 'message', 'timestamp']
        read_only_fields = ['id', 'sender_role', 'timestamp']


class ComplaintSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.full_name', read_only=True)
    messages = ComplaintMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_id', 'resident', 'resident_name', 'category',
            'description', 'photo', 'status', 'priority', 'admin_notes',
            'messages', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'complaint_id', 'resident', 'created_at', 'updated_at']


class ComplaintCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['category', 'description', 'photo']
