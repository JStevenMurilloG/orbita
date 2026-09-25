import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Fase 0 · smoke", () => {
  test("la home carga", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Órbita/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
  });

  test("las rutas de la app exigen sesión", async ({ page }) => {
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/login\?next=%2Fhoy$/);
  });

  test("una ruta inexistente muestra la página 404 en español", async ({ page }) => {
    await page.goto("/login/no-existe");
    await expect(page.getByRole("heading", { name: "No encontramos este elemento" })).toBeVisible();
  });

  for (const colorScheme of ["light", "dark"] as const) {
    test(`home sin violaciones graves de accesibilidad (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto("/");
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
    });
  }
});
