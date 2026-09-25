import { describe, expect, it } from "vitest";
import { termLabel, TERM_STATUS_LABELS } from "../labels";
import {
  availableTransitions,
  confirmNameMatches,
  newTermDefaults,
  nextTermStatus,
  termPeriod,
} from "../utils";

describe("nextTermStatus", () => {
  it.each([
    ["active", "finish", "finished"],
    ["finished", "reopen", "active"],
    ["active", "archive", "archived"],
    ["finished", "archive", "archived"],
    ["archived", "unarchive", "finished"],
  ] as const)("%s --%s--> %s", (from, transition, to) => {
    expect(nextTermStatus(from, transition)).toBe(to);
  });

  it.each([
    ["active", "reopen"],
    ["active", "unarchive"],
    ["finished", "finish"],
    ["archived", "archive"],
    ["archived", "finish"],
    ["archived", "reopen"],
  ] as const)("no permite %s --%s-->", (from, transition) => {
    expect(nextTermStatus(from, transition)).toBeNull();
  });

  it("ofrece solo las transiciones válidas de cada estado", () => {
    expect(availableTransitions("active")).toEqual(["finish", "archive"]);
    expect(availableTransitions("finished")).toEqual(["reopen", "archive"]);
    expect(availableTransitions("archived")).toEqual(["unarchive"]);
  });
});

describe("termPeriod", () => {
  const term = { start_date: "2026-07-13", end_date: "2026-10-02" };

  it.each([
    ["2026-07-12", "upcoming"],
    ["2026-07-13", "current"],
    ["2026-08-20", "current"],
    ["2026-10-02", "current"],
    ["2026-10-03", "past"],
  ])("%s → %s", (today, period) => {
    expect(termPeriod(term, today)).toBe(period);
  });
});

describe("confirmNameMatches", () => {
  it("exige el nombre exacto, sin importar espacios alrededor", () => {
    expect(confirmNameMatches("Primer trimestre", "  Primer trimestre ")).toBe(true);
    expect(confirmNameMatches("Primer trimestre", "primer trimestre")).toBe(false);
    expect(confirmNameMatches("Primer trimestre", "Primer")).toBe(false);
  });
});

describe("newTermDefaults", () => {
  it("empieza hoy en la zona dada, no en la del servidor", () => {
    // 2026-01-01 03:00 UTC = 31 dic 2025 22:00 en Bogotá.
    const now = new Date("2026-01-01T03:00:00Z");
    expect(newTermDefaults("America/Bogota", now)).toEqual({
      name: "",
      year: 2025,
      start_date: "2025-12-31",
      end_date: "",
      timezone: "America/Bogota",
      description: "",
    });
    expect(newTermDefaults("Europe/Madrid", now).start_date).toBe("2026-01-01");
  });
});

describe("labels", () => {
  it("formatea el nombre con el año", () => {
    expect(termLabel({ name: "Segundo trimestre", year: 2026 })).toBe("Segundo trimestre · 2026");
  });

  it("el estado active se llama En curso (no se confunde con el trimestre activo)", () => {
    expect(TERM_STATUS_LABELS).toEqual({
      active: "En curso",
      finished: "Finalizado",
      archived: "Archivado",
    });
  });
});
