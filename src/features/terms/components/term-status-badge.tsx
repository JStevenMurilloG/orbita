import { ArchiveIcon, CircleCheckIcon, CircleDotIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TERM_STATUS_LABELS } from "../labels";
import type { TermStatus } from "../schemas";

const ICONS = {
  active: CircleDotIcon,
  finished: CircleCheckIcon,
  archived: ArchiveIcon,
} satisfies Record<TermStatus, unknown>;

export function TermStatusBadge({ status }: { status: TermStatus }) {
  const Icon = ICONS[status];
  return (
    <Badge variant={status === "active" ? "secondary" : "outline"} data-status={status}>
      <Icon aria-hidden data-icon="inline-start" />
      {TERM_STATUS_LABELS[status]}
    </Badge>
  );
}
