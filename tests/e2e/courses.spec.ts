import { expect, test } from "@playwright/test";
import { createConfirmedUser, login } from "./helpers/auth";
import { createAndAssignTeacher, createCourse, teacherCombobox } from "./helpers/courses";
import { createFirstTerm, createTerm, switchActiveTerm } from "./helpers/terms";

const SECOND = { name: "Segundo trimestre", year: 2026, start: "2026-07-13", end: "2026-10-02" };
const THIRD = { name: "Tercer trimestre", year: 2026, start: "2026-10-13", end: "2026-12-18" };

const TERM_ARCHIVED_MESSAGE = "Este trimestre está archivado. Desarchívalo para editar.";

async function archiveTermFromCourses(page: import("@playwright/test").Page) {
  await page
    .getByRole("main")
    .getByRole("link", { name: /· 2026$/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: "Archivar", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Archivar trimestre" }).click();
  await expect(page.getByTestId("read-only-banner")).toBeVisible();
}

test.describe("Fase 3 · clases y docentes", () => {
  test("crear clases y docente; escribirle y llamarle con un clic", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);

    // Sin clases: estado vacío en el atajo /clases (redirige al trimestre activo).
    await page.goto("/clases");
    await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}\/clases$/);
    await expect(page.getByText("Aún no tienes clases en este trimestre")).toBeVisible();

    // Validación en el cliente.
    await page.getByRole("link", { name: "Nueva clase" }).click();
    await page.getByLabel("Créditos (opcional)").fill("tres");
    await page.getByRole("button", { name: "Crear clase" }).click();
    await expect(page.getByText("El nombre es obligatorio.")).toBeVisible();
    await expect(page.getByText("Escribe un número, p. ej. 3 o 4,5.")).toBeVisible();

    const calculus = await createCourse(page, {
      name: "Cálculo diferencial",
      code: "MAT-204",
      room: "B-204",
      credits: "4,5",
      color: "Azul",
      icon: "📐",
    });
    await expect(page.getByRole("main")).toContainText("4,5 créditos");
    await expect(page.getByRole("main")).toContainText("Sin docente asignado");

    await createAndAssignTeacher(page, calculus, {
      name: "Marta Gómez",
      email: "marta.gomez@universidad.test",
      phone: "+57 (601) 555-0101",
      office: "Bloque B, 204",
    });

    // En el Resumen, el correo y el teléfono son enlaces directos (un clic).
    await page.getByRole("link", { name: "Resumen" }).click();
    await expect(page).toHaveURL(new RegExp(`${calculus}$`));
    const card = page.getByTestId("teacher-card");
    await expect(card).toContainText("Marta Gómez");
    await expect(card).toContainText("Docente principal");
    await expect(card.getByRole("link", { name: "marta.gomez@universidad.test" })).toHaveAttribute(
      "href",
      "mailto:marta.gomez@universidad.test",
    );
    await expect(card.getByRole("link", { name: "+57 (601) 555-0101" })).toHaveAttribute(
      "href",
      "tel:+576015550101",
    );

    // Un clic en el correo abre el cliente de correo. El navegador de pruebas no tiene uno,
    // así que se captura la navegación mailto: que dispara ese único clic.
    await page.evaluate(() => {
      document.addEventListener(
        "click",
        (event) => {
          const link = (event.target as Element).closest("a");
          if (link?.href.startsWith("mailto:")) {
            (window as unknown as { openedMailto: string }).openedMailto = link.href;
            event.preventDefault();
          }
        },
        { capture: true },
      );
    });
    await card.getByRole("link", { name: "marta.gomez@universidad.test" }).click();
    expect(
      await page.evaluate(() => (window as unknown as { openedMailto?: string }).openedMailto),
    ).toBe("mailto:marta.gomez@universidad.test");
    await expect(page).toHaveURL(new RegExp(`${calculus}$`));

    // Segunda clase del mismo trimestre reutilizando el docente con el buscador.
    const chemistry = await createCourse(page, { name: "Química general", color: "Verde" });
    await page.goto(`${chemistry}/profesor`);
    await teacherCombobox(page).fill("gomez");
    const marta = page.getByRole("option", { name: /Marta Gómez/ });
    const createOption = page.getByRole("option", { name: "Crear docente “gomez”" });
    await expect(marta).toHaveAttribute("aria-selected", "true");
    await teacherCombobox(page).press("ArrowDown");
    await expect(createOption).toHaveAttribute("aria-selected", "true");
    await teacherCombobox(page).press("ArrowUp");
    await expect(marta).toHaveAttribute("aria-selected", "true");
    await teacherCombobox(page).press("Enter");
    await expect(page.getByTestId("teacher-card")).toContainText("Marta Gómez");

    // La lista del trimestre muestra ambas clases con su docente.
    await page.goto("/clases");
    const cards = page.getByRole("main").getByRole("listitem");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText("Cálculo diferencial");
    await expect(cards.nth(0)).toContainText("Marta Gómez");
    await expect(cards.nth(1)).toContainText("Química general");

    // Orden manual: mover Química antes (persistente).
    await page.getByRole("button", { name: "Mover Química general antes" }).click();
    await expect(cards.nth(0)).toContainText("Química general");
    await expect(page.getByRole("main").getByRole("list")).not.toHaveAttribute("aria-busy");
    await page.reload();
    await expect(cards.nth(0)).toContainText("Química general");

    // Un clic en la tarjeta abre el espacio de la clase.
    await page.getByRole("link", { name: "Cálculo diferencial" }).click();
    await expect(page).toHaveURL(new RegExp(`${calculus}$`));
  });

  test("editar el docente, cambiarlo y quitarlo", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    const course = await createCourse(page, { name: "Historia" });
    await createAndAssignTeacher(page, course, { name: "Elena Ruiz" });

    await page.getByRole("button", { name: "Editar datos" }).click();
    const dialog = page.getByRole("dialog", { name: "Editar docente" });
    await dialog.getByLabel("Correo (opcional)").fill("no-es-correo");
    await dialog.getByRole("button", { name: "Guardar docente" }).click();
    await expect(dialog.getByText("Escribe un correo válido")).toBeVisible();
    await dialog.getByLabel("Correo (opcional)").fill("elena@uni.test");
    await dialog.getByRole("button", { name: "Guardar docente" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: "elena@uni.test" })).toBeVisible();

    // Cambiar a un docente nuevo sustituye al anterior.
    await page.getByRole("button", { name: "Cambiar docente" }).click();
    await teacherCombobox(page).fill("Pablo Díaz");
    await teacherCombobox(page).press("Enter");
    const create = page.getByRole("dialog", { name: "Nuevo docente" });
    await create.getByRole("button", { name: "Crear y asignar" }).click();
    await expect(page.getByTestId("teacher-card")).toHaveCount(1);
    await expect(page.getByTestId("teacher-card")).toContainText("Pablo Díaz");

    // Quitarlo deja la clase sin docente (el docente se conserva para reutilizarlo).
    await page.getByRole("button", { name: "Quitar", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Quitar docente" }).click();
    await expect(teacherCombobox(page)).toBeVisible();
    await teacherCombobox(page).fill("a");
    await expect(page.getByRole("option", { name: /Elena Ruiz/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Pablo Díaz/ })).toBeVisible();
  });

  test("editar y eliminar una clase (con deshacer)", async ({ page }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    const course = await createCourse(page, { name: "Biología" });

    await page.getByRole("link", { name: "Editar clase" }).click();
    await expect(page).toHaveURL(new RegExp(`${course}/editar$`));
    await page.getByLabel("Nombre").fill("Biología celular");
    await page.getByLabel("Aula (opcional)").fill("Lab 2");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Cambios guardados.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Biología celular");

    await page.getByRole("button", { name: "Eliminar clase" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar clase" }).click();
    await expect(page).toHaveURL(/\/trimestres\/[0-9a-f-]{36}\/clases$/);
    await expect(page.getByText("Aún no tienes clases en este trimestre")).toBeVisible();

    // La clase eliminada no se puede abrir…
    await page.goto(course);
    await expect(page.getByRole("heading", { name: "No encontramos este elemento" })).toBeVisible();

    // …pero "Deshacer" la restaura.
    await page.goto("/clases");
    await page.getByRole("link", { name: "Nueva clase" }).click();
    await page.getByLabel("Nombre").fill("Temporal");
    await page.getByRole("button", { name: "Crear clase" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Temporal");
    await page.getByRole("link", { name: "Editar clase" }).click();
    await page.getByRole("button", { name: "Eliminar clase" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Eliminar clase" }).click();
    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Temporal");
  });

  test("las clases de otro trimestre y de otro usuario no aparecen", async ({
    page,
    browser,
    baseURL,
  }) => {
    const owner = await createConfirmedUser();
    await login(page, owner.email, owner.password);
    await createFirstTerm(page, SECOND);
    const secondCourse = await createCourse(page, { name: "Álgebra lineal" });

    await createTerm(page, THIRD);
    await page.goto("/clases");
    await expect(page.getByText("Aún no tienes clases en este trimestre")).toBeVisible();
    await expect(page.getByText("Álgebra lineal")).toHaveCount(0);
    await createCourse(page, { name: "Estadística" });

    await page.goto("/clases");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("main")).toContainText("Estadística");
    await expect(page.getByRole("main")).not.toContainText("Álgebra lineal");

    // Al volver al trimestre anterior, solo se ven sus clases.
    await switchActiveTerm(page, "Segundo trimestre · 2026");
    await page.goto("/clases");
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);
    await expect(page.getByRole("main")).toContainText("Álgebra lineal");
    await expect(page.getByRole("main")).not.toContainText("Estadística");

    // Otro usuario no ve ni puede abrir las clases del primero.
    const other = await createConfirmedUser();
    const otherPage = await browser.newPage({ baseURL });
    await login(otherPage, other.email, other.password);
    await otherPage.goto(secondCourse);
    await expect(
      otherPage.getByRole("heading", { name: "No encontramos este elemento" }),
    ).toBeVisible();
    await otherPage.goto(`${secondCourse}/profesor`);
    await expect(
      otherPage.getByRole("heading", { name: "No encontramos este elemento" }),
    ).toBeVisible();
    // Sin trimestre activo, /clases lleva a la lista de trimestres.
    await otherPage.goto("/clases");
    await expect(otherPage).toHaveURL(/\/trimestres$/);
  });

  test("trimestre archivado: clases en solo lectura", async ({ page, context }) => {
    const user = await createConfirmedUser();
    await login(page, user.email, user.password);
    await createFirstTerm(page, SECOND);
    const course = await createCourse(page, { name: "Física", color: "Violeta" });
    await createAndAssignTeacher(page, course, { name: "Laura Pérez" });
    await createCourse(page, { name: "Dibujo técnico" });

    // Formulario abierto antes de archivar: al guardar, el servidor responde TERM_ARCHIVED.
    await page.goto(`${course}/editar`);
    const otherTab = await context.newPage();
    await otherTab.goto("/clases");
    await archiveTermFromCourses(otherTab);
    await otherTab.close();

    await page.getByLabel("Nombre").fill("Física I");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("alert").filter({ hasText: TERM_ARCHIVED_MESSAGE })).toBeVisible();

    // La lista: sin crear ni reordenar.
    await page.goto("/clases");
    await expect(page.getByTestId("read-only-banner")).toBeVisible();
    await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Nueva clase" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Mover / })).toHaveCount(0);

    // El espacio de la clase: sin editar ni gestionar el docente, pero con sus datos.
    await page.goto(course);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Física");
    await expect(page.getByRole("link", { name: "Editar clase" })).toHaveCount(0);
    await expect(page.getByTestId("teacher-card")).toContainText("Laura Pérez");
    await page.getByRole("link", { name: "Profesor" }).click();
    await expect(page.getByTestId("teacher-card")).toContainText("Laura Pérez");
    await expect(page.getByRole("button", { name: "Editar datos" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Quitar", exact: true })).toHaveCount(0);
    await expect(teacherCombobox(page)).toHaveCount(0);

    // Las rutas de edición directas tampoco permiten escribir.
    await page.goto(`${course}/editar`);
    await expect(page.getByText("Esta clase es de solo lectura")).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toHaveCount(0);
    await page.goto("/clases");
    const termCoursesUrl = new URL(page.url()).pathname;
    await page.goto(`${termCoursesUrl}/nueva`);
    await expect(page.getByText("Este trimestre está archivado")).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear clase" })).toHaveCount(0);

    // Al desarchivar vuelve a ser editable.
    await page.getByTestId("read-only-banner").getByRole("button", { name: "Desarchivar" }).click();
    await expect(page.getByTestId("read-only-banner")).toBeHidden();
    await page.goto(course);
    await expect(page.getByRole("link", { name: "Editar clase" })).toBeVisible();
  });
});
