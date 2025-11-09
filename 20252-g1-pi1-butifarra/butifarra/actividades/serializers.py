from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Activity, UserProfile, Tournament, ActivityEnrollment


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

    class Meta:
        model = Activity
        fields = ['id', 'title', 'category', 'description', 'location',
                  'start', 'end', 'capacity', 'available_spots',
                  'instructor', 'assigned_professor', 'assigned_professor_name',
                  'visibility', 'status', 'tags', 'notes', 'actual_attendees',
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'assigned_professor_name', 'actual_attendees']

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


class TournamentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Tournament
        fields = [
            'id', 'name', 'sport', 'format', 'description', 'location',
            'inscription_start', 'inscription_end',
            'start', 'end', 'visibility', 'status', 'max_teams', 'current_teams', 'fixtures',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
