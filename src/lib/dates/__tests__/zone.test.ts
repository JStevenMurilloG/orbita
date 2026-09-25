import { describe, expect, it } from "vitest";
import {
  DEFAULT_TIMEZONE,
  getToday,
  getTodayIsoWeekday,
  isValidTimeZone,
  zonedWallTimeToInstant,
} from "../zone";

describe("isValidTimeZone", () => {
  it.each(["America/Bogota", "America/New_York", "Europe/Madrid", "UTC"])("acepta %s", (tz) => {
    expect(isValidTimeZone(tz)).toBe(true);
  });

  it.each(["", "Marte/Olympus", "GMT+99"])("rechaza %j", (tz) => {
    expect(isValidTimeZone(tz)).toBe(false);
  });

  it("la zona por defecto es válida", () => {
    expect(isValidTimeZone(DEFAULT_TIMEZONE)).toBe(true);
  });
});

describe("getToday", () => {
  // 2026-10-01T03:30Z = 30 sep 22:30 en Bogotá (UTC-5).
  const lateEveningBogota = new Date("2026-10-01T03:30:00Z");

  it("usa la zona del usuario, no la del servidor (UTC)", () => {
    expect(getToday("UTC", lateEveningBogota)).toBe("2026-10-01");
    expect(getToday("America/Bogota", lateEveningBogota)).toBe("2026-09-30");
  });

  it("a las 23:30 de Bogotá sigue siendo el mismo día", () => {
    const at2330 = new Date("2026-10-01T04:30:00Z");
    expect(getToday("America/Bogota", at2330)).toBe("2026-09-30");
    expect(getTodayIsoWeekday("America/Bogota", at2330)).toBe(3); // miércoles
  });

  it("Madrid ya está en el día siguiente", () => {
    expect(getToday("Europe/Madrid", lateEveningBogota)).toBe("2026-10-01");
  });

  it("domingo es 7 en ISO", () => {
    expect(getTodayIsoWeekday("America/Bogota", new Date("2026-10-04T15:00:00Z"))).toBe(7);
  });
});

describe("zonedWallTimeToInstant", () => {
  it("Bogotá no tiene horario de verano (UTC-5 todo el año)", () => {
    expect(zonedWallTimeToInstant("2026-01-15", "08:00", "America/Bogota").toISOString()).toBe(
      "2026-01-15T13:00:00.000Z",
    );
    expect(zonedWallTimeToInstant("2026-07-15", "08:00", "America/Bogota").toISOString()).toBe(
      "2026-07-15T13:00:00.000Z",
    );
  });

  it("Madrid: la clase sigue a las 08:00 locales antes y después del cambio de hora", () => {
    // 25 oct 2026: fin del horario de verano en la UE (CEST UTC+2 → CET UTC+1).
    expect(zonedWallTimeToInstant("2026-10-24", "08:00", "Europe/Madrid").toISOString()).toBe(
      "2026-10-24T06:00:00.000Z",
    );
    expect(zonedWallTimeToInstant("2026-10-26", "08:00", "Europe/Madrid").toISOString()).toBe(
      "2026-10-26T07:00:00.000Z",
    );
  });

  it("Nueva York: hora inexistente del salto de primavera se desplaza hacia delante", () => {
    // 8 mar 2026, 02:30 no existe en America/New_York (02:00 → 03:00 EDT).
    const instant = zonedWallTimeToInstant("2026-03-08", "02:30", "America/New_York");
    expect(instant.toISOString()).toBe("2026-03-08T07:30:00.000Z"); // 03:30 EDT
  });

  it("Nueva York: hora ambigua de otoño toma la primera ocurrencia (EDT)", () => {
    // 1 nov 2026, 01:30 ocurre dos veces; la primera es EDT (UTC-4).
    const instant = zonedWallTimeToInstant("2026-11-01", "01:30", "America/New_York");
    expect(instant.toISOString()).toBe("2026-11-01T05:30:00.000Z");
  });
});
