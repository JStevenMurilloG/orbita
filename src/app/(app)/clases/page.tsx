import { redirect } from "next/navigation";
import { getActiveTerm } from "@/features/terms/queries";

/**
 * Atajo a las clases del trimestre activo. Normalmente lo resuelve el proxy con un 307;
 * esto es el respaldo si el proxy no pudo consultar el perfil.
 */
export default async function CoursesShortcutPage() {
  const activeTerm = await getActiveTerm();
  redirect(activeTerm ? `/trimestres/${activeTerm.id}/clases` : "/trimestres");
}
