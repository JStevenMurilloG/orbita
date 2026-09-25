import { expect, type Page } from "@playwright/test";

/**
 * Utilidades E2E de autenticación contra Supabase local.
 * Los correos se leen de Mailpit (http://127.0.0.1:55424) y los usuarios ya confirmados
 * se crean con la API admin de Supabase Auth (clave secreta, solo en tests).
 */

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:55424";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
  return { url, key };
}

export const DEFAULT_PASSWORD = "orbita-e2e-123";

/** Correo único por test y proyecto (desktop/mobile corren en paralelo). */
export function uniqueEmail(label: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `e2e-${label}-${Date.now()}-${random}@orbita.test`;
}

/** Crea un usuario con el correo ya confirmado (el trigger crea su perfil). */
export async function createConfirmedUser(
  opts: { email?: string; password?: string; fullName?: string; timezone?: string } = {},
) {
  const email = opts.email ?? uniqueEmail("user");
  const password = opts.password ?? DEFAULT_PASSWORD;
  const fullName = opts.fullName ?? "Estudiante E2E";
  const { url, key } = supabaseAdmin();

  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, timezone: opts.timezone ?? "America/Bogota" },
    }),
  });
  if (!response.ok) throw new Error(`No se pudo crear el usuario: ${await response.text()}`);
  return { email, password, fullName };
}

type MailpitMessage = { ID: string; Subject: string; Created: string };

/**
 * Espera el correo más reciente para `to` cuyo asunto contenga `subject` y devuelve la ruta
 * (path + query) de su enlace de acción, lista para `page.goto` contra el servidor de tests.
 */
export async function getEmailLinkPath(
  to: string,
  subject: string,
  opts: { after?: Date; timeoutMs?: number } = {},
): Promise<string> {
  const deadline = Date.now() + (opts.timeoutMs ?? 15_000);
  const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`);

  while (Date.now() < deadline) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}&limit=10`);
    if (response.ok) {
      const { messages } = (await response.json()) as { messages: MailpitMessage[] };
      const message = messages.find((m) => !opts.after || new Date(m.Created) >= opts.after);
      if (message) {
        const detail = (await (
          await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
        ).json()) as { HTML: string };
        const href = detail.HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
        if (!href) throw new Error(`El correo "${message.Subject}" no tiene enlace de acción`);
        // Las plantillas usan el site_url de Supabase; el servidor E2E puede estar en otro puerto.
        const url = new URL(href.replaceAll("&amp;", "&"));
        return `${url.pathname}${url.search}`;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No llegó el correo "${subject}" a ${to}`);
}

/**
 * Destino tras iniciar sesión: Hoy, o el onboarding si el usuario aún no tiene trimestres
 * (`/hoy` redirige a `/bienvenida`).
 */
export const AFTER_LOGIN_URL = /\/(hoy|bienvenida)$/;

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expectAfterLoginPage(page);
}

/**
 * Espera a que la página final tras iniciar sesión esté pintada (no solo a la URL), para no
 * navegar mientras sigue una transición del cliente.
 */
export async function expectAfterLoginPage(page: Page) {
  await expect(
    page.getByRole("heading", { level: 1, name: /^(Hoy|Te damos la bienvenida)/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(AFTER_LOGIN_URL);
}

export async function openUserMenu(page: Page) {
  await page.getByRole("button", { name: "Menú de usuario" }).click();
}

export async function logout(page: Page) {
  await openUserMenu(page);
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
}
