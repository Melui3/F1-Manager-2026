import assert from "node:assert/strict";

class MemoryStorage {
    constructor() {
        this.map = new Map();
    }

    getItem(key) {
        const normalized = String(key);
        return this.map.has(normalized) ? this.map.get(normalized) : null;
    }

    setItem(key, value) {
        this.map.set(String(key), String(value));
    }

    removeItem(key) {
        this.map.delete(String(key));
    }

    clear() {
        this.map.clear();
    }
}

globalThis.localStorage = new MemoryStorage();

const sessionStore = await import("../src/services/sessionStore.js");
const mockApi = await import("../src/services/mockApi.js");
const { apiFetch } = await import("../src/services/api.js");
const liveEngine = await import("../src/services/liveRaceEngine.js");
const { getSeasonRounds } = await import("../src/services/seasonCalendar.js");

function resetStorage() {
    globalThis.localStorage.clear();
}

function testSessionScoping() {
    resetStorage();

    const alice = sessionStore.createSessionProfile("Alice", "leclerc");
    const aliceGameKey = sessionStore.getScopedStorageKey("game", alice.id);
    globalThis.localStorage.setItem(aliceGameKey, JSON.stringify({ marker: "alice" }));

    const bob = sessionStore.createSessionProfile("Bob", "verstappen");
    const bobGameKey = sessionStore.getScopedStorageKey("game", bob.id);

    assert.notEqual(alice.id, bob.id);
    assert.notEqual(aliceGameKey, bobGameKey);
    assert.equal(sessionStore.getActiveSessionId(), bob.id);

    sessionStore.activateSessionProfile(alice.id);
    assert.equal(sessionStore.getActiveSessionId(), alice.id);
    assert.equal(JSON.parse(globalThis.localStorage.getItem(aliceGameKey)).marker, "alice");
}

function testSessionExportImport() {
    resetStorage();

    const source = sessionStore.createSessionProfile("Exporter", "hamilton");
    globalThis.localStorage.setItem(
        sessionStore.getScopedStorageKey("game", source.id),
        JSON.stringify({ team: { name: "Scuderia Ferrari HP" }, sim: { season: 2028 } })
    );

    const payload = sessionStore.exportSessionPayload(source.id);
    const imported = sessionStore.importSessionPayload(payload);
    const importedGame = JSON.parse(globalThis.localStorage.getItem(sessionStore.getScopedStorageKey("game", imported.id)));

    assert.equal(payload.app, "F1 Manager 2026");
    assert.notEqual(imported.id, source.id);
    assert.equal(sessionStore.getActiveSessionId(), imported.id);
    assert.equal(importedGame.sim.season, 2028);
}

function testSimulationResultsKeepCountry() {
    resetStorage();
    sessionStore.createSessionProfile("Simulation", "verstappen");
    mockApi.mockResetSeason();

    const gp = mockApi.mockCalendar().find((session) => session.session_type === "GP");
    const result = mockApi.mockSimulate(gp.index);
    const history = mockApi.mockHistory();

    assert.ok(result.results[0].country);
    assert.ok(history[0].results[0].country);
}

function testDriverMarketSwap() {
    resetStorage();
    sessionStore.createSessionProfile("Market", "norris");

    const drivers = mockApi.mockDrivers();
    const leclerc = drivers.find((d) => d.surname === "Leclerc");
    const norris = drivers.find((d) => d.surname === "Norris");
    const leclercTeam = leclerc.team;
    const norrisTeam = norris.team;

    const signed = mockApi.mockSignDriver(norris.id, leclercTeam, leclerc.id);
    const updatedDrivers = mockApi.mockDrivers();
    const updatedNorris = updatedDrivers.find((d) => d.id === norris.id);
    const updatedLeclerc = updatedDrivers.find((d) => d.id === leclerc.id);

    assert.equal(signed.driver.team, leclercTeam);
    assert.equal(signed.replaced.team, norrisTeam);
    assert.equal(updatedNorris.team, leclercTeam);
    assert.equal(updatedLeclerc.team, norrisTeam);
}

function testBudgetEconomyStaysScarce() {
    resetStorage();
    sessionStore.createSessionProfile("Economy", "leclerc");
    mockApi.mockResetSeason();

    const ferrari = "Scuderia Ferrari HP";
    assert.equal(mockApi.mockGetBudget().budget, 4_000_000);
    assert.throws(() => mockApi.mockUpgradeTeam(ferrari, "aero"), /Budget insuffisant/);

    mockApi.mockAwardBudget(5_000_000);
    const upgraded = mockApi.mockUpgradeTeam(ferrari, "aero");
    assert.equal(upgraded.upgrades.aero, 2);
    assert.ok(upgraded.budget < 2_000_000);
    assert.throws(() => mockApi.mockUpgradeTeam(ferrari, "power_unit"), /Budget insuffisant/);
}

function testOldEconomyBudgetIsMigrated() {
    resetStorage();
    const profile = sessionStore.createSessionProfile("Old money", "verstappen");
    globalThis.localStorage.setItem(
        sessionStore.getScopedStorageKey("mock", profile.id),
        JSON.stringify({
            drivers: [],
            sessions: [],
            user: { username: "Old money", avatar_key: "verstappen" },
            season: 2026,
            budget: 267_000_000,
            teamUpgrades: {},
            history: [],
        })
    );

    assert.equal(mockApi.mockGetBudget().budget, 8_000_000);
}

function testFullSeasonResetClearsEconomyAndProgression() {
    resetStorage();
    sessionStore.createSessionProfile("Full reset", "leclerc");
    mockApi.mockResetSeason({ advanceSeason: false, keepSeason: true });

    const ferrari = "Scuderia Ferrari HP";
    const leclercBefore = mockApi.mockDrivers().find((d) => d.surname === "Leclerc");
    const baselineSpeed = leclercBefore.speed;

    mockApi.mockAwardBudget(20_000_000);
    mockApi.mockUpgradeTeam(ferrari, "aero");
    mockApi.mockTrain(leclercBefore.id, "speed");

    const gp = mockApi.mockCalendar().find((session) => session.session_type === "GP");
    mockApi.mockSimulate(gp.index);

    assert.ok(mockApi.mockHistory().length > 0);
    assert.equal(mockApi.mockGetTeamUpgrades(ferrari).upgrades.aero, 2);
    assert.notEqual(mockApi.mockGetBudget().budget, 4_000_000);

    const reset = mockApi.mockResetSeason({ advanceSeason: false, keepSeason: true });
    const leclercAfter = mockApi.mockDrivers().find((d) => d.surname === "Leclerc");

    assert.equal(reset.season, 2026);
    assert.equal(mockApi.mockGetBudget().budget, 4_000_000);
    assert.equal(mockApi.mockGetTeamUpgrades(ferrari).upgrades.aero, 1);
    assert.equal(mockApi.mockHistory().length, 0);
    assert.equal(leclercAfter.points, 0);
    assert.equal(leclercAfter.speed, baselineSpeed);
    assert.ok(mockApi.mockCalendar().every((session) => !session.is_simulated && !session.results));
}

function freshLiveRace(name = "Live race") {
    resetStorage();
    sessionStore.createSessionProfile(name, "leclerc");
    const driver = mockApi.mockDrivers().find((item) => item.surname === "Leclerc");
    const session = mockApi.mockCalendar().find((item) => item.session_type === "GP");
    return mockApi.mockStartLiveRace({ session_index: session.index, player_id: driver.id, total_laps: 8, tyre: "medium" });
}

function testLiveRaceUsesQualifyingAndResumes() {
    const { race } = freshLiveRace();
    const qualifying = mockApi.mockCalendar().find((session) => session.session_type === "QC");
    assert.ok(qualifying.is_simulated);
    assert.deepEqual(race.cars.map((car) => car.id), qualifying.results.map((row) => row.id));
    const advanced = mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 0 });
    assert.equal(advanced.race.lap, 1);
    assert.equal(mockApi.mockLiveRace().race.lap, 1);
    assert.equal(mockApi.mockStartLiveRace({}).race.id, race.id);
    assert.throws(() => mockApi.mockSimulate(race.session.index), /GP est en cours/);
    assert.throws(() => mockApi.mockTrain(race.playerId, "speed"), /GP est en cours/);
}

function testLiveRaceCommandsAndTyreTradeoff() {
    const { race, budget } = freshLiveRace();
    race.seed = 12345;
    race.weatherPlan = "dry";
    const attack = liveEngine.setRaceCommand(race, { pace: "attack" }, budget);
    const conserve = liveEngine.setRaceCommand(race, { pace: "conserve" }, budget);
    const fast = liveEngine.advanceLiveRace(attack, budget).cars.find((car) => car.id === race.playerId);
    const slow = liveEngine.advanceLiveRace(conserve, budget).cars.find((car) => car.id === race.playerId);
    assert.ok(fast.wear > slow.wear * 2);
    assert.ok(fast.lapTime < slow.lapTime || fast.damage > slow.damage);
    assert.throws(() => liveEngine.setRaceCommand(race, { pace: "cheat" }, budget), /inconnu/);
    assert.throws(() => liveEngine.setRaceCommand(race, { pit: "soft" }, 0), /Budget insuffisant/);
    assert.throws(() => liveEngine.setRaceCommand(race, { pit: "unknown" }, budget), /inconnus/);
}

function testLiveRacePitBudgetAndDuplicateRequests() {
    let { race, budget } = freshLiveRace();
    mockApi.mockCommandLiveRace({ race_id: race.id, command: { pit: "hard" } });
    let snapshot = mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 0 });
    const player = snapshot.race.cars.find((car) => car.id === race.playerId);
    assert.equal(player.tyre, "hard");
    assert.equal(player.pitStops, 1);
    assert.equal(snapshot.budget, budget - liveEngine.PIT_COST);
    snapshot = mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 0 });
    assert.equal(snapshot.race.lap, 1);
    assert.equal(snapshot.budget, budget - liveEngine.PIT_COST);
    assert.throws(() => mockApi.mockAdvanceLiveRace({ race_id: "other", expected_lap: 1 }), /plus active/);
    assert.throws(() => mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 8 }), /Tour invalide/);
    mockApi.mockCommandLiveRace({ race_id: race.id, command: { pit: "soft" } });
    mockApi.mockCommandLiveRace({ race_id: race.id, command: { pit: null } });
    snapshot = mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 1 });
    assert.equal(snapshot.race.cars.find((car) => car.id === race.playerId).pitStops, 1);
}

function testLiveRaceSettlementIsAtomicAndIdempotent() {
    let { race } = freshLiveRace();
    for (let lap = 0; lap < 8; lap++) race = mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: lap }).race;
    assert.equal(race.status, "finished");
    assert.equal(race.results.reduce((sum, item) => sum + item.points_gained, 0), 101);
    assert.equal(new Set(race.results.map((item) => item.position)).size, 22);
    assert.equal(mockApi.mockCalendar().find((session) => session.index === race.session.index).is_simulated, true);
    assert.equal(mockApi.mockHistory()[0].mode, "live");
    assert.equal(mockApi.mockHistory()[0].results[0].country, race.cars[0].country);
    const budget = mockApi.mockGetBudget().budget;
    const points = mockApi.mockDrivers().map((driver) => driver.points);
    mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 7 });
    assert.equal(mockApi.mockGetBudget().budget, budget);
    assert.deepEqual(mockApi.mockDrivers().map((driver) => driver.points), points);
    assert.throws(() => mockApi.mockSimulate(race.session.index, true), /définitif/);
    assert.throws(() => mockApi.mockStartLiveRace({ session_index: race.session.index, player_id: race.playerId }), /plus la prochaine/);
}

function testLiveRaceIsScopedAndResettable() {
    const { race } = freshLiveRace("Live Alice");
    const aliceId = sessionStore.getActiveSessionId();
    const bob = sessionStore.createSessionProfile("Live Bob", "hamilton");
    assert.equal(mockApi.mockLiveRace().race, null);
    sessionStore.activateSessionProfile(aliceId);
    assert.equal(mockApi.mockLiveRace().race.id, race.id);
    const exported = sessionStore.exportSessionPayload(aliceId);
    const imported = sessionStore.importSessionPayload(exported);
    assert.notEqual(imported.id, aliceId);
    assert.equal(mockApi.mockLiveRace().race.id, race.id);
    mockApi.mockResetSeason({ advanceSeason: false });
    assert.equal(mockApi.mockLiveRace().race, null);
    sessionStore.activateSessionProfile(aliceId);
    assert.equal(mockApi.mockLiveRace().race.id, race.id);
    sessionStore.activateSessionProfile(bob.id);
    assert.equal(mockApi.mockLiveRace().race, null);
}

function testLiveRaceStorageFailureDoesNotConsumeLap() {
    const { race } = freshLiveRace();
    const original = localStorage.setItem;
    localStorage.setItem = () => { throw new Error("Quota exceeded"); };
    assert.throws(() => mockApi.mockAdvanceLiveRace({ race_id: race.id, expected_lap: 0 }), /Sauvegarde impossible/);
    localStorage.setItem = original;
    assert.equal(mockApi.mockLiveRace().race.lap, 0);
    assert.equal(mockApi.mockGetBudget().budget, 4_000_000);
}

function testLiveRaceWetTyresAndDeterminism() {
    const { race, budget } = freshLiveRace();
    race.seed = 12345;
    race.weatherPlan = "shower";
    race.rainLap = 1;
    race.lap = 2;
    const player = race.cars.find((car) => car.id === race.playerId);
    const dry = structuredClone(race);
    player.tyre = "intermediate";
    const wetResult = liveEngine.advanceLiveRace(race, budget);
    const dryResult = liveEngine.advanceLiveRace(dry, budget);
    assert.ok(wetResult.cars.find((car) => car.id === player.id).lapTime < dryResult.cars.find((car) => car.id === player.id).lapTime);
    assert.deepEqual(liveEngine.advanceLiveRace(race, budget), wetResult);
}

function testSafetyCarPreservesTrackOrder() {
    const { race, budget } = freshLiveRace();
    race.safetyCar = 2;
    race.weatherPlan = "dry";
    race.cars.forEach((car, index) => {
        car.totalTime = index * 0.001;
        car.paceRating = index * 300;
        car.tyre = "medium";
    });
    const neutralized = liveEngine.advanceLiveRace(race, budget);
    assert.deepEqual(neutralized.cars.map((car) => car.id), race.cars.map((car) => car.id));
    assert.ok(neutralized.cars.every((car, index, cars) => !index || car.totalTime > cars[index - 1].totalTime));
    race.command.pit = "hard";
    const pitted = liveEngine.advanceLiveRace(race, budget);
    assert.deepEqual(pitted.cars.filter((car) => !car.lastPit).map((car) => car.id), race.cars.filter((car) => car.id !== race.playerId).map((car) => car.id));
    assert.equal(pitted.spent, liveEngine.PIT_COST);
}

function testCalendarRoundProgressionAndSprint() {
    freshLiveRace();
    const calendar = structuredClone(mockApi.mockCalendar());
    let result = getSeasonRounds(calendar);
    assert.equal(result.rounds.length, 24);
    assert.equal(result.current.name, "Australian GP");
    assert.equal(result.completed.length, 0);
    assert.equal(result.upcoming.length, 23);
    for (const session of calendar.filter((item) => item.gp_name === "Australian GP")) session.is_simulated = true;
    result = getSeasonRounds(calendar);
    assert.equal(result.current.name, "Chinese GP");
    assert.equal(result.nextRace.session_type, "S");
    const sprint = result.nextRace;
    sprint.is_simulated = true;
    result = getSeasonRounds(calendar);
    assert.equal(result.current.name, "Chinese GP");
    assert.equal(result.nextRace.session_type, "GP");
    assert.equal(result.completed.length, 1);
    const active = { status: "racing", session: result.nextRace };
    assert.equal(getSeasonRounds(calendar, active).nextRace.index, active.session.index);
    calendar.forEach((session) => { session.is_simulated = true; });
    result = getSeasonRounds(calendar);
    assert.equal(result.current, null);
    assert.equal(result.completed.length, 24);
    assert.equal(result.upcoming.length, 0);
}

async function testLocalApiDoesNotCallServer() {
    resetStorage();
    const profile = sessionStore.createSessionProfile("Sans serveur", "hamilton");
    const key = sessionStore.getScopedStorageKey("user", profile.id);
    const user = JSON.parse(localStorage.getItem(key));
    assert.equal(user.accessToken, undefined);
    assert.equal(user.refreshToken, undefined);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error("Unexpected network request"); };
    try {
        const drivers = await apiFetch("/api/drivers/");
        assert.equal(drivers.length, 22);
        const calendar = await apiFetch("/api/season/calendar/");
        assert.equal(getSeasonRounds(calendar).rounds.length, 24);
        await apiFetch("/api/season/reset/", { method: "POST", body: JSON.stringify({ full: true, keepSeason: true }) });
        assert.equal((await apiFetch("/api/live-race/")).race, null);
    } finally {
        globalThis.fetch = originalFetch;
    }
}

const tests = [
    testLocalApiDoesNotCallServer,
    testSessionScoping,
    testSessionExportImport,
    testSimulationResultsKeepCountry,
    testDriverMarketSwap,
    testBudgetEconomyStaysScarce,
    testOldEconomyBudgetIsMigrated,
    testFullSeasonResetClearsEconomyAndProgression,
    testLiveRaceUsesQualifyingAndResumes,
    testLiveRaceCommandsAndTyreTradeoff,
    testLiveRacePitBudgetAndDuplicateRequests,
    testLiveRaceSettlementIsAtomicAndIdempotent,
    testLiveRaceIsScopedAndResettable,
    testLiveRaceStorageFailureDoesNotConsumeLap,
    testLiveRaceWetTyresAndDeterminism,
    testSafetyCarPreservesTrackOrder,
    testCalendarRoundProgressionAndSprint,
];

for (const test of tests) {
    await test();
    console.log(`ok - ${test.name}`);
}

console.log(`${tests.length} tests passed`);
