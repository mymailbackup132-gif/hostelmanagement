from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('totp/setup/', views.TOTPSetupView.as_view(), name='totp-setup'),
    path('totp/verify/', views.TOTPVerifyView.as_view(), name='totp-verify'),
    path('profile/', views.ProfileView.as_view(), name='auth-profile'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/reset-2fa/<uuid:pk>/', views.AdminReset2FAView.as_view(), name='admin-reset-2fa'),
    path('admin/deactivate/<uuid:pk>/', views.AdminDeactivateUserView.as_view(), name='admin-deactivate-user'),
]
