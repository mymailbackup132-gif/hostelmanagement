import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from complaints.models import Complaint, ComplaintMessage

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
def test_complaint(resident_user):
    return Complaint.objects.create(
        resident=resident_user,
        category='plumbing',
        description='Leaky faucet'
    )

@pytest.mark.django_db
class TestComplaintsModule:

    def test_resident_create_complaint(self, client, resident_user):
        client.force_authenticate(user=resident_user)
        res = client.post('/api/complaints/', {
            'category': 'electrical',
            'description': 'Fan not working'
        })
        assert res.status_code == 201
        assert Complaint.objects.count() == 1
        assert Complaint.objects.first().category == 'electrical'
        # Check notification was created
        from notifications_app.models import Notification
        assert Notification.objects.filter(recipient_role='admin').count() >= 1

    def test_resident_view_complaints(self, client, resident_user, test_complaint):
        client.force_authenticate(user=resident_user)
        res = client.get('/api/complaints/')
        assert res.status_code == 200
        assert len(res.data['results']) == 1
        assert res.data['results'][0]['description'] == 'Leaky faucet'

    def test_admin_update_complaint_status(self, client, admin_user, test_complaint):
        client.force_authenticate(user=admin_user)
        res = client.patch(f'/api/complaints/admin/{test_complaint.id}/', {
            'status': 'in_progress',
            'priority': 'high',
            'admin_notes': 'Sending plumber tomorrow'
        })
        assert res.status_code == 200
        test_complaint.refresh_from_db()
        assert test_complaint.status == 'in_progress'
        assert test_complaint.priority == 'high'

        # Resident should be notified
        from notifications_app.models import Notification
        notif = Notification.objects.filter(recipient_id=test_complaint.resident.id).first()
        assert notif is not None
        assert 'status changed' in notif.message

    def test_thread_messages(self, client, resident_user, admin_user, test_complaint):
        # Resident sends a message
        client.force_authenticate(user=resident_user)
        res1 = client.post(f'/api/complaints/{test_complaint.id}/messages/', {
            'message': 'When will it be fixed?'
        })
        assert res1.status_code == 201

        # Admin replies
        client.force_authenticate(user=admin_user)
        res2 = client.post(f'/api/complaints/{test_complaint.id}/messages/', {
            'message': 'Tomorrow morning.'
        })
        assert res2.status_code == 201

        # Check order
        messages = ComplaintMessage.objects.filter(complaint=test_complaint).order_by('timestamp')
        assert messages.count() == 2
        assert messages[0].sender_role == 'resident'
        assert messages[1].sender_role == 'admin'
