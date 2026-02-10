from django.urls import path
from . import views
from .auth_views import login, me, set_avatar, register

urlpatterns = [
    # API
    path("health/", views.health),
    path("drivers/", views.drivers_list),
    path("teams/", views.teams_list),
    path("season/calendar/", views.calendar_list),

    # AUTH
    path("auth/login/", login),
    path("auth/me/", me),
    path("auth/avatar/", set_avatar),
    path("auth/register/", register),

    # SIMULATION
    path("simulate/session/<int:session_index>/", views.simulate_one),
    path("simulate/next/", views.simulate_next_view),
    path("season/reset/", views.season_reset_view),
]