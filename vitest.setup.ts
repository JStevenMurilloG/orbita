import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// `server-only` lanza fuera del entorno de React Server; en tests se neutraliza.
vi.mock("server-only", () => ({}));
