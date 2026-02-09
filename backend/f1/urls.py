from django.urls import path
from . import views
from .auth_views import me, set_avatar, register

urlpatterns = [
    path("health/", views.health),
    path("drivers/", views.drivers_list),
    path("teams/", views.teams_list),
    path("season/calendar/", views.calendar_list),

    path("auth/me/", me),
    path("auth/avatar/", set_avatar),
    path("auth/register/", register),

    path("simulate/session/<int:session_index>/", views.simulate_one),
    path("simulate/next/", views.simulate_next_view),
    path("season/reset/", views.season_reset_view),
]