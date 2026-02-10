from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = "Create a default admin user if it doesn't exist (env-driven)."

    def handle(self, *args, **options):
        username = os.getenv("DJANGO_SU_NAME")
        password = os.getenv("DJANGO_SU_PASSWORD")
        email = os.getenv("DJANGO_SU_EMAIL", "")

        if not username or not password:
            self.stdout.write(self.style.WARNING("DJANGO_SU_NAME/PASSWORD not set. Skipping."))
            return

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(f"User '{username}' already exists."))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Superuser '{username}' created."))