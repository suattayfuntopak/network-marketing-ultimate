'use client'

import { AlertCircle, RotateCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'

interface ErrorCardProps {
  onRetry?: () => void
  message?: string
}

export function ErrorCard({ onRetry, message }: ErrorCardProps) {
  const { t } = useLanguage()
  return (
    <Card padding="lg">
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10">
          <AlertCircle className="h-6 w-6 text-error" />
        </div>
        <p className="text-sm font-semibold text-text-primary">{t.analytics.errorTitle}</p>
        {message && <p className="text-xs text-text-secondary">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-text-primary transition hover:border-border-strong"
          >
            <RotateCw className="h-3.5 w-3.5" />
            {t.analytics.errorRetry}
          </button>
        )}
      </div>
    </Card>
  )
}
