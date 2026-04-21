'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useLanguage } from '@/components/common/LanguageProvider'
import { toHeadingCase } from '@/lib/headingCase'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: 'primary' | 'success' | 'warning' | 'error' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
  delay?: number
}

export function Card({ children, className, hover = false, glow = 'none', padding = 'md', onClick, delay = 0 }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-2.5 sm:p-3',
    md: 'p-3.5 sm:p-5',
    lg: 'p-4 sm:p-6 lg:p-7',
  }

  const glows = {
    primary: 'shadow-[0_0_20px_rgba(0,212,255,0.1)] border-primary/20',
    success: 'shadow-[0_0_20px_rgba(16,185,129,0.1)] border-success/20',
    warning: 'shadow-[0_0_20px_rgba(245,158,11,0.1)] border-warning/20',
    error: 'shadow-[0_0_20px_rgba(239,68,68,0.1)] border-error/20',
    none: '',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -2 } : undefined}
      className={cn(
        'bg-card border border-border rounded-xl transition-colors duration-200',
        hover && 'cursor-pointer hover:bg-card-hover hover:border-border-strong',
        glow !== 'none' && glows[glow],
        paddings[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  const { locale } = useLanguage()
  const headingLocale = locale === 'tr' ? 'tr' : 'en'
  const rendered = typeof children === 'string' ? toHeadingCase(children, headingLocale) : children
  return <h3 className={cn('text-sm font-semibold text-text-primary', className)}>{rendered}</h3>
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-xs text-text-tertiary mt-0.5', className)}>{children}</p>
}
