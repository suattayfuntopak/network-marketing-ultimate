'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { fetchContacts, updateContactStage } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import { Plus, Phone, MessageCircle, GripVertical } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const PIPELINE_STAGES = [
  { stage: 'new',                label: 'Yeni Potansiyel',      color: '#64748b' },
  { stage: 'contact_planned',    label: 'İletişim Planlandı',   color: '#8b5cf6' },
  { stage: 'first_contact',      label: 'İlk İletişim',         color: '#6366f1' },
  { stage: 'interested',         label: 'İlgileniyor',           color: '#0ea5e9' },
  { stage: 'invited',            label: 'Davet Edildi',          color: '#06b6d4' },
  { stage: 'presentation_sent',  label: 'Sunum Gönderildi',     color: '#14b8a6' },
  { stage: 'followup_pending',   label: 'Takip Bekleniyor',     color: '#f59e0b' },
  { stage: 'objection_handling', label: 'İtiraz Yönetimi',      color: '#f97316' },
  { stage: 'ready_to_buy',       label: 'Satın Almaya Hazır',   color: '#22c55e' },
  { stage: 'became_customer',    label: 'Müşteri',              color: '#10b981' },
  { stage: 'ready_to_join',      label: 'Katılmaya Hazır',      color: '#a855f7' },
  { stage: 'became_member',      label: 'Ekip Üyesi',           color: '#d946ef' },
  { stage: 'nurture_later',      label: 'Sonra İlgilen',        color: '#64748b' },
  { stage: 'dormant',            label: 'Pasif',                color: '#475569' },
  { stage: 'lost',               label: 'Kaybedildi',           color: '#334155' },
]

const INTEREST_LABELS: Record<string, { tr: string; en: string }> = {
  product:  { tr: 'Ürün', en: 'Product' },
  business: { tr: 'İş', en: 'Business' },
  both:     { tr: 'Her İkisi', en: 'Both' },
  unknown:  { tr: 'Bilinmiyor', en: 'Unknown' },
}

export default function PipelinePage() {
  const { t, locale } = useLanguage()
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

  const interestLabel = (type: string | null) => {
    if (!type) return null
    return INTEREST_LABELS[type]?.[locale] ?? type
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
      <motion.div variants={item} className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        {PIPELINE_STAGES.map((stage) => {
          const stageContacts = byStage(stage.stage)
          return (
            <div
              key={stage.stage}
              className="flex-shrink-0 w-[280px]"
              onDragOver={e => { e.preventDefault(); setDragOverStage(stage.stage) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.stage)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-semibold text-text-primary">{stage.label}</span>
                  <span className="text-[10px] font-bold text-text-tertiary bg-surface-hover px-1.5 py-0.5 rounded-full">{stageContacts.length}</span>
                </div>
                <button onClick={() => router.push('/contacts?segment=prospects&new=1')} className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Cards */}
              <div className={`space-y-2 min-h-[200px] rounded-xl p-2 border transition-colors ${
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
                    className="bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-border-strong hover:bg-card-hover transition-all group"
                    style={{ opacity: draggedId === contact.id ? 0.5 : 1 }}
                    onClick={() => router.push(`/contacts?contact=${contact.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={contact.full_name} size="xs" />
                        <div>
                          <p className="text-sm font-medium text-text-primary">{contact.full_name}</p>
                          {contact.profession && <p className="text-[10px] text-text-tertiary">{contact.profession}</p>}
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                      {contact.interest_type && contact.interest_type !== 'unknown' && (
                        <Badge variant={contact.interest_type === 'business' ? 'secondary' : 'success'} size="sm">
                          {interestLabel(contact.interest_type)}
                        </Badge>
                      )}
                    </div>
                    {contact.next_follow_up_date && (
                      <p className="text-[10px] text-text-tertiary mt-2">
                        {t.common.next}: {new Date(contact.next_follow_up_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={event => { event.stopPropagation(); if (contact.phone) window.location.href = `tel:${contact.phone}` }}
                        className="p-1 rounded text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                      <button
                        onClick={event => { event.stopPropagation(); if (contact.phone) window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank') }}
                        className="p-1 rounded text-text-tertiary hover:text-success hover:bg-success/10 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
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
