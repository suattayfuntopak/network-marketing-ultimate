'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, addContact } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import {
  Search, Plus, Grid3X3, List, Phone, MessageCircle,
  Mail, Flame, Download, Upload, Users, X,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const PIPELINE_STAGES: Record<string, { label: string; color: string }> = {
  new:                { label: 'Yeni Potansiyel',      color: '#00d4ff' },
  contact_planned:    { label: 'İletişim Planlandı',   color: '#3b82f6' },
  first_contact:      { label: 'İlk İletişim',         color: '#8b5cf6' },
  interested:         { label: 'İlgileniyor',           color: '#a855f7' },
  invited:            { label: 'Davet Edildi',          color: '#f59e0b' },
  presentation_sent:  { label: 'Sunum Gönderildi',     color: '#f97316' },
  followup_pending:   { label: 'Takip Bekleniyor',     color: '#ef4444' },
  objection_handling: { label: 'İtiraz Yönetimi',      color: '#dc2626' },
  ready_to_buy:       { label: 'Satın Almaya Hazır',   color: '#10b981' },
  became_customer:    { label: 'Müşteri Oldu',         color: '#059669' },
  ready_to_join:      { label: 'Katılmaya Hazır',      color: '#06b6d4' },
  became_member:      { label: 'Ekip Üyesi',           color: '#6366f1' },
  nurture_later:      { label: 'Sonra İlgilen',        color: '#64748b' },
  dormant:            { label: 'Pasif',                color: '#475569' },
  lost:               { label: 'Kaybedildi',           color: '#334155' },
}

const INTEREST_KEY: Record<string, 'product' | 'business' | 'both' | 'unknown'> = {
  product: 'product', business: 'business', both: 'both', unknown: 'unknown',
}

const EMPTY_FORM = {
  full_name: '', phone: '', email: '', profession: '', location: '',
  temperature: 'cold' as 'cold' | 'warm' | 'hot' | 'frozen',
  interest_type: 'unknown' as 'product' | 'business' | 'both' | 'unknown',
  source: '', notes: '',
}

export default function ProspectsPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const importInputRef = useRef<HTMLInputElement>(null)

  const interestLabel = (type: string) =>
    t.interest?.[INTEREST_KEY[type] ?? 'unknown'] ?? type
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTemp, setFilterTemp] = useState<string>('all')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const routeModalOpen = searchParams.get('new') === '1'
  const isModalOpen = modalOpen || routeModalOpen

  function closeModal() {
    setModalOpen(false)
    if (routeModalOpen) {
      router.push('/prospects')
    }
  }

  function exportContacts() {
    const headers = [
      'full_name',
      'phone',
      'email',
      'profession',
      'location',
      'temperature',
      'interest_type',
      'source',
      'pipeline_stage',
      'last_contact_date',
      'next_follow_up_date',
      'notes',
    ]

    const rows = contacts.map(contact => ([
      contact.full_name,
      contact.phone ?? '',
      contact.email ?? '',
      contact.profession ?? '',
      contact.location ?? '',
      contact.temperature,
      contact.interest_type,
      contact.source ?? '',
      contact.pipeline_stage,
      contact.last_contact_date ?? '',
      contact.next_follow_up_date ?? '',
      contact.goals_notes ?? '',
    ]))

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nmu-prospects-${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    setImporting(true)
    setImportMessage('')

    try {
      const text = await file.text()
      const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)

      if (!headerLine) {
        throw new Error('CSV bos.')
      }

      const headers = headerLine.split(',').map(header => header.trim().replace(/^"|"$/g, ''))
      const importedRows = lines
        .map(line => {
          const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)|(?<=,)(?=,)/g) ?? []
          const normalizedValues = values.map(value => value.replace(/^"|"$/g, '').replace(/""/g, '"'))
          return headers.reduce<Record<string, string>>((accumulator, header, index) => {
            accumulator[header] = normalizedValues[index] ?? ''
            return accumulator
          }, {})
        })
        .filter(row => row.full_name?.trim())

      if (importedRows.length === 0) {
        throw new Error('Iceride aktarilacak gecerli kayit bulunamadi.')
      }

      for (const row of importedRows) {
        await addContact(currentUser.id, {
          full_name: row.full_name.trim(),
          phone: row.phone || undefined,
          email: row.email || undefined,
          profession: row.profession || undefined,
          location: row.location || undefined,
          temperature: (row.temperature as 'cold' | 'warm' | 'hot' | 'frozen') || 'cold',
          interest_type: (row.interest_type as 'product' | 'business' | 'both' | 'unknown') || 'unknown',
          source: row.source || undefined,
          notes: row.notes || undefined,
          pipeline_stage: row.pipeline_stage || undefined,
        })
      }

      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setImportMessage(`${importedRows.length} kayit ice aktarildi.`)
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Ice aktarma sirasinda hata olustu.')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  const { data: contacts = [], isLoading } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  async function handleAddContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!currentUser) return
    if (!form.full_name.trim()) { setFormError('Ad Soyad zorunludur.'); return }
    setSaving(true)
    setFormError('')
    try {
      await addContact(currentUser.id, {
        full_name: form.full_name.trim(),
        phone: form.phone || undefined,
        email: form.email || undefined,
        profession: form.profession || undefined,
        location: form.location || undefined,
        temperature: form.temperature,
        interest_type: form.interest_type,
        source: form.source || undefined,
        notes: form.notes || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: ['contacts'] })
      closeModal()
      setForm(EMPTY_FORM)
    } catch {
      setFormError('Kayıt sırasında hata oluştu.')
    }
    setSaving(false)
  }

  const filtered = contacts.filter(c => {
    if (searchQuery && !c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (filterTemp !== 'all' && c.temperature !== filterTemp) return false
    if (filterStage !== 'all' && c.pipeline_stage !== filterStage) return false
    return true
  })

  const hotCount  = contacts.filter(c => c.temperature === 'hot').length
  const warmCount = contacts.filter(c => c.temperature === 'warm').length
  const coldCount = contacts.filter(c => c.temperature === 'cold').length

  return (
    <>
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.prospects.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{contacts.length} {t.prospects.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="outline"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => importInputRef.current?.click()}
            loading={importing}
          >
            {t.prospects.importContacts}
          </Button>
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={exportContacts}>
            {t.prospects.exportContacts}
          </Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setModalOpen(true)}>{t.prospects.addProspect}</Button>
        </div>
      </motion.div>

      {importMessage && (
        <motion.div variants={item}>
          <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm text-text-secondary">
            {importMessage}
          </div>
        </motion.div>
      )}

      {/* Temperature Summary */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { key: 'hot',  count: hotCount,  label: t.prospects.hotLeads,  icon: Flame, bg: 'bg-error/15',       color: 'text-error'    },
          { key: 'warm', count: warmCount, label: t.prospects.warmLeads, icon: Flame, bg: 'bg-warning/15',     color: 'text-warning'  },
          { key: 'cold', count: coldCount, label: t.prospects.coldLeads, icon: Flame, bg: 'bg-slate-500/15',   color: 'text-slate-400' },
        ].map(({ key, count, label, icon: Icon, bg, color }) => (
          <div
            key={key}
            onClick={() => setFilterTemp(filterTemp === key ? 'all' : key)}
            className={`bg-card border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors ${filterTemp === key ? 'border-primary/40' : 'border-border'}`}
          >
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{count}</p>
              <p className="text-xs text-text-tertiary">{label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.prospects.searchPlaceholder}
            className="w-full h-10 pl-10 pr-4 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            className="h-10 px-3 bg-surface border border-border rounded-xl text-sm text-text-primary outline-none"
          >
            <option value="all">{t.prospects.allStages}</option>
            {Object.entries(PIPELINE_STAGES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div variants={item}>
        {isLoading ? (
          <div className="py-16 text-center text-sm text-text-tertiary">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              {searchQuery || filterTemp !== 'all' || filterStage !== 'all'
                ? 'Filtreyle eşleşen kişi yok'
                : 'Henüz potansiyel müşteri eklenmemiş'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {[t.prospects.contact, t.prospects.stage, t.prospects.temperature,
                      t.prospects.interest, t.prospects.lastContact, t.prospects.nextFollowUp, t.prospects.actions
                    ].map((h, i) => (
                      <th key={i} className={`text-[10px] font-semibold text-text-tertiary uppercase tracking-wider px-4 py-3 ${i === 6 ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact, i) => {
                    const stage = PIPELINE_STAGES[contact.pipeline_stage]
                    return (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-b border-border-subtle hover:bg-surface/50 cursor-pointer group transition-colors"
                        onClick={() => router.push(`/contacts?contact=${contact.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={contact.full_name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-text-primary">{contact.full_name}</p>
                              <p className="text-[10px] text-text-tertiary">
                                {[contact.profession, contact.location].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {stage ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              style={{ backgroundColor: `${stage.color}15`, color: stage.color, borderColor: `${stage.color}25` }}>
                              {stage.label}
                            </span>
                          ) : (
                            <span className="text-xs text-text-muted">{contact.pipeline_stage}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={contact.interest_type === 'business' ? 'secondary' : contact.interest_type === 'product' ? 'success' : 'primary'}
                            size="sm"
                          >
                            {interestLabel(contact.interest_type)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-secondary">
                            {contact.last_contact_date
                              ? new Date(contact.last_contact_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-text-secondary">
                            {contact.next_follow_up_date
                              ? new Date(contact.next_follow_up_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
                              : '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={event => { event.stopPropagation(); if (contact.phone) window.location.href = `tel:${contact.phone}` }}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={event => { event.stopPropagation(); if (contact.phone) window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank') }}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-success hover:bg-success/10 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={event => { event.stopPropagation(); if (contact.email) window.location.href = `mailto:${contact.email}` }}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-secondary hover:bg-secondary/10 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((contact, i) => {
              const stage = PIPELINE_STAGES[contact.pipeline_stage]
              return (
                <motion.div key={contact.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Card hover className="group" onClick={() => router.push(`/contacts?contact=${contact.id}`)}>
                    <div className="flex items-start justify-between mb-3">
                      <Avatar name={contact.full_name} size="lg" />
                      <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">{contact.full_name}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {[contact.profession, contact.location].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {stage && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{ backgroundColor: `${stage.color}15`, color: stage.color, borderColor: `${stage.color}25` }}>
                          {stage.label}
                        </span>
                      )}
                      <Badge variant={contact.interest_type === 'business' ? 'secondary' : 'success'} size="sm">
                        {interestLabel(contact.interest_type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border-subtle">
                      <button
                        onClick={event => { event.stopPropagation(); if (contact.phone) window.location.href = `tel:${contact.phone}` }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Phone className="w-3 h-3" /> {t.prospects.call}
                      </button>
                      <button
                        onClick={event => { event.stopPropagation(); if (contact.phone) window.open(`https://wa.me/${contact.phone.replace(/\D/g, '')}`, '_blank') }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-text-secondary hover:text-success hover:bg-success/10 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" /> {t.prospects.message}
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>

      {/* Add Contact Modal */}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.97 }}
              className="w-full max-w-lg bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{t.prospects.addProspect}</h2>
                <button onClick={closeModal} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddContact} className="p-5 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">{formError}</div>
                )}

                {/* Ad Soyad */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Ad Soyad *</label>
                  <input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Adı Soyadı"
                    required
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Telefon & E-posta */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Telefon</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">E-posta</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="ornek@mail.com"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                {/* Meslek & Konum */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Meslek</label>
                    <input
                      value={form.profession}
                      onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
                      placeholder="Öğretmen, Doktor..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Konum</label>
                    <input
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="İstanbul, Ankara..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                </div>

                {/* Sıcaklık & İlgi */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Sıcaklık</label>
                    <select
                      value={form.temperature}
                      onChange={e => setForm(f => ({ ...f, temperature: e.target.value as typeof form.temperature }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary outline-none focus:border-primary/50 transition-all"
                    >
                      <option value="cold">❄️ Soğuk</option>
                      <option value="warm">🌤 Ilık</option>
                      <option value="hot">🔥 Sıcak</option>
                      <option value="frozen">🧊 Donmuş</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">İlgi Türü</label>
                    <select
                      value={form.interest_type}
                      onChange={e => setForm(f => ({ ...f, interest_type: e.target.value as typeof form.interest_type }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary outline-none focus:border-primary/50 transition-all"
                    >
                      <option value="unknown">Bilinmiyor</option>
                      <option value="product">Ürün</option>
                      <option value="business">İş Fırsatı</option>
                      <option value="both">Her İkisi</option>
                    </select>
                  </div>
                </div>

                {/* Kaynak */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Kaynak</label>
                  <input
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="Instagram, Arkadaş tavsiyesi..."
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                {/* Notlar */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Notlar</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="İlk izlenimler, ortak noktalar..."
                    rows={2}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                    İptal
                  </button>
                  <Button type="submit" size="sm" disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Kişiyi Ekle'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
