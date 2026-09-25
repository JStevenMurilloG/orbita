import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COURSE_COLORS, isCourseColor } from "../course-colors";

/**
 * Contraste WCAG de la paleta de clases en claro y oscuro (plan §6, riesgo de la Fase 3).
 * Lee los tokens `oklch()` de globals.css y los convierte a sRGB para calcular la luminancia.
 */
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

type Oklch = [number, number, number];

function tokens(selector: string): Record<string, Oklch> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("\n}", start));
  const result: Record<string, Oklch> = {};
  for (const [, name, value] of block.matchAll(/--([\w-]+):\s*oklch\(([^)]+)\)/g)) {
    const [l, c, h] = value.split("/")[0].trim().split(/\s+/).map(Number);
    result[name] = [l, c, h ?? 0];
  }
  return result;
}

/** Luminancia relativa de un color OKLCH (OKLab → sRGB lineal, recortado a la gama). */
function luminance([L, C, H]: Oklch): number {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (x: number) => Math.min(1, Math.max(0, x));
  const r = clip(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clip(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clip(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function contrast(x: Oklch, y: Oklch): number {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

describe.each([
  ["claro", ":root"],
  ["oscuro", ".dark"],
])("paleta de clases en tema %s", (_, selector) => {
  const theme = { ...tokens(":root"), ...tokens(selector) };

  it.each(COURSE_COLORS)("%s: texto AA (4.5:1) sobre su fondo y sobre la tarjeta", (color) => {
    const fg = theme[`course-${color}-fg`];
    const bg = theme[`course-${color}`];
    expect(fg, `falta --course-${color}-fg`).toBeDefined();
    expect(bg, `falta --course-${color}`).toBeDefined();
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(fg, theme.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(theme.foreground, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("COURSE_COLORS", () => {
  it("coincide con el CHECK de la columna courses.color", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260925030000_courses_teachers.sql"),
      "utf8",
    );
    const check = sql.match(/courses_color_token check \(color in \(([^)]+)\)/)?.[1] ?? "";
    const inSql = [...check.matchAll(/'(\w+)'/g)].map(([, token]) => token);
    expect(inSql).toEqual([...COURSE_COLORS]);
  });

  it("isCourseColor", () => {
    expect(isCourseColor("indigo")).toBe(true);
    expect(isCourseColor("#ff0000")).toBe(false);
  });
});
