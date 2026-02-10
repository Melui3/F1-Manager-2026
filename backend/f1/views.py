from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Driver, SeasonSession, Team
from .services.simulation import simulate_session, simulate_next, reset_season


@api_view(["GET"])
def health(request):
    return Response({"ok": True})


@api_view(["GET"])
def teams_list(request):
    qs = Team.objects.all().order_by("name")
    return Response([
        {
            "id": t.id,
            "name": t.name,
            "logo_url": getattr(t, "logo_url", None),
        }
        for t in qs
    ])


@api_view(["GET"])
def drivers_list(request):
    qs = Driver.objects.select_related("team").all().order_by("-points", "-wins")
    return Response([
        {
            "id": d.id,
            "name": d.name,
            "surname": d.surname,

            # team infos
            "team": d.team.name if d.team_id else None,
            "team_id": d.team_id,
            "team_logo_url": getattr(d.team, "logo_url", None) if d.team_id else None,

            # media
            "image_url": getattr(d, "image_url", None),
            "image_key": getattr(d, "image_key", None),

            # identity
            "country": getattr(d, "country", None),
            "number": getattr(d, "number", None),

            # progression
            "points": getattr(d, "points", 0),
            "wins": getattr(d, "wins", 0),
            "podiums": getattr(d, "podiums", 0),
            "pole_positions": getattr(d, "pole_positions", 0),
            "fastest_laps": getattr(d, "fastest_laps", 0),

            # core stats
            "speed": getattr(d, "speed", None),
            "racing": getattr(d, "racing", None),
            "reaction": getattr(d, "reaction", None),
            "experience": getattr(d, "experience", None),

            # ✅ champs manquants (safe)
            "consistency": getattr(d, "consistency", None),
            "error_rate": getattr(d, "error_rate", None),

            # ✅ affinities (safe + tes noms front)
            "street_circuit_affinity": getattr(d, "street_affinity", getattr(d, "street_circuit_affinity", None)),
            "high_speed_circuit_affinity": getattr(d, "high_speed_affinity", getattr(d, "high_speed_circuit_affinity", None)),
            "wet_circuit_affinity": getattr(d, "wet_affinity", getattr(d, "wet_circuit_affinity", None)),
        }
        for d in qs
    ])


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
    return Response({"results": simulate_session(session_index, force=force)})


@api_view(["POST"])
def simulate_next_view(request):
    force = request.query_params.get("force") in ("1", "true", "True", "yes")
    return Response(simulate_next(force=force))


@api_view(["POST"])
def season_reset_view(request):
    # tu peux laisser reset_season() par défaut (reset_skills=True dans ton service)
    return Response(reset_season())