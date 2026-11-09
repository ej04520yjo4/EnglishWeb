import type { CSSProperties } from "react";

export function ProgressRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="progress-ring" style={{ "--progress": `${value * 3.6}deg` } as CSSProperties}>
      <div>
        <strong>{value}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  testId,
}: {
  label: string;
  value: string | number;
  note?: string;
  testId?: string;
}) {
  return (
    <article className="stat-card" data-testid={testId}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
