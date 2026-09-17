import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";

async function setup(page) {
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Ex: Alex, Test Ferrari, Saison agressive").fill("Scuderia Test");
    await page.getByRole("button", { name: "Creer et commencer" }).click();
}

async function chooseDriver(page) {
    await page.getByRole("button", { name: "Selectionner Ferrari", exact: true }).click();
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click();
    await page.getByRole("button", { name: "Choisir Lewis Hamilton, pilote Scuderia Ferrari HP", exact: true }).click();
}

test("calendrier : Simuler ouvre la 3D, reprise et classement des manches", async ({ page }, info) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await setup(page);
    await chooseDriver(page);
    await page.getByRole("button", { name: "Valider ce pilote" }).click();
    await expect(page).toHaveURL(/#\/calendar$/);
    const current = page.getByRole("region", { name: "Course actuelle", exact: true });
    await expect(current.getByRole("heading", { name: "Australian GP", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Simuler", exact: true })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "En piste", exact: true })).toHaveCount(0);
    expect(await current.locator("img.calendar-circuit-photo").evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: info.outputPath("calendar-desktop.png") });
    await page.getByRole("button", { name: "Simuler", exact: true }).click();
    await expect(page).toHaveURL(/#\/race\/2$/);
    await expect(page.getByRole("button", { name: "Prendre le départ" })).toBeVisible();
    expect(await page.evaluate(async () => (await (await import("/src/services/api.js")).apiFetch("/api/live-race/")).race)).toBeNull();
    await page.getByRole("button", { name: "8 tours", exact: true }).click();
    await page.getByRole("button", { name: "Prendre le départ" }).click();
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await page.getByRole("button", { name: "Avancer d'un tour", exact: true }).click();
    await page.getByRole("button", { name: "Retour au calendrier", exact: true }).click();
    await expect(page.getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Reprendre", exact: true }).click();
    await expect(page.getByRole("button", { name: "Reprendre la course", exact: true })).toBeVisible();
    await page.evaluate(async () => {
        const { apiFetch } = await import("/src/services/api.js");
        let { race } = await apiFetch("/api/live-race/");
        while (race.status !== "finished") ({ race } = await apiFetch("/api/live-race/advance/", { method: "POST", body: JSON.stringify({ race_id: race.id, expected_lap: race.lap }) }));
    });
    await page.goto("/#/calendar", { waitUntil: "domcontentloaded" });
    await expect(current.getByRole("heading", { name: "Chinese GP", exact: true })).toBeVisible();
    const history = page.getByRole("region", { name: "Courses terminées", exact: true });
    const future = page.getByRole("region", { name: "Courses à venir", exact: true });
    expect((await history.boundingBox()).y).toBeLessThan((await current.boundingBox()).y);
    expect((await future.boundingBox()).y).toBeGreaterThan((await current.boundingBox()).y);
    await history.locator("summary").click();
    await expect(history.getByText("PROGRAMMÉ", { exact: true })).toHaveCount(0);
    await history.getByRole("button", { name: "Résultats Grand Prix, Australian GP", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.screenshot({ path: info.outputPath("calendar-after-race.png") });
    await page.goto("/#/race/99", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Course indisponible" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Prendre le départ" })).toHaveCount(0);
    expect(errors).toEqual([]);
});

test("logos couleur, pilote rotatif et calendrier mobile", async ({ page }, info) => {
    await setup(page);
    const logos = page.locator(".team-logo-panel img");
    await expect(logos).toHaveCount(11);
    await expect.poll(() => logos.evaluateAll((images) => images.every((img) => img.complete && img.naturalWidth > 0 && img.src.endsWith("-color.webp")))).toBe(true);
    const logo = PNG.sync.read(await page.locator(".team-logo-panel").getByRole("img", { name: "Logo Ferrari", exact: true }).screenshot());
    let colored = 0;
    for (let i = 0; i < logo.data.length; i += 4) if (Math.max(...logo.data.subarray(i, i + 3)) - Math.min(...logo.data.subarray(i, i + 3)) > 80) colored++;
    expect(colored).toBeGreaterThan(500);
    await page.screenshot({ path: info.outputPath("teams-color.png"), fullPage: true });
    await chooseDriver(page);
    const canvas = page.locator('.driver-model-canvas[data-rendered="true"] canvas');
    await expect(canvas).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const before = await canvas.screenshot();
    await page.getByRole("button", { name: "Tourner le pilote à droite", exact: true }).click();
    await page.waitForTimeout(200);
    expect(before.equals(await canvas.screenshot())).toBe(false);
    await page.getByRole("button", { name: "Recentrer le pilote", exact: true }).click();
    await page.mouse.move(0, 0);
    await page.screenshot({ path: info.outputPath("driver-desktop.png") });
    await page.getByRole("button", { name: "Portrait", exact: true }).click();
    await expect(page.locator(".driver-portrait-main")).toBeVisible();
    await page.getByRole("button", { name: "Avatar 3D", exact: true }).click();
    for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(canvas).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        expect(await page.locator(".driver-card-badges").evaluateAll((groups) => groups.every((group) => {
            const bounds = group.getBoundingClientRect();
            const badges = [...group.children].map((item) => item.getBoundingClientRect());
            return badges.every((a, index) => a.left >= bounds.left - 1 && a.right <= bounds.right + 1 && badges.slice(index + 1).every((b) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top));
        }))).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileBefore = await canvas.screenshot();
    await page.getByRole("button", { name: "Tourner le pilote à droite", exact: true }).click();
    await page.waitForTimeout(200);
    expect(mobileBefore.equals(await canvas.screenshot())).toBe(false);
    await page.getByRole("button", { name: "Recentrer le pilote", exact: true }).click();
    await page.screenshot({ path: info.outputPath("driver-mobile.png") });
    await page.getByRole("button", { name: "Valider ce pilote" }).click();
    for (const width of [320, 390, 768]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
        await expect(page.getByRole("button", { name: "Simuler", exact: true })).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: info.outputPath("calendar-mobile.png") });
    const photos = await page.locator(".calendar-circuit-photo").evaluateAll(async (images) => {
        await Promise.all(images.map((image) => { image.loading = "eager"; return image.decode().catch(() => {}); }));
        return images.filter((image) => !image.naturalWidth).map((image) => image.src);
    });
    expect(photos).toEqual([]);
});
