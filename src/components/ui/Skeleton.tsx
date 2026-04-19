import type { HTMLAttributes } from 'react'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className = '', ...rest }: SkeletonProps) {
  return (
    <div
      {...rest}
      className={`animate-pulse rounded-xl bg-gradient-to-r from-surface/40 via-surface/70 to-surface/40 ${className}`}
    />
  )
}

type SkeletonGridProps = {
  count?: number
  className?: string
  itemClassName?: string
}

export function SkeletonGrid({ count = 6, className = '', itemClassName = 'h-[112px]' }: SkeletonGridProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className={itemClassName} />
      ))}
    </div>
  )
}
