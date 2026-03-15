import pytest
import uuid
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from gate.models import ScanLog
from rooms.models import Room, Bed, Booking, Allocation
from datetime import date

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_users():
    admin = User.objects.create_user(email='admin@test.com', password='pw', role='admin', full_name='Test Admin')
    resident = User.objects.create_user(email='res@test.com', password='pw', role='resident', full_name='Test Resident')
    return {'admin': admin, 'resident': resident}

@pytest.fixture
def active_allocation(test_users):
    """Creates a complete room → bed → booking → allocation chain."""
    room = Room.objects.create(room_number='G101', floor=1, room_type='single', total_beds=1, rent_amount=3000)
    bed = Bed.objects.create(room=room, bed_number=1, is_occupied=True)
    booking = Booking.objects.create(
        resident=test_users['resident'],
        preferred_room_type='single',
        move_in_date=date.today(),
        duration_months=1,
        status='approved'
    )
    alloc = Allocation.objects.create(
        resident=test_users['resident'],
        booking=booking,
        bed=bed,
        start_date=date.today()
    )
    return alloc


# ── Test: Unknown QR token ──────────────────────────────────────────────────

@pytest.mark.django_db
def test_gate_scan_unknown_qr(api_client, test_users):
    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('gate-scan')
    payload = {'qr_token': str(uuid.uuid4())}  # random unknown token
    response = api_client.post(url, payload, format='json')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['result'] == 'failed'
    assert 'Unknown' in response.data['reason']
    assert ScanLog.objects.count() == 1
    assert ScanLog.objects.first().result == 'failed'


# ── Test: Valid active QR token grants access ───────────────────────────────

@pytest.mark.django_db
def test_gate_scan_success_active_allocation(api_client, test_users, active_allocation):
    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('gate-scan')
    payload = {'qr_token': str(active_allocation.qr_token)}
    response = api_client.post(url, payload, format='json')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['result'] == 'success'
    assert response.data['color'] == 'green'
    assert response.data['resident']['name'] == 'Test Resident'
    assert response.data['resident']['room'] == 'G101'

    log = ScanLog.objects.first()
    assert log.result == 'success'
    assert log.resident == test_users['resident']


# ── Test: Deactivated QR (payment overdue) ──────────────────────────────────

@pytest.mark.django_db
def test_gate_scan_denied_deactivated_qr(api_client, test_users, active_allocation):
    # Deactivate the qr
    active_allocation.qr_status = 'deactivated_payment'
    active_allocation.save()

    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('gate-scan')
    payload = {'qr_token': str(active_allocation.qr_token)}
    response = api_client.post(url, payload, format='json')

    assert response.status_code == status.HTTP_200_OK
    assert response.data['result'] == 'failed'
    assert 'Payment' in response.data['reason']
    assert ScanLog.objects.first().result == 'failed'


# ── Test: Missing qr_token returns 400 ──────────────────────────────────────

@pytest.mark.django_db
def test_gate_scan_missing_qr_token(api_client, test_users):
    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('gate-scan')
    response = api_client.post(url, {}, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ── Test: Resident cannot access gate scan endpoint ───────────────────────

@pytest.mark.django_db
def test_gate_scan_forbidden_for_resident(api_client, test_users):
    api_client.force_authenticate(user=test_users['resident'])
    url = reverse('gate-scan')
    response = api_client.post(url, {'qr_token': str(uuid.uuid4())}, format='json')
    assert response.status_code == status.HTTP_403_FORBIDDEN


# ── Test: Admin can list scan logs ──────────────────────────────────────────

@pytest.mark.django_db
def test_admin_can_list_scan_logs(api_client, test_users):
    ScanLog.objects.create(qr_token=uuid.uuid4(), result='success', resident=test_users['resident'])
    ScanLog.objects.create(qr_token=uuid.uuid4(), result='failed', reason='Unknown QR')

    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('gate-scan-logs')
    response = api_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    data = response.data.get('results', response.data)
    assert len(data) == 2
