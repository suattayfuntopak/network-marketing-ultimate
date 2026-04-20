'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { fetchContacts, updateContactStage } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import { Plus, GripVertical } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const PIPELINE_STAGES = [
  { stage: 'new',                label: 'Yeni Potansiyel',      color: '#64748b' },
  { stage: 'contact_planned',    label: 'İletişim Planlandı',   color: '#8b5cf6' },
  { stage: 'first_contact',      label: 'İlk İletişim',         color: '#6366f1' },
  { stage: 'interested',         label: 'İlgileniyor',           color: '#0ea5e9' },
  { stage: 'invited',            label: 'Davet Edildi',          color: '#06b6d4' },
  { stage: 'presentation_sent',  label: 'Sunum Gönderildi',     color: '#14b8a6' },
  { stage: 'presentation_done',  label: 'Sunum Yapıldı',        color: '#f97316' },
  { stage: 'followup_pending',   label: 'Takip Ediliyor',       color: '#f59e0b' },
  { stage: 'objection_handling', label: 'İtiraz Yönetimi',      color: '#f97316' },
  { stage: 'ready_to_buy',       label: 'Karar Aşamasında',     color: '#22c55e' },
  { stage: 'became_customer',    label: 'Müşteri',              color: '#10b981' },
  { stage: 'ready_to_join',      label: 'Katılmaya Hazır',      color: '#a855f7' },
  { stage: 'became_member',      label: 'Ekip Üyesi',           color: '#d946ef' },
  { stage: 'nurture_later',      label: 'Sonra İlgilen',        color: '#64748b' },
  { stage: 'dormant',            label: 'Pasif',                color: '#475569' },
  { stage: 'lost',               label: 'Kaybedildi',           color: '#334155' },
]

export default function PipelinePage() {
  const { t } = useLanguage()
  const qc = useQueryClient()
  const router = useRouter()
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)

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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.pipeline.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.pipeline.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => router.push('/contacts?segment=prospects&new=1')}>{t.pipeline.addToPipeline}</Button>
      </motion.div>

      {/* Kanban Board */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0">
        {PIPELINE_STAGES.map((stage) => {
          const stageContacts = byStage(stage.stage)
          return (
            <div
              key={stage.stage}
              className="w-[200px] shrink-0 sm:w-[210px]"
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.stage) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.stage)}
            >
              {/* Column Header */}
              <div className="mb-2 flex items-center justify-between gap-1 px-0.5">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="truncate text-xs font-semibold text-text-primary">{stage.label}</span>
                  <span className="shrink-0 rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-bold text-text-tertiary">
                    {stageContacts.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/contacts?segment=prospects&new=1')}
                  className="shrink-0 rounded-md p-0.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                  aria-label={t.pipeline.addToPipeline}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <div className={`min-h-[140px] space-y-1.5 rounded-lg border p-1.5 transition-colors ${
                dragOverStage === stage.stage
                  ? 'bg-primary/5 border-primary/30'
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
                    className="group cursor-grab rounded-lg border border-border bg-card px-2 py-1.5 transition-all hover:border-border-strong hover:bg-card-hover active:cursor-grabbing"
                    style={{ opacity: draggedId === contact.id ? 0.5 : 1 }}
                    onClick={() => router.push(`/contacts?contact=${contact.id}`)}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">{contact.full_name}</p>
                      <GripVertical className="h-3.5 w-3.5 shrink-0 text-text-muted opacity-40 transition-opacity group-hover:opacity-80" aria-hidden />
                    </div>
                  </motion.div>
                ))}
                {stageContacts.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-xs text-text-muted">
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
