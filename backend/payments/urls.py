from django.urls import path
from . import views

urlpatterns = [
    path('upi-qr/', views.UPIQRDisplayView.as_view(), name='upi-qr'),
    path('my/', views.ResidentPaymentHistoryView.as_view(), name='my-payments'),
    path('admin/', views.AdminPaymentListView.as_view(), name='admin-payments'),
    path('admin/upi-qr/upload/', views.AdminUPIQRUploadView.as_view(), name='admin-upi-upload'),
    path('<uuid:pk>/paid/', views.AdminMarkPaidView.as_view(), name='mark-paid'),
    path('<uuid:pk>/record/', views.ResidentRecordPaymentView.as_view(), name='record-payment'),
    path('reminder-schedule/', views.ReminderScheduleView.as_view(), name='reminder-schedule'),
    path('trigger-reminders/', views.AdminTriggerRemindersView.as_view(), name='trigger-reminders'),
    path('admin/remind/<uuid:pk>/', views.AdminSendResidentReminderView.as_view(), name='admin-remind-resident'),
]
