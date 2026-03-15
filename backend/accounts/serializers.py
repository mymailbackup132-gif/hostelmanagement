import pyotp
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = [
            'email', 'password', 'full_name', 'phone',
            'profile_photo', 'id_proof',
            'emergency_contact_name', 'emergency_contact_phone',
            'parent_contact_name', 'parent_contact_phone',
            'residential_address',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Generate TOTP secret on registration
        totp_secret = pyotp.random_base32()
        user = User(**validated_data, totp_secret=totp_secret, role='resident')
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role',
            'profile_photo', 'id_proof',
            'emergency_contact_name', 'emergency_contact_phone',
            'parent_contact_name', 'parent_contact_phone',
            'residential_address', 'is_active', 'is_2fa_setup', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'is_2fa_setup', 'date_joined']


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
