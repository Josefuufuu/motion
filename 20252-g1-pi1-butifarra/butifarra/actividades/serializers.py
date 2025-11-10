from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Activity,
    UserProfile,
    Tournament,
    ActivityEnrollment,
    TournamentEnrollment,
    Notification,
    NotificationDeliveryLog,
    NotificationPreference,
    Campaign,
)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'role', 'is_admin', 'is_beneficiary',
            'phone_number', 'program', 'semester',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['is_admin', 'is_beneficiary', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class ActivityEnrollmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        source='user', queryset=User.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = ActivityEnrollment
        fields = ['id', 'user', 'user_id', 'attended', 'enrolled_at']
        read_only_fields = ['id', 'enrolled_at', 'user']


class ActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    # Campo para asignar profesor (solo id). Debe ser usuario con rol PROFESOR.
    assigned_professor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    # Nombre amigable del profesor (solo lectura)
    assigned_professor_name = serializers.SerializerMethodField(read_only=True)
    actual_attendees = serializers.IntegerField(read_only=True)
    register_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'title', 'category', 'description', 'location',
                  'start', 'end', 'capacity', 'available_spots',
                  'instructor', 'assigned_professor', 'assigned_professor_name',
                  'visibility', 'status', 'tags', 'notes', 'actual_attendees',
                  'checkin_token', 'checkin_expires_at',
                  'created_by', 'created_at', 'updated_at', 'register_url']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'assigned_professor_name', 'actual_attendees', 'checkin_token', 'checkin_expires_at', 'register_url']

    def get_assigned_professor_name(self, obj):
        user = getattr(obj, 'assigned_professor', None)
        if not user:
            return None
        full_name = user.get_full_name()
        return full_name if full_name else user.username

    def validate_assigned_professor(self, value):
        if value is None:
            return value
        profile = getattr(value, 'profile', None)
        if not profile or profile.role != 'PROFESSOR':
            raise serializers.ValidationError('El usuario asignado no tiene rol PROFESOR')
        return value

    def get_register_url(self, obj):
        return f"/actividades/{obj.pk}"

    def validate(self, data):
        # Validate end time is after start time
        if 'end' in data and 'start' in data and data['end'] <= data['start']:
            raise serializers.ValidationError({'end': 'End time must be after start time'})

        # Validate available_spots <= capacity
        if 'capacity' in data and 'available_spots' in data:
            if data['available_spots'] > data['capacity']:
                raise serializers.ValidationError({'available_spots': 'Available spots cannot exceed capacity'})

        return data

    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user

        # If available_spots is not provided, set it to capacity
        if 'capacity' in validated_data and 'available_spots' not in validated_data:
            validated_data['available_spots'] = validated_data['capacity']

        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


class TournamentEnrollmentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TournamentEnrollment
        fields = ['id', 'user', 'status', 'created_at', 'updated_at']
        read_only_fields = fields


class TournamentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    enrollment = serializers.SerializerMethodField(read_only=True)
    available_slots = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'sport', 'format', 'description', 'location',
            'inscription_start', 'inscription_end',
            'start', 'end', 'visibility', 'status', 'max_teams', 'current_teams', 'fixtures',
            'created_by', 'created_at', 'updated_at', 'enrollment', 'available_slots'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'enrollment', 'available_slots']

    def get_enrollment(self, obj):
        request = self.context.get('request') if self.context else None
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        enrollment = next(
            (enr for enr in obj.enrollments.all() if enr.user_id == user.id),
            None,
        )
        if enrollment is None:
            return None
        return TournamentEnrollmentSerializer(enrollment, context=self.context).data

    def get_available_slots(self, obj):
        if not obj.max_teams:
            return None
        remaining = max(obj.max_teams - obj.current_teams, 0)
        return remaining


# ======================
# Notification serializers
# ======================
class NotificationDeliveryLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationDeliveryLog
        fields = ['id', 'channel', 'status', 'detail', 'created_at']
        read_only_fields = fields


class NotificationSerializer(serializers.ModelSerializer):
    delivery_logs = NotificationDeliveryLogSerializer(many=True, read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'activity', 'campaign', 'title', 'body', 'channel', 'status',
            'priority', 'scheduled_for', 'sent_at', 'read_at', 'metadata', 'created_at', 'delivery_logs'
        ]
        read_only_fields = ['id', 'user', 'activity', 'campaign', 'status', 'sent_at', 'read_at', 'created_at', 'delivery_logs']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_enabled', 'app_enabled', 'push_enabled', 'sms_enabled', 'quiet_hours_start', 'quiet_hours_end', 'updated_at']
        read_only_fields = ['updated_at']


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'message', 'channel_option', 'segment', 'selected_user_ids', 'schedule_at',
            'total_recipients', 'app_sent', 'emails_sent', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'total_recipients', 'app_sent', 'emails_sent', 'created_by', 'created_at']
