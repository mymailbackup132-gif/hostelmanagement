import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from payments.models import Payment, ReminderSchedule
from rooms.models import Room, Bed, Allocation

User = get_user_model()

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def admin_user():
    return User.objects.create_user(
        email='admin@test.com',
        phone='1111111111',
        full_name='Admin User',
        password='password123',
        role='admin',
        is_2fa_setup=True,
        totp_secret='JBSWY3DPEHPK3PXP'
    )

@pytest.fixture
def resident_user():
    return User.objects.create_user(
        email='resident@test.com',
        phone='2222222222',
        full_name='Resident User',
        password='password123',
        role='resident',
        is_2fa_setup=True,
        totp_secret='JBSWY3DPEHPK3PXP'
    )

@pytest.fixture
def test_room():
    return Room.objects.create(
        room_number='101',
        floor=1,
        room_type='single',
        total_beds=1,
        rent_amount=5000
    )

@pytest.fixture
def test_bed(test_room):
    return Bed.objects.create(
        room=test_room,
        bed_number=1,
        is_occupied=True
    )

@pytest.fixture
def test_allocation(resident_user, test_bed):
    return Allocation.objects.create(
        resident=resident_user,
        bed=test_bed,
        start_date=timezone.now().date()
    )

@pytest.fixture
def test_payment(resident_user):
    return Payment.objects.create(
        resident=resident_user,
        amount=5000,
        month_label='January 2026',
        due_date=timezone.now().date() - timedelta(days=1),
        status='pending'
    )

@pytest.mark.django_db
class TestPaymentsModule:
    def test_resident_view_payments(self, client, resident_user, test_payment):
        client.force_authenticate(user=resident_user)
        res = client.get('/api/payments/my/')
        assert res.status_code == 200
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        assert len(results) > 0
        assert results[0]['id'] == str(test_payment.id)

    def test_admin_view_all_payments(self, client, admin_user, test_payment):
        client.force_authenticate(user=admin_user)
        res = client.get('/api/payments/admin/')
        assert res.status_code == 200
        results = res.data.get('results', res.data) if isinstance(res.data, dict) else res.data
        assert len(results) > 0

    def test_admin_mark_payment_paid(self, client, admin_user, test_payment):
        client.force_authenticate(user=admin_user)
        res = client.post(f'/api/payments/{test_payment.id}/paid/')
        assert res.status_code == 200
        assert res.data['detail'] == 'Payment marked as paid.'
        test_payment.refresh_from_db()
        assert test_payment.status == 'paid'
        # Reactivate QR check (it happens in the view logic for the resident's active allocation)
        alloc = test_payment.resident.allocations.first()
        if alloc:
            assert alloc.qr_status == 'active'

    def test_reminder_schedule_singleton(self, client, admin_user):
        client.force_authenticate(user=admin_user)
        # Accessing it via GET should create the singleton if it doesn't exist
        res1 = client.get('/api/payments/reminder-schedule/')
        assert res1.status_code == 200
        assert ReminderSchedule.objects.count() == 1
        
        # Patching it
        res2 = client.patch('/api/payments/reminder-schedule/', {'enabled': False})
        assert res2.status_code == 200
        assert res2.data['enabled'] is False
        assert ReminderSchedule.objects.count() == 1
