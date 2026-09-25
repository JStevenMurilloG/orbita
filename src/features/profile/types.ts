import type { Tables } from "@/types/database";
import type { Theme } from "./schemas";

export type Profile = Omit<Tables<"profiles">, "theme"> & { theme: Theme };
