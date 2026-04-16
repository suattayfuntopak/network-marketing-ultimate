'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default'
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

export function Badge({ children, variant = 'default', size = 'sm', className, dot }: BadgeProps) {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-error/10 text-error border-error/20',
    default: 'bg-surface-hover text-text-secondary border-border',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    default: 'bg-text-tertiary',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-semibold rounded-full border tracking-wide',
      variants[variant],
      sizes[size],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}

export function TemperatureBadge({ temperature, score }: { temperature: string; score?: number }) {
  const config: Record<string, { label: string; className: string }> = {
    hot: { label: 'Hot', className: 'bg-error/15 text-red-400 border-error/25' },
    warm: { label: 'Warm', className: 'bg-warning/15 text-amber-400 border-warning/25' },
    cold: { label: 'Cold', className: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
    frozen: { label: 'Frozen', className: 'bg-slate-600/15 text-slate-500 border-slate-600/25' },
  }

  const c = config[temperature] || config.cold

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full border tracking-wide',
      c.className
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {c.label}
      {score !== undefined && <span className="opacity-70">{score}</span>}
    </span>
  )
}
