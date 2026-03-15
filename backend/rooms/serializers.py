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
    """Read serializer used by both admin and resident."""
    resident_name = serializers.CharField(source='resident.full_name', read_only=True)
    resident_email = serializers.CharField(source='resident.email', read_only=True)
    # Room detail fields sourced from the FK
    room_number = serializers.CharField(source='room.room_number', read_only=True, default=None)
    room_type = serializers.CharField(source='room.room_type', read_only=True, default=None)
    floor = serializers.IntegerField(source='room.floor', read_only=True, default=None)
    rent_amount = serializers.DecimalField(
        source='room.rent_amount', max_digits=10, decimal_places=2, read_only=True, default=None
    )

    class Meta:
        model = Booking
        fields = [
            'id', 'resident', 'resident_name', 'resident_email',
            'room', 'room_number', 'room_type', 'floor', 'rent_amount',
            'preferred_room_type',  # kept for backward compat
            'move_in_date', 'duration_months',
            'status', 'rejection_reason', 'created_at',
        ]
        read_only_fields = [
            'id', 'resident', 'status', 'rejection_reason', 'created_at',
            'preferred_room_type',
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    """Write serializer: resident submits a room UUID, move-in date, and duration."""
    class Meta:
        model = Booking
        fields = ['room', 'move_in_date', 'duration_months']

    def validate_room(self, value):
        if value is None:
            raise serializers.ValidationError('A room must be selected.')
        if value.available_beds() == 0:
            raise serializers.ValidationError('This room has no available beds. Please choose another room.')
        return value


class AdminBookingApprovalSerializer(serializers.Serializer):
    """Kept for import compat; no longer used in approve view."""
    pass


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
