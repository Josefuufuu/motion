from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from actividades.models import UserProfile


class Command(BaseCommand):
    help = 'Create UserProfile for existing users without a profile'

    def handle(self, *args, **options):
        users_without_profile = []

        for user in User.objects.all():
            if not hasattr(user, 'profile'):
                users_without_profile.append(user)

        if not users_without_profile:
            self.stdout.write(self.style.SUCCESS('All users already have profiles!'))
            return

        created_count = 0
        for user in users_without_profile:
            UserProfile.objects.create(user=user)
            created_count += 1
            self.stdout.write(f'Created profile for user: {user.username}')

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} user profiles!'))
