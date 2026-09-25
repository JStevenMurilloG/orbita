"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { toResult, type Result } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  courseIdSchema,
  createCourseSchema,
  reorderCoursesSchema,
  updateCourseSchema,
} from "./schemas";
import * as courseService from "./service";
import type { Course } from "./types";

/** Las clases aparecen en la lista del trimestre, en su espacio y (Fase 5) en Hoy. */
function revalidateCourses() {
  revalidatePath("/", "layout");
}

export async function createCourseAction(input: unknown): Promise<Result<Course>> {
  return toResult(async () => {
    await requireUser();
    const data = createCourseSchema.parse(input);
    const course = await courseService.createCourse(await createClient(), data);
    revalidateCourses();
    return course;
  });
}

export async function updateCourseAction(input: unknown): Promise<Result<Course>> {
  return toResult(async () => {
    await requireUser();
    const data = updateCourseSchema.parse(input);
    const course = await courseService.updateCourse(await createClient(), data);
    revalidateCourses();
    return course;
  });
}

export async function deleteCourseAction(input: unknown): Promise<Result<Course>> {
  return toResult(async () => {
    await requireUser();
    const { id } = courseIdSchema.parse(input);
    const course = await courseService.softDeleteCourse(await createClient(), id);
    revalidateCourses();
    return course;
  });
}

export async function restoreCourseAction(input: unknown): Promise<Result<Course>> {
  return toResult(async () => {
    await requireUser();
    const { id } = courseIdSchema.parse(input);
    const course = await courseService.restoreCourse(await createClient(), id);
    revalidateCourses();
    return course;
  });
}

export async function reorderCoursesAction(input: unknown): Promise<Result<null>> {
  return toResult(async () => {
    await requireUser();
    const data = reorderCoursesSchema.parse(input);
    await courseService.reorderCourses(await createClient(), data);
    revalidateCourses();
    return null;
  });
}
