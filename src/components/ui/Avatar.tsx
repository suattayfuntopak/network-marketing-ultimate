'use client'

import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  status?: 'online' | 'offline' | 'busy' | 'away'
}

const sizes = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-text-tertiary',
  busy: 'bg-error',
  away: 'bg-warning',
}

const statusSizes = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
}

const gradients = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-indigo-500 to-blue-600',
]

function getGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradients[Math.abs(hash) % gradients.length]
}

export function Avatar({ name, src, size = 'md', className, status }: AvatarProps) {
  const initials = getInitials(name)
  const gradient = getGradient(name)

  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={imageSizes[size]}
          height={imageSizes[size]}
          unoptimized
          className={cn('rounded-full object-cover', sizes[size])}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white',
          sizes[size],
          gradient
        )}>
          {initials}
        </div>
      )}
      {status && (
        <span className={cn(
          'absolute bottom-0 right-0 rounded-full border-2 border-card',
          statusColors[status],
          statusSizes[size]
        )} />
      )}
    </div>
  )
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: { names: string[]; max?: number; size?: 'xs' | 'sm' | 'md' }) {
  const visible = names.slice(0, max)
  const remaining = names.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((name, i) => (
        <div key={i} className="ring-2 ring-card rounded-full">
          <Avatar name={name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full bg-surface-hover flex items-center justify-center font-semibold text-text-secondary ring-2 ring-card',
          sizes[size]
        )}>
          +{remaining}
        </div>
      )}
    </div>
  )
}
