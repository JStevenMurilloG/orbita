import { expect, type Page } from "@playwright/test";

export type CourseInput = {
  name: string;
  code?: string;
  room?: string;
  credits?: string;
  /** Nombre accesible del color ("Azul", "Verde"…). */
  color?: string;
  /** Emoji sugerido ("📐"…). */
  icon?: string;
};

/**
 * Crea una clase en el trimestre activo (desde el atajo /clases) y espera su espacio.
 * Devuelve la ruta de la clase (`/clases/<id>`).
 */
export async function createCourse(page: Page, course: CourseInput): Promise<string> {
  await page.goto("/clases");
  await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}\/clases$/);
  await page.getByRole("link", { name: "Nueva clase" }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Nueva clase" })).toBeVisible();

  await page.getByLabel("Nombre").fill(course.name);
  if (course.code) await page.getByLabel("Código (opcional)").fill(course.code);
  if (course.room) await page.getByLabel("Aula (opcional)").fill(course.room);
  if (course.credits) await page.getByLabel("Créditos (opcional)").fill(course.credits);
  if (course.color) {
    // El radio es visualmente oculto: se elige pulsando la muestra de color (su etiqueta).
    const radio = page.getByRole("radio", { name: course.color, exact: true });
    await page.locator("label", { has: radio }).click();
    await expect(radio).toBeChecked();
  }
  if (course.icon) await page.getByRole("button", { name: `Usar ${course.icon}` }).click();
  await page.getByRole("button", { name: "Crear clase" }).click();

  await expect(page).toHaveURL(/\/clases\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(course.name);
  return new URL(page.url()).pathname;
}

/** Campo del buscador de docentes (pestaña Profesor). */
export function teacherCombobox(page: Page) {
  return page.getByRole("combobox", { name: "Buscar o crear docente" });
}

/** Crea un docente nuevo desde la pestaña Profesor y lo asigna como principal. */
export async function createAndAssignTeacher(
  page: Page,
  coursePath: string,
  teacher: { name: string; email?: string; phone?: string; office?: string },
) {
  await page.goto(`${coursePath}/profesor`);
  await teacherCombobox(page).fill(teacher.name);
  await page.getByRole("option", { name: `Crear docente “${teacher.name}”` }).click();

  const dialog = page.getByRole("dialog", { name: "Nuevo docente" });
  await expect(dialog.getByLabel("Nombre")).toHaveValue(teacher.name);
  if (teacher.email) await dialog.getByLabel("Correo (opcional)").fill(teacher.email);
  if (teacher.phone) await dialog.getByLabel("Teléfono (opcional)").fill(teacher.phone);
  if (teacher.office) await dialog.getByLabel("Oficina (opcional)").fill(teacher.office);
  await dialog.getByRole("button", { name: "Crear y asignar" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("teacher-card")).toContainText(teacher.name);
}
