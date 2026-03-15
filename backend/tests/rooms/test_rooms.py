import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rooms.models import Room, Bed, Booking, Allocation
from datetime import date, timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def test_users():
    admin = User.objects.create_user(email='admin@test.com', password='pw', role='admin')
    resident = User.objects.create_user(email='res@test.com', password='pw', role='resident')
    return {'admin': admin, 'resident': resident}

@pytest.fixture
def sample_room():
    room = Room.objects.create(room_number='101', floor=1, room_type='single', total_beds=1, rent_amount=5000)
    bed = Bed.objects.create(room=room, bed_number=1)
    return {'room': room, 'bed': bed}

@pytest.mark.django_db
def test_room_creation(sample_room):
    assert Room.objects.count() == 1
    assert sample_room['room'].available_beds() == 1

@pytest.mark.django_db
def test_booking_creation_api(api_client, test_users, sample_room):
    api_client.force_authenticate(user=test_users['resident'])
    url = reverse('booking-create')
    payload = {
        'room': str(sample_room['room'].id),
        'move_in_date': (date.today() + timedelta(days=10)).isoformat(),
        'duration_months': 3
    }
    response = api_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Booking.objects.count() == 1
    assert Booking.objects.first().status == 'pending'

@pytest.mark.django_db
def test_admin_approve_booking(api_client, test_users, sample_room):
    booking = Booking.objects.create(
        resident=test_users['resident'],
        room=sample_room['room'],
        preferred_room_type='single',
        move_in_date=date.today(),
        duration_months=1
    )
    api_client.force_authenticate(user=test_users['admin'])
    url = reverse('booking-approve', kwargs={'pk': booking.id})
    payload = {}  # No bed_id needed anymore
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == status.HTTP_200_OK
    booking.refresh_from_db()
    assert booking.status == 'approved'
    sample_room['bed'].refresh_from_db()
    assert sample_room['bed'].is_occupied is True
    assert Allocation.objects.count() == 1
