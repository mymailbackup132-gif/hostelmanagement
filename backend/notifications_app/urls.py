from django.urls import path
from . import views

urlpatterns = [
    path('', views.MyNotificationsView.as_view(), name='notifications'),
    path('<uuid:pk>/read/', views.MarkNotificationReadView.as_view(), name='notification-read'),
    path('read-all/', views.MarkAllReadView.as_view(), name='notifications-read-all'),
]
