from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import models
from .models import Activity, UserProfile, Project, Enrollment


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'is_admin', 'is_beneficiary', 'phone_number', 'program', 'semester']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class ActivitySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'title', 'category', 'description', 'location',
                  'start', 'end', 'capacity', 'available_spots',
                  'instructor', 'visibility', 'status', 'tags',
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

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


class ProjectSerializer(serializers.ModelSerializer):
    confirmed_enrollments = serializers.ReadOnlyField()
    available_quota = serializers.ReadOnlyField()
    already_enrolled = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'type', 'area', 'subtype', 'description',
            'total_quota', 'start_date', 'end_date', 'status',
            'confirmed_enrollments', 'available_quota', 'already_enrolled',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_already_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.enrollments.filter(
                models.Q(user=request.user) | models.Q(email=request.user.email),
                status='confirmed'
            ).exists()
        return False


class EnrollmentSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='project.name')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Enrollment
        fields = [
            'id', 'project', 'project_name', 'user', 'user_email',
            'full_name', 'email', 'phone', 'status',
            'enrollment_date', 'updated_at'
        ]
        read_only_fields = ['user', 'enrollment_date', 'updated_at']

    def validate(self, data):
        project = data.get('project') or getattr(self.instance, 'project', None)
        if not project:
            raise serializers.ValidationError({'project': 'Proyecto requerido'})

        if project.status != 'enrollment':
            raise serializers.ValidationError({
                'project': f'Este proyecto no está aceptando inscripciones (Estado: {project.get_status_display()})'
            })

        if project.available_quota <= 0 and not self.instance:
            raise serializers.ValidationError({'project': 'No hay cupos disponibles para este proyecto'})

        if not self.instance:
            email = (data.get('email') or '').strip()
            if not email:
                raise serializers.ValidationError({'email': 'El correo es obligatorio'})
            if Enrollment.objects.filter(project=project, email=email).exists():
                raise serializers.ValidationError({'project': 'Ya existe una inscripción con este correo para este proyecto'})

        new_status = data.get('status')
        if self.instance and new_status:
            if new_status not in {'pending', 'confirmed', 'rejected', 'cancelled'}:
                raise serializers.ValidationError({'status': 'Estado inválido'})

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user

        validated_data['status'] = 'pending'
        return super().create(validated_data)

