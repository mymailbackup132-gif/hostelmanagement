from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/gate/', include('gate.urls')),
    path('api/notifications/', include('notifications_app.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
