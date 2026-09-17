import { seededRandom, clamp } from "three/src/math/MathUtils.js";

export const TYRES = {
    soft: { code: "S", label: "Tendres", color: "#ff505a", pace: -1.35, wear: 12, life: "4–6 tours" },
    medium: { code: "M", label: "Mediums", color: "#f1cf47", pace: 0, wear: 8.5, life: "7–9 tours" },
    hard: { code: "H", label: "Durs", color: "#e5e8ed", pace: 0.85, wear: 5.5, life: "10–12 tours" },
    intermediate: { code: "I", label: "Intermédiaires", color: "#4bc789", pace: 0, wear: 6, life: "Piste humide" },
};

export const PACES = {
    attack: { label: "Attaquer", time: -1.45, wear: 1.5, risk: 0.065, detail: "Plus rapide · usure et risque élevés" },
    balanced: { label: "Équilibré", time: 0, wear: 1, risk: 0.025, detail: "Rythme et usure modérés" },
    conserve: { label: "Préserver", time: 0.9, wear: 0.66, risk: 0.007, detail: "Moins d'usure · rythme réduit" },
};

export const PIT_COST = 90_000;
export const ALLOWED_LAPS = [8, 10, 12];

const round = (n) => Math.round(n * 1000) / 1000;
function random(race) { return seededRandom(race.seed++); }
function message(race, type, text) {
    race.messages.unshift({ id: `${race.id}-${race.lap}-${race.messages.length}-${race.seed}`, lap: race.lap, type, text });
    race.messages = race.messages.slice(0, 24);
}

export function weatherAt(race, lap) {
    if (race.weatherPlan !== "shower" || lap < race.rainLap) return 0;
    const age = lap - race.rainLap;
    return age < 3 ? Math.min(78, (age + 1) * 28) : Math.max(0, 78 - (age - 2) * 24);
}

export function createLiveRace({ session, season, drivers, playerId, grid, ratings, upgrades, totalLaps = 10, tyre = "medium", seed = 1 }) {
    if (!ALLOWED_LAPS.includes(totalLaps)) throw new Error("Choisis une course de 8, 10 ou 12 tours.");
    if (!TYRES[tyre]) throw new Error("Pneus inconnus.");
    if (!drivers.some((driver) => driver.id === playerId)) throw new Error("Pilote introuvable.");
    const ordered = [...drivers].sort((a, b) => grid.indexOf(a.id) - grid.indexOf(b.id));
    const race = {
        id: `${season}-${session.index}-${seed}`, session: { ...session, results: undefined }, season,
        totalLaps, lap: 0, status: "racing", playerId, seed, wetness: 0,
        weatherPlan: "dry", rainLap: Math.max(3, Math.floor(totalLaps * 0.4)),
        safetyCar: 0, spent: 0, command: { pace: "balanced", pit: null },
        messages: [], history: [], settlement: null,
        cars: ordered.map((driver, i) => ({
            ...driver, position: i + 1, gridPosition: i + 1, totalTime: i * 0.55, lapTime: 0,
            paceRating: ratings[driver.id] ?? 100, upgrades: upgrades[driver.team] ?? {},
            tyre: driver.id === playerId ? tyre : ["medium", "hard", "soft"][i % 3],
            wear: 0, damage: 0, pitStops: 0, lastPit: false, bestLap: null,
        })),
    };
    race.weatherPlan = random(race) < 0.48 ? "shower" : "dry";
    message(race, "engineer", "Radio check. La grille est prête. À toi de choisir le rythme.");
    if (race.weatherPlan === "shower") message(race, "weather", `Une averse est attendue autour du tour ${race.rainLap}. On surveille le radar.`);
    return race;
}

export function setRaceCommand(race, command, budget) {
    if (race.status !== "racing") throw new Error("Cette course est terminée.");
    const next = { ...race, command: { ...race.command } };
    if (command.pace !== undefined) {
        if (!PACES[command.pace]) throw new Error("Rythme inconnu.");
        next.command.pace = command.pace;
    }
    if (command.pit !== undefined) {
        if (command.pit !== null && !TYRES[command.pit]) throw new Error("Pneus inconnus.");
        if (command.pit !== null && budget < PIT_COST) throw new Error("Budget insuffisant pour cet arrêt.");
        if (command.pit !== null && race.lap >= race.totalLaps - 1) throw new Error("Dernier tour : les stands sont fermés.");
        next.command.pit = command.pit;
    }
    return next;
}

export function advanceLiveRace(previous, availableBudget) {
    if (previous.status === "finished") return previous;
    const race = structuredClone(previous);
    race.lap++;
    race.wetness = weatherAt(race, race.lap);
    const neutralized = race.safetyCar > 0;
    race.safetyCar = Math.max(0, race.safetyCar - 1);
    const meanRating = race.cars.reduce((sum, car) => sum + car.paceRating, 0) / race.cars.length;
    const oldPlayer = race.cars.find((car) => car.id === race.playerId);
    const previousPosition = oldPlayer.position;
    let newSafetyCar = false;

    for (const car of race.cars) {
        const isPlayer = car.id === race.playerId;
        const paceKey = isPlayer ? race.command.pace : car.wear > 64 ? "conserve" : random(race) < 0.22 ? "attack" : "balanced";
        const pace = PACES[paceKey];
        car.lastPit = false;
        let pitTyre = isPlayer ? race.command.pit : null;
        if (!isPlayer && race.lap < race.totalLaps) {
            if (race.wetness >= 40 && car.tyre !== "intermediate") pitTyre = "intermediate";
            else if (race.wetness < 25 && car.tyre === "intermediate") pitTyre = "medium";
            else if (car.wear > 65 && race.totalLaps - race.lap > 1) pitTyre = race.totalLaps - race.lap <= 4 ? "soft" : "medium";
        }
        let pitLoss = 0;
        if (pitTyre && (!isPlayer || availableBudget >= PIT_COST)) {
            car.tyre = pitTyre;
            car.wear = 0;
            car.pitStops++;
            car.lastPit = true;
            pitLoss = (neutralized ? 8 : 14) + random(race) * 1.5 - Math.min(1.5, (car.upgrades.race_ops ?? 1) * 0.2);
            if (isPlayer) {
                race.spent += PIT_COST;
                message(race, "pit", `Arrêt effectué en ${pitLoss.toFixed(1)} s. Pneus ${TYRES[pitTyre].label.toLowerCase()} montés. Reprends ton rythme.`);
            }
        } else if (isPlayer && pitTyre) {
            message(race, "pit", "Arrêt annulé : le budget disponible est insuffisant.");
        }
        const compound = TYRES[car.tyre];
        const mismatch = car.tyre === "intermediate" ? Math.max(0, 32 - race.wetness) * 0.14 : Math.max(0, race.wetness - 25) * 0.19;
        const degradation = Math.pow(Math.max(0, car.wear - 35) / 22, 2);
        const wetSkill = (car.wet_circuit_affinity ?? 5) * race.wetness * 0.003;
        let lapTime = 84 - (car.paceRating - meanRating) * 0.035 + compound.pace + pace.time + degradation + mismatch + car.damage * 0.028 - wetSkill;
        lapTime += (random(race) - 0.5) * (2.5 - Math.min(1.8, (car.consistency ?? 80) / 60));

        const reliability = car.upgrades.reliability ?? 1;
        const risk = pace.risk * (0.65 + (car.error_rate ?? 5) / 10) * (1 + mismatch / 5) / (0.9 + reliability * 0.1);
        if (!neutralized && random(race) < risk) {
            const lost = 2 + random(race) * 5;
            lapTime += lost;
            car.damage = Math.min(45, car.damage + 3 + Math.round(random(race) * 8));
            if (isPlayer) message(race, "warning", `Petite sortie de piste : ${lost.toFixed(1)} s perdues. La voiture roule, mais la carrosserie est touchée.`);
            if (!isPlayer && lost > 6.4 && race.lap < race.totalLaps - 1) newSafetyCar = true;
        }
        if (neutralized) lapTime = 100 + (lapTime - 84) * 0.15;
        const wearRate = car.tyre === "intermediate" && race.wetness < 30 ? 13 : compound.wear;
        car.wear = round(clamp(car.wear + wearRate * pace.wear * (neutralized ? 0.45 : 1), 0, 100));
        car.lapTime = round(Math.max(65, lapTime) + pitLoss);
        car.totalTime = round(car.totalTime + car.lapTime);
        if (!car.lastPit && !neutralized) car.bestLap = Math.min(car.bestLap ?? Infinity, car.lapTime);
    }
    race.command.pit = null;
    if (neutralized) {
        // Preserve track order under safety car; pitting cars can still lose places.
        let precedingTime = -Infinity;
        for (const car of race.cars) {
            if (car.lastPit) continue;
            const heldTime = Math.max(car.totalTime, precedingTime + 0.15);
            car.lapTime = round(car.lapTime + heldTime - car.totalTime);
            car.totalTime = round(heldTime);
            precedingTime = car.totalTime;
        }
    }
    race.cars.sort((a, b) => a.totalTime - b.totalTime || a.gridPosition - b.gridPosition);
    race.cars.forEach((car, i) => { car.position = i + 1; });
    const player = race.cars.find((car) => car.id === race.playerId);
    if (player.position < previousPosition) message(race, "overtake", `P${player.position} ! ${previousPosition - player.position} place(s) gagnée(s) ce tour.`);
    else if (player.position > previousPosition && !player.lastPit) message(race, "engineer", `P${player.position}. On a perdu ${player.position - previousPosition} place(s), la course continue.`);
    if (player.wear > 65 && previous.cars.find((car) => car.id === player.id).wear <= 65) message(race, "tyres", "Les pneus commencent à décrocher. Préserve-les ou prépare un arrêt.");
    if (race.wetness >= 28 && previous.wetness < 28) message(race, "weather", "La pluie arrive. Surveille l'humidité avant de passer les intermédiaires.");
    if (race.wetness >= 40 && player.tyre !== "intermediate") message(race, "weather", "La piste est mouillée. Les intermédiaires sont maintenant plus rapides.");
    if (race.wetness < 25 && previous.wetness >= 25) message(race, "weather", "La trajectoire sèche. Les pneus slicks redeviennent intéressants.");
    if (newSafetyCar && !neutralized) {
        race.safetyCar = 2;
        message(race, "safety", "Voiture de sécurité ! Débris en piste. Les deux prochains tours sont neutralisés, un arrêt coûtera moins de temps.");
    } else if (neutralized && race.safetyCar === 0) message(race, "engineer", "La voiture de sécurité rentre. Reprise de la course au prochain tour.");
    race.history.push({ lap: race.lap, position: player.position, lapTime: player.lapTime, tyre: player.tyre, wear: player.wear, pit: player.lastPit, wetness: race.wetness });
    if (race.lap >= race.totalLaps) {
        race.status = "finished";
        message(race, "finish", `Drapeau à damier ! P${player.position} pour ${player.surname}. ${race.cars[0].surname} remporte la course.`);
    }
    return race;
}
