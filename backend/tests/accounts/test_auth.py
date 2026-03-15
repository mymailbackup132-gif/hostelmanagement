import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def resident_data():
    return {
        'email': 'resident@example.com',
        'password': 'testpassword123',
        'full_name': 'Test Resident',
        'phone': '1234567890',
        'emergency_contact_name': '0987654321',
        'residential_address': '123 Test St',
    }

@pytest.mark.django_db
def test_create_user(resident_data):
    user = User.objects.create_user(**resident_data)
    assert user.email == 'resident@example.com'
    assert user.role == 'resident'
    assert user.is_active is True
    assert user.check_password('testpassword123')

@pytest.mark.django_db
def test_register_api(api_client, resident_data):
    url = reverse('auth-register')
    response = api_client.post(url, resident_data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert 'email' in response.data
    assert response.data['email'] == resident_data['email']
    
@pytest.mark.django_db
def test_login_step1_api(api_client, resident_data):
    User.objects.create_user(**resident_data)
    url = reverse('auth-login')
    response = api_client.post(url, {'email': resident_data['email'], 'password': resident_data['password']}, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert 'user_id' in response.data
    assert 'require_2fa' in response.data
