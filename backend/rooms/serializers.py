from rest_framework import serializers
from .models import Room, Bed, Booking, Allocation, RoomPhoto


class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = ['id', 'bed_number', 'is_occupied']


class RoomPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomPhoto
        fields = ['id', 'image']


class RoomSerializer(serializers.ModelSerializer):
    available_beds = serializers.SerializerMethodField()
    photos_list = RoomPhotoSerializer(source='room_photos', many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'room_number', 'floor', 'room_type', 'total_beds', 'available_beds', 'rent_amount', 'photos_list']

    def get_available_beds(self, obj):
        return obj.available_beds()


class RoomDetailSerializer(RoomSerializer):
    beds = BedSerializer(many=True, read_only=True)

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ['beds']


class RoomCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['room_number', 'floor', 'room_type', 'total_beds', 'rent_amount']


class BookingSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source='resident.full_name', read_only=True)
    resident_email = serializers.CharField(source='resident.email', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'resident', 'resident_name', 'resident_email',
                  'preferred_room_type', 'move_in_date', 'duration_months',
                  'status', 'rejection_reason', 'created_at']
        read_only_fields = ['id', 'resident', 'status', 'rejection_reason', 'created_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['preferred_room_type', 'move_in_date', 'duration_months']


class AdminBookingApprovalSerializer(serializers.Serializer):
    bed_id = serializers.UUIDField()


class AllocationSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source='bed.room.room_number', read_only=True)
    floor = serializers.IntegerField(source='bed.room.floor', read_only=True)
    bed_number = serializers.IntegerField(source='bed.bed_number', read_only=True)
    room_type = serializers.CharField(source='bed.room.room_type', read_only=True)
    rent_amount = serializers.DecimalField(source='bed.room.rent_amount', max_digits=10, decimal_places=2, read_only=True)
    resident_name = serializers.CharField(source='resident.full_name', read_only=True)
    resident_photo = serializers.ImageField(source='resident.profile_photo', read_only=True)

    class Meta:
        model = Allocation
        fields = [
            'id', 'resident_name', 'resident_photo', 'room_number', 'floor',
            'bed_number', 'room_type', 'rent_amount',
            'start_date', 'qr_code', 'qr_token', 'qr_status',
        ]
