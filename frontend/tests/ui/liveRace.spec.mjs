import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";

async function enterRace(page) {
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Ex: Alex, Test Ferrari, Saison agressive").fill("Test Pit Wall");
    await page.getByRole("button", { name: "Creer et commencer" }).click();
    await page.getByRole("button", { name: "Selectionner Ferrari", exact: true }).click();
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click();
    await page.getByRole("button", { name: "Choisir Lewis Hamilton, pilote Scuderia Ferrari HP", exact: true }).click();
    await page.getByRole("button", { name: "Valider ce pilote" }).click();
    await page.getByRole("button", { name: "Simuler", exact: true }).click();
    await expect(page.getByRole("button", { name: "Prendre le départ" })).toBeVisible();
}

async function snapshot(page) {
    return page.evaluate(async () => (await import("/src/services/api.js")).apiFetch("/api/live-race/"));
}

async function step(page, lap) {
    await page.getByRole("button", { name: "Avancer d'un tour", exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).race.lap).toBe(lap);
}

function changedPixels(first, second) {
    const a = PNG.sync.read(first);
    const b = PNG.sync.read(second);
    let changed = 0;
    for (let i = 0; i < a.data.length; i += 4) {
        if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 30) changed++;
    }
    return changed;
}

function trackPixels(buffer) {
    const { data, width, height } = PNG.sync.read(buffer);
    const colors = new Set();
    let green = 0;
    let road = 0;
    for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = data.subarray(i, i + 3);
        if (g > r * 1.1 && g > b) green++;
        if (Math.max(r, g, b) - Math.min(r, g, b) < 30 && r > 35 && r < 180) road++;
        colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
    }
    return { colors: colors.size, green: green / (width * height), road: road / (width * height) };
}

test("mini-GP : commandes, stand, reprise et resultat unique", async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await enterRace(page);
    await page.getByRole("button", { name: "8 tours", exact: true }).click();
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await page.getByRole("button", { name: /Attaquer/ }).click();
    await expect(page.getByRole("button", { name: /Attaquer/ })).toHaveAttribute("aria-pressed", "true");
    await step(page, 1);
    const beforePit = await snapshot(page);
    await page.getByRole("group", { name: "Pneus au prochain arrêt", exact: true }).getByRole("button", { name: /Durs/ }).click();
    await page.getByRole("button", { name: "Rentrer aux stands ce tour" }).click();
    await expect(page.getByText("BOX ce tour · Durs", { exact: true })).toBeVisible();
    await step(page, 2);
    const afterPit = await snapshot(page);
    expect(afterPit.budget).toBe(beforePit.budget - 90_000);
    expect(afterPit.race.cars.find((car) => car.id === afterPit.race.playerId).pitStops).toBe(1);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Reprendre la course", exact: true })).toBeVisible();
    expect((await snapshot(page)).race.lap).toBe(2);
    for (let lap = 3; lap <= 8; lap++) await step(page, lap);
    await expect(page.locator(".race-winner-banner")).toBeVisible();
    await expect(page.locator(".race-finish")).toBeVisible();
    const finished = await snapshot(page);
    expect(finished.race.results.reduce((sum, row) => sum + row.points_gained, 0)).toBe(101);
    expect(finished.race.history).toHaveLength(8);
    await page.screenshot({ path: testInfo.outputPath("race-finish-desktop.png"), fullPage: true });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".race-finish")).toBeVisible();
    expect((await snapshot(page)).budget).toBe(finished.budget);
    await page.getByRole("button", { name: "Course suivante", exact: true }).click();
    await expect(page.getByRole("button", { name: "Prendre le départ" })).toBeVisible();
    expect(errors).toEqual([]);
});

test("piste 3D : rendu, mouvement, pause et camera embarquee", async ({ page }, testInfo) => {
    await enterRace(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const canvas = page.locator('.live-track-canvas[data-rendered="true"] canvas');
    await expect(canvas).toBeVisible();
    const stats = trackPixels(await canvas.screenshot());
    expect(stats.colors).toBeGreaterThan(50);
    expect(stats.green).toBeGreaterThan(0.15);
    expect(stats.road).toBeGreaterThan(0.03);
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await expect(page.getByRole("status", { name: "Départ imminent" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mettre la course en pause", exact: true })).toBeEnabled({ timeout: 8000 });
    const first = await canvas.screenshot();
    await page.waitForTimeout(500);
    expect(changedPixels(first, await canvas.screenshot())).toBeGreaterThan(150);
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const paused = await canvas.screenshot();
    await page.waitForTimeout(300);
    expect(changedPixels(paused, await canvas.screenshot())).toBeLessThan(100);
    await page.getByRole("button", { name: "Suivre mon pilote", exact: true }).click();
    await page.waitForTimeout(900);
    const chase = await canvas.screenshot();
    expect(changedPixels(paused, chase)).toBeGreaterThan(1000);
    await page.screenshot({ path: testInfo.outputPath("race-chase-desktop.png"), fullPage: true });
    await page.getByRole("button", { name: "Vue du circuit", exact: true }).click();
    await page.waitForTimeout(350);
    expect(changedPixels(chase, await canvas.screenshot())).toBeGreaterThan(10000);
    expect(trackPixels(await canvas.screenshot()).road).toBeGreaterThan(0.03);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: testInfo.outputPath("race-desktop.png"), fullPage: true });
});

test("mobile : piste visible et controles sans debordement", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterRace(page);
    const canvas = page.locator('.live-track-canvas[data-rendered="true"] canvas');
    await expect(canvas).toBeVisible();
    expect(trackPixels(await canvas.screenshot()).road).toBeGreaterThan(0.02);
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await expect(page.getByRole("button", { name: "Suivre mon pilote", exact: true })).toBeDisabled();
    for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await page.screenshot({ path: testInfo.outputPath(`race-${width}.png`), fullPage: true });
        const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, outside: [...document.querySelectorAll("body *")].filter((element) => { const rect = element.getBoundingClientRect(); return rect.width && rect.right > innerWidth + 1; }).map((element) => ({ tag: element.tagName, class: element.className, text: element.textContent.slice(0, 65) })).slice(-20) }));
        expect(layout.scroll, JSON.stringify(layout)).toBeLessThanOrEqual(width);
        const overflowing = await page.locator(".live-race button, .race-strategy-section").evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth + 2 && element.clientWidth > 0).map((element) => element.textContent));
        expect(overflowing).toEqual([]);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /Préserver/ }).click();
    await step(page, 1);
    await page.screenshot({ path: testInfo.outputPath("race-mobile.png"), fullPage: true });
});

test("sans WebGL : course jouable avec portrait de repli", async ({ page }) => {
    await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            return /webgl/.test(type) ? null : original.call(this, type, ...args);
        };
    });
    await enterRace(page);
    await expect(page.locator(".race-track-fallback img")).toBeVisible();
    expect(await page.locator(".race-track-fallback img").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await step(page, 1);
    await expect(page.locator(".race-radio-current")).toBeVisible();
});

test("lecture automatique et protection contre deux onglets", async ({ page, context }) => {
    await enterRace(page);
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await page.getByRole("group", { name: "Vitesse de lecture" }).getByRole("button", { name: "×4", exact: true }).click();
    await expect.poll(async () => (await snapshot(page)).race.lap, { timeout: 8000 }).toBeGreaterThanOrEqual(1);
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    const before = await snapshot(page);
    await page.waitForTimeout(2400);
    expect((await snapshot(page)).race.lap).toBe(before.race.lap);
    await page.getByRole("button", { name: "Rentrer aux stands ce tour" }).click();
    const second = await context.newPage();
    await second.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await second.goto("/#/race-live", { waitUntil: "domcontentloaded" });
    await expect(second.getByRole("button", { name: "Reprendre la course", exact: true })).toBeVisible();
    expect((await snapshot(second)).race.id).toBe(before.race.id);
    const advance = (tab) => tab.evaluate(async ({ id, lap }) => {
        const { apiFetch } = await import("/src/services/api.js");
        return apiFetch("/api/live-race/advance/", { method: "POST", body: JSON.stringify({ race_id: id, expected_lap: lap }) });
    }, { id: before.race.id, lap: before.race.lap });
    const results = await Promise.all([advance(page), advance(second)]);
    for (const result of results) {
        expect(result.race.lap).toBe(before.race.lap + 1);
        expect(result.budget).toBe(before.budget - 90_000);
        expect(result.race.cars.find((car) => car.id === result.race.playerId).pitStops).toBe(1);
    }
    await second.close();
});
