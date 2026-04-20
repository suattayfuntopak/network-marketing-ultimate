'use client'

import { cn } from '@/lib/utils'

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Pastel gradient warmth bar (0–100) for contact tables. */
export function ContactWarmthBar({ score, className }: { score: number | null | undefined; className?: string }) {
  const pct = clampScore(score ?? 0)
  const gradient =
    pct < 35
      ? 'from-sky-400/70 via-cyan-400/60 to-teal-400/50'
      : pct < 70
        ? 'from-amber-400/70 via-orange-400/55 to-rose-400/45'
        : 'from-fuchsia-400/65 via-rose-400/60 to-orange-400/50'

  return (
    <div className={cn('w-full min-w-[7rem] max-w-[9rem] space-y-1', className)}>
      <div className="flex items-center justify-between text-[11px] tabular-nums text-text-tertiary">
        <span className="text-text-muted">{pct}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover/80 ring-1 ring-primary/10">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-[width] duration-300', gradient)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
