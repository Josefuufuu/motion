from django.contrib import admin
from .models import Activity, UserProfile

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
    list_display = ("user", "phone_number", "program", "semester")
    search_fields = ("user__username", "user__email", "program")
