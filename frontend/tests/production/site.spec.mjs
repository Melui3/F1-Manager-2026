import { test, expect } from "@playwright/test";

test("site publie : assets, course 3D, sauvegarde et reset sans backend", async ({ page, request }, info) => {
    const backendRequests = [];
    const brokenAssets = [];
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
        if (response.status() >= 400 && /\.(js|css|webp|avif|png|jpg)(\?|$)/.test(response.url())) brokenAssets.push(response.url());
    });
    await page.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.includes("/api/") || url.port === "8001") {
            backendRequests.push(url.href);
            return route.abort();
        }
        if (url.hostname === "fonts.googleapis.com") return route.abort();
        return route.continue();
    });
    const version = await request.get("version.json");
    expect(version.ok()).toBe(true);
    expect((await version.json()).commit).toMatch(/^(local|[a-f0-9]{40})$/);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("#/login", { waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Ex: Alex, Test Ferrari, Saison agressive").fill("Verification publication");
    await page.getByRole("button", { name: "Creer et commencer", exact: true }).click();
    await page.getByRole("button", { name: "Selectionner Ferrari", exact: true }).click();
    await page.getByRole("button", { name: "CONTINUER", exact: true }).click();
    await expect(page.locator('.driver-model-canvas[data-rendered="true"]')).toBeVisible();
    await page.getByRole("button", { name: "Choisir Lewis Hamilton, pilote Scuderia Ferrari HP", exact: true }).click();
    await page.getByRole("button", { name: "Valider ce pilote", exact: true }).click();
    await expect(page).toHaveURL(/#\/calendar$/);
    const budget = page.locator(".season-manager > span:last-child strong");
    const initialBudget = await budget.innerText();
    await page.locator(".calendar-circuit-photo").first().evaluate((image) => image.decode());
    await page.screenshot({ path: info.outputPath("published-calendar.png") });
    await page.getByRole("button", { name: "Simuler", exact: true }).click();
    await expect(page).toHaveURL(/#\/race\/2$/);
    await page.getByRole("button", { name: "8 tours", exact: true }).click();
    await page.getByRole("button", { name: "Prendre le départ", exact: true }).click();
    await page.getByRole("button", { name: "Mettre la course en pause", exact: true }).click();
    await page.getByRole("button", { name: "Avancer d'un tour", exact: true }).click();
    await page.getByRole("button", { name: "Retour au calendrier", exact: true }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Reprendre", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Réinitialiser la saison", exact: true }).click();
    await page.getByRole("button", { name: "Reset saison", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Simuler", exact: true })).toBeVisible();
    await expect(budget).toHaveText(initialBudget);
    await expect(page.locator(".calendar-current")).toHaveAttribute("data-round", "1");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("published-calendar-mobile.png") });
    expect(backendRequests).toEqual([]);
    expect(brokenAssets).toEqual([]);
    expect(errors).toEqual([]);
});
