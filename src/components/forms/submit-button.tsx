import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botón de envío con estado "enviando" accesible. */
export function SubmitButton({
  pending,
  children,
  pendingText,
  ...props
}: React.ComponentProps<typeof Button> & { pending: boolean; pendingText?: string }) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending || undefined} {...props}>
      {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
