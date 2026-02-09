from django.contrib import admin
from .models import Driver, Team, SeasonSession, SessionResult

admin.site.register(Team)
admin.site.register(Driver)
admin.site.register(SeasonSession)
admin.site.register(SessionResult)