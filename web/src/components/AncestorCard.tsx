import { Link } from "react-router-dom";
import type { AncestorListItem } from "../api/client";

interface Props {
  ancestor: AncestorListItem;
}

export function AncestorCard({ ancestor }: Props) {
  const dates =
    ancestor.birth_year && ancestor.death_year
      ? `${ancestor.birth_year}-${ancestor.death_year}`
      : null;
  return (
    <Link
      to={`/chat/${ancestor.id}`}
      data-testid="ancestor-card"
      className="block bg-card border border-border rounded-lg p-3.5 hover:bg-card-raise hover:border-border-strong transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-mono text-[13px] text-fg truncate">{ancestor.name}</h3>
        {dates && (
          <span className="badge badge-secondary font-mono">{dates}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="badge badge-default">{ancestor.relation}</span>
        <span className="text-[11px] text-micro-fg font-mono">→</span>
      </div>
    </Link>
  );
}
