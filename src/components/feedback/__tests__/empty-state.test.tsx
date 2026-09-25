import { render, screen } from "@testing-library/react";
import { SunIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("muestra título, descripción y acción", () => {
    render(
      <EmptyState
        icon={SunIcon}
        title="Sin clases hoy"
        description="Disfruta tu día libre."
        action={<button type="button">Ver horario</button>}
      />,
    );
    expect(screen.getByText("Sin clases hoy")).toBeInTheDocument();
    expect(screen.getByText("Disfruta tu día libre.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver horario" })).toBeInTheDocument();
  });
});
