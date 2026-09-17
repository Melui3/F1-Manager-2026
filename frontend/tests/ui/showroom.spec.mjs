import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";

async function startSession(page) {
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Ex: Alex, Test Ferrari, Saison agressive").fill("Test garage 3D");
    await page.getByRole("button", { name: "Creer et commencer" }).click();
    await expect(page.getByRole("heading", { name: "Choisis ton écurie" })).toBeVisible();
}

async function chooseFerrari(page, animated = true, proceed = true) {
    await page.getByRole("button", { name: "Selectionner Ferrari", exact: true }).click();
    if (animated) await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 6000 });
    if (!proceed) return;
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Choisis ton pilote" })).toBeVisible();
}

function pixelStats(buffer) {
    const { data, width, height } = PNG.sync.read(buffer);
    let red = 0;
    const buckets = new Set();
    for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (r > 100 && r > g * 1.5 && r > b * 1.5) red++;
        buckets.add(`${r >> 4},${g >> 4},${b >> 4}`);
    }
    return { redRatio: red / (width * height), colors: buckets.size, width, height };
}

function changedPixels(first, second) {
    const a = PNG.sync.read(first);
    const b = PNG.sync.read(second);
    let changed = 0;
    for (let i = 0; i < a.data.length; i += 4) {
        if (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]) > 20) changed++;
    }
    return changed;
}

test("3D visible, rotation, caméras et révélation clavier du pilote", async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await startSession(page);
    await chooseFerrari(page, true, false);
    await page.mouse.move(0, 0);
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await expect(page.locator(".showroom-identity h2")).toHaveText("Ferrari");
    const canvas = page.locator('.race-showroom .race-car-canvas[data-rendered="true"]');
    await expect(canvas).toBeVisible();
    const first = await canvas.screenshot({ path: testInfo.outputPath("car-colour.png") });
    const stats = pixelStats(first);
    expect(stats.redRatio).toBeGreaterThan(0.015);
    expect(stats.colors).toBeGreaterThan(40);
    await page.waitForTimeout(400);
    expect(changedPixels(first, await canvas.screenshot())).toBeGreaterThan(500);

    await page.getByRole("button", { name: "Mettre la rotation en pause" }).click();
    await page.waitForTimeout(400);
    const paused = await canvas.screenshot();
    await page.waitForTimeout(250);
    expect(changedPixels(paused, await canvas.screenshot())).toBeLessThan(100);
    const bounds = await canvas.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 100, bounds.y + bounds.height / 2, { steps: 8 });
    await page.mouse.up();
    expect(changedPixels(paused, await canvas.screenshot())).toBeGreaterThan(1000);
    await page.getByRole("button", { name: "Vue du dessus" }).click();
    expect(changedPixels(paused, await canvas.screenshot())).toBeGreaterThan(1000);
    await page.getByRole("button", { name: "Recentrer la voiture" }).click();
    await expect(canvas).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("garage-team-desktop.png") });
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Choisis ton pilote" })).toBeVisible();
    await expect.poll(() => page.locator(".f1-driver-card-photo img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);

    const driver = page.getByRole("button", { name: "Choisir Lewis Hamilton, pilote Scuderia Ferrari HP", exact: true });
    await driver.focus();
    await driver.press("Enter");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(driver).toHaveAttribute("aria-pressed", "true");
    await expect(driver.getByText("Stats de simulation")).toBeVisible();
    await expect(page.locator("#root")).toHaveJSProperty("inert", false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(0, 0);
    await page.screenshot({ path: testInfo.outputPath("garage-desktop.png") });
    expect(errors).toEqual([]);
});

test("mobile : monoplace visible, cartes utilisables et aucun débordement", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await startSession(page);
    await chooseFerrari(page);
    await page.getByRole("button", { name: "Mettre la rotation du pilote en pause" }).click();
    const canvas = page.locator('.driver-model-canvas[data-rendered="true"]');
    expect(pixelStats(await canvas.screenshot()).redRatio).toBeGreaterThan(0.015);
    await page.mouse.move(0, 0);
    await page.getByRole("button", { name: "Lancer la rotation du pilote" }).evaluate((button) => button.blur());
    await page.screenshot({ path: testInfo.outputPath("garage-mobile.png") });
    for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.locator(".f1-driver-card").first().getByRole("button", { name: "Découvrir ce pilote" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Stats de simulation")).toBeVisible();
    await page.getByRole("button", { name: "Valider ce pilote" }).click();
    await expect(page).toHaveURL(/calendar/);
});

test("réduction des animations : sélection immédiate, garage immobile", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startSession(page);
    await chooseFerrari(page, false);
    await expect(page.getByRole("button", { name: "Lancer la rotation du pilote" })).toBeDisabled();
    await page.locator(".f1-driver-card").first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Stats de simulation")).toBeVisible();
});

test("sans WebGL : repli visuel et sélection disponibles", async ({ page }) => {
    await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
            if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
            return getContext.call(this, type, ...args);
        };
    });
    await startSession(page);
    await expect(page.locator(".race-car-fallback img")).toBeVisible();
    await expect(page.getByRole("group", { name: "Vues de la monoplace" })).toHaveCount(0);
    await chooseFerrari(page, false);
    await page.locator(".f1-driver-card").first().click();
    await expect(page.getByText("Stats de simulation")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("#root")).toHaveJSProperty("inert", false);
});
