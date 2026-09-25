"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { toResult, type Result } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  createTermSchema,
  deleteTermSchema,
  setActiveTermSchema,
  termIdSchema,
  updateTermSchema,
} from "./schemas";
import * as termService from "./service";
import type { Term, TermSummary, TermTransition } from "./types";

type TermWithOverlaps = { term: Term; overlaps: TermSummary[] };

/** El trimestre activo y la lista de trimestres se muestran en el layout de toda la app. */
function revalidateApp() {
  revalidatePath("/", "layout");
}

export async function createTermAction(input: unknown): Promise<Result<TermWithOverlaps>> {
  return toResult(async () => {
    const user = await requireUser();
    const data = createTermSchema.parse(input);
    const result = await termService.createTerm(await createClient(), user.id, data);
    revalidateApp();
    return result;
  });
}

export async function updateTermAction(input: unknown): Promise<Result<TermWithOverlaps>> {
  return toResult(async () => {
    await requireUser();
    const data = updateTermSchema.parse(input);
    const result = await termService.updateTerm(await createClient(), data);
    revalidateApp();
    return result;
  });
}

async function transition(input: unknown, kind: TermTransition): Promise<Result<Term>> {
  return toResult(async () => {
    await requireUser();
    const { id } = termIdSchema.parse(input);
    const term = await termService.transitionTerm(await createClient(), id, kind);
    revalidateApp();
    return term;
  });
}

export async function finishTermAction(input: unknown): Promise<Result<Term>> {
  return transition(input, "finish");
}

export async function reopenTermAction(input: unknown): Promise<Result<Term>> {
  return transition(input, "reopen");
}

export async function archiveTermAction(input: unknown): Promise<Result<Term>> {
  return transition(input, "archive");
}

export async function unarchiveTermAction(input: unknown): Promise<Result<Term>> {
  return transition(input, "unarchive");
}

export async function deleteTermAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    await requireUser();
    const data = deleteTermSchema.parse(input);
    await termService.deleteTerm(await createClient(), data);
    revalidateApp();
    return null;
  });
}

export async function setActiveTermAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    const user = await requireUser();
    const { term_id } = setActiveTermSchema.parse(input);
    await termService.setActiveTerm(await createClient(), user.id, term_id);
    revalidateApp();
    return null;
  });
}
