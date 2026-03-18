import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Creates a superuser if it does not already exist'

    def handle(self, *args, **options):
        User = get_user_model()
        # Use env vars if provided, otherwise defaults
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@hostelmanagement.com')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'Admin@123')
        full_name = os.environ.get('DJANGO_SUPERUSER_FULL_NAME', 'Admin User')

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                full_name=full_name
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser: {email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Superuser {email} already exists.'))
