from django.conf import settings
from django.db import models


class Team(models.Model):
    name = models.CharField(max_length=120, unique=True)
    logo_url = models.URLField(blank=True, null=True)  # tu peux laisser vide si tu gères côté front

    def __str__(self):
        return self.name


class Driver(models.Model):
    surname = models.CharField(max_length=50)
    name = models.CharField(max_length=50)
    team = models.ForeignKey(Team, on_delete=models.PROTECT, related_name="drivers")

    country = models.CharField(max_length=50)
    number = models.IntegerField()

    # Si un jour tu veux remettre des URLs directes
    image_url = models.URLField(blank=True, null=True)

    # ✅ clé stable pour que le front retrouve l’image en local, ex: "verstappen_3"
    image_key = models.CharField(max_length=80, blank=True, null=True)

    # ---- Stats ----
    speed = models.IntegerField(default=0)
    racing = models.IntegerField(default=0)
    reaction = models.IntegerField(default=0)
    experience = models.IntegerField(default=0)

    consistency = models.IntegerField(default=0)
    error_rate = models.IntegerField(default=0)

    street_affinity = models.IntegerField(default=0)
    high_speed_affinity = models.IntegerField(default=0)
    wet_affinity = models.IntegerField(default=0)

    # ---- Résultats ----
    points = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    podiums = models.IntegerField(default=0)
    pole_positions = models.IntegerField(default=0)
    fastest_laps = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} {self.surname}"


class SeasonSession(models.Model):
    index = models.IntegerField(unique=True)
    gp_name = models.CharField(max_length=120)
    circuit_name = models.CharField(max_length=120)
    date = models.DateField()
    session_type = models.CharField(max_length=5)   # FP QS S QC GP
    circuit_type = models.CharField(max_length=20)  # street high_speed wet
    is_simulated = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.index} {self.gp_name} {self.session_type}"


class SessionResult(models.Model):
    session = models.ForeignKey(SeasonSession, on_delete=models.CASCADE, related_name="results")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE)
    position = models.IntegerField()
    points_gained = models.IntegerField(default=0)
    stats_gained = models.IntegerField(default=0)

    class Meta:
        unique_together = ("session", "driver")

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    avatar_key = models.CharField(max_length=64, default="default")

    @property
    def avatar_url(self):
        return f"/avatars/{self.avatar_key}.jpg"  # mets .png si tes fichiers sont en png

    def __str__(self):
        return f"Profile({self.user.username})"