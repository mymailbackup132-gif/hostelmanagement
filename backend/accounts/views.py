import pyotp
import qrcode
import io, base64
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    TOTPVerifySerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, AdminUserListSerializer,
)
from notifications_app.utils import create_notification

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Resident self-registration."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # Notify admin
        create_notification(
            recipient_role='admin',
            message=f'New resident registered: {user.full_name} ({user.email})'
        )


class LoginView(APIView):
    """POST /api/auth/login/ — Step 1: validate email+password, return temp token indicating 2FA needed."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'detail': 'Account deactivated.'}, status=status.HTTP_403_FORBIDDEN)

        # Issue a short-lived "pre-auth" token — we use access token with a flag
        # The frontend must also verify TOTP before using any protected endpoint.
        return Response({
            'user_id': str(user.id),
            'email': user.email,
            'is_2fa_setup': user.is_2fa_setup,
            'require_2fa': True,
        }, status=status.HTTP_200_OK)


class TOTPSetupView(APIView):
    """GET /api/auth/totp/setup/ — returns QR code data URI for first-time setup."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id required.'}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        if not user.totp_secret:
            user.totp_secret = pyotp.random_base32()
            user.save(update_fields=['totp_secret'])

        otp = pyotp.TOTP(user.totp_secret)
        uri = otp.provisioning_uri(name=user.email, issuer_name='HostelMS')

        # Generate QR image as base64
        img = qrcode.make(uri)
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64 = base64.b64encode(buf.getvalue()).decode()

        return Response({'totp_uri': uri, 'qr_image': f'data:image/png;base64,{b64}', 'secret': user.totp_secret})


class TOTPVerifyView(APIView):
    """POST /api/auth/totp/verify/ — Step 2: verify TOTP and issue JWT."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        token = request.data.get('token', '')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        otp = pyotp.TOTP(user.totp_secret)
        if not otp.verify(token, valid_window=1):
            return Response({'detail': 'Invalid TOTP code.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_2fa_setup:
            user.is_2fa_setup = True
            user.save(update_fields=['is_2fa_setup'])

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'full_name': user.full_name,
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/profile/ — authenticated resident profile."""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            send_mail(
                subject='Password Reset Request',
                message=f'Click the link to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
            )
        except User.DoesNotExist:
            pass  # Don't reveal user existence
        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({'detail': 'Invalid link.'}, status=400)

        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'Link expired.'}, status=400)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password updated successfully.'})


# ─── Admin-only views ───────────────────────────────────────────────────────

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        role = self.request.query_params.get('role', 'resident')
        return User.objects.filter(role=role).order_by('-date_joined')


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all()


class AdminReset2FAView(APIView):
    """POST /api/auth/admin/reset-2fa/<user_id>/ — reset TOTP for a resident."""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        user.totp_secret = pyotp.random_base32()
        user.is_2fa_setup = False
        user.save(update_fields=['totp_secret', 'is_2fa_setup'])
        return Response({'detail': '2FA reset. User must re-scan QR on next login.'})


class AdminDeactivateUserView(APIView):
    """POST /api/auth/admin/deactivate/<user_id>/"""
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        user.is_active = False
        user.save(update_fields=['is_active'])
        # Deactivate gate QR if allocated
        try:
            from rooms.models import Allocation
            alloc = Allocation.objects.filter(resident=user).latest('start_date')
            alloc.qr_status = 'deactivated_admin'
            alloc.save(update_fields=['qr_status'])
        except Exception:
            pass
        return Response({'detail': 'User deactivated.'})
