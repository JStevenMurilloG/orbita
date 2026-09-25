"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { toResult, type Result } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { courseTeacherSchema, createTeacherSchema, updateTeacherSchema } from "./schemas";
import * as teacherService from "./service";
import type { Teacher } from "./types";

/** El docente se muestra en el espacio de cada clase que imparte. */
function revalidateCourseSpaces() {
  revalidatePath("/clases", "layout");
}

export async function createTeacherAction(input: unknown): Promise<Result<Teacher>> {
  return toResult(async () => {
    await requireUser();
    const data = createTeacherSchema.parse(input);
    const teacher = await teacherService.createTeacher(await createClient(), data);
    revalidateCourseSpaces();
    return teacher;
  });
}

export async function updateTeacherAction(input: unknown): Promise<Result<Teacher>> {
  return toResult(async () => {
    await requireUser();
    const data = updateTeacherSchema.parse(input);
    const teacher = await teacherService.updateTeacher(await createClient(), data);
    revalidateCourseSpaces();
    return teacher;
  });
}

export async function assignPrimaryTeacherAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    await requireUser();
    const { course_id, teacher_id } = courseTeacherSchema.parse(input);
    await teacherService.setPrimaryTeacher(await createClient(), course_id, teacher_id);
    revalidateCourseSpaces();
    return null;
  });
}

export async function unassignTeacherAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    await requireUser();
    const { course_id, teacher_id } = courseTeacherSchema.parse(input);
    await teacherService.unassignTeacher(await createClient(), course_id, teacher_id);
    revalidateCourseSpaces();
    return null;
  });
}
