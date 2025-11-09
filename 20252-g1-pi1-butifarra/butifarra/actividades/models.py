from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class UserProfile(models.Model):
    """
    Extended user profile: role management + optional personal info
    """
    ROLE_CHOICES = [
        ("BENEFICIARY", "Beneficiario/Estudiante"),
        ("ADMIN", "Administrador"),
        ("PROFESSOR", "Profesor"),  # Nuevo rol
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="BENEFICIARY")
    # Optional personal info so signals can create a profile without breaking
    phone_number = models.CharField(max_length=20, blank=True, default="")
    program = models.CharField(max_length=120, blank=True, default="")
    semester = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
    )

    # Use defaults to avoid interactive prompts when migrating existing rows
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

    @property
    def is_admin(self):
        return self.role == "ADMIN" or self.user.is_staff or self.user.is_superuser

    @property
    def is_beneficiary(self):
        return self.role == "BENEFICIARY"

    @property
    def is_professor(self):  # Nuevo helper
        return self.role == "PROFESSOR"


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
    instructor = models.CharField(max_length=120, blank=True)  # Texto descriptivo visible
    assigned_professor = models.ForeignKey(  # Relación directa al usuario profesor
        User,
        null=True,
        blank=True,
        related_name="activities_assigned",
        on_delete=models.SET_NULL,
        help_text="Profesor responsable (usuario con rol PROFESOR)",
    )
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default="public")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")
    tags = models.JSONField(default=list, blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    actual_attendees = models.PositiveIntegerField(default=0)  # Conteo real de asistentes
    notes = models.TextField(blank=True)  # Notas / reporte del profesor

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

        # Si hay profesor asignado, garantizar que su perfil sea PROFESOR
        if self.assigned_professor:
            profile = getattr(self.assigned_professor, "profile", None)
            if not profile or profile.role != "PROFESSOR":
                raise ValidationError({"assigned_professor": "El usuario asignado no tiene rol PROFESOR"})

        # Sincronizar instructor textual si falta
        if self.assigned_professor and not self.instructor:
            self.instructor = self.assigned_professor.get_full_name() or self.assigned_professor.username

        if self.actual_attendees and self.capacity and self.actual_attendees > self.capacity:
            raise ValidationError({"actual_attendees": "Actual attendees cannot exceed capacity"})

    def save(self, *args, **kwargs):
        # Set initial available spots to match capacity if not specified
        if self.capacity and not self.available_spots:
            self.available_spots = self.capacity

        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Tournament(models.Model):
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("ongoing", "Ongoing"),
        ("finished", "Finished"),
        ("cancelled", "Cancelled"),
    ]
    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("private", "Private"),
    ]

    name = models.CharField(max_length=160)
    sport = models.CharField(max_length=64, blank=True, default="")
    format = models.CharField(max_length=64, blank=True, default="")
    description = models.TextField(blank=True)
    location = models.CharField(max_length=160, blank=True, default="")
    inscription_start = models.DateField(null=True, blank=True)
    inscription_end = models.DateField(null=True, blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    visibility = models.CharField(max_length=16, choices=VISIBILITY_CHOICES, default="public")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="planned")
    max_teams = models.PositiveIntegerField(default=0)
    current_teams = models.PositiveIntegerField(default=0)
    fixtures = models.JSONField(default=list, blank=True, null=True)

    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["start"]),
            models.Index(fields=["status"]),
            models.Index(fields=["visibility"]),
        ]

    def clean(self):
        if self.end and self.start and self.end <= self.start:
            raise ValidationError({"end": "End time must be after start time"})
        if self.current_teams and self.max_teams and self.current_teams > self.max_teams:
            raise ValidationError({"current_teams": "Current teams cannot exceed max teams"})
        if self.inscription_start and self.inscription_end and self.inscription_end < self.inscription_start:
            raise ValidationError({"inscription_end": "Inscription end must be after start"})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sport})"


class ActivityEnrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activity_enrollments")
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="enrollments")
    enrolled_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)

    class Meta:
        unique_together = ("user", "activity")
        indexes = [
            models.Index(fields=["activity", "user"]),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.activity.title}"
