from django.urls import path
from . import views

urlpatterns = [
    path('scan/', views.GateScanView.as_view(), name='gate-scan'),
    path('logs/', views.AdminScanLogListView.as_view(), name='gate-scan-logs'),
]
