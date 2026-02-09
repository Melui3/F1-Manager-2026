# drivers.py

class Driver:
    def __init__(self, surname, name, team, country, number, image=None):
        self.surname = surname
        self.name = name
        self.team = team
        self.country = country
        self.number = number
        self.image = image

        # Stats de base
        self.speed = 0
        self.racing = 0
        self.reaction = 0
        self.experience = 0

        # Facteurs
        self.consistency = 0
        self.error_rate = 0

        # Affinités circuits
        self.street_circuit_affinity = 0
        self.high_speed_circuit_affinity = 0
        self.wet_circuit_affinity = 0

        # Résultats
        self.points = 0
        self.wins = 0
        self.podiums = 0
        self.pole_positions = 0
        self.fastest_laps = 0

    def init_ai_stats(self, speed, racing, reaction, experience,
                      consistency, error_rate,
                      street_affinity, high_speed_affinity, wet_affinity):
        self.speed = speed
        self.racing = racing
        self.reaction = reaction
        self.experience = experience
        self.consistency = consistency
        self.error_rate = error_rate
        self.street_circuit_affinity = street_affinity
        self.high_speed_circuit_affinity = high_speed_affinity
        self.wet_circuit_affinity = wet_affinity


# Liste des 22 pilotes 2026
drivers = []

# Ferrari
leclerc = Driver("Leclerc", "Charles", "Scuderia Ferrari HP", "Monaco", 16)
leclerc.init_ai_stats(speed=9, racing=9, reaction=9, experience=8,
                      consistency=90, error_rate=5,
                      street_affinity=8, high_speed_affinity=9, wet_affinity=7)

hamilton = Driver("Hamilton", "Lewis", "Scuderia Ferrari HP", "UK", 44)
hamilton.init_ai_stats(speed=9, racing=10, reaction=8, experience=10,
                       consistency=88, error_rate=6,
                       street_affinity=7, high_speed_affinity=9, wet_affinity=8)

drivers.extend([leclerc, hamilton])

# Red Bull
verstappen = Driver("Verstappen", "Max", "Oracle Red Bull Racing", "NED", 3)
verstappen.init_ai_stats(speed=10, racing=10, reaction=9, experience=9,
                         consistency=92, error_rate=5,
                         street_affinity=6, high_speed_affinity=10, wet_affinity=7)

hadjar = Driver("Hadjar", "Isack", "Oracle Red Bull Racing", "FRA", 6)
hadjar.init_ai_stats(speed=7, racing=8, reaction=8, experience=7,
                     consistency=85, error_rate=8,
                     street_affinity=5, high_speed_affinity=8, wet_affinity=6)

drivers.extend([verstappen, hadjar])

# Mercedes
russell = Driver("Russell", "George", "Mercedes-AMG Petronas Formula One Team", "UK", 63)
russell.init_ai_stats(speed=8, racing=8, reaction=9, experience=8,
                      consistency=88, error_rate=6,
                      street_affinity=6, high_speed_affinity=9, wet_affinity=7)

antonelli = Driver("Antonelli","Andrea Kimi", "Mercedes-AMG Petronas Formula One Team", "ITA", 12)
antonelli.init_ai_stats(speed=7, racing=7, reaction=8, experience=7,
                        consistency=84, error_rate=7,
                        street_affinity=5, high_speed_affinity=8, wet_affinity=6)

drivers.extend([russell, antonelli])

# McLaren
norris = Driver("Norris", "Lando", "McLaren Mastercard Formula 1 Team", "UK", 1)
norris.init_ai_stats(speed=8, racing=8, reaction=9, experience=7,
                     consistency=87, error_rate=6,
                     street_affinity=6, high_speed_affinity=8, wet_affinity=7)

piastri = Driver("Piastri", "Oscar", "McLaren Mastercard Formula 1 Team", "AUS", 81)
piastri.init_ai_stats(speed=7, racing=7, reaction=8, experience=6,
                      consistency=85, error_rate=7,
                      street_affinity=5, high_speed_affinity=7, wet_affinity=6)

drivers.extend([norris, piastri])

# Aston Martin
stroll = Driver("Stroll", "Lance", "Aston Martin Aramco Formula One Team", "CAN", 18)
stroll.init_ai_stats(speed=7, racing=7, reaction=7, experience=7,
                     consistency=83, error_rate=8,
                     street_affinity=5, high_speed_affinity=7, wet_affinity=6)

alonso = Driver("Alonso", "Fernando", "Aston Martin Aramco Formula One Team", "ESP", 14)
alonso.init_ai_stats(speed=9, racing=9, reaction=8, experience=10,
                     consistency=88, error_rate=6,
                     street_affinity=6, high_speed_affinity=8, wet_affinity=7)

drivers.extend([stroll, alonso])

# Alpine
gasly = Driver("Gasly", "Pierre", "BWT Alpine F1 Team", "FRA", 10)
gasly.init_ai_stats(speed=8, racing=8, reaction=8, experience=8,
                    consistency=86, error_rate=6,
                    street_affinity=6, high_speed_affinity=8, wet_affinity=7)

colapinto = Driver("Colapinto", "Franco", "BWT Alpine F1 Team", "ARG", 43)
colapinto.init_ai_stats(speed=6, racing=7, reaction=7, experience=6,
                        consistency=82, error_rate=8,
                        street_affinity=5, high_speed_affinity=7, wet_affinity=6)

drivers.extend([gasly, colapinto])

# Audi
hulkenberg = Driver("Hulkenberg", "Nico", "Audi F1 Team (Revolut)", "GER", 27)
hulkenberg.init_ai_stats(speed=8, racing=7, reaction=8, experience=9,
                         consistency=85, error_rate=6,
                         street_affinity=5, high_speed_affinity=8, wet_affinity=7)

bortoleto = Driver("Bortoleto", "Gabriel", "Audi F1 Team (Revolut)", "BRA", 5)
bortoleto.init_ai_stats(speed=6, racing=7, reaction=7, experience=6,
                        consistency=82, error_rate=8,
                        street_affinity=5, high_speed_affinity=7, wet_affinity=6)

drivers.extend([hulkenberg, bortoleto])

# Cadillac
perez = Driver("Pérez", "Sergio", "Cadillac Formula One Team", "MEX", 11)
perez.init_ai_stats(speed=8, racing=8, reaction=8, experience=9,
                    consistency=85, error_rate=6,
                    street_affinity=6, high_speed_affinity=8, wet_affinity=7)

bottas = Driver("Bottas", "Valtteri", "Cadillac Formula One Team", "FIN", 77)
bottas.init_ai_stats(speed=8, racing=8, reaction=7, experience=9,
                     consistency=85, error_rate=6,
                     street_affinity=5, high_speed_affinity=8, wet_affinity=6)

drivers.extend([perez, bottas])

# Haas
ocon = Driver("Ocon", "Esteban", "TGR Hass F1 Team", "FRA", 31)
ocon.init_ai_stats(speed=7, racing=7, reaction=8, experience=8,
                   consistency=83, error_rate=7,
                   street_affinity=5, high_speed_affinity=7, wet_affinity=6)

bearman = Driver("Bearman", "Oliver", "TGR Hass F1 Team", "UK", 87)
bearman.init_ai_stats(speed=5, racing=6, reaction=7, experience=5,
                      consistency=80, error_rate=9,
                      street_affinity=4, high_speed_affinity=6, wet_affinity=5)

drivers.extend([ocon, bearman])

# Williams
sainz = Driver("Sainz", "Carlos", "Atlassian Williams Racing", "ESP", 55)
sainz.init_ai_stats(speed=8, racing=8, reaction=8, experience=8,
                    consistency=85, error_rate=6,
                    street_affinity=6, high_speed_affinity=8, wet_affinity=7)

albon = Driver("Albon", "Alexander", "Atlassian Williams Racing", "THA", 23)
albon.init_ai_stats(speed=7, racing=7, reaction=8, experience=7,
                    consistency=83, error_rate=7,
                    street_affinity=5, high_speed_affinity=7, wet_affinity=6)

drivers.extend([sainz, albon])

# Racing Bulls
lawson = Driver("Lawson", "Liam", "Visa Cash App Racing Bulls F1 Team", "AUS", 30)
lawson.init_ai_stats(speed=6, racing=7, reaction=7, experience=6,
                     consistency=82, error_rate=8,
                     street_affinity=5, high_speed_affinity=7, wet_affinity=6)

lindblad = Driver("Lindblad", "Arvid", "Visa Cash App Racing Bulls F1 Team", "SWE", 41)
lindblad.init_ai_stats(speed=5, racing=6, reaction=7, experience=5,
                       consistency=80, error_rate=9,
                       street_affinity=4, high_speed_affinity=6, wet_affinity=5)

drivers.extend([lawson, lindblad])
