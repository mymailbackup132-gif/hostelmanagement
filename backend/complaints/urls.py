from django.urls import path
from . import views

urlpatterns = [
    path('', views.ResidentComplaintListCreateView.as_view(), name='complaint-list-create'),
    path('<uuid:pk>/', views.ResidentComplaintDetailView.as_view(), name='complaint-detail'),
    path('<uuid:pk>/messages/', views.ComplaintMessageCreateView.as_view(), name='complaint-messages'),
    path('admin/', views.AdminComplaintListView.as_view(), name='admin-complaint-list'),
    path('admin/<uuid:pk>/', views.AdminComplaintUpdateView.as_view(), name='admin-complaint-update'),
]
