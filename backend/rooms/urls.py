from django.urls import path
from . import views

urlpatterns = [
    path('', views.RoomListView.as_view(), name='room-list'),
    path('<uuid:pk>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('bookings/', views.BookingCreateView.as_view(), name='booking-create'),
    path('bookings/my/', views.ResidentBookingListView.as_view(), name='my-bookings'),
    path('bookings/<uuid:pk>/cancel/', views.BookingCancelView.as_view(), name='booking-cancel'),
    path('allocation/', views.ResidentAllocationView.as_view(), name='my-allocation'),
    # Admin
    path('admin/rooms/', views.AdminRoomListView.as_view(), name='admin-room-list'),
    path('admin/rooms/<uuid:pk>/', views.AdminRoomDetailView.as_view(), name='admin-room-detail'),
    path('admin/rooms/<uuid:pk>/photos/', views.AdminRoomPhotoUploadView.as_view(), name='admin-room-photos'),
    path('admin/bookings/', views.AdminBookingListView.as_view(), name='admin-booking-list'),
    path('admin/bookings/<uuid:pk>/approve/', views.AdminBookingApproveView.as_view(), name='booking-approve'),
    path('admin/bookings/<uuid:pk>/reject/', views.AdminBookingRejectView.as_view(), name='booking-reject'),
]
