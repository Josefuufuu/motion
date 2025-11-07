from django.contrib import admin
from .models import Activity, UserProfile, Project, Enrollment


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'start', 'end', 'capacity', 'available_spots', 'status', 'created_by']
    list_filter = ['category', 'status', 'visibility', 'start']
    search_fields = ['title', 'description', 'location', 'instructor']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start'
    ordering = ('-start',)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "phone_number", "program", "semester")
    list_filter = ("role",)
    search_fields = ("user__username", "user__email", "program")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'area', 'total_quota', 'confirmed_enrollments', 'available_quota', 'status', 'start_date', 'end_date']
    list_filter = ['type', 'status', 'area']
    search_fields = ['name', 'description', 'area', 'subtype']
    readonly_fields = ['created_at', 'updated_at', 'confirmed_enrollments', 'available_quota']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'type', 'area', 'subtype', 'description')
        }),
        ('Cupos y Fechas', {
            'fields': ('total_quota', 'start_date', 'end_date', 'status')
        }),
        ('Estadísticas', {
            'fields': ('confirmed_enrollments', 'available_quota'),
            'classes': ('collapse',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'project', 'user', 'status', 'enrollment_date']
    list_filter = ['status', 'project', 'enrollment_date']
    search_fields = ['full_name', 'email', 'phone', 'project__name']
    readonly_fields = ['enrollment_date', 'updated_at']
    date_hierarchy = 'enrollment_date'
    ordering = ('-enrollment_date',)
    raw_id_fields = ['user', 'project']
    fieldsets = (
        ('Datos del Participante', {
            'fields': ('full_name', 'email', 'phone', 'user')
        }),
        ('Inscripción', {
            'fields': ('project', 'status')
        }),
        ('Auditoría', {
            'fields': ('enrollment_date', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
