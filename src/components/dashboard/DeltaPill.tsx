'use client'

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { DeltaInfo } from './dashboardMetrics'

type DeltaPillProps = {
  delta: DeltaInfo
  label: string
  tone?: 'auto' | 'inverse'
}

export function DeltaPill({ delta, label, tone = 'auto' }: DeltaPillProps) {
  if (delta.neutral) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-2 py-0.5 text-[10px] font-semibold text-text-tertiary">
        <Minus className="h-3 w-3" />
        {label}
      </span>
    )
  }

  const isPositive = tone === 'inverse' ? !delta.positive : delta.positive
  const classes = isPositive
    ? 'border-success/25 bg-success/10 text-success'
    : 'border-error/25 bg-error/10 text-error'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${classes}`}>
      {delta.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {label}
    </span>
  )
}
