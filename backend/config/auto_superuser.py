# backend/config/auto_superuser.py
import os

def ensure_superuser():
    """
    Crée un superuser au boot si les variables d'env sont présentes
    et si l'utilisateur n'existe pas déjà.
    """
    username = os.getenv("DJANGO_SU_NAME")
    email = os.getenv("DJANGO_SU_EMAIL", "")
    password = os.getenv("DJANGO_SU_PASSWORD")

    if not username or not password:
        return  # rien à faire

    from django.contrib.auth import get_user_model
    User = get_user_model()

    if User.objects.filter(username=username).exists():
        return

    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"[auto_superuser] Superuser '{username}' created.")