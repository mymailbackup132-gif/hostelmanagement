from django.urls import path
from . import views

urlpatterns = [
    path('upi-qr/', views.UPIQRDisplayView.as_view(), name='upi-qr'),
    path('my/', views.ResidentPaymentHistoryView.as_view(), name='my-payments'),
    path('admin/', views.AdminPaymentListView.as_view(), name='admin-payments'),
    path('admin/upi-qr/upload/', views.AdminUPIQRUploadView.as_view(), name='admin-upi-upload'),
    path('<uuid:pk>/paid/', views.AdminMarkPaidView.as_view(), name='mark-paid'),
]
