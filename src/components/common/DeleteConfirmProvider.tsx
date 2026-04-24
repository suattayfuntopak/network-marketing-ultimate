'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'

export type DeleteConfirmRequest = {
  /** Shown under the standard warning (e.g. record name). */
  detail?: string
  onConfirm: () => void | Promise<void>
}

type DeleteConfirmContextValue = {
  requestDelete: (request: DeleteConfirmRequest) => void
}

const DeleteConfirmContext = createContext<DeleteConfirmContextValue | null>(null)

export function DeleteConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const pendingRef = useRef<(() => void | Promise<void>) | null>(null)

  const close = useCallback(() => {
    if (busy) return
    setOpen(false)
    pendingRef.current = null
  }, [busy])

  const requestDelete = useCallback((request: DeleteConfirmRequest) => {
    pendingRef.current = request.onConfirm
    setOpen(true)
  }, [])

  const confirm = useCallback(async () => {
    const run = pendingRef.current
    if (!run || busy) return
    setBusy(true)
    try {
      await run()
      setOpen(false)
      pendingRef.current = null
    } finally {
      setBusy(false)
    }
  }, [busy])

  const value = useMemo(() => ({ requestDelete }), [requestDelete])

  return (
    <DeleteConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={open}
        onClose={close}
        overlayClassName="z-[200]"
      >
        <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
          <h2 className="text-base font-semibold text-text-primary">{t.common.deleteConfirmTitle}</h2>
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              {t.common.cancel}
            </Button>
            <Button type="button" variant="danger" loading={busy} onClick={() => void confirm()}>
              {t.common.deleteConfirmConfirm}
            </Button>
          </div>
        </div>
      </Modal>
    </DeleteConfirmContext.Provider>
  )
}

export function useDeleteConfirm() {
  const ctx = useContext(DeleteConfirmContext)
  if (!ctx) {
    throw new Error('useDeleteConfirm must be used within DeleteConfirmProvider')
  }
  return ctx
}
