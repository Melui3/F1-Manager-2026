export function getSeasonRounds(calendar = [], liveRace = null) {
    const grouped = new Map();
    for (const session of [...calendar].sort((a, b) => a.index - b.index)) {
        if (!grouped.has(session.gp_name)) grouped.set(session.gp_name, []);
        grouped.get(session.gp_name).push(session);
    }
    const rounds = [...grouped.entries()].map(([name, sessions], index) => ({
        name, number: index + 1, sessions, date: sessions[0].date,
        circuit: sessions[0].circuit_name, type: sessions[0].circuit_type,
        sprint: sessions.some((item) => item.session_type === "S"),
        done: sessions.filter((item) => ["GP", "S"].includes(item.session_type)).every((item) => item.is_simulated),
    }));
    const nextRace = liveRace?.status === "racing" ? liveRace.session : [...calendar].sort((a, b) => a.index - b.index).find((item) => !item.is_simulated && ["GP", "S"].includes(item.session_type));
    const current = rounds.find((round) => round.name === nextRace?.gp_name) ?? null;
    return { rounds, nextRace, current, completed: rounds.filter((round) => round.done), upcoming: rounds.filter((round) => !round.done && round !== current) };
}

export const CIRCUIT_ASSETS = {
    "Australian GP": "australia", "Chinese GP": "china", "Japanese GP": "japan",
    "Bahrain GP": "bahrain", "Jeddah GP": "saudi-arabia", "Miami GP": "miami",
    "Canadian GP": "canada", "Monaco GP": "monaco", "Barcelona GP": "barcelona-catalunya",
    "Austrian GP": "austria", "British GP": "great-britain", "Belgian GP": "belgium",
    "Hungarian GP": "hungary", "Dutch GP": "netherlands", "Italian GP": "italy",
    "Spanish GP": "spain", "Azerbaijan GP": "azerbaijan", "Singapore GP": "singapore",
    "United States GP": "united-states", "Mexico GP": "mexico", "Brazilian GP": "brazil",
    "Las Vegas GP": "las-vegas", "Qatar GP": "qatar", "Abu Dhabi GP": "united-arab-emirates",
};
