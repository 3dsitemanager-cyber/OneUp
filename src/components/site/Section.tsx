import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <span className="inline-block border-l-4 border-primary pl-2.5 text-[11px] font-bold tracking-[0.22em] text-primary">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2.5 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
        {subtitle && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-foreground">
      {children}
    </span>
  );
}
