'use client'

import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeadingCase } from '@/hooks/useHeadingCase'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  /** Yarı saydam arka plan + esnek katman (ör. diğer z-50 modalların üstünde onay) */
  overlayClassName?: string
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {
      // no subscription
    },
    () => true,
    () => false,
  )
}

export function Modal({ open, onClose, title, description, children, className, overlayClassName }: ModalProps) {
  const h = useHeadingCase()
  const isClient = useIsClient()
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const tree = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
            overlayClassName,
          )}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              onClose()
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className={cn('w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto', className)}
          >
            {(title || description) && (
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
                <div>
                  {title && <h2 className="text-base font-semibold text-text-primary">{h(title)}</h2>}
                  {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!isClient) return null
  return createPortal(tree, document.body)
}
