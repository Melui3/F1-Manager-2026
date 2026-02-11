from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Driver, SeasonSession, Team
from .services.simulation import simulate_session, simulate_next, reset_season


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def teams_list(request):
    qs = Team.objects.all().order_by("name")
    return Response([
        {"id": t.id, "name": t.name, "logo_url": getattr(t, "logo_url", None)}
        for t in qs
    ])


@api_view(["GET"])
@permission_classes([AllowAny])
def drivers_list(request):
    qs = Driver.objects.select_related("team").all().order_by("-points", "-wins")
    return Response([
        {
            "id": d.id,
            "name": d.name,
            "surname": d.surname,
            "team": d.team.name if d.team_id else None,
            "team_id": d.team_id,
            "team_logo_url": getattr(d.team, "logo_url", None) if d.team_id else None,
            "image_url": getattr(d, "image_url", None),
            "image_key": getattr(d, "image_key", None),
            "country": getattr(d, "country", None),
            "number": getattr(d, "number", None),
            "points": getattr(d, "points", 0),
            "wins": getattr(d, "wins", 0),
            "podiums": getattr(d, "podiums", 0),
            "pole_positions": getattr(d, "pole_positions", 0),
            "fastest_laps": getattr(d, "fastest_laps", 0),
            "speed": getattr(d, "speed", None),
            "racing": getattr(d, "racing", None),
            "reaction": getattr(d, "reaction", None),
            "experience": getattr(d, "experience", None),
            "consistency": getattr(d, "consistency", None),
            "error_rate": getattr(d, "error_rate", None),
            "street_circuit_affinity": getattr(d, "street_affinity", getattr(d, "street_circuit_affinity", 0)),
            "high_speed_circuit_affinity": getattr(d, "high_speed_affinity", getattr(d, "high_speed_circuit_affinity", 0)),
            "wet_circuit_affinity": getattr(d, "wet_affinity", getattr(d, "wet_circuit_affinity", 0)),
        }
        for d in qs
    ])


@api_view(["GET"])
@permission_classes([AllowAny])
def calendar_list(request):
    qs = SeasonSession.objects.all().order_by("index")
    return Response([
        {
            "index": s.index,
            "gp_name": s.gp_name,
            "circuit_name": s.circuit_name,
            "date": s.date.isoformat() if s.date else None,
            "session_type": s.session_type,
            "circuit_type": s.circuit_type,
            "is_simulated": s.is_simulated,
        }
        for s in qs
    ])


@api_view(["POST"])
@permission_classes([AllowAny])
def simulate_one(request, session_index: int):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    return Response({"results": simulate_session(session_index, force=force)})


@api_view(["POST"])
@permission_classes([AllowAny])
def simulate_next_view(request):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    return Response(simulate_next(force=force))


@api_view(["POST"])
@permission_classes([AllowAny])
def season_reset_view(request):
    return Response(reset_season())