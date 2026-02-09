import numpy as np
from django.db import transaction

from ..models import Team, Driver, SeasonSession, SessionResult
from ..legacy import driver as legacy_drivers


POINTS_GP = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
POINTS_SPRINT = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]


@transaction.atomic
def simulate_session(session_index: int, force: bool = False):
    """
    Simule une session (FP/QS/QC/S/GP), met à jour :
    - drivers (stats + points + wins/podiums/etc)
    - SessionResult (position + points_gained + stats_gained)
    - SeasonSession.is_simulated = True

    Si la session est déjà simulée :
    - force=False -> renvoie les résultats existants
    - force=True  -> supprime les résultats existants et resimule
    """
    session = SeasonSession.objects.select_for_update().get(index=session_index)

    # ✅ si déjà simulée et pas force : renvoyer l'existant
    if session.is_simulated and not force:
        existing = (SessionResult.objects
                    .select_related("driver", "driver__team")
                    .filter(session=session)
                    .order_by("position"))
        if existing.exists():
            return [
                _format(r.driver, r.points_gained, r.stats_gained, r.position)
                for r in existing
            ]

    # ✅ si force (ou si pas encore simulée mais résultats fantômes) : nettoyer
    SessionResult.objects.filter(session=session).delete()

    # ✅ lock drivers pour éviter les doubles clics / incohérences
    drivers = list(Driver.objects.select_for_update().select_related("team").all())

    results_payload = []
    driver_scores = []

    # -----------------------
    # Calcul des performances
    # -----------------------
    for d in drivers:
        base = d.speed * 2 + d.racing * 2 + d.reaction + d.experience

        # Affinité circuit
        if session.circuit_type == "street":
            base += d.street_affinity
        elif session.circuit_type == "high_speed":
            base += d.high_speed_affinity
        elif session.circuit_type == "wet":
            base += d.wet_affinity

        # FP : boost stats seulement
        if session.session_type == "FP":
            stat_boost = int(np.random.randint(1, 5) + base // 50)
            d.speed += stat_boost
            d.racing += stat_boost
            d.reaction += stat_boost
            d.experience += stat_boost // 2
            d.save()

            # pas de position / pas de points, juste payload
            results_payload.append(_format(d, 0, stat_boost, None))
            continue

        # Autres sessions : score pondéré
        score = int(base + np.random.randint(-5, 6))
        driver_scores.append((d, score))

    # -----------------------
    # Classement et points
    # -----------------------
    if session.session_type in ["QS", "QC", "S", "GP"]:
        driver_scores.sort(key=lambda x: x[1], reverse=True)

        if session.session_type == "S":
            points_table = POINTS_SPRINT
        elif session.session_type == "GP":
            points_table = POINTS_GP
        else:
            points_table = [0] * len(driver_scores)  # qualifs = 0 points

        for pos, (d, score) in enumerate(driver_scores, start=1):
            points = points_table[pos - 1] if (pos - 1) < len(points_table) else 0
            stats_gain = max(1, int(score / 20))

            # gain stats
            d.speed += stats_gain
            d.racing += stats_gain
            d.reaction += stats_gain
            d.experience += stats_gain // 2

            # points
            d.points += points

            # pole (qualifs)
            if session.session_type in ["QS", "QC"] and pos == 1:
                d.pole_positions += 1

            # sprint/gp: fastest lap simplifié sur P1
            if session.session_type in ["GP", "S"] and pos == 1:
                d.fastest_laps += 1
                if session.session_type == "GP":
                    d.wins += 1

            # podium (sprint + gp)
            if session.session_type in ["GP", "S"] and pos <= 3:
                d.podiums += 1

            d.save()

            # persist result
            SessionResult.objects.create(
                session=session,
                driver=d,
                position=pos,
                points_gained=points,
                stats_gained=stats_gain,
            )

            results_payload.append(_format(d, points, stats_gain, pos))

    # Marquer session jouée
    session.is_simulated = True
    session.save()

    # Tri : positions d'abord, puis FP (None) à la fin
    results_payload.sort(key=lambda r: (r["position"] is None, r["position"] or 999))
    return results_payload


@transaction.atomic
def simulate_next(force: bool = False) -> dict:
    """
    Simule la prochaine session non jouée.
    Retourne:
    {
      done: bool,
      session: {...} | None,
      results: [...]
    }
    """
    next_session = (SeasonSession.objects
                    .select_for_update()
                    .filter(is_simulated=False)
                    .order_by("index")
                    .first())

    if not next_session:
        return {
            "done": True,
            "message": "Season complete",
            "session": None,
            "results": []
        }

    results = simulate_session(next_session.index, force=force)

    return {
        "done": False,
        "session": {
            "index": next_session.index,
            "gp_name": next_session.gp_name,
            "circuit_name": next_session.circuit_name,
            "date": next_session.date.isoformat(),
            "session_type": next_session.session_type,
            "circuit_type": next_session.circuit_type,
            "is_simulated": True,
        },
        "results": results
    }


@transaction.atomic
@transaction.atomic
def reset_season(reset_skills: bool = True) -> dict:
    """
    Reset de saison :
    - supprime SessionResult
    - remet is_simulated=False sur toutes les sessions
    - remet à 0 points/wins/podiums/poles/fastest_laps sur tous les drivers
    - OPTIONNEL (par défaut OUI): remet aussi les skills/affinités/consistency/error_rate
      à la baseline (f1.legacy.driver.drivers)
    """
    SessionResult.objects.all().delete()
    SeasonSession.objects.all().update(is_simulated=False)

    # Reset progression (toujours)
    Driver.objects.all().update(
        points=0,
        wins=0,
        podiums=0,
        pole_positions=0,
        fastest_laps=0,
    )

    # ✅ Reset skills/affinités (si demandé)
    if reset_skills:
        if not hasattr(legacy_drivers, "drivers"):
            raise RuntimeError("f1/legacy/driver.py must expose `drivers`")

        for d in legacy_drivers.drivers:
            team_obj, _ = Team.objects.get_or_create(
                name=d.team,
                defaults={"logo_url": None}
            )

            Driver.objects.filter(
                surname=d.surname,
                name=d.name,
                number=d.number,
            ).update(
                team=team_obj,
                country=d.country,

                speed=d.speed,
                racing=d.racing,
                reaction=d.reaction,
                experience=d.experience,

                consistency=d.consistency,
                error_rate=d.error_rate,

                street_affinity=getattr(d, "street_circuit_affinity", 0),
                high_speed_affinity=getattr(d, "high_speed_circuit_affinity", 0),
                wet_affinity=getattr(d, "wet_circuit_affinity", 0),
            )

    return {"ok": True, "reset_skills": reset_skills}


def _format(d: Driver, points_gained: int, stats_gained: int, position):
    return {
        "id": d.id,
        "name": d.name,
        "surname": d.surname,

        "team": d.team.name,
        "team_logo_url": d.team.logo_url,
        "image_url": d.image_url,
        "image_key": d.image_key,

        "points": d.points,
        "wins": d.wins,
        "podiums": d.podiums,
        "pole_positions": d.pole_positions,
        "fastest_laps": d.fastest_laps,

        "speed": d.speed,
        "racing": d.racing,
        "reaction": d.reaction,
        "experience": d.experience,

        "consistency": d.consistency,
        "error_rate": d.error_rate,

        # ✅ mêmes noms que ton front (tu affiches Street/High speed/Wet)
        "street_circuit_affinity": d.street_affinity,
        "high_speed_circuit_affinity": d.high_speed_affinity,
        "wet_circuit_affinity": d.wet_affinity,

        "points_gained": points_gained,
        "stats_gained": stats_gained,
        "position": position,
    }