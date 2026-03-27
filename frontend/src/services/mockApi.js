// ============================================================================
// F1 Manager 2026 — Mock API  (demo mode, aucun backend requis)
// Port fidèle de backend/f1/legacy/driver.py et session.py
// ============================================================================

const STATE_KEY = "f1m26_mock";

// ─── Données seed (identiques au backend) ───────────────────────────────────

const SEED_DRIVERS = [
    { id:1,  name:"Charles",     surname:"Leclerc",    team:"Scuderia Ferrari HP",                    country:"Monaco", number:16, speed:9,  racing:9,  reaction:9, experience:8,  consistency:90, error_rate:5, street_circuit_affinity:8, high_speed_circuit_affinity:9,  wet_circuit_affinity:7 },
    { id:2,  name:"Lewis",       surname:"Hamilton",   team:"Scuderia Ferrari HP",                    country:"UK",     number:44, speed:9,  racing:10, reaction:8, experience:10, consistency:88, error_rate:6, street_circuit_affinity:7, high_speed_circuit_affinity:9,  wet_circuit_affinity:8 },
    { id:3,  name:"Max",         surname:"Verstappen", team:"Oracle Red Bull Racing",                 country:"NED",    number:3,  speed:10, racing:10, reaction:9, experience:9,  consistency:92, error_rate:5, street_circuit_affinity:6, high_speed_circuit_affinity:10, wet_circuit_affinity:7 },
    { id:4,  name:"Isack",       surname:"Hadjar",     team:"Oracle Red Bull Racing",                 country:"FRA",    number:6,  speed:7,  racing:8,  reaction:8, experience:7,  consistency:85, error_rate:8, street_circuit_affinity:5, high_speed_circuit_affinity:8,  wet_circuit_affinity:6 },
    { id:5,  name:"George",      surname:"Russell",    team:"Mercedes-AMG Petronas Formula One Team", country:"UK",     number:63, speed:8,  racing:8,  reaction:9, experience:8,  consistency:88, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:9,  wet_circuit_affinity:7 },
    { id:6,  name:"Andrea Kimi", surname:"Antonelli",  team:"Mercedes-AMG Petronas Formula One Team", country:"ITA",    number:12, speed:7,  racing:7,  reaction:8, experience:7,  consistency:84, error_rate:7, street_circuit_affinity:5, high_speed_circuit_affinity:8,  wet_circuit_affinity:6 },
    { id:7,  name:"Lando",       surname:"Norris",     team:"McLaren Mastercard Formula 1 Team",      country:"UK",     number:1,  speed:8,  racing:8,  reaction:9, experience:7,  consistency:87, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:8,  name:"Oscar",       surname:"Piastri",    team:"McLaren Mastercard Formula 1 Team",      country:"AUS",    number:81, speed:7,  racing:7,  reaction:8, experience:6,  consistency:85, error_rate:7, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:9,  name:"Lance",       surname:"Stroll",     team:"Aston Martin Aramco Formula One Team",   country:"CAN",    number:18, speed:7,  racing:7,  reaction:7, experience:7,  consistency:83, error_rate:8, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:10, name:"Fernando",    surname:"Alonso",     team:"Aston Martin Aramco Formula One Team",   country:"ESP",    number:14, speed:9,  racing:9,  reaction:8, experience:10, consistency:88, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:11, name:"Pierre",      surname:"Gasly",      team:"BWT Alpine F1 Team",                     country:"FRA",    number:10, speed:8,  racing:8,  reaction:8, experience:8,  consistency:86, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:12, name:"Franco",      surname:"Colapinto",  team:"BWT Alpine F1 Team",                     country:"ARG",    number:43, speed:6,  racing:7,  reaction:7, experience:6,  consistency:82, error_rate:8, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:13, name:"Nico",        surname:"Hulkenberg", team:"Audi F1 Team (Revolut)",                 country:"GER",    number:27, speed:8,  racing:7,  reaction:8, experience:9,  consistency:85, error_rate:6, street_circuit_affinity:5, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:14, name:"Gabriel",     surname:"Bortoleto",  team:"Audi F1 Team (Revolut)",                 country:"BRA",    number:5,  speed:6,  racing:7,  reaction:7, experience:6,  consistency:82, error_rate:8, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:15, name:"Sergio",      surname:"Pérez",      team:"Cadillac Formula One Team",              country:"MEX",    number:11, speed:8,  racing:8,  reaction:8, experience:9,  consistency:85, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:16, name:"Valtteri",    surname:"Bottas",     team:"Cadillac Formula One Team",              country:"FIN",    number:77, speed:8,  racing:8,  reaction:7, experience:9,  consistency:85, error_rate:6, street_circuit_affinity:5, high_speed_circuit_affinity:8,  wet_circuit_affinity:6 },
    { id:17, name:"Esteban",     surname:"Ocon",       team:"TGR Hass F1 Team",                       country:"FRA",    number:31, speed:7,  racing:7,  reaction:8, experience:8,  consistency:83, error_rate:7, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:18, name:"Oliver",      surname:"Bearman",    team:"TGR Hass F1 Team",                       country:"UK",     number:87, speed:5,  racing:6,  reaction:7, experience:5,  consistency:80, error_rate:9, street_circuit_affinity:4, high_speed_circuit_affinity:6,  wet_circuit_affinity:5 },
    { id:19, name:"Carlos",      surname:"Sainz",      team:"Atlassian Williams Racing",              country:"ESP",    number:55, speed:8,  racing:8,  reaction:8, experience:8,  consistency:85, error_rate:6, street_circuit_affinity:6, high_speed_circuit_affinity:8,  wet_circuit_affinity:7 },
    { id:20, name:"Alexander",   surname:"Albon",      team:"Atlassian Williams Racing",              country:"THA",    number:23, speed:7,  racing:7,  reaction:8, experience:7,  consistency:83, error_rate:7, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:21, name:"Liam",        surname:"Lawson",     team:"Visa Cash App Racing Bulls F1 Team",     country:"AUS",    number:30, speed:6,  racing:7,  reaction:7, experience:6,  consistency:82, error_rate:8, street_circuit_affinity:5, high_speed_circuit_affinity:7,  wet_circuit_affinity:6 },
    { id:22, name:"Arvid",       surname:"Lindblad",   team:"Visa Cash App Racing Bulls F1 Team",     country:"SWE",    number:41, speed:5,  racing:6,  reaction:7, experience:5,  consistency:80, error_rate:9, street_circuit_affinity:4, high_speed_circuit_affinity:6,  wet_circuit_affinity:5 },
];

const GP_LIST = [
    { name:"Australian GP",    circuit:"Albert Park",                     date:"2026-03-08", sprint:false, type:"street"     },
    { name:"Chinese GP",       circuit:"Shanghai International Circuit",  date:"2026-03-15", sprint:true,  type:"high_speed" },
    { name:"Japanese GP",      circuit:"Suzuka Circuit",                  date:"2026-03-29", sprint:false, type:"high_speed" },
    { name:"Bahrain GP",       circuit:"Bahrain International Circuit",   date:"2026-04-12", sprint:false, type:"high_speed" },
    { name:"Jeddah GP",        circuit:"Jeddah Corniche Circuit",         date:"2026-04-19", sprint:false, type:"street"     },
    { name:"Miami GP",         circuit:"Miami International Autodrome",   date:"2026-05-03", sprint:true,  type:"street"     },
    { name:"Canadian GP",      circuit:"Circuit Gilles Villeneuve",       date:"2026-05-24", sprint:true,  type:"high_speed" },
    { name:"Monaco GP",        circuit:"Circuit de Monaco",               date:"2026-06-07", sprint:false, type:"street"     },
    { name:"Barcelona GP",     circuit:"Circuit de Barcelona-Catalunya",  date:"2026-06-14", sprint:false, type:"high_speed" },
    { name:"Austrian GP",      circuit:"Red Bull Ring",                   date:"2026-06-28", sprint:false, type:"high_speed" },
    { name:"British GP",       circuit:"Silverstone Circuit",             date:"2026-07-05", sprint:true,  type:"high_speed" },
    { name:"Belgian GP",       circuit:"Circuit de Spa-Francorchamps",    date:"2026-07-19", sprint:false, type:"high_speed" },
    { name:"Hungarian GP",     circuit:"Hungaroring",                     date:"2026-07-26", sprint:false, type:"high_speed" },
    { name:"Dutch GP",         circuit:"Circuit Zandvoort",               date:"2026-08-23", sprint:true,  type:"high_speed" },
    { name:"Italian GP",       circuit:"Monza Circuit",                   date:"2026-09-06", sprint:false, type:"high_speed" },
    { name:"Spanish GP",       circuit:"Madring Circuit",                 date:"2026-09-13", sprint:false, type:"high_speed" },
    { name:"Azerbaijan GP",    circuit:"Baku City Circuit",               date:"2026-09-26", sprint:false, type:"street"     },
    { name:"Singapore GP",     circuit:"Marina Bay Street Circuit",       date:"2026-10-11", sprint:true,  type:"street"     },
    { name:"United States GP", circuit:"Circuit of the Americas",         date:"2026-10-25", sprint:false, type:"high_speed" },
    { name:"Mexico GP",        circuit:"Autódromo Hermanos Rodríguez",    date:"2026-11-01", sprint:false, type:"high_speed" },
    { name:"Brazilian GP",     circuit:"Interlagos Circuit",              date:"2026-11-08", sprint:false, type:"high_speed" },
    { name:"Las Vegas GP",     circuit:"Las Vegas Street Circuit",        date:"2026-11-21", sprint:false, type:"street"     },
    { name:"Qatar GP",         circuit:"Losail International Circuit",    date:"2026-11-29", sprint:false, type:"high_speed" },
    { name:"Abu Dhabi GP",     circuit:"Yas Marina Circuit",              date:"2026-12-06", sprint:false, type:"high_speed" },
];

function buildCalendar() {
    const sessions = [];
    let idx = 0;
    for (const gp of GP_LIST) {
        if (gp.sprint) {
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "FP", circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "QS", circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "S",  circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "QC", circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "GP", circuit_type: gp.type, is_simulated: false });
        } else {
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "FP", circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "QC", circuit_type: gp.type, is_simulated: false });
            sessions.push({ index: idx++, gp_name: gp.name, circuit_name: gp.circuit, date: gp.date, session_type: "GP", circuit_type: gp.type, is_simulated: false });
        }
    }
    return sessions;
}

// ─── État persistant (localStorage) ─────────────────────────────────────────

function initState() {
    return {
        drivers: SEED_DRIVERS.map((d) => ({ ...d, points: 0, wins: 0, podiums: 0, pole_positions: 0, fastest_laps: 0 })),
        sessions: buildCalendar(),
        user: { username: "DémoUser", avatar_key: "verstappen" },
        season: 2026,
        budget: 10_000_000,
    };
}

let _state = null;

function getState() {
    if (_state) return _state;
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (raw) _state = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!_state) _state = initState();
    return _state;
}

function saveState(s) {
    _state = s;
    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

// ─── Helpers simulation ──────────────────────────────────────────────────────

function rand(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function clamp(v) { return Math.max(0, Math.min(100, Math.round(Number(v) || 0))); }

function affinityBonus(circuitType, d) {
    if (circuitType === "street")     return d.street_circuit_affinity || 0;
    if (circuitType === "high_speed") return d.high_speed_circuit_affinity || 0;
    if (circuitType === "wet")        return d.wet_circuit_affinity || 0;
    return 0;
}

// Simule une session — mute les drivers en place, retourne le tableau résultats
function simulateSession(session, drivers) {
    const { session_type: type, circuit_type: ct } = session;

    if (type === "FP") {
        return drivers.map((d) => {
            const boost = rand(1, 5) + affinityBonus(ct, d);
            d.speed      = clamp(d.speed      + boost);
            d.racing     = clamp(d.racing     + boost);
            d.reaction   = clamp(d.reaction   + boost);
            d.experience = clamp(d.experience + Math.floor(boost / 2));
            return { ...d, points_gained: 0, stats_gained: boost };
        });
    }

    if (type === "QC" || type === "QS") {
        const qualified = drivers.map((d) => {
            let boost = rand(3, 10);
            if (Math.random() * 100 < (d.error_rate || 0)) boost = Math.max(0, boost - 5);
            d.speed    = clamp(d.speed    + boost);
            d.reaction = clamp(d.reaction + boost);
            return { ...d, points_gained: 0, stats_gained: boost };
        }).sort((a, b) => b.stats_gained - a.stats_gained);
        // Pole position for P1
        if (qualified[0]) qualified[0].pole_positions = (qualified[0].pole_positions || 0) + 1;
        return qualified;
    }

    if (type === "S") {
        const PTS = [10,9,8,7,6,5,4,3,2,1];
        const sorted = [...drivers].sort(() => Math.random() - 0.5);
        return sorted.map((d, i) => {
            const boost  = rand(5, 12);
            const points = PTS[i] ?? 0;
            d.points  = (d.points  || 0) + points;
            d.wins    = (d.wins    || 0) + (i === 0 ? 1 : 0);
            d.podiums = (d.podiums || 0) + (i < 3  ? 1 : 0);
            d.speed   = clamp(d.speed  + boost);
            d.racing  = clamp(d.racing + boost);
            return { ...d, points_gained: points, stats_gained: boost, position: i + 1 };
        });
    }

    // GP (default)
    const PTS = [25,18,15,12,10,8,6,4,2,1];
    const sorted = [...drivers].sort(() => Math.random() - 0.5);
    return sorted.map((d, i) => {
        const boost  = rand(5, 20);
        const points = PTS[i] ?? 0;
        d.points   = (d.points   || 0) + points;
        d.wins     = (d.wins     || 0) + (i === 0 ? 1 : 0);
        d.podiums  = (d.podiums  || 0) + (i < 3  ? 1 : 0);
        d.speed    = clamp(d.speed    + boost);
        d.racing   = clamp(d.racing   + boost);
        d.reaction = clamp(d.reaction + boost);
        return { ...d, points_gained: points, stats_gained: boost, position: i + 1 };
    });
}

// ─── Handlers (même interface que l'API réelle) ──────────────────────────────

export function mockLogin(username) {
    const s = getState();
    s.user.username = username || "DémoUser";
    saveState(s);
    return { access: "demo-token", refresh: "demo-refresh", username: s.user.username, avatar_key: s.user.avatar_key, avatar_url: null };
}

export function mockRegister(username, _password, avatar_key) {
    const s = getState();
    s.user = { username: username || "DémoUser", avatar_key: avatar_key || "verstappen" };
    saveState(s);
    return { access: "demo-token", refresh: "demo-refresh", username: s.user.username, avatar_key: s.user.avatar_key, avatar_url: null };
}

export function mockSetAvatar(avatar_key) {
    const s = getState();
    s.user.avatar_key = avatar_key;
    saveState(s);
    return { avatar_key };
}

export function mockTeams() {
    const drivers = getState().drivers;
    const seen = new Map();
    let id = 1;
    for (const d of drivers) {
        if (!seen.has(d.team)) seen.set(d.team, id++);
    }
    return [...seen.entries()].map(([name, teamId]) => ({ id: teamId, name, logo_url: null }));
}

export function mockDrivers() {
    const s = getState();
    return [...s.drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
}

export function mockCalendar() {
    return getState().sessions;
}

export function mockSimulate(index, force = false) {
    const s = getState();
    const session = s.sessions.find((sess) => sess.index === index);
    if (!session) throw Object.assign(new Error(`Session ${index} introuvable`), { status: 404 });
    if (session.is_simulated && !force) throw Object.assign(new Error(`Session ${index} déjà simulée`), { status: 400 });

    const results = simulateSession(session, s.drivers);
    session.is_simulated = true;
    saveState(s);
    return { results };
}

export function mockResetSeason() {
    const s = getState();
    s.sessions = buildCalendar();
    s.drivers  = SEED_DRIVERS.map((d) => ({ ...d, points: 0, wins: 0, podiums: 0, pole_positions: 0, fastest_laps: 0 }));
    s.season   = (s.season || 2026) + 1;
    s.budget   = 10_000_000;
    saveState(s);
    return { season: s.season };
}

export function mockGetBudget() {
    return { budget: getState().budget || 0 };
}

export function mockAwardBudget(amount) {
    const s = getState();
    s.budget = (s.budget || 0) + Math.max(0, Number(amount) || 0);
    saveState(s);
    return { budget: s.budget };
}

const TRAINING_COST = {
    speed: 5_000_000,
    racing: 5_000_000,
    reaction: 5_000_000,
    consistency: 3_000_000,
    experience: 3_000_000,
};

export function mockTrain(driverId, stat) {
    const cost = TRAINING_COST[stat];
    if (!cost) throw Object.assign(new Error("Stat invalide"), { status: 400 });

    const s = getState();
    if ((s.budget || 0) < cost) throw Object.assign(new Error("Budget insuffisant"), { status: 400 });

    const driver = s.drivers.find((d) => d.id === driverId);
    if (!driver) throw Object.assign(new Error("Pilote introuvable"), { status: 404 });

    s.budget -= cost;
    driver[stat] = Math.min(100, (driver[stat] || 0) + 2);
    saveState(s);
    return { budget: s.budget, driver: { ...driver } };
}

// ─── Dispatcher principal ────────────────────────────────────────────────────

export function mockDispatch(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    let body = {};
    try {
        if (typeof options.body === "string") body = JSON.parse(options.body);
    } catch { /* ignore */ }

    // Auth
    if (method === "POST" && path === "/api/auth/login/")    return Promise.resolve(mockLogin(body.username));
    if (method === "POST" && path === "/api/auth/register/") return Promise.resolve(mockRegister(body.username, body.password, body.avatar_key));
    if (method === "POST" && path === "/api/auth/avatar/")   return Promise.resolve(mockSetAvatar(body.avatar_key));

    // Data
    if (method === "GET" && path === "/api/teams/")           return Promise.resolve(mockTeams());
    if (method === "GET" && path === "/api/drivers/")         return Promise.resolve(mockDrivers());
    if (method === "GET" && path === "/api/season/calendar/") return Promise.resolve(mockCalendar());

    // Saison
    if (method === "POST" && path === "/api/season/reset/") return Promise.resolve(mockResetSeason());
    if (method === "GET"  && path === "/api/season/budget/")        return Promise.resolve(mockGetBudget());
    if (method === "POST" && path === "/api/season/budget/award/")  return Promise.resolve(mockAwardBudget(body.amount));
    if (method === "POST" && path === "/api/season/train/") {
        try { return Promise.resolve(mockTrain(body.driver_id, body.stat)); }
        catch (e) { return Promise.reject(e); }
    }

    // Simulation : /api/simulate/session/42/?force=1
    const simMatch = path.match(/^\/api\/simulate\/session\/(\d+)\//);
    if (simMatch && method === "POST") {
        const idx   = parseInt(simMatch[1]);
        const force = path.includes("force=1");
        try {
            return Promise.resolve(mockSimulate(idx, force));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    console.warn("[mock] unhandled:", method, path);
    return Promise.resolve(null);
}
