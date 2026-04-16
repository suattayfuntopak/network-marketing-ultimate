'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, addContact, deleteContact } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import {
  Search, Phone, Mail, MapPin, Plus, X, ArrowLeft,
  ChevronRight, Trash2, User, Briefcase, AlertCircle,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const TEMPERATURES = ['cold', 'warm', 'hot', 'frozen'] as const
const INTEREST_TYPES = ['unknown', 'product', 'business', 'both'] as const
const PIPELINE_STAGES: Record<string, string> = {
  new: 'Yeni', contact_planned: 'İletişim Planlandı', first_contact: 'İlk İletişim',
  interested: 'İlgileniyor', invited: 'Davet Edildi', presentation_sent: 'Sunum Gönderildi',
  followup_pending: 'Takip Bekleniyor', ready_to_buy: 'Satın Almaya Hazır',
  became_customer: 'Müşteri', became_member: 'Ekip Üyesi', lost: 'Kaybedildi',
}

type AddForm = {
  full_name: string
  phone: string
  email: string
  location: string
  profession: string
  temperature: typeof TEMPERATURES[number]
  interest_type: typeof INTEREST_TYPES[number]
  source: string
}

const EMPTY_FORM: AddForm = {
  full_name: '', phone: '', email: '', location: '',
  profession: '', temperature: 'cold', interest_type: 'unknown', source: '',
}

export default function ContactsPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const qc = useQueryClient()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const { data: contacts = [], isLoading } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const addMutation = useMutation({
    mutationFn: (f: AddForm) => addContact(currentUser!.id, f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setSelectedId(null)
    },
  })

  const filtered = contacts.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  const selected = selectedId ? contacts.find(c => c.id === selectedId) : null

  // ── Detail View ──────────────────────────────────────────────
  if (selected) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            {t.common.backToContacts}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="text-error hover:bg-error/10"
            onClick={() => deleteMutation.mutate(selected.id)}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {t.common.delete}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <Card className="lg:col-span-1">
            <div className="text-center mb-6">
              <Avatar name={selected.full_name} size="xl" className="mx-auto mb-3" />
              <h2 className="text-lg font-bold text-text-primary">{selected.full_name}</h2>
              {selected.profession && <p className="text-sm text-text-tertiary">{selected.profession}</p>}
              <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                <TemperatureBadge temperature={selected.temperature} score={selected.temperature_score} />
                <Badge variant="secondary" size="sm">
                  {t.interest?.[selected.interest_type as keyof typeof t.interest] ?? selected.interest_type}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              {selected.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="text-text-primary">{selected.phone}</span>
                </div>
              )}
              {selected.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="text-text-primary">{selected.email}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="text-text-primary">{selected.location}</span>
                </div>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{t.common.pipelineStage}</p>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {PIPELINE_STAGES[selected.pipeline_stage] ?? selected.pipeline_stage}
              </span>
            </div>
          </Card>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Kayıt Bilgileri</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-text-tertiary text-xs mb-0.5">Kaynak</p>
                  <p className="text-text-primary">{selected.source || '—'}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs mb-0.5">Eklenme</p>
                  <p className="text-text-primary">{new Date(selected.created_at).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs mb-0.5">İlişki Gücü</p>
                  <p className="text-text-primary">{selected.relationship_strength} / 100</p>
                </div>
                <div>
                  <p className="text-text-tertiary text-xs mb-0.5">Son İletişim</p>
                  <p className="text-text-primary">{selected.last_contact_date ? new Date(selected.last_contact_date).toLocaleDateString('tr-TR') : '—'}</p>
                </div>
              </div>
            </Card>

            {selected.goals_notes && (
              <Card>
                <h3 className="text-sm font-semibold text-text-primary mb-2">{t.common.goals}</h3>
                <p className="text-sm text-text-secondary">{selected.goals_notes}</p>
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-2">{t.contacts.interactionHistory}</h3>
              <p className="text-sm text-text-tertiary py-4 text-center">{t.contacts.noInteractions}</p>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  // ── List View ─────────────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.contacts.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{contacts.length} {t.contacts.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAdd(true)}>
          {t.contacts.addContact}
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t.contacts.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </motion.div>

      {/* List */}
      <motion.div variants={item} className="space-y-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-text-tertiary">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              {search ? 'Arama sonucu bulunamadı' : 'Henüz kişi eklenmemiş'}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-primary hover:text-primary-dim font-medium">
                İlk kişini ekle →
              </button>
            )}
          </div>
        ) : (
          filtered.map((contact, i) => (
            <motion.div key={contact.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            >
              <Card hover padding="sm" className="cursor-pointer group" onClick={() => setSelectedId(contact.id)}>
                <div className="flex items-center gap-4">
                  <Avatar name={contact.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{contact.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.profession && <span className="text-xs text-text-tertiary flex items-center gap-1"><Briefcase className="w-3 h-3" />{contact.profession}</span>}
                      {contact.location && <span className="text-xs text-text-tertiary flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.location}</span>}
                      {contact.phone && <span className="text-xs text-text-tertiary flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                    <Badge variant="default" size="sm">{PIPELINE_STAGES[contact.pipeline_stage] ?? contact.pipeline_stage}</Badge>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{t.contacts.addContact}</h2>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Ad Soyad *</label>
                    <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Adı Soyadı" required
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Telefon</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+90 5xx xxx xx xx"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">E-posta</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="ad@ornek.com" type="email"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Şehir / Konum</label>
                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="İstanbul"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Meslek</label>
                    <input value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))}
                      placeholder="Öğretmen, Girişimci..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Sıcaklık</label>
                    <select value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value as typeof TEMPERATURES[number] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all">
                      <option value="cold">Soğuk</option>
                      <option value="warm">Ilık</option>
                      <option value="hot">Sıcak</option>
                      <option value="frozen">Donuk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">İlgi Alanı</label>
                    <select value={form.interest_type} onChange={e => setForm(f => ({ ...f, interest_type: e.target.value as typeof INTEREST_TYPES[number] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all">
                      <option value="unknown">Bilinmiyor</option>
                      <option value="product">Ürün</option>
                      <option value="business">İş Fırsatı</option>
                      <option value="both">Her İkisi</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Kaynak (nereden tanışıldı)</label>
                    <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                      placeholder="WhatsApp grubu, tanışma, sosyal medya..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>{t.common.cancel}</Button>
                <Button
                  className="flex-1"
                  disabled={!form.full_name.trim() || addMutation.isPending}
                  onClick={() => addMutation.mutate(form)}
                >
                  {addMutation.isPending ? 'Kaydediliyor...' : t.common.save}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
