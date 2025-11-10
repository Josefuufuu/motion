from django.db import models, transaction
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMessage


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
    checkin_token = models.CharField(max_length=64, null=True, blank=True, unique=True)
    checkin_expires_at = models.DateTimeField(null=True, blank=True)

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

        # Detect changes in critical fields to trigger notifications
        changes = {}
        if self.pk:
            try:
                prev = type(self).objects.get(pk=self.pk)
                if prev.start != self.start:
                    changes['start'] = {'old': prev.start, 'new': self.start}
                if prev.location != self.location:
                    changes['location'] = {'old': prev.location, 'new': self.location}
                if prev.status != self.status:
                    changes['status'] = {'old': prev.status, 'new': self.status}
            except type(self).DoesNotExist:
                changes = {}

        self.clean()
        super().save(*args, **kwargs)

        # Enqueue notifications after saving successfully
        if changes:
            try:
                enqueue_activity_change_notifications(self, changes)
            except Exception:
                # Avoid breaking the main flow if notifications fail
                pass

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


class TournamentEnrollment(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pendiente"),
        (STATUS_CONFIRMED, "Confirmada"),
        (STATUS_CANCELLED, "Cancelada"),
    ]

    ACTIVE_STATUSES = {STATUS_PENDING, STATUS_CONFIRMED}

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="tournament_enrollments"
    )
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name="enrollments"
    )
    status = models.CharField(
        max_length=16, choices=STATUS_CHOICES, default=STATUS_CONFIRMED
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "tournament")
        indexes = [
            models.Index(fields=["tournament", "status"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.tournament.name} ({self.status})"

    @classmethod
    def _active_statuses(cls):
        return cls.ACTIVE_STATUSES

    @classmethod
    def update_current_teams(cls, tournament):
        active_count = (
            cls.objects.filter(
                tournament=tournament, status__in=cls._active_statuses()
            ).count()
        )
        Tournament.objects.filter(pk=tournament.pk).update(
            current_teams=active_count
        )

    @property
    def is_active(self):
        return self.status in self._active_statuses()

    def save(self, *args, **kwargs):
        with transaction.atomic():
            if self.pk:
                previous_status = (
                    type(self)
                    .objects.filter(pk=self.pk)
                    .values_list("status", flat=True)
                    .first()
                )
                was_active = previous_status in self._active_statuses()
            else:
                was_active = False

            super().save(*args, **kwargs)

            if was_active != self.is_active:
                self.update_current_teams(self.tournament)

    def delete(self, *args, **kwargs):
        tournament = self.tournament
        was_active = self.is_active
        with transaction.atomic():
            super().delete(*args, **kwargs)
            if was_active:
                self.update_current_teams(tournament)


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


# ======================
# Notifications module
# ======================
class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="notification_preferences")
    email_enabled = models.BooleanField(default=True)
    app_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=False)
    sms_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prefs({self.user.username})"


@receiver(post_save, sender=User)
def ensure_notification_prefs(sender, instance, created, **kwargs):
    if created:
        NotificationPreference.objects.create(user=instance)


class Campaign(models.Model):
    CHANNEL_OPTION_CHOICES = [
        ("CORREO", "Correo"),
        ("PUSH", "Push/App"),
        ("AMBOS", "Ambos"),
    ]

    SEGMENT_CHOICES = [
        ("Todos los usuarios", "Todos los usuarios"),
        ("Solo Estudiantes", "Solo Estudiantes"),
        ("Solo Profesores", "Solo Profesores"),
        ("Seleccionados", "Seleccionados"),
    ]

    name = models.CharField(max_length=160)
    message = models.TextField()
    channel_option = models.CharField(max_length=16, choices=CHANNEL_OPTION_CHOICES, default="AMBOS")
    segment = models.CharField(max_length=32, choices=SEGMENT_CHOICES, default="Todos los usuarios")
    selected_user_ids = models.JSONField(null=True, blank=True, default=list)
    schedule_at = models.DateTimeField(null=True, blank=True)

    total_recipients = models.PositiveIntegerField(default=0)
    app_sent = models.PositiveIntegerField(default=0)
    emails_sent = models.PositiveIntegerField(default=0)

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="campaigns_created")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Campaign({self.name})"

    def update_metrics(self):
        from django.db.models import Count
        app_count = Notification.objects.filter(campaign=self, channel='app').count()
        email_count = Notification.objects.filter(campaign=self, channel='email', status='sent').count()
        total = Notification.objects.filter(campaign=self).values('user').distinct().count()
        self.app_sent = app_count
        self.emails_sent = email_count
        self.total_recipients = total
        self.save(update_fields=['app_sent', 'emails_sent', 'total_recipients'])


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ("app", "App"),
        ("email", "Email"),
        ("push", "Push"),
        ("sms", "SMS"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("scheduled", "Scheduled"),
        ("sent", "Sent"),
        ("failed", "Failed"),
        ("read", "Read"),
    ]
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("normal", "Normal"),
        ("high", "High"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    activity = models.ForeignKey(Activity, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")
    campaign = models.ForeignKey(Campaign, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications")

    title = models.CharField(max_length=200)
    body = models.TextField()
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)  # ajustado a longitud real
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="pending")  # ajustado
    priority = models.CharField(max_length=8, choices=PRIORITY_CHOICES, default="normal")  # ajustado

    scheduled_for = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # añadido para coincidir con la tabla

    class Meta:
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["scheduled_for"]),
            models.Index(fields=["activity", "channel"]),
            models.Index(fields=["campaign"]),
        ]

    def mark_sent(self):
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at', 'updated_at'])

    def mark_read(self):
        self.status = 'read'
        self.read_at = timezone.now()
        self.save(update_fields=['status', 'read_at', 'updated_at'])

    def __str__(self):
        return f"Notif({self.channel}) to {self.user_id}: {self.title[:20]}"


class NotificationDeliveryLog(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='delivery_logs')
    channel = models.CharField(max_length=16, choices=Notification.CHANNEL_CHOICES)
    status = models.CharField(max_length=16, choices=[('success','Success'), ('error','Error')])
    detail = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Log({self.channel},{self.status}) for {self.notification_id}"


# Helper functions (placed at end to avoid circular imports)

def _activity_change_message(activity: Activity, changes: dict):
    fields = ", ".join(sorted(changes.keys()))
    title = f"Actualización de actividad: {activity.title}"
    body = f"La actividad '{activity.title}' ha sido actualizada. Campos: {fields}."
    return title, body


def _should_create_similar(user: User, activity: Activity, title: str, window_minutes: int = 10) -> bool:
    since = timezone.now() - timezone.timedelta(minutes=window_minutes)
    return not Notification.objects.filter(
        user=user,
        activity=activity,
        title=title,
        created_at__gte=since,
    ).exists()


def _eligible_channels(user: User):
    # Use a safe lookup to avoid RelatedObjectDoesNotExist when prefs missing
    try:
        from .models import NotificationPreference  # local import avoids circular on app loading
        prefs = NotificationPreference.objects.filter(user_id=user.id).first()
    except Exception:
        prefs = None
    if not prefs:
        # default behavior if no prefs stored yet
        return {'app', 'email'}
    channels = set()
    if prefs.app_enabled:
        channels.add('app')
    if prefs.email_enabled:
        channels.add('email')
    # Extensions (push/sms) could be added here based on prefs
    return channels


def enqueue_activity_change_notifications(activity: Activity, changes: dict):
    """Create Notification rows for enrolled users and assigned professor on activity changes."""
    title, body = _activity_change_message(activity, changes)

    recipients = set(
        activity.enrollments.values_list('user_id', flat=True)
    )
    if activity.assigned_professor_id:
        recipients.add(activity.assigned_professor_id)

    notifs_to_create = []
    now = timezone.now()

    for user_id in recipients:
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            continue

        if not _should_create_similar(user, activity, title):
            continue

        channels = _eligible_channels(user)
        for ch in channels:
            status = 'sent' if ch == 'app' else 'pending'
            sent_at = now if ch == 'app' else None
            notifs_to_create.append(
                Notification(
                    user=user,
                    activity=activity,
                    title=title,
                    body=body,
                    channel=ch,
                    status=status,
                    sent_at=sent_at,
                    metadata={"type": "activity_change", "fields": list(changes.keys())},
                )
            )

    created = []
    if notifs_to_create:
        created = Notification.objects.bulk_create(notifs_to_create)

    # Envío inmediato de emails si aplica (best-effort)
    try:
        send_email_immediate = getattr(settings, 'SEND_EMAIL_IMMEDIATE', True)
        if send_email_immediate:
            # Seleccionar notificaciones email pendientes recién creadas
            email_qs = Notification.objects.filter(
                activity=activity, channel='email', status='pending', title=title,
                created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
            )
            for n in email_qs:
                try:
                    if not n.user.email:
                        raise ValueError('Usuario sin email')
                    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
                        raise ValueError('Credenciales SMTP no configuradas')
                    msg = EmailMessage(
                        subject=n.title,
                        body=n.body,
                        from_email=settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER,
                        to=[n.user.email],
                    )
                    msg.send(fail_silently=False)
                    n.mark_sent()
                    NotificationDeliveryLog.objects.create(
                        notification=n,
                        channel='email',
                        status='success',
                        detail='Email enviado por cambio de actividad'
                    )
                except Exception as exc:
                    NotificationDeliveryLog.objects.create(
                        notification=n,
                        channel='email',
                        status='error',
                        detail=f'Error email: {exc}'
                    )
                    n.status = 'failed'
                    n.save(update_fields=['status'])
    except Exception:
        # No romper en caso de error en envío
        pass
