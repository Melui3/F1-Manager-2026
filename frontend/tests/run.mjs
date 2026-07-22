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

const tests = [
    testSessionScoping,
    testSessionExportImport,
    testSimulationResultsKeepCountry,
    testDriverMarketSwap,
    testBudgetEconomyStaysScarce,
    testOldEconomyBudgetIsMigrated,
    testFullSeasonResetClearsEconomyAndProgression,
];

for (const test of tests) {
    test();
    console.log(`ok - ${test.name}`);
}

console.log(`${tests.length} tests passed`);
