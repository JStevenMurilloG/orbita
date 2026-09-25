import { expect, type Page } from "@playwright/test";

export type TermInput = { name: string; start: string; end: string; year?: number };

async function fillTermForm(page: Page, term: TermInput) {
  await page.getByLabel("Nombre").fill(term.name);
  if (term.year) await page.getByLabel("Año").fill(String(term.year));
  await page.getByLabel("Fecha de inicio").fill(term.start);
  await page.getByLabel("Fecha de fin").fill(term.end);
}

/** Crea el primer trimestre desde el onboarding (el usuario debe estar en /bienvenida). */
export async function createFirstTerm(page: Page, term: TermInput) {
  await expect(page).toHaveURL(/\/bienvenida$/);
  await fillTermForm(page, term);
  await page.getByRole("button", { name: "Crear mi primer trimestre" }).click();
  await expect(page).toHaveURL(/\/hoy$/);
}

/** Crea otro trimestre desde /trimestres/nuevo y espera su página de detalle. */
export async function createTerm(page: Page, term: TermInput & { makeActive?: boolean }) {
  await page.goto("/trimestres/nuevo");
  await fillTermForm(page, term);
  const makeActive = page.getByLabel("Usarlo como trimestre activo");
  if (term.makeActive === false) await makeActive.uncheck();
  await page.getByRole("button", { name: "Crear trimestre" }).click();
  await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(term.name);
}

/** Botón del selector de trimestre activo (visible en desktop y en móvil). */
export function termSwitcher(page: Page) {
  return page.getByRole("button", { name: /^Cambiar trimestre activo/ });
}

export async function switchActiveTerm(page: Page, label: string) {
  await termSwitcher(page).click();
  await page.getByRole("menuitemradio", { name: label }).click();
  await expect(termSwitcher(page)).toHaveAccessibleName(`Cambiar trimestre activo (${label})`);
}
