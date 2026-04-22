'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { fetchContacts, updateContactStage } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import { stageMeta } from '@/components/contacts/contactLabels'
import { Plus, GripVertical } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const PIPELINE_STAGES = [
  { stage: 'new', color: '#64748b' },
  { stage: 'contact_planned', color: '#8b5cf6' },
  { stage: 'first_contact', color: '#6366f1' },
  { stage: 'interested', color: '#0ea5e9' },
  { stage: 'invited', color: '#06b6d4' },
  { stage: 'presentation_sent', color: '#14b8a6' },
  { stage: 'presentation_done', color: '#f97316' },
  { stage: 'followup_pending', color: '#f59e0b' },
  { stage: 'objection_handling', color: '#f97316' },
  { stage: 'ready_to_buy', color: '#22c55e' },
  { stage: 'became_customer', color: '#10b981' },
  { stage: 'ready_to_join', color: '#a855f7' },
  { stage: 'became_member', color: '#d946ef' },
  { stage: 'nurture_later', color: '#64748b' },
  { stage: 'dormant', color: '#475569' },
  { stage: 'lost', color: '#334155' },
] as const

export default function PipelinePage() {
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const qc = useQueryClient()
  const router = useRouter()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const currentLocale = locale === 'tr' ? 'tr' : 'en'

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      updateContactStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: ['contacts'] })
      const previousContacts = qc.getQueryData<ContactRow[]>(['contacts'])
      qc.setQueryData<ContactRow[]>(['contacts'], old =>
        old ? old.map(c => c.id === id ? { ...c, pipeline_stage: stage } : c) : []
      )
      return { previousContacts }
    },
    onError: (err, variables, context) => {
      if (context?.previousContacts) {
        qc.setQueryData(['contacts'], context.previousContacts)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const byStage = (stage: string) => contacts.filter(c => c.pipeline_stage === stage)
  const totalVisible = contacts.filter((c) => c.status !== 'inactive').length

  function handleDrop(stage: string) {
    if (draggedId) {
      const contact = contacts.find(c => c.id === draggedId)
      if (contact && contact.pipeline_stage !== stage) {
        stageMutation.mutate({ id: draggedId, stage })
      }
    }
    setDraggedId(null)
    setDragOverStage(null)
  }

  function maybeAutoScrollOnDrag(clientX: number) {
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const edgeThreshold = 110
    const scrollStep = 20
    if (clientX < rect.left + edgeThreshold) {
      board.scrollBy({ left: -scrollStep })
    } else if (clientX > rect.right - edgeThreshold) {
      board.scrollBy({ left: scrollStep })
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1700px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{h(t.pipeline.title)}</h1>
          <p className="text-base text-text-secondary mt-1">{totalVisible} {t.contacts.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push('/contacts?segment=prospects&new=1')}
            className="text-sm"
          >
            {currentLocale === 'tr' ? 'Sürece Kontak Ekle' : 'Add Contact to Pipeline'}
          </Button>
        </div>
      </motion.div>

      {/* Kanban Board */}
      <motion.div
        ref={boardRef}
        variants={item}
        className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0"
        onDragOver={(event) => maybeAutoScrollOnDrag(event.clientX)}
      >
        {PIPELINE_STAGES.map((stage) => {
          const stageContacts = byStage(stage.stage)
          return (
            <div
              key={stage.stage}
              className="w-[260px] shrink-0 sm:w-[280px]"
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.stage); maybeAutoScrollOnDrag(e.clientX) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.stage)}
            >
              {/* Column Header */}
              <div
                className="mb-2 flex items-center justify-between gap-2 rounded-t-xl border border-b-0 px-3 py-2.5"
                style={{ borderColor: `${stage.color}66`, backgroundColor: `${stage.color}14` }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="truncate text-sm font-semibold text-text-primary/95">{stageMeta(stage.stage)[currentLocale]}</span>
                  <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-text-tertiary ring-1 ring-border-subtle">
                    {stageContacts.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className={`min-h-[220px] space-y-2.5 rounded-b-xl border border-border-subtle p-2.5 transition-colors ${
                dragOverStage === stage.stage
                  ? 'bg-primary/8 border-primary/40'
                  : 'bg-surface/30 border-border-subtle'
              }`}>
                {stageContacts.map((contact, i) => (
                  <motion.div
                    layout
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                    draggable
                    onDragStart={() => setDraggedId(contact.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="group cursor-grab rounded-xl border border-border bg-card px-3 py-2.5 transition-all hover:border-border-strong hover:bg-card-hover active:cursor-grabbing"
                    style={{ opacity: draggedId === contact.id ? 0.5 : 1 }}
                    onClick={() => router.push(`/contacts?contact=${contact.id}`)}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{contact.full_name}</p>
                      <GripVertical className="h-4 w-4 shrink-0 text-text-muted opacity-40 transition-opacity group-hover:opacity-80" aria-hidden />
                    </div>
                    <p className="mt-1 truncate text-xs text-text-tertiary">
                      {[contact.location, contact.profession].filter(Boolean).join(' · ') || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact')}
                    </p>
                    <div className="mt-2 text-sm font-semibold text-warning">
                      {Math.min(100, Math.max(0, Math.round(contact.temperature_score ?? 0)))} - {t.temperature[contact.temperature]}
                    </div>
                  </motion.div>
                ))}
                {stageContacts.length === 0 && (
                  <div className="flex items-center justify-center h-28 text-sm text-text-muted">
                    {t.pipeline.dropHere}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
