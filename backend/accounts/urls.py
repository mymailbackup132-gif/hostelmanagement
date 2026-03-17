from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('email-otp/send/', views.SendEmailOTPView.as_view(), name='email-otp-send'),
    path('email-otp/verify/', views.VerifyEmailOTPView.as_view(), name='email-otp-verify'),
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('totp/setup/', views.TOTPSetupView.as_view(), name='totp-setup'),
    path('totp/verify/', views.TOTPVerifyView.as_view(), name='totp-verify'),
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),
    path('complete-profile/', views.CompleteProfileView.as_view(), name='complete-profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/stats/', views.AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('admin/chart-data/', views.AdminChartDataView.as_view(), name='admin-chart-data'),
    path('admin/users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/reset-2fa/<uuid:pk>/', views.AdminReset2FAView.as_view(), name='admin-reset-2fa'),
    path('admin/deactivate/<uuid:pk>/', views.AdminDeactivateUserView.as_view(), name='admin-deactivate-user'),
]
