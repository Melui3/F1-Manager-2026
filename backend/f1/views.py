from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response


from .models import Driver, SeasonSession, Team
from .services.simulation import simulate_session, simulate_next, reset_season

@api_view(["GET"])
def health(request):
    return Response({"ok": True})

@api_view(["GET"])

def teams_list(request):
    qs = Team.objects.all().order_by("name")
    return Response([{
        "id": t.id,
        "name": t.name,
        "logo_url": t.logo_url,
    } for t in qs])

@api_view(["GET"])

def drivers_list(request):
    qs = Driver.objects.all().order_by("-points", "-wins")
    return Response([{
        "id": d.id,
        "name": d.name,
        "surname": d.surname,
        "team": d.team.name,
        "team_logo_url": d.team.logo_url,
        "image_url": d.image_url,
        "country": d.country,
        "number": d.number,
        "points": d.points,
        "wins": d.wins,
        "podiums": d.podiums,
        "pole_positions": d.pole_positions,
        "fastest_laps": d.fastest_laps,
        "speed": d.speed,
        "racing": d.racing,
        "reaction": d.reaction,
        "experience": d.experience,
    } for d in qs])

@api_view(["GET"])

def calendar_list(request):
    qs = SeasonSession.objects.all().order_by("index")
    return Response([{
        "index": s.index,
        "gp_name": s.gp_name,
        "circuit_name": s.circuit_name,
        "date": s.date.isoformat(),
        "session_type": s.session_type,
        "circuit_type": s.circuit_type,
        "is_simulated": s.is_simulated,
    } for s in qs])

@api_view(["POST"])

def simulate_one(request, session_index: int):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    return Response({"results": simulate_session(session_index, force=force)})

@api_view(["POST"])

def simulate_next_view(request):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    return Response(simulate_next(force=force))


@api_view(["POST"])

def season_reset_view(request):
    return Response(reset_season())