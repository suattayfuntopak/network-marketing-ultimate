'use client'

import { cn } from '@/lib/utils'

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, value))
}

/** Neon warmth bar (0–100) for contact tables. */
export function ContactWarmthBar({
  score,
  className,
  hideNumeric = false,
}: {
  score: number | null | undefined
  className?: string
  /** Hide the small score line above the bar (e.g. when a floating value is shown next to a slider). */
  hideNumeric?: boolean
}) {
  const pct = clampScore(score ?? 0)
  const gradient =
    pct < 35
      ? 'from-cyan-400 via-sky-500 to-blue-500'
      : pct < 70
        ? 'from-yellow-300 via-amber-500 to-orange-500'
        : 'from-fuchsia-500 via-rose-500 to-red-500'

  return (
    <div className={cn('w-full min-w-[7rem] max-w-[9rem] space-y-1', className)}>
      {!hideNumeric && (
        <div className="flex items-center justify-between text-[11px] tabular-nums text-text-tertiary">
          <span className="text-text-muted">{pct}</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover/80 ring-1 ring-primary/15">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(56,189,248,0.35)]',
            hideNumeric ? '' : 'transition-[width] duration-300',
            gradient,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
