import { courseColorStyle, type CourseColor } from "@/lib/design/course-colors";
import { cn } from "@/lib/utils";

/** Distintivo de una clase: su emoji o, si no tiene, la inicial, sobre el color de la clase. */
export function CourseIcon({
  icon,
  name,
  color,
  size = "md",
}: {
  icon: string | null;
  name: string;
  color: CourseColor;
  size?: "md" | "lg";
}) {
  return (
    <span
      aria-hidden
      style={courseColorStyle(color)}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border font-semibold",
        size === "md" ? "size-10 text-lg" : "size-12 text-2xl",
      )}
    >
      {icon ?? name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
