from datetime import date
import random

# ----------------------
# HELPERS
# ----------------------

def clamp(v, lo=0, hi=100):
    try:
        v = int(v)
    except Exception:
        v = lo
    return max(lo, min(hi, v))

# ----------------------
# CLASSES DE SESSIONS
# ----------------------

class Session:
    def __init__(self, gp_name, circuit_name, session_date, session_type, circuit_type):
        self.gp_name = gp_name
        self.circuit_name = circuit_name
        self.date = session_date
        self.session_type = session_type  # "FP", "QS", "S", "QC", "GP"
        self.circuit_type = circuit_type  # "street", "high_speed", "wet"
        self.results = []

    def simulate(self, drivers):
        raise NotImplementedError("Cette méthode doit être surchargée dans les sous-classes")

    def _affinity_bonus(self, driver):
        bonus = 0
        if self.circuit_type == "street":
            bonus += int(getattr(driver, "street_circuit_affinity", 0) or 0)
        elif self.circuit_type == "high_speed":
            bonus += int(getattr(driver, "high_speed_circuit_affinity", 0) or 0)
        elif self.circuit_type == "wet":
            bonus += int(getattr(driver, "wet_circuit_affinity", 0) or 0)
        return bonus

# --- Free Practice ---
class FreePractice(Session):
    def simulate(self, drivers):
        results = []
        for driver in drivers:
            stats_boost = random.randint(1, 5) + self._affinity_bonus(driver)

            # ✅ clamp pour éviter explosion
            driver.speed = clamp(driver.speed + stats_boost)
            driver.racing = clamp(driver.racing + stats_boost)
            driver.reaction = clamp(driver.reaction + stats_boost)
            driver.experience = clamp(driver.experience + (stats_boost // 2))

            results.append({
                "driver": driver,
                "points_gained": 0,
                "stats_gained": stats_boost
            })

        self.results = results
        return results

# --- Qualifying ---
class Qualifying(Session):
    def simulate(self, drivers):
        results = []
        for driver in drivers:
            stats_boost = random.randint(3, 10)

            # pénalité d'erreur
            err = int(getattr(driver, "error_rate", 0) or 0)
            if random.randint(1, 100) < err:
                stats_boost = max(0, stats_boost - 5)

            driver.speed = clamp(driver.speed + stats_boost)
            driver.reaction = clamp(driver.reaction + stats_boost)

            results.append({
                "driver": driver,
                "points_gained": 0,
                "stats_gained": stats_boost
            })

        # Qualif : on ordonne par perf simulée (stats_gained)
        results.sort(key=lambda r: r["stats_gained"], reverse=True)
        self.results = results
        return results

# --- Sprint ---
class Sprint(Session):
    def simulate(self, drivers):
        results = []
        points_distribution = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]

        # NOTE: si tu veux plus réaliste: pondère par stats plutôt que random()
        drivers_sorted = sorted(drivers, key=lambda d: random.random())

        for i, driver in enumerate(drivers_sorted):
            stats_boost = random.randint(5, 12)
            points = points_distribution[i] if i < len(points_distribution) else 0

            driver.points = int(getattr(driver, "points", 0) or 0) + points
            driver.speed = clamp(driver.speed + stats_boost)
            driver.racing = clamp(driver.racing + stats_boost)

            results.append({
                "driver": driver,
                "points_gained": points,
                "stats_gained": stats_boost,
                "position": i + 1,   # ✅ utile si tu veux renvoyer direct
            })

        self.results = results
        return results

# --- Grand Prix ---
class GrandPrix(Session):
    def simulate(self, drivers):
        results = []
        points_distribution = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

        drivers_sorted = sorted(drivers, key=lambda d: random.random())

        for i, driver in enumerate(drivers_sorted):
            stats_boost = random.randint(5, 20)
            points = points_distribution[i] if i < len(points_distribution) else 0

            driver.points = int(getattr(driver, "points", 0) or 0) + points
            driver.speed = clamp(driver.speed + stats_boost)
            driver.racing = clamp(driver.racing + stats_boost)
            driver.reaction = clamp(driver.reaction + stats_boost)

            results.append({
                "driver": driver,
                "points_gained": points,
                "stats_gained": stats_boost,
                "position": i + 1,   # ✅ utile si tu veux renvoyer direct
            })

        self.results = results
        return results

# ----------------------
# CALENDRIER DES GP
# ----------------------

season_calendar = []

gp_list = [
    {"name": "Australian GP", "circuit": "Albert Park", "date": date(2026, 3, 8), "has_sprint": False, "circuit_type": "street"},
    {"name": "Chinese GP", "circuit": "Shanghai International Circuit", "date": date(2026, 3, 15), "has_sprint": True, "circuit_type": "high_speed"},
    {"name": "Japanese GP", "circuit": "Suzuka Circuit", "date": date(2026, 3, 29), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Bahrain GP", "circuit": "Bahrain International Circuit", "date": date(2026, 4, 12), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Jeddah GP", "circuit": "Jeddah Corniche Circuit", "date": date(2026, 4, 19), "has_sprint": False, "circuit_type": "street"},
    {"name": "Miami GP", "circuit": "Miami International Autodrome", "date": date(2026, 5, 3), "has_sprint": True, "circuit_type": "street"},
    {"name": "Canadian GP", "circuit": "Circuit Gilles Villeneuve", "date": date(2026, 5, 24), "has_sprint": True, "circuit_type": "high_speed"},
    {"name": "Monaco GP", "circuit": "Circuit de Monaco", "date": date(2026, 6, 7), "has_sprint": False, "circuit_type": "street"},
    {"name": "Barcelona GP", "circuit": "Circuit de Barcelona-Catalunya", "date": date(2026, 6, 14), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Austrian GP", "circuit": "Red Bull Ring", "date": date(2026, 6, 28), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "British GP", "circuit": "Silverstone Circuit", "date": date(2026, 7, 5), "has_sprint": True, "circuit_type": "high_speed"},
    {"name": "Belgian GP", "circuit": "Circuit de Spa-Francorchamps", "date": date(2026, 7, 19), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Hungarian GP", "circuit": "Hungaroring", "date": date(2026, 7, 26), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Dutch GP", "circuit": "Circuit Zandvoort", "date": date(2026, 8, 23), "has_sprint": True, "circuit_type": "high_speed"},
    {"name": "Italian GP", "circuit": "Monza Circuit", "date": date(2026, 9, 6), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Spanish GP", "circuit": "Madring Circuit", "date": date(2026, 9, 13), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Azerbaijan GP", "circuit": "Baku City Circuit", "date": date(2026, 9, 26), "has_sprint": False, "circuit_type": "street"},
    {"name": "Singapore GP", "circuit": "Marina Bay Street Circuit", "date": date(2026, 10, 11), "has_sprint": True, "circuit_type": "street"},
    {"name": "United States GP", "circuit": "Circuit of the Americas", "date": date(2026, 10, 25), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Mexico GP", "circuit": "Autódromo Hermanos Rodríguez", "date": date(2026, 11, 1), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Brazilian GP", "circuit": "Interlagos Circuit", "date": date(2026, 11, 8), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Las Vegas GP", "circuit": "Las Vegas Street Circuit", "date": date(2026, 11, 21), "has_sprint": False, "circuit_type": "street"},
    {"name": "Qatar GP", "circuit": "Losail International Circuit", "date": date(2026, 11, 29), "has_sprint": False, "circuit_type": "high_speed"},
    {"name": "Abu Dhabi GP", "circuit": "Yas Marina Circuit", "date": date(2026, 12, 6), "has_sprint": False, "circuit_type": "high_speed"},
]

for gp in gp_list:
    base_date = gp["date"]
    if gp["has_sprint"]:
        season_calendar.extend([
            FreePractice(gp["name"], gp["circuit"], base_date, "FP", gp["circuit_type"]),
            Qualifying(gp["name"], gp["circuit"], base_date, "QS", gp["circuit_type"]),
            Sprint(gp["name"], gp["circuit"], base_date, "S", gp["circuit_type"]),
            Qualifying(gp["name"], gp["circuit"], base_date, "QC", gp["circuit_type"]),
            GrandPrix(gp["name"], gp["circuit"], base_date, "GP", gp["circuit_type"]),
        ])
    else:
        season_calendar.extend([
            FreePractice(gp["name"], gp["circuit"], base_date, "FP", gp["circuit_type"]),
            Qualifying(gp["name"], gp["circuit"], base_date, "QC", gp["circuit_type"]),
            GrandPrix(gp["name"], gp["circuit"], base_date, "GP", gp["circuit_type"]),
        ])