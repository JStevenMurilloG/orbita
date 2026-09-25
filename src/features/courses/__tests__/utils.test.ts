import { describe, expect, it } from "vitest";
import { COURSE_COLORS } from "@/lib/design/course-colors";
import {
  courseToFormValues,
  formatCredits,
  isSingleEmoji,
  moveInOrder,
  suggestCourseColor,
} from "../utils";

describe("isSingleEmoji", () => {
  it.each(["📐", "🧪", "⚖️", "👩🏽‍🔬", "🇨🇴", "1️⃣"])("%s es un emoji", (value) => {
    expect(isSingleEmoji(value)).toBe(true);
  });

  it.each(["", "a", "ab", "📐📚", "📐 ", "Ω"])("%j no es un único emoji", (value) => {
    expect(isSingleEmoji(value)).toBe(false);
  });
});

describe("suggestCourseColor", () => {
  it("empieza por el primer color de la paleta", () => {
    expect(suggestCourseColor([])).toBe(COURSE_COLORS[0]);
  });

  it("elige el primero que el trimestre aún no usa", () => {
    expect(suggestCourseColor(["red", "orange"])).toBe("amber");
    expect(suggestCourseColor(["orange"])).toBe("red");
  });

  it("con todos usados, el menos repetido", () => {
    const all = [...COURSE_COLORS, ...COURSE_COLORS.filter((color) => color !== "teal")];
    expect(suggestCourseColor(all)).toBe("teal");
  });
});

describe("moveInOrder", () => {
  const ids = ["a", "b", "c"];

  it("mueve una posición antes o después", () => {
    expect(moveInOrder(ids, "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveInOrder(ids, "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("no mueve más allá de los extremos ni ids desconocidos", () => {
    expect(moveInOrder(ids, "a", -1)).toBeNull();
    expect(moveInOrder(ids, "c", 1)).toBeNull();
    expect(moveInOrder(ids, "z", 1)).toBeNull();
  });
});

describe("formatCredits", () => {
  it("usa coma decimal y singular/plural", () => {
    expect(formatCredits(1)).toBe("1 crédito");
    expect(formatCredits(3)).toBe("3 créditos");
    expect(formatCredits(4.5)).toBe("4,5 créditos");
  });
});

describe("courseToFormValues", () => {
  it("convierte null en cadenas vacías y los créditos a texto con coma", () => {
    expect(
      courseToFormValues({
        id: "1",
        user_id: "u",
        term_id: "t",
        name: "Química",
        code: null,
        description: null,
        color: "green",
        icon: null,
        room: "Lab 3",
        credits: 2.5,
        position: 0,
        deleted_at: null,
        created_at: "",
        updated_at: "",
      }),
    ).toEqual({
      name: "Química",
      code: "",
      description: "",
      color: "green",
      icon: "",
      room: "Lab 3",
      credits: "2,5",
    });
  });
});
