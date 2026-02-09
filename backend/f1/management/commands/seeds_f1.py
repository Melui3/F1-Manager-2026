from django.core.management.base import BaseCommand
from django.db import transaction

from ...models import Team, Driver, SeasonSession, SessionResult
from ...legacy import driver as legacy_drivers
from ...legacy import session as legacy_session


class Command(BaseCommand):
    help = "Seed drivers and season calendar into database (from f1.legacy.*)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--wipe",
            action="store_true",
            help="Wipe existing F1 data (drivers/teams/sessions/results) before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        wipe = options.get("wipe", False)

        if wipe:
            self.stdout.write(self.style.WARNING("Wiping existing F1 data..."))
            SessionResult.objects.all().delete()
            SeasonSession.objects.all().delete()
            Driver.objects.all().delete()
            Team.objects.all().delete()

        self.stdout.write("Seeding drivers…")
        drivers_count = self.seed_drivers()

        self.stdout.write("Seeding season calendar…")
        sessions_count = self.seed_calendar()

        self.stdout.write(self.style.SUCCESS(
            f"Seed completed ✅ Drivers: {drivers_count} | Sessions: {sessions_count}"
        ))

    def seed_drivers(self) -> int:
        if not hasattr(legacy_drivers, "drivers"):
            raise RuntimeError("f1/legacy/drivers.py must expose a variable named `drivers`")

        created = 0

        for d in legacy_drivers.drivers:
            team_obj, _ = Team.objects.get_or_create(
                name=d.team,
                defaults={"logo_url": None}
            )

            image_key = f"{d.surname.lower()}_{d.number}"

            Driver.objects.update_or_create(
                surname=d.surname,
                name=d.name,
                defaults={
                    "team": team_obj,
                    "country": d.country,
                    "number": d.number,

                    "image_url": None,   # tu gères les vraies images côté front
                    "image_key": image_key,

                    "speed": d.speed,
                    "racing": d.racing,
                    "reaction": d.reaction,
                    "experience": d.experience,

                    "consistency": d.consistency,
                    "error_rate": d.error_rate,

                    "street_affinity": getattr(d, "street_circuit_affinity", 0),
                    "high_speed_affinity": getattr(d, "high_speed_circuit_affinity", 0),
                    "wet_affinity": getattr(d, "wet_circuit_affinity", 0),

                    "points": d.points,
                    "wins": d.wins,
                    "podiums": d.podiums,
                    "pole_positions": d.pole_positions,
                    "fastest_laps": d.fastest_laps,
                }
            )

            created += 1

        return created

    def seed_calendar(self) -> int:
        if not hasattr(legacy_session, "season_calendar"):
            raise RuntimeError("f1/legacy/session.py must expose a variable named `season_calendar`")

        created = 0

        for index, s in enumerate(legacy_session.season_calendar):
            SeasonSession.objects.update_or_create(
                index=index,
                defaults={
                    "gp_name": s.gp_name,
                    "circuit_name": s.circuit_name,
                    "date": s.date,
                    "session_type": s.session_type,
                    "circuit_type": s.circuit_type,
                    "is_simulated": False,
                }
            )
            created += 1

        return created