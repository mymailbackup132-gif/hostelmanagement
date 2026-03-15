from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer
from accounts.views import IsAdmin


class MyNotificationsView(generics.ListAPIView):
    """GET /api/notifications/ — Authenticated user's notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(
            recipient_role=user.role
        ).filter(
            Q(recipient_id=None) | Q(recipient_id=user.id)
        )


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk)
            n.is_read = True
            n.save()
        except Notification.DoesNotExist:
            pass
        return Response({'detail': 'Marked as read.'})


class MarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        Notification.objects.filter(
            recipient_role=user.role
        ).filter(
            Q(recipient_id=None) | Q(recipient_id=user.id)
        ).update(is_read=True)
        return Response({'detail': 'All marked as read.'})
