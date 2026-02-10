from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Driver, SeasonSession, Team
from .services.simulation import simulate_session, simulate_next, reset_season


def serialize_team(t: Team):
    return {
        "id": t.id,
        "name": t.name,
        "logo_url": getattr(t, "logo_url", None),
    }


def serialize_driver(d: Driver):
    return {
        "id": d.id,
        "name": d.name,
        "surname": d.surname,
        "country": d.country,
        "number": d.number,

        "team": d.team.name if d.team_id else None,
        "team_id": d.team_id,
        "team_logo_url": getattr(d.team, "logo_url", None) if d.team_id else None,

        "image_url": getattr(d, "image_url", None),

        "points": d.points,
        "wins": d.wins,
        "podiums": d.podiums,
        "pole_positions": d.pole_positions,
        "fastest_laps": d.fastest_laps,

        # stats
        "speed": d.speed,
        "racing": d.racing,
        "reaction": d.reaction,
        "experience": d.experience,

        # ✅ champs souvent oubliés (si ton model les a)
        "consistency": getattr(d, "consistency", None),
        "error_rate": getattr(d, "error_rate", None),

        "street_circuit_affinity": getattr(d, "street_circuit_affinity", None),
        "high_speed_circuit_affinity": getattr(d, "high_speed_circuit_affinity", None),
        "wet_circuit_affinity": getattr(d, "wet_circuit_affinity", None),
    }


@api_view(["GET"])
def health(request):
    return Response({"ok": True})


@api_view(["GET"])
def teams_list(request):
    qs = Team.objects.all().order_by("name")
    return Response([serialize_team(t) for t in qs])


@api_view(["GET"])
def drivers_list(request):
    qs = Driver.objects.all().order_by("-points", "-wins")
    return Response([serialize_driver(d) for d in qs])


@api_view(["GET"])
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
def simulate_one(request, session_index: int):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    # ✅ simulate_session renvoie déjà une LISTE JSON-ready
    results = simulate_session(session_index, force=force)
    return Response({"results": results})


@api_view(["POST"])
def simulate_next_view(request):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    # ✅ simulate_next renvoie un dict complet {session, results}
    return Response(simulate_next(force=force))


@api_view(["POST"])
def season_reset_view(request):
    return Response(reset_season())