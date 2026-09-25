"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { PlusIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { assignPrimaryTeacherAction } from "../actions";
import type { TeacherOption } from "../types";
import { filterTeachers } from "../utils";
import { TeacherFormDialog } from "./teacher-form-dialog";

const MAX_OPTIONS = 8;

type Option = { kind: "teacher"; teacher: TeacherOption } | { kind: "create"; name: string };

/**
 * Buscador para asignar el docente principal de una clase (plan §13, §24 `TeacherCombobox`):
 * reutiliza un docente existente o crea uno nuevo con el nombre escrito. Patrón combobox
 * de ARIA 1.2 (flechas, Intro, Escape; la opción activa se anuncia con aria-activedescendant).
 */
export function TeacherCombobox({
  courseId,
  teachers,
  excludeTeacherId,
  onAssigned,
  autoFocus,
}: {
  courseId: string;
  teachers: TeacherOption[];
  /** Docente actual (no se ofrece de nuevo). */
  excludeTeacherId?: string;
  onAssigned?: () => void;
  autoFocus?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [creating, setCreating] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = useMemo<Option[]>(() => {
    const matches = filterTeachers(
      teachers.filter((teacher) => teacher.id !== excludeTeacherId),
      query,
    )
      .slice(0, MAX_OPTIONS)
      .map((teacher) => ({ kind: "teacher" as const, teacher }));
    const name = query.trim();
    return name ? [...matches, { kind: "create" as const, name }] : matches;
  }, [teachers, excludeTeacherId, query]);

  const expanded = open && options.length > 0;
  const active = Math.min(activeIndex, options.length - 1);

  const choose = (option: Option) => {
    setOpen(false);
    if (option.kind === "create") {
      setCreating(option.name);
      return;
    }
    startTransition(async () => {
      const result = await assignPrimaryTeacherAction({
        course_id: courseId,
        teacher_id: option.teacher.id,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success(`Se asignó a ${option.teacher.full_name} como docente de la clase.`);
      setQuery("");
      onAssigned?.();
    });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((active + 1) % options.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((active - 1 + options.length) % options.length);
        break;
      case "Enter":
        if (expanded) {
          event.preventDefault();
          choose(options[active]);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        } else {
          setQuery("");
        }
        break;
    }
  };

  return (
    <div className="relative max-w-md">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        Buscar o crear docente
      </label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
        aria-describedby={`${id}-hint`}
        aria-busy={pending || undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder="Nombre o correo del docente"
        value={query}
        disabled={pending}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      <p id={`${id}-hint`} className="mt-2 text-sm text-muted-foreground">
        {teachers.length > 0
          ? "Elige uno de tus docentes o escribe un nombre nuevo para crearlo."
          : "Escribe el nombre del docente para crearlo."}
      </p>
      <ul
        id={listId}
        role="listbox"
        aria-label="Docentes"
        hidden={!expanded}
        className="absolute inset-x-0 top-[4.25rem] z-20 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
      >
        {options.map((option, index) => (
          <li
            key={option.kind === "teacher" ? option.teacher.id : "create"}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            // mousedown en vez de click: evita que el blur del campo cierre la lista antes.
            onMouseDown={(event) => {
              event.preventDefault();
              choose(option);
            }}
            onMouseMove={() => setActiveIndex(index)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              index === active && "bg-accent text-accent-foreground",
            )}
          >
            {option.kind === "teacher" ? (
              <>
                <UserIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 truncate">
                  {option.teacher.full_name}
                  {option.teacher.email ? (
                    <span className="text-muted-foreground"> · {option.teacher.email}</span>
                  ) : null}
                </span>
              </>
            ) : (
              <>
                <PlusIcon className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">Crear docente “{option.name}”</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <TeacherFormDialog
        mode="create"
        courseId={courseId}
        defaultName={creating ?? ""}
        open={creating !== null}
        onOpenChange={(next) => {
          if (!next) setCreating(null);
        }}
        onSaved={() => {
          setQuery("");
          onAssigned?.();
        }}
      />
    </div>
  );
}
