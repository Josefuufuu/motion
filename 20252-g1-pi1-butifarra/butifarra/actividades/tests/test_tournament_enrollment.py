import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from actividades.models import (
    Tournament,
    TournamentEnrollment,
    UserProfile,
)


@pytest.fixture
def api_client():
    """Fixture to provide an API client"""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create an admin user with ADMIN role"""
    user = User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='admin123',
        is_staff=True,
        is_superuser=True
    )
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'ADMIN',
            'phone_number': '1234567890',
            'program': 'Admin Program',
            'semester': 1
        }
    )
    return user


@pytest.fixture
def beneficiary_user(db):
    """Create a beneficiary user"""
    user = User.objects.create_user(
        username='student1',
        email='student1@test.com',
        password='student123',
        first_name='John',
        last_name='Doe'
    )
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'BENEFICIARY',
            'phone_number': '0987654321',
            'program': 'Engineering',
            'semester': 5
        }
    )
    return user


@pytest.fixture
def beneficiary_user2(db):
    """Create a second beneficiary user"""
    user = User.objects.create_user(
        username='student2',
        email='student2@test.com',
        password='student123',
        first_name='Jane',
        last_name='Smith'
    )
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            'role': 'BENEFICIARY',
            'phone_number': '1122334455',
            'program': 'Business',
            'semester': 3
        }
    )
    return user


@pytest.fixture
def tournament(db, admin_user):
    """Create a basic tournament"""
    today = timezone.now().date()
    return Tournament.objects.create(
        name='Spring Soccer Tournament',
        sport='Soccer',
        format='5v5',
        description='A friendly soccer tournament',
        location='Main Field',
        inscription_start=today - timedelta(days=7),
        inscription_end=today + timedelta(days=7),
        start=timezone.now() + timedelta(days=10),
        end=timezone.now() + timedelta(days=12),
        status='planned',
        visibility='public',
        max_teams=10,
        current_teams=0,
        created_by=admin_user
    )


@pytest.fixture
def tournament_limited(db, admin_user):
    """Create a tournament with limited capacity"""
    today = timezone.now().date()
    return Tournament.objects.create(
        name='Limited Basketball Tournament',
        sport='Basketball',
        format='3v3',
        description='Limited spots available',
        location='Sports Complex',
        inscription_start=today - timedelta(days=5),
        inscription_end=today + timedelta(days=5),
        start=timezone.now() + timedelta(days=8),
        end=timezone.now() + timedelta(days=10),
        status='planned',
        visibility='public',
        max_teams=2,
        current_teams=0,
        created_by=admin_user
    )


@pytest.fixture
def tournament_finished(db, admin_user):
    """Create a finished tournament"""
    today = timezone.now().date()
    return Tournament.objects.create(
        name='Past Tennis Tournament',
        sport='Tennis',
        format='Singles',
        description='Already finished',
        location='Tennis Courts',
        inscription_start=today - timedelta(days=30),
        inscription_end=today - timedelta(days=20),
        start=timezone.now() - timedelta(days=15),
        end=timezone.now() - timedelta(days=14),
        status='finished',
        visibility='public',
        max_teams=8,
        current_teams=5,
        created_by=admin_user
    )


@pytest.mark.django_db
class TestTournamentModel:
    """Test Tournament model functionality"""

    def test_tournament_creation(self, admin_user):
        """Test creating a tournament"""
        today = timezone.now().date()
        tournament = Tournament.objects.create(
            name='Test Tournament',
            sport='Football',
            format='11v11',
            description='Test description',
            location='Test Location',
            inscription_start=today,
            inscription_end=today + timedelta(days=7),
            start=timezone.now() + timedelta(days=10),
            end=timezone.now() + timedelta(days=12),
            status='planned',
            visibility='public',
            max_teams=16,
            created_by=admin_user
        )
        assert tournament.name == 'Test Tournament'
        assert tournament.sport == 'Football'
        assert tournament.max_teams == 16
        assert tournament.current_teams == 0
        assert tournament.status == 'planned'

    def test_tournament_str_representation(self, tournament):
        """Test tournament string representation"""
        expected = f"{tournament.name} ({tournament.sport})"
        assert str(tournament) == expected

    def test_tournament_clean_validation(self, admin_user):
        """Test tournament validation"""
        today = timezone.now().date()
        tournament = Tournament(
            name='Invalid Tournament',
            sport='Soccer',
            inscription_start=today,
            inscription_end=today - timedelta(days=1),  # End before start
            start=timezone.now() + timedelta(days=10),
            end=timezone.now() + timedelta(days=5),  # End before start
            created_by=admin_user
        )

        with pytest.raises(Exception):  # ValidationError
            tournament.clean()


@pytest.mark.django_db
class TestTournamentEnrollmentModel:
    """Test TournamentEnrollment model functionality"""

    def test_enrollment_creation(self, tournament, beneficiary_user):
        """Test creating an enrollment"""
        enrollment = TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )
        assert enrollment.user == beneficiary_user
        assert enrollment.tournament == tournament
        assert enrollment.status == TournamentEnrollment.STATUS_CONFIRMED
        assert enrollment.is_active

    def test_enrollment_str_representation(self, tournament, beneficiary_user):
        """Test enrollment string representation"""
        enrollment = TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )
        expected = f"{beneficiary_user.username} -> {tournament.name} ({enrollment.status})"
        assert str(enrollment) == expected

    def test_enrollment_updates_current_teams(self, tournament, beneficiary_user):
        """Test that enrollment updates current_teams counter"""
        assert tournament.current_teams == 0

        TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        tournament.refresh_from_db()
        assert tournament.current_teams == 1

    def test_enrollment_unique_constraint(self, tournament, beneficiary_user):
        """Test that a user cannot enroll twice in the same tournament"""
        TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        with pytest.raises(Exception):  # IntegrityError
            TournamentEnrollment.objects.create(
                user=beneficiary_user,
                tournament=tournament,
                status=TournamentEnrollment.STATUS_CONFIRMED
            )

    def test_enrollment_is_active_property(self, tournament, beneficiary_user):
        """Test is_active property for different statuses"""
        # Confirmed enrollment is active
        enrollment = TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )
        assert enrollment.is_active is True

        # Cancelled enrollment is not active
        enrollment.status = TournamentEnrollment.STATUS_CANCELLED
        enrollment.save()
        assert enrollment.is_active is False

    def test_enrollment_deletion_updates_current_teams(self, tournament, beneficiary_user):
        """Test that deleting an enrollment updates current_teams"""
        enrollment = TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        tournament.refresh_from_db()
        assert tournament.current_teams == 1

        enrollment.delete()

        tournament.refresh_from_db()
        assert tournament.current_teams == 0

    def test_cancelling_enrollment_updates_current_teams(self, tournament, beneficiary_user):
        """Test that cancelling an enrollment updates current_teams"""
        enrollment = TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        tournament.refresh_from_db()
        assert tournament.current_teams == 1

        enrollment.status = TournamentEnrollment.STATUS_CANCELLED
        enrollment.save()

        tournament.refresh_from_db()
        assert tournament.current_teams == 0


@pytest.mark.django_db
class TestTournamentAPI:
    """Test Tournament API endpoints"""

    def test_list_tournaments_unauthenticated(self, api_client, tournament):
        """Test that unauthenticated users cannot list tournaments"""
        response = api_client.get('/api/torneos/')
        assert response.status_code == 403

    def test_list_tournaments_authenticated(self, api_client, beneficiary_user, tournament):
        """Test listing tournaments as authenticated user"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/torneos/')
        assert response.status_code == 200
        assert len(response.data) >= 1
        assert response.data[0]['name'] == tournament.name

    def test_create_tournament_as_admin(self, api_client, admin_user):
        """Test creating a tournament as admin"""
        api_client.force_authenticate(user=admin_user)
        today = timezone.now().date()

        data = {
            'name': 'New Tournament',
            'sport': 'Volleyball',
            'format': '6v6',
            'description': 'Test description',
            'location': 'Gym',
            'inscription_start': today.isoformat(),
            'inscription_end': (today + timedelta(days=7)).isoformat(),
            'start': (timezone.now() + timedelta(days=10)).isoformat(),
            'end': (timezone.now() + timedelta(days=12)).isoformat(),
            'visibility': 'public',
            'status': 'planned',
            'max_teams': 8
        }

        response = api_client.post('/api/torneos/', data, format='json')
        assert response.status_code == 201
        assert response.data['name'] == 'New Tournament'
        assert response.data['sport'] == 'Volleyball'

    def test_create_tournament_as_beneficiary_fails(self, api_client, beneficiary_user):
        """Test that beneficiaries cannot create tournaments"""
        api_client.force_authenticate(user=beneficiary_user)
        today = timezone.now().date()

        data = {
            'name': 'Unauthorized Tournament',
            'sport': 'Soccer',
            'start': (timezone.now() + timedelta(days=10)).isoformat(),
            'end': (timezone.now() + timedelta(days=12)).isoformat(),
            'max_teams': 8
        }

        response = api_client.post('/api/torneos/', data, format='json')
        assert response.status_code == 403

    def test_retrieve_tournament(self, api_client, beneficiary_user, tournament):
        """Test retrieving a single tournament"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/')
        assert response.status_code == 200
        assert response.data['name'] == tournament.name
        assert response.data['sport'] == tournament.sport

    def test_update_tournament_as_admin(self, api_client, admin_user, tournament):
        """Test updating a tournament as admin"""
        api_client.force_authenticate(user=admin_user)

        data = {
            'name': 'Updated Tournament Name',
            'description': 'Updated description'
        }

        response = api_client.patch(f'/api/torneos/{tournament.id}/', data, format='json')
        assert response.status_code == 200
        assert response.data['name'] == 'Updated Tournament Name'
        assert response.data['description'] == 'Updated description'

    def test_delete_tournament_as_admin(self, api_client, admin_user, tournament):
        """Test deleting a tournament as admin"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f'/api/torneos/{tournament.id}/')
        assert response.status_code == 204
        assert not Tournament.objects.filter(id=tournament.id).exists()

    def test_search_tournaments(self, api_client, beneficiary_user, tournament):
        """Test searching tournaments"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/torneos/?search=Soccer')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_filter_tournaments_by_sport(self, api_client, beneficiary_user, tournament):
        """Test filtering tournaments by sport"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/?sport={tournament.sport}')
        assert response.status_code == 200
        assert len(response.data) >= 1
        assert all(t['sport'] == tournament.sport for t in response.data)

    def test_filter_tournaments_by_status(self, api_client, beneficiary_user, tournament):
        """Test filtering tournaments by status"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get('/api/torneos/?status=planned')
        assert response.status_code == 200
        assert all(t['status'] == 'planned' for t in response.data)


@pytest.mark.django_db
class TestTournamentEnrollmentAPI:
    """Test Tournament Enrollment API endpoints"""

    def test_enroll_in_tournament_success(self, api_client, beneficiary_user, tournament):
        """Test successfully enrolling in a tournament"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        assert response.status_code == 201
        assert 'detail' in response.data
        assert 'tournament' in response.data
        assert 'enrollment' in response.data

        # Verify enrollment was created
        enrollment = TournamentEnrollment.objects.get(
            user=beneficiary_user,
            tournament=tournament
        )
        assert enrollment.status == TournamentEnrollment.STATUS_CONFIRMED

    def test_enroll_unauthenticated_fails(self, api_client, tournament):
        """Test that unauthenticated users cannot enroll"""
        response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert response.status_code == 401

    def test_enroll_twice_fails(self, api_client, beneficiary_user, tournament):
        """Test that enrolling twice in the same tournament fails"""
        api_client.force_authenticate(user=beneficiary_user)

        # First enrollment
        response1 = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert response1.status_code == 201

        # Second enrollment attempt
        response2 = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert response2.status_code == 400
        assert 'Ya estás inscrito' in response2.data['detail']

    def test_enroll_in_finished_tournament_fails(self, api_client, beneficiary_user, tournament_finished):
        """Test that enrolling in a finished tournament fails"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament_finished.id}/enroll/')

        assert response.status_code == 400
        assert 'no admite inscripciones' in response.data['detail'].lower()

    def test_enroll_when_full_fails(self, api_client, beneficiary_user, beneficiary_user2, tournament_limited):
        """Test that enrolling when tournament is full fails"""
        # Create a third user
        user3 = User.objects.create_user(
            username='student3',
            email='student3@test.com',
            password='student123'
        )
        UserProfile.objects.create(
            user=user3,
            role='BENEFICIARY',
            phone_number='5566778899',
            program='Arts',
            semester=2
        )

        # Fill the tournament (max_teams = 2)
        api_client.force_authenticate(user=beneficiary_user)
        response1 = api_client.post(f'/api/torneos/{tournament_limited.id}/enroll/')
        assert response1.status_code == 201

        api_client.force_authenticate(user=beneficiary_user2)
        response2 = api_client.post(f'/api/torneos/{tournament_limited.id}/enroll/')
        assert response2.status_code == 201

        # Try to enroll third user
        api_client.force_authenticate(user=user3)
        response3 = api_client.post(f'/api/torneos/{tournament_limited.id}/enroll/')
        assert response3.status_code == 400
        assert 'no hay cupos' in response3.data['detail'].lower()

    def test_unenroll_from_tournament_success(self, api_client, beneficiary_user, tournament):
        """Test successfully unenrolling from a tournament"""
        api_client.force_authenticate(user=beneficiary_user)

        # First enroll
        enroll_response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert enroll_response.status_code == 201

        # Then unenroll
        unenroll_response = api_client.post(f'/api/torneos/{tournament.id}/unenroll/')
        assert unenroll_response.status_code == 200
        assert 'cancelada correctamente' in unenroll_response.data['detail'].lower()

        # Verify enrollment status changed to cancelled
        enrollment = TournamentEnrollment.objects.get(
            user=beneficiary_user,
            tournament=tournament
        )
        assert enrollment.status == TournamentEnrollment.STATUS_CANCELLED

    def test_unenroll_without_enrollment_fails(self, api_client, beneficiary_user, tournament):
        """Test that unenrolling without an enrollment fails"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament.id}/unenroll/')

        assert response.status_code == 400
        assert 'no tienes una inscripción' in response.data['detail'].lower()

    def test_unenroll_twice_fails(self, api_client, beneficiary_user, tournament):
        """Test that unenrolling twice fails"""
        api_client.force_authenticate(user=beneficiary_user)

        # Enroll
        api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        # First unenroll
        response1 = api_client.post(f'/api/torneos/{tournament.id}/unenroll/')
        assert response1.status_code == 200

        # Second unenroll attempt
        response2 = api_client.post(f'/api/torneos/{tournament.id}/unenroll/')
        assert response2.status_code == 400
        assert 'ya está cancelada' in response2.data['detail'].lower()

    def test_reenroll_after_cancellation(self, api_client, beneficiary_user, tournament):
        """Test that a user can re-enroll after cancelling"""
        api_client.force_authenticate(user=beneficiary_user)

        # Enroll
        response1 = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert response1.status_code == 201

        # Unenroll
        response2 = api_client.post(f'/api/torneos/{tournament.id}/unenroll/')
        assert response2.status_code == 200

        # Re-enroll
        response3 = api_client.post(f'/api/torneos/{tournament.id}/enroll/')
        assert response3.status_code == 200
        assert 'reactivada' in response3.data['detail'].lower()

        # Verify enrollment status is confirmed again
        enrollment = TournamentEnrollment.objects.get(
            user=beneficiary_user,
            tournament=tournament
        )
        assert enrollment.status == TournamentEnrollment.STATUS_CONFIRMED

    def test_list_tournament_enrollments_as_admin(self, api_client, admin_user, tournament, beneficiary_user):
        """Test that admins can list tournament enrollments"""
        # Create an enrollment
        TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/enrollments/')

        assert response.status_code == 200
        assert len(response.data) >= 1
        assert response.data[0]['user']['username'] == beneficiary_user.username

    def test_list_tournament_enrollments_as_beneficiary_fails(self, api_client, beneficiary_user, tournament):
        """Test that beneficiaries cannot list tournament enrollments"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/enrollments/')

        assert response.status_code == 403

    def test_tournament_available_slots(self, api_client, beneficiary_user, tournament_limited):
        """Test that available slots are calculated correctly"""
        api_client.force_authenticate(user=beneficiary_user)

        # Check initial available slots
        response1 = api_client.get(f'/api/torneos/{tournament_limited.id}/')
        assert response1.status_code == 200
        assert response1.data['available_slots'] == tournament_limited.max_teams

        # Enroll and check again
        api_client.post(f'/api/torneos/{tournament_limited.id}/enroll/')

        response2 = api_client.get(f'/api/torneos/{tournament_limited.id}/')
        assert response2.status_code == 200
        assert response2.data['available_slots'] == tournament_limited.max_teams - 1

    def test_tournament_current_teams_count(self, api_client, beneficiary_user, beneficiary_user2, tournament):
        """Test that current_teams counter is updated correctly"""
        # Check initial count
        tournament.refresh_from_db()
        assert tournament.current_teams == 0

        # Enroll first user
        api_client.force_authenticate(user=beneficiary_user)
        api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        tournament.refresh_from_db()
        assert tournament.current_teams == 1

        # Enroll second user
        api_client.force_authenticate(user=beneficiary_user2)
        api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        tournament.refresh_from_db()
        assert tournament.current_teams == 2

    def test_enrollment_includes_user_profile(self, api_client, admin_user, beneficiary_user, tournament):
        """Test that enrollment data includes user profile information"""
        # Create enrollment
        TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/enrollments/')

        assert response.status_code == 200
        assert len(response.data) >= 1
        enrollment_data = response.data[0]
        assert 'user' in enrollment_data
        assert 'profile' in enrollment_data['user']
        assert enrollment_data['user']['profile']['role'] == 'BENEFICIARY'


@pytest.mark.django_db
class TestTournamentInscriptionDates:
    """Test tournament inscription date restrictions"""

    def test_enroll_before_inscription_opens(self, api_client, beneficiary_user, admin_user):
        """Test that enrollment before inscription start date fails"""
        today = timezone.now().date()
        tournament = Tournament.objects.create(
            name='Future Tournament',
            sport='Soccer',
            inscription_start=today + timedelta(days=5),  # Opens in 5 days
            inscription_end=today + timedelta(days=15),
            start=timezone.now() + timedelta(days=20),
            end=timezone.now() + timedelta(days=22),
            status='planned',
            max_teams=10,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        assert response.status_code == 400
        assert 'no están abiertas' in response.data['detail'].lower()

    def test_enroll_after_inscription_closes(self, api_client, beneficiary_user, admin_user):
        """Test that enrollment after inscription end date fails"""
        today = timezone.now().date()
        tournament = Tournament.objects.create(
            name='Past Inscription Tournament',
            sport='Basketball',
            inscription_start=today - timedelta(days=15),
            inscription_end=today - timedelta(days=5),  # Closed 5 days ago
            start=timezone.now() + timedelta(days=2),
            end=timezone.now() + timedelta(days=4),
            status='planned',
            max_teams=10,
            created_by=admin_user
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        assert response.status_code == 400
        assert 'finalizado' in response.data['detail'].lower()

    def test_enroll_during_valid_period(self, api_client, beneficiary_user, tournament):
        """Test that enrollment during valid period succeeds"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.post(f'/api/torneos/{tournament.id}/enroll/')

        assert response.status_code == 201


@pytest.mark.django_db
class TestTournamentEnrollmentWithSerializer:
    """Test tournament enrollment with serializer context"""

    def test_tournament_serializer_includes_enrollment_for_user(self, api_client, beneficiary_user, tournament):
        """Test that tournament serializer includes enrollment data for authenticated user"""
        # Enroll the user
        TournamentEnrollment.objects.create(
            user=beneficiary_user,
            tournament=tournament,
            status=TournamentEnrollment.STATUS_CONFIRMED
        )

        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/')

        assert response.status_code == 200
        assert 'enrollment' in response.data
        assert response.data['enrollment'] is not None
        assert response.data['enrollment']['status'] == TournamentEnrollment.STATUS_CONFIRMED

    def test_tournament_serializer_no_enrollment_for_non_enrolled_user(self, api_client, beneficiary_user, tournament):
        """Test that tournament serializer returns null enrollment for non-enrolled user"""
        api_client.force_authenticate(user=beneficiary_user)
        response = api_client.get(f'/api/torneos/{tournament.id}/')

        assert response.status_code == 200
        assert 'enrollment' in response.data
        assert response.data['enrollment'] is None

    def test_tournament_serializer_available_slots(self, api_client, beneficiary_user, tournament_limited):
        """Test available_slots field in tournament serializer"""
        api_client.force_authenticate(user=beneficiary_user)

        # Before enrollment
        response1 = api_client.get(f'/api/torneos/{tournament_limited.id}/')
        assert response1.data['available_slots'] == 2

        # After enrollment
        api_client.post(f'/api/torneos/{tournament_limited.id}/enroll/')
        response2 = api_client.get(f'/api/torneos/{tournament_limited.id}/')
        assert response2.data['available_slots'] == 1

