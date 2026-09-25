"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { toResult, type Result } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, updateThemeSchema } from "./schemas";
import * as profileService from "./service";
import type { Profile } from "./types";

export async function updateProfileAction(input: unknown): Promise<Result<Profile>> {
  return toResult(async () => {
    const user = await requireUser();
    const data = updateProfileSchema.parse(input);
    const profile = await profileService.updateProfile(await createClient(), user.id, data);
    // Nombre, zona y tema se usan en el layout de toda la app.
    revalidatePath("/", "layout");
    return profile;
  });
}

export async function updateThemeAction(input: unknown): Promise<Result<Profile>> {
  return toResult(async () => {
    const user = await requireUser();
    const data = updateThemeSchema.parse(input);
    const profile = await profileService.updateProfile(await createClient(), user.id, data);
    revalidatePath("/", "layout");
    return profile;
  });
}
