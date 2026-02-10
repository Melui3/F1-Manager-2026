# f1/auth_views.py
from .models import Profile

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken


ALLOWED_AVATARS = {
    "verstappen",
    "leclerc",
    "norris",
    "hamilton",
    "alonso",
    "sainz",
    "colapinto",
    "stroll",
    "hadjar",
    "albon",
    "antonelli",
    "piastri",
    "bearman",
    "hulkenberg",
    "bortoleto",
    "ocon",
    "lawson",
    "russell",  # 🔥 corrigé
}


def issue_tokens(user: User):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


# ==========================
# LOGIN (NOUVEAU)
# ==========================
@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    if not username or not password:
        return Response(
            {"detail": "Username et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)
    if not user:
        return Response(
            {"detail": "Identifiants invalides."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    profile, _ = Profile.objects.get_or_create(user=user)
    tokens = issue_tokens(user)

    return Response(
        {
            **tokens,
            "username": user.username,
            "avatar_key": profile.avatar_key,
            "avatar_url": profile.avatar_url,
        },
        status=status.HTTP_200_OK,
    )


# ==========================
# ME
# ==========================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "avatar_key": profile.avatar_key,
            "avatar_url": profile.avatar_url,
        }
    )


# ==========================
# SET AVATAR
# ==========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_avatar(request):
    key = (request.data.get("avatar_key") or "").strip()

    if key not in ALLOWED_AVATARS:
        return Response({"detail": "Avatar invalide."}, status=400)

    profile, _ = Profile.objects.get_or_create(user=request.user)
    profile.avatar_key = key
    profile.save(update_fields=["avatar_key"])

    return Response(
        {
            "ok": True,
            "avatar_key": profile.avatar_key,
            "avatar_url": profile.avatar_url,
        }
    )


# ==========================
# REGISTER
# ==========================
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = (request.data.get("username") or "").strip()
    password = request.data.get("password") or ""
    avatar_key = (request.data.get("avatar_key") or "").strip()

    if not username or not password:
        return Response(
            {"detail": "Username et mot de passe requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "Ce username est déjà pris."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if avatar_key not in ALLOWED_AVATARS:
        avatar_key = None

    user = User.objects.create_user(username=username, password=password)

    profile, _ = Profile.objects.get_or_create(user=user)
    profile.avatar_key = avatar_key
    profile.save(update_fields=["avatar_key"])

    tokens = issue_tokens(user)

    return Response(
        {
            **tokens,
            "username": user.username,
            "avatar_key": profile.avatar_key,
            "avatar_url": profile.avatar_url,
        },
        status=status.HTTP_201_CREATED,
    )