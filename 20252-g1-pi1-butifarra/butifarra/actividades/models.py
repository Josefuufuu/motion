from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extended user profile to manage user roles and personal information
    """
    ROLE_CHOICES = [
        ("BENEFICIARY", "Beneficiario/Estudiante"),
        ("ADMIN", "Administrador"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='BENEFICIARY')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    program = models.CharField(max_length=120, blank=True, default='')
    semester = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(20)],
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @property
    def is_admin(self):
        return self.role == "ADMIN" or self.user.is_staff or self.user.is_superuser

    @property
    def is_beneficiary(self):
        return self.role == "BENEFICIARY"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Automatically create a UserProfile when a new User is created
    """
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Save the UserProfile when the User is saved
    """
    if hasattr(instance, "profile"):
        instance.profile.save()


class Activity(models.Model):
    # Choices for category field
    CATEGORY_CHOICES = [
        ("DEPORTE", "Deporte"),
        ("CULTURA", "Cultura"),
        ("EVENTO", "Evento"),
        ("BIENESTAR", "Bienestar"),
        ("OTRO", "Otro"),
    ]

    # Choices for visibility field
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
    ]

    # Choices for status field
    STATUS_CHOICES = [
        ("active", "Active"),
        ("cancelled", "Cancelled"),
        ("finished", "Finished"),
    ]

    title = models.CharField(max_length=120)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=120, blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=0)
    available_spots = models.PositiveIntegerField()
    instructor = models.CharField(max_length=120, blank=True)
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default="public")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")
    tags = models.JSONField(default=list, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["start"]),
            models.Index(fields=["category"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        # Validate end time is after start time
        if self.end and self.start and self.end <= self.start:
            raise ValidationError({"end": "End time must be after start time"})

        # Validate available_spots is consistent with capacity
        if self.available_spots > self.capacity:
            raise ValidationError({"available_spots": "Available spots cannot exceed capacity"})

    def save(self, *args, **kwargs):
        # Set initial available spots to match capacity if not specified
        if self.capacity and not self.available_spots:
            self.available_spots = self.capacity

        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Project(models.Model):
    TYPE_CHOICES = [
        ('PSU', 'Prestación de Servicio Social Universitario'),
        ('VOLUNTEER', 'Voluntariado'),
    ]

    STATUS_CHOICES = [
        ('enrollment', 'Inscripción'),
        ('ongoing', 'En Curso'),
        ('finished', 'Finalizado'),
        ('cancelled', 'Cancelado'),
    ]

    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='VOLUNTEER')
    area = models.CharField(max_length=100, blank=True)
    subtype = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    total_quota = models.PositiveIntegerField(default=20)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrollment')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    @property
    def confirmed_enrollments(self):
        return self.enrollments.filter(status='confirmed').count()

    @property
    def available_quota(self):
        return max(self.total_quota - self.confirmed_enrollments, 0)


class Enrollment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('rejected', 'Rechazada'),
        ('cancelled', 'Cancelada'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='enrollments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='project_enrollments', null=True, blank=True)
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    enrollment_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Inscripción'
        verbose_name_plural = 'Inscripciones'
        ordering = ['-enrollment_date']
        unique_together = [['project', 'email']]

    def __str__(self):
        return f"{self.full_name} - {self.project.name}"

    def clean(self):
        if self.project.available_quota <= 0 and not self.pk:
            raise ValidationError('No hay cupos disponibles para este proyecto')

    def save(self, *args, **kwargs):
        if not self.pk:
            self.clean()
        super().save(*args, **kwargs)
