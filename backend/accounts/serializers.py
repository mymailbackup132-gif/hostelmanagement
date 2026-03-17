import re
import pyotp
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

PHONE_RE = re.compile(r'^\+?[\d\s\-]{7,20}$')


PHONE_10_RE = re.compile(r'^(\+91[\s\-]?)?[6-9]\d{9}$')
MAX_FILE_SIZE = 1 * 1024 * 1024  # 1 MB


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            'email', 'password', 'full_name', 'phone',
            'emergency_contact_name', 'emergency_contact_phone',
            'parent_contact_name', 'parent_contact_phone',
        ]

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters.')
        if len(value) > 30:
            raise serializers.ValidationError('Full name must be 30 characters or fewer.')
        if not re.match(r"^[a-zA-Z\s'\-]+$", value):
            raise serializers.ValidationError('Full name may only contain letters, spaces, hyphens, and apostrophes.')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def _validate_phone(self, value, field_label='Phone'):
        value = value.strip()
        if not PHONE_10_RE.match(value):
            raise serializers.ValidationError(f'{field_label} must be a valid 10-digit mobile number.')
        return value

    def validate_phone(self, value):
        return self._validate_phone(value, 'Phone')

    def validate_emergency_contact_phone(self, value):
        value = value.strip()
        if value:
            return self._validate_phone(value, 'Emergency contact phone')
        return value

    def validate_parent_contact_phone(self, value):
        value = value.strip()
        if value:
            return self._validate_phone(value, 'Parent contact phone')
        return value

    def validate_emergency_contact_name(self, value):
        value = value.strip()
        if len(value) > 30:
            raise serializers.ValidationError('Name must be 30 characters or fewer.')
        return value

    def validate_parent_contact_name(self, value):
        value = value.strip()
        if len(value) > 30:
            raise serializers.ValidationError('Name must be 30 characters or fewer.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        totp_secret = pyotp.random_base32()
        user = User(**validated_data, totp_secret=totp_secret, role='resident')
        user.set_password(password)
        user.save()
        return user


class CompleteProfileSerializer(serializers.ModelSerializer):
    """Used by POST /auth/complete-profile/ — uploads photo+ID and fills address."""

    class Meta:
        model = User
        fields = [
            'full_name', 'phone', 'residential_address',
            'profile_photo', 'id_proof',
            'emergency_contact_name', 'emergency_contact_phone',
            'parent_contact_name', 'parent_contact_phone',
        ]

    def _validate_file(self, f):
        if f and hasattr(f, 'size') and f.size > MAX_FILE_SIZE:
            raise serializers.ValidationError('File size must be 1 MB or less.')
        return f

    def validate_profile_photo(self, value):
        return self._validate_file(value)

    def validate_id_proof(self, value):
        return self._validate_file(value)

    def validate_full_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters.')
        if len(value) > 30:
            raise serializers.ValidationError('Full name must be 30 characters or fewer.')
        return value

    def validate_phone(self, value):
        value = value.strip()
        if value and not PHONE_10_RE.match(value):
            raise serializers.ValidationError('Enter a valid 10-digit mobile number.')
        return value

    def validate_emergency_contact_phone(self, value):
        value = value.strip()
        if value and not PHONE_10_RE.match(value):
            raise serializers.ValidationError('Enter a valid 10-digit mobile number.')
        return value

    def validate_parent_contact_phone(self, value):
        value = value.strip()
        if value and not PHONE_10_RE.match(value):
            raise serializers.ValidationError('Enter a valid 10-digit mobile number.')
        return value

    def update(self, instance, validated_data):
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        # Mark profile complete when both photo and ID are present
        if instance.profile_photo and instance.id_proof:
            instance.profile_complete = True
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'profile_photo', 'id_proof',
            'emergency_contact_name', 'emergency_contact_phone',
            'parent_contact_name', 'parent_contact_phone',
            'residential_address', 'is_active', 'is_2fa_setup', 'profile_complete', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'is_2fa_setup', 'profile_complete', 'date_joined']


class TOTPSetupSerializer(serializers.Serializer):
    """Returns the provisioning URI for the authenticator app QR."""
    totp_uri = serializers.CharField(read_only=True)
    secret = serializers.CharField(read_only=True)


class TOTPVerifySerializer(serializers.Serializer):
    token = serializers.CharField(max_length=6)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lean serializer for admin user tables."""
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'phone', 'role', 'is_active', 'is_2fa_setup', 'date_joined']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
