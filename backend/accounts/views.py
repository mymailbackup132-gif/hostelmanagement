import pyotp
import qrcode
import io, base64, secrets, string, random, threading
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .models import EmailOTP

from rest_framework import generics, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, UserProfileSerializer,
    TOTPVerifySerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, AdminUserListSerializer,
    ChangePasswordSerializer, CompleteProfileSerializer,
)
from notifications_app.utils import create_notification, send_email_async

User = get_user_model()


class SendEmailOTPView(APIView):
    """POST /api/auth/email-otp/send/ — Send a 6-digit OTP to the given email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'detail': 'Email is required.'}, status=400)

        # Check email not already registered
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'An account with this email already exists.'}, status=400)

        otp_code = f'{random.randint(0, 999999):06d}'
        EmailOTP.objects.create(email=email, otp=otp_code)

        # Send email in background to avoid Gunicorn worker timeouts
        send_email_async(
            'HostelMS — Email Verification OTP',
            (
                f"Your email verification code is:\n\n"
                f"  {otp_code}\n\n"
                f"This code is valid for 10 minutes.\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"— HostelMS Team"
            ),
            settings.DEFAULT_FROM_EMAIL,
            [email]
        )

        return Response({'detail': 'OTP sent to your email.'})


class VerifyEmailOTPView(APIView):
    """POST /api/auth/email-otp/verify/ — Verify the OTP for the given email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp_code = request.data.get('otp', '').strip()

        if not email or not otp_code:
            return Response({'detail': 'Email and OTP are required.'}, status=400)

        # Get the latest OTP for this email
        try:
            otp_obj = EmailOTP.objects.filter(email=email, is_verified=False).latest('created_at')
        except EmailOTP.DoesNotExist:
            return Response({'detail': 'No OTP found. Please request a new one.'}, status=400)

        if otp_obj.is_expired():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)

        if otp_obj.otp != otp_code:
            return Response({'detail': 'Invalid OTP. Please try again.'}, status=400)

        otp_obj.is_verified = True
        otp_obj.save(update_fields=['is_verified'])
        return Response({'detail': 'Email verified successfully.'})


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Resident self-registration."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        # Ensure email was verified via OTP before allowing registration
        verified = EmailOTP.objects.filter(email=email, is_verified=True).exists()
        if not verified:
            return Response(
                {'detail': 'Email address has not been verified. Please verify your email first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = serializer.save()
        # Clean up used OTPs for this email
        EmailOTP.objects.filter(email=user.email).delete()
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


class CompleteProfileView(APIView):
    """POST /api/auth/complete-profile/ — resident uploads photo + ID to mark profile complete."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        serializer = CompleteProfileSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Refresh from DB to get updated profile_complete flag
        user.refresh_from_db()
        return Response({
            'detail': 'Profile updated successfully.',
            'profile_complete': user.profile_complete,
        })


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ — authenticated user changes their own password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})


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

            # Send email in background
            send_email_async(
                'HostelMS — Password Reset',
                (
                    f"Hi {user.full_name},\n\n"
                    f"We received a request to reset your password.\n\n"
                    f"Please use the link below to set a new password:\n"
                    f"{reset_url}\n\n"
                    f"This link expires in 24 hours.\n\n"
                    f"If you did not request this, please contact the hostel administrator.\n\n"
                    f"— HostelMS Team"
                ),
                settings.DEFAULT_FROM_EMAIL,
                [email]
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


class AdminDashboardStatsView(APIView):
    """GET /api/auth/admin/stats/ — Aggregates data for the admin dashboard overview."""
    permission_classes = [IsAdmin]

    def get(self, request):
        from rooms.models import Bed, Booking
        from payments.models import Payment
        from complaints.models import Complaint
        from django.db.models import Sum

        resident_count = User.objects.filter(role='resident', is_active=True).count()
        total_beds = Bed.objects.count()
        occupied_beds = Bed.objects.filter(is_occupied=True).count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        unresolved_complaints = Complaint.objects.exclude(status='resolved').count()
        overdue_payments = Payment.objects.filter(status='overdue').count()

        # Simple revenue calc: sum of all 'paid' payments this month (for demo we just sum all paid)
        revenue = Payment.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            'residents': resident_count,
            'total_beds': total_beds,
            'occupied_beds': occupied_beds,
            'available_beds': total_beds - occupied_beds,
            'pending_bookings': pending_bookings,
            'unresolved_complaints': unresolved_complaints,
            'overdue_payments': overdue_payments,
            'revenue': revenue
        })


class AdminChartDataView(APIView):
    """GET /api/auth/admin/chart-data/ — Returns complex structured data for Recharts."""
    permission_classes = [IsAdmin]

    def get(self, request):
        from rooms.models import Room
        from payments.models import Payment
        from complaints.models import Complaint
        from django.db.models import Sum, Count

        # 1. Occupancy by floor
        floors = {}
        for r in Room.objects.all():
            fl = f"Floor {r.floor}"
            if fl not in floors:
                floors[fl] = {'floor': fl, 'occupied': 0, 'available': 0}
            floors[fl]['occupied'] += r.beds.filter(is_occupied=True).count()
            floors[fl]['available'] += r.beds.filter(is_occupied=False).count()
        occupancy_data = sorted(list(floors.values()), key=lambda x: x['floor'])

        # 2. Revenue over last 6 months (mock simple aggregation by month_label)
        # We group by month_label for past paid payments
        rev_qs = Payment.objects.filter(status='paid').values('month_label').annotate(amount=Sum('amount')).order_by('-created_at')[:6]
        revenue_data = [{'month': r['month_label'], 'amount': r['amount']} for r in reversed(list(rev_qs))]

        # 3. Complaints by status
        comp_qs = Complaint.objects.values('status').annotate(count=Count('id'))
        comp_data = [{'status': c['status'].replace('_', ' ').capitalize(), 'count': c['count']} for c in comp_qs]
        # ensure keys exist visually
        present_statuses = [c['status'] for c in comp_data]
        for st in ['Submitted', 'Pending', 'In progress', 'Resolved']:
            if st not in present_statuses:
                comp_data.append({'status': st, 'count': 0})
        
        # Sort complaints logically
        comp_order = {'Submitted': 1, 'Pending': 2, 'In progress': 3, 'Resolved': 4}
        comp_data = sorted(comp_data, key=lambda x: comp_order.get(x['status'], 99))

        return Response({
            'occupancy': occupancy_data,
            'revenue': revenue_data,
            'complaints': comp_data
        })


