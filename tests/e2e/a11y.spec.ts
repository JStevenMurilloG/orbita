import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createConfirmedUser, login } from "./helpers/auth";
import { createAndAssignTeacher, createCourse, teacherCombobox } from "./helpers/courses";
import { createFirstTerm } from "./helpers/terms";

async function expectNoSeriousViolations(page: Page) {
  // Un toast a mitad de su animación de entrada tiene opacidad parcial y falsea el contraste.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe("Fases 1–3 · accesibilidad", () => {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`páginas públicas de autenticación (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of ["/login", "/registro", "/recuperar", "/restablecer"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
    });

    test(`configuración con sesión (${colorScheme})`, async ({ page }) => {
      const user = await createConfirmedUser();
      await page.emulateMedia({ colorScheme });
      await login(page, user.email, user.password);
      for (const path of ["/hoy", "/configuracion/perfil", "/configuracion/cuenta"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
    });

    test(`trimestres y onboarding (${colorScheme})`, async ({ page }) => {
      const user = await createConfirmedUser();
      await page.emulateMedia({ colorScheme });
      await login(page, user.email, user.password);
      await expectNoSeriousViolations(page); // /bienvenida
      await createFirstTerm(page, {
        name: "Segundo trimestre",
        start: "2026-07-13",
        end: "2026-10-02",
      });
      for (const path of ["/hoy", "/trimestres", "/trimestres/nuevo"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
      await page.goto("/trimestres");
      await page.getByRole("link", { name: /Segundo trimestre · / }).click();
      await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}$/);
      await expectNoSeriousViolations(page);

      // Archivado: aviso de solo lectura.
      await page.getByRole("button", { name: "Archivar", exact: true }).click();
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Archivar trimestre" })
        .click();
      await expect(page.getByTestId("read-only-banner")).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test(`clases y docentes (${colorScheme})`, async ({ page }) => {
      test.setTimeout(180_000); // crea una clase por cada color de la paleta
      const user = await createConfirmedUser();
      await page.emulateMedia({ colorScheme });
      await login(page, user.email, user.password);
      await createFirstTerm(page, {
        name: "Segundo trimestre",
        start: "2026-07-13",
        end: "2026-10-02",
      });

      await page.goto("/clases");
      await expect(page.getByRole("heading", { level: 1, name: "Clases" })).toBeVisible();
      await expectNoSeriousViolations(page); // estado vacío

      await page.getByRole("link", { name: "Nueva clase" }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Nueva clase" })).toBeVisible();
      await page.getByRole("button", { name: "Crear clase" }).click();
      await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();
      await expectNoSeriousViolations(page); // formulario con error y selector de color

      // Una clase de cada color: la lista muestra la paleta completa.
      const colors = [
        "Rojo",
        "Naranja",
        "Ámbar",
        "Lima",
        "Verde",
        "Verde azulado",
        "Cian",
        "Azul",
        "Violeta",
        "Rosa",
        "Gris",
      ];
      const course = await createCourse(page, {
        name: "Cálculo diferencial",
        code: "MAT-204",
        room: "B-204",
        color: "Índigo",
        icon: "📐",
      });
      await createAndAssignTeacher(page, course, {
        name: "Marta Gómez",
        email: "marta@uni.test",
        phone: "+57 601 555 0101",
        office: "Bloque B",
      });
      await expectNoSeriousViolations(page); // pestaña Profesor con docente
      await page.getByRole("button", { name: "Cambiar docente" }).click();
      await teacherCombobox(page).fill("m");
      await expect(page.getByRole("listbox")).toBeVisible();
      await expectNoSeriousViolations(page); // buscador abierto

      for (const color of colors) {
        await createCourse(page, { name: `Clase ${color}`, code: "X-1", color });
      }
      for (const path of [course, `${course}/editar`, `${course}/tareas`, "/clases"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoSeriousViolations(page);
      }
    });
  }
});
