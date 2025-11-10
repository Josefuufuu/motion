"""
Comprehensive tests for Activity model, serializers and API endpoints
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import Activity, ActivityEnrollment, UserProfile


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='admin123',
        is_staff=True,
        is_superuser=True
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'ADMIN',
            'phone_number': '1234567890',
            'program': 'Admin',
            'semester': 1
        }
    )
    return user


@pytest.fixture
def professor_user(db):
    user = User.objects.create_user(
        username='professor1',
        email='professor1@test.com',
        password='prof123',
        first_name='John',
        last_name='Professor'
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'PROFESSOR',
            'phone_number': '1111111111',
            'program': 'Engineering',
            'semester': 1
        }
    )
    return user


@pytest.fixture
def beneficiary_user(db):
    user = User.objects.create_user(
        username='student1',
        email='student1@test.com',
        password='student123'
    )
    UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'BENEFICIARY',
            'phone_number': '2222222222',
            'program': 'Computer Science',
            'semester': 5
        }
    )
    return user


@pytest.fixture
def activity(db, admin_user):
    return Activity.objects.create(
        title='Yoga Class',
        category='DEPORTE',
        description='Morning yoga session',
        location='Gym A',
        start=timezone.now() + timedelta(days=1),
        end=timezone.now() + timedelta(days=1, hours=1),
        capacity=20,
        available_spots=20,
        instructor='Jane Doe',
        visibility='public',
        status='active',
        created_by=admin_user
    )


@pytest.mark.django_db
class TestActivityModel:
    """Test Activity model functionality"""

    def test_create_activity(self, admin_user):
        activity = Activity.objects.create(
            title='Swimming Lesson',
            category='DEPORTE',
            description='Learn to swim',
            location='Pool',
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=2, hours=2),
            capacity=15,
            available_spots=15,
            instructor='Coach Mike',
            visibility='public',
            status='active',
            created_by=admin_user
        )
        assert activity.title == 'Swimming Lesson'
        assert activity.capacity == 15
        assert activity.available_spots == 15

    def test_activity_str_representation(self, activity):
        assert str(activity) == activity.title

    def test_activity_validation_end_before_start(self, admin_user):
        activity = Activity(
            title='Invalid Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now(),  # End before start
            capacity=10,
            created_by=admin_user
        )
        with pytest.raises(Exception):
            activity.clean()

    def test_activity_validation_available_spots(self, admin_user):
        activity = Activity(
            title='Invalid Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=10,
            available_spots=15,  # More than capacity
            created_by=admin_user
        )
        with pytest.raises(Exception):
            activity.clean()

    def test_activity_auto_set_available_spots(self, admin_user):
        activity = Activity.objects.create(
            title='Auto Spots Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=25,
            created_by=admin_user
        )
        assert activity.available_spots == 25

    def test_assign_professor_to_activity(self, admin_user, professor_user):
        activity = Activity.objects.create(
            title='Math Workshop',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            assigned_professor=professor_user,
            created_by=admin_user
        )
        assert activity.assigned_professor == professor_user


@pytest.mark.django_db
class TestActivityEnrollmentModel:
    """Test ActivityEnrollment model functionality"""

    def test_create_enrollment(self, activity, beneficiary_user):
        enrollment = ActivityEnrollment.objects.create(
            user=beneficiary_user,
            activity=activity
        )
        assert enrollment.user == beneficiary_user
        assert enrollment.activity == activity
        assert enrollment.attended is False

    def test_enrollment_unique_constraint(self, activity, beneficiary_user):
        ActivityEnrollment.objects.create(
            user=beneficiary_user,
            activity=activity
        )
        with pytest.raises(Exception):
            ActivityEnrollment.objects.create(
                user=beneficiary_user,
                activity=activity
            )

    def test_mark_attendance(self, activity, beneficiary_user):
        enrollment = ActivityEnrollment.objects.create(
            user=beneficiary_user,
            activity=activity
        )
        enrollment.attended = True
        enrollment.save()
        assert enrollment.attended is True


@pytest.mark.django_db
class TestActivityAPI:
    """Test Activity API endpoints"""

    def test_list_activities_unauthenticated(self, api_client, activity):
        response = api_client.get('/api/actividades/')
        assert response.status_code == 403

    def test_list_activities_authenticated(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_create_activity_as_admin(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        data = {
            'title': 'New Activity',
            'category': 'DEPORTE',
            'description': 'Test description',
            'location': 'Test Location',
            'start': (timezone.now() + timedelta(days=1)).isoformat(),
            'end': (timezone.now() + timedelta(days=1, hours=2)).isoformat(),
            'capacity': 20,
            'visibility': 'public',
            'status': 'active'
        }
        response = api_client.post('/api/actividades/', data, format='json')
        assert response.status_code == 201
        assert response.data['title'] == 'New Activity'

    def test_create_activity_as_beneficiary_fails(self, api_client, beneficiary_user):
        api_client.force_authenticate(user=beneficiary_user)
        data = {
            'title': 'Unauthorized Activity',
            'category': 'DEPORTE',
            'start': (timezone.now() + timedelta(days=1)).isoformat(),
            'end': (timezone.now() + timedelta(days=2)).isoformat(),
            'capacity': 10
        }
        response = api_client.post('/api/actividades/', data, format='json')
        assert response.status_code == 403

    def test_retrieve_activity(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/actividades/{activity.id}/')
        assert response.status_code == 200
        assert response.data['title'] == activity.title

    def test_update_activity_as_admin(self, api_client, admin_user, activity):
        api_client.force_authenticate(user=admin_user)
        data = {'title': 'Updated Activity Title'}
        response = api_client.patch(f'/api/actividades/{activity.id}/', data, format='json')
        assert response.status_code == 200
        assert response.data['title'] == 'Updated Activity Title'

    def test_delete_activity_as_admin(self, api_client, admin_user, activity):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f'/api/actividades/{activity.id}/')
        assert response.status_code == 204
        assert not Activity.objects.filter(id=activity.id).exists()

    def test_search_activities(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?search=Yoga')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_filter_activities_by_category(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?category=DEPORTE')
        assert response.status_code == 200
        assert all(a['category'] == 'DEPORTE' for a in response.data)

    def test_filter_activities_by_status(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/actividades/?status=active')
        assert response.status_code == 200
        assert all(a['status'] == 'active' for a in response.data)


@pytest.mark.django_db
class TestActivityEnrollmentAPI:
    """Test Activity Enrollment API endpoints"""

    def test_enroll_in_activity_success(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/actividades/{activity.id}/enroll/')
        assert response.status_code == 201

        enrollment = ActivityEnrollment.objects.get(
            user=beneficiary_user,
            activity=activity
        )
        assert enrollment is not None

    def test_enroll_unauthenticated_fails(self, api_client, activity):
        response = api_client.post(f'/api/actividades/{activity.id}/enroll/')
        assert response.status_code == 401

    def test_enroll_twice_fails(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        api_client.post(f'/api/actividades/{activity.id}/enroll/')
        response = api_client.post(f'/api/actividades/{activity.id}/enroll/')
        assert response.status_code == 200
        assert 'Ya estás inscrito' in response.data['detail']

    def test_enroll_when_full_fails(self, api_client, beneficiary_user, activity):
        activity.available_spots = 0
        activity.save()

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/actividades/{activity.id}/enroll/')
        assert response.status_code == 400
        assert 'No hay cupos' in response.data['detail']

    def test_unenroll_from_activity_success(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        api_client.post(f'/api/actividades/{activity.id}/enroll/')

        response = api_client.post(f'/api/actividades/{activity.id}/unenroll/')
        assert response.status_code == 200
        assert not ActivityEnrollment.objects.filter(
            user=beneficiary_user,
            activity=activity
        ).exists()

    def test_unenroll_without_enrollment_fails(self, api_client, beneficiary_user, activity):
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/actividades/{activity.id}/unenroll/')
        assert response.status_code == 400

    def test_list_activity_enrollments_as_admin(self, api_client, admin_user, activity, beneficiary_user):
        ActivityEnrollment.objects.create(
            user=beneficiary_user,
            activity=activity
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/actividades/{activity.id}/enrollments/')
        assert response.status_code == 200
        assert len(response.data) >= 1


@pytest.mark.django_db
class TestProfessorActivityManagement:
    """Test Professor-specific activity management"""

    def test_professor_can_update_assigned_activity(self, api_client, professor_user, admin_user):
        activity = Activity.objects.create(
            title='Professor Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        api_client.force_authenticate(user=professor_user)
        data = {'description': 'Updated by professor'}
        response = api_client.patch(
            f'/api/actividades/{activity.id}/professor-update/',
            data,
            format='json'
        )
        assert response.status_code == 200
        assert response.data['description'] == 'Updated by professor'

    def test_professor_cannot_update_unassigned_activity(self, api_client, professor_user, admin_user, activity):
        api_client.force_authenticate(user=professor_user)
        data = {'description': 'Unauthorized update'}
        response = api_client.patch(
            f'/api/actividades/{activity.id}/professor-update/',
            data,
            format='json'
        )
        assert response.status_code == 403

    def test_professor_list_own_activities(self, api_client, professor_user, admin_user):
        Activity.objects.create(
            title='My Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        api_client.force_authenticate(user=professor_user)
        response = api_client.get('/api/actividades/professor/list/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_professor_update_attendance(self, api_client, professor_user, admin_user, beneficiary_user):
        activity = Activity.objects.create(
            title='Attendance Activity',
            category='DEPORTE',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        enrollment = ActivityEnrollment.objects.create(
            user=beneficiary_user,
            activity=activity
        )

        api_client.force_authenticate(user=professor_user)
        data = {'attended': [beneficiary_user.id], 'not_attended': []}
        response = api_client.patch(
            f'/api/actividades/{activity.id}/professor/attendance/',
            data,
            format='json'
        )
        assert response.status_code == 200

        enrollment.refresh_from_db()
        assert enrollment.attended is True

    def test_professor_add_notes(self, api_client, professor_user, admin_user):
        activity = Activity.objects.create(
            title='Notes Activity',
            category='CULTURA',
            start=timezone.now() + timedelta(days=1),
            end=timezone.now() + timedelta(days=2),
            capacity=30,
            assigned_professor=professor_user,
            created_by=admin_user
        )

        api_client.force_authenticate(user=professor_user)
        data = {'notes': 'Great session today!'}
        response = api_client.patch(
            f'/api/actividades/{activity.id}/professor/notes/',
            data,
            format='json'
        )
        assert response.status_code == 200

        activity.refresh_from_db()
        assert activity.notes == 'Great session today!'

