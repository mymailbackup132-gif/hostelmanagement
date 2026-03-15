from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from rooms.models import Allocation
from .models import ScanLog
from .serializers import ScanLogSerializer, GateScanResultSerializer
from accounts.views import IsAdmin


class GateScanView(APIView):
    """POST /api/gate/scan/ — Admin scans a QR token, gets pass/fail + details."""
    permission_classes = [IsAdmin]

    def post(self, request):
        qr_token = request.data.get('qr_token')
        if not qr_token:
            return Response({'detail': 'qr_token required.'}, status=400)

        try:
            alloc = Allocation.objects.select_related('resident', 'bed', 'bed__room').get(qr_token=qr_token)
        except Allocation.DoesNotExist:
            ScanLog.objects.create(qr_token=qr_token, result='failed', reason='Unknown QR')
            return Response({'result': 'failed', 'reason': 'Unknown QR', 'color': 'red'})

        resident = alloc.resident
        if not alloc.is_qr_active():
            reason_map = {
                'deactivated_payment': 'Payment Overdue',
                'deactivated_admin': 'Account Deactivated by Admin',
                'deactivated_vacated': 'Resident has Vacated',
            }
            reason = reason_map.get(alloc.qr_status, 'Deactivated')
            ScanLog.objects.create(qr_token=qr_token, resident=resident, result='failed', reason=reason)
            return Response({'result': 'failed', 'reason': reason, 'color': 'red'})

        ScanLog.objects.create(qr_token=qr_token, resident=resident, result='success')
        return Response({
            'result': 'success',
            'color': 'green',
            'resident': {
                'name': resident.full_name,
                'photo': request.build_absolute_uri(resident.profile_photo.url) if resident.profile_photo else None,
                'room': alloc.bed.room.room_number,
                'floor': alloc.bed.room.floor,
                'bed': alloc.bed.bed_number,
            }
        })


class AdminScanLogListView(generics.ListAPIView):
    serializer_class = ScanLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = ScanLog.objects.select_related('resident')
        result = self.request.query_params.get('result')
        date_f = self.request.query_params.get('date')
        if result:
            qs = qs.filter(result=result)
        if date_f:
            qs = qs.filter(scan_time__date=date_f)
        return qs
