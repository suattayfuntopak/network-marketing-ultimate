'use client'

import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Pencil, Save, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  PIPELINE_STAGE_OPTIONS,
  contactRowToAddContactForm,
  stageMeta,
  type AddContactForm,
  type PipelineStage,
} from '@/components/contacts/contactLabels'
import type { ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'

type TabId = 'basic' | 'detail' | 'network' | 'notes'

const TABS: { id: TabId; tr: string; en: string }[] = [
  { id: 'basic', tr: 'Temel', en: 'Basic' },
  { id: 'detail', tr: 'Detay', en: 'Detail' },
  { id: 'network', tr: 'Network', en: 'Network' },
  { id: 'notes', tr: 'Notlar', en: 'Notes' },
]

const fieldClass =
  'w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all'

interface Props {
  open: boolean
  editingContact?: ContactRow | null
  currentLocale: 'tr' | 'en'
  form: AddContactForm
  setForm: Dispatch<SetStateAction<AddContactForm>>
  error: string
  loading: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ContactCreateModal({
  open,
  editingContact = null,
  currentLocale,
  form,
  setForm,
  error,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const [tab, setTab] = useState<TabId>('basic')
  const isEdit = Boolean(editingContact)

  useEffect(() => {
    if (!open) return
    setTab('basic')
    if (editingContact) {
      setForm(contactRowToAddContactForm(editingContact))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate when sheet opens; avoids reset on contacts refetch
  }, [open])

  const tr = currentLocale === 'tr'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="shadow-float max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit} className="flex max-h-[90vh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-border p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {isEdit ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {isEdit ? (tr ? 'Kontağı Düzenle' : 'Edit contact') : tr ? 'Yeni Kontak' : 'New contact'}
                </h2>
                <p className="mt-0.5 text-sm text-text-tertiary">
                  {isEdit
                    ? tr
                      ? 'Kayıtlı kişiyi güncelle; kaydet ile değişikliklerin uygulanır.'
                      : 'Update this person; save to apply your changes.'
                    : tr
                      ? 'Temel bilgilerden notlara kadar tek ekranda kayıt.'
                      : 'Capture channels, pipeline context, and notes in one flow.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-border px-5 pt-1">
            <div className="flex gap-1 overflow-x-auto pb-0">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors',
                    tab === item.id ? 'text-primary' : 'text-text-tertiary hover:text-text-secondary',
                  )}
                >
                  {tr ? item.tr : item.en}
                  {tab === item.id && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary/90" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 p-3 text-sm text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {tab === 'basic' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Ad Soyad *' : 'Full name *'}
                  </label>
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((c) => ({ ...c, full_name: event.target.value }))}
                    placeholder={tr ? 'Örn. Ayşe Kaya' : 'e.g. Jane Doe'}
                    className={fieldClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Takma ad' : 'Nickname'}
                  </label>
                  <input
                    value={form.nickname}
                    onChange={(event) => setForm((c) => ({ ...c, nickname: event.target.value }))}
                    placeholder={tr ? 'Örn. Ayşe' : 'e.g. Jane'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Telefon' : 'Phone'}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))}
                    placeholder="+90 555 123 4567"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">WhatsApp</label>
                  <input
                    value={form.whatsapp_username}
                    onChange={(event) => setForm((c) => ({ ...c, whatsapp_username: event.target.value }))}
                    placeholder={tr ? 'Numara veya @kullanıcı' : 'Number or @username'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">E-posta</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))}
                    placeholder="name@email.com"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Telegram</label>
                  <input
                    value={form.telegram_username}
                    onChange={(event) => setForm((c) => ({ ...c, telegram_username: event.target.value }))}
                    placeholder="@username"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">Instagram</label>
                  <input
                    value={form.instagram_username}
                    onChange={(event) => setForm((c) => ({ ...c, instagram_username: event.target.value }))}
                    placeholder="@username"
                    className={fieldClass}
                  />
                </div>
              </div>
            )}

            {tab === 'detail' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Şehir' : 'City'}
                  </label>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((c) => ({ ...c, location: event.target.value }))}
                    placeholder={tr ? 'İstanbul' : 'Istanbul'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Meslek' : 'Profession'}
                  </label>
                  <input
                    value={form.profession}
                    onChange={(event) => setForm((c) => ({ ...c, profession: event.target.value }))}
                    placeholder={tr ? 'Mühendis' : 'Engineer'}
                    className={fieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'İlişki türü' : 'Relationship'}
                  </label>
                  <input
                    value={form.relationship_type}
                    onChange={(event) => setForm((c) => ({ ...c, relationship_type: event.target.value }))}
                    placeholder={tr ? 'arkadaş, akraba…' : 'friend, cousin…'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Doğum günü' : 'Birthday'}
                  </label>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(event) => setForm((c) => ({ ...c, birthday: event.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Aile / ek notlar' : 'Family notes'}
                  </label>
                  <textarea
                    value={form.family_notes}
                    onChange={(event) => setForm((c) => ({ ...c, family_notes: event.target.value }))}
                    rows={3}
                    placeholder={tr ? 'Çocuk sayısı, özel günler…' : 'Kids, milestones…'}
                    className={cn(fieldClass, 'resize-none')}
                  />
                </div>
              </div>
            )}

            {tab === 'network' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      {tr ? 'Kaynak' : 'Source'}
                    </label>
                    <input
                      value={form.source}
                      onChange={(event) => setForm((c) => ({ ...c, source: event.target.value }))}
                      placeholder={tr ? 'Sıcak temas, Instagram, etkinlik…' : 'Warm intro, Instagram, event…'}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      {tr ? 'Kontak türü' : 'Contact type'}
                    </label>
                    <select
                      value={form.interest_type}
                      onChange={(event) =>
                        setForm((c) => ({ ...c, interest_type: event.target.value as AddContactForm['interest_type'] }))}
                      className={fieldClass}
                    >
                      <option value="unknown">{tr ? 'Belirsiz' : 'Unknown'}</option>
                      <option value="product">{tr ? 'Ürün' : 'Product'}</option>
                      <option value="business">{tr ? 'İş' : 'Business'}</option>
                      <option value="both">{tr ? 'Her ikisi' : 'Both'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      {tr ? 'Aşama' : 'Stage'}
                    </label>
                    <select
                      value={form.pipeline_stage}
                      onChange={(event) =>
                        setForm((c) => ({ ...c, pipeline_stage: event.target.value as PipelineStage }))}
                      className={fieldClass}
                    >
                      {PIPELINE_STAGE_OPTIONS.map((stage) => (
                        <option key={stage} value={stage}>
                          {stageMeta(stage)[currentLocale]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface/30 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                      {tr ? 'Sıcaklık skoru' : 'Warmth score'}
                    </span>
                    <span className="tabular-nums text-sm font-semibold text-primary">{form.temperature_score}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={form.temperature_score}
                    onChange={(event) =>
                      setForm((c) => ({ ...c, temperature_score: Number(event.target.value) }))}
                    className="h-2 w-full cursor-pointer accent-primary"
                  />
                  <p className="mt-2 text-xs text-text-muted">
                    {tr
                      ? '0 soğuk, 100 çok sıcak; liste ve filtreler otomatik güncellenir.'
                      : '0 is cold, 100 is very warm; table filters stay in sync.'}
                  </p>
                </div>
              </div>
            )}

            {tab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Notlar' : 'Notes'}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((c) => ({ ...c, notes: event.target.value }))}
                    rows={4}
                    placeholder={tr ? 'Bu kontak hakkında notlarınız…' : 'Your notes about this contact…'}
                    className={cn(fieldClass, 'resize-none')}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'İlgi alanları' : 'Interests'}
                  </label>
                  <input
                    value={form.interests}
                    onChange={(event) => setForm((c) => ({ ...c, interests: event.target.value }))}
                    placeholder={tr ? 'spor, sağlık, teknoloji (virgülle)' : 'sports, health, tech (comma-separated)'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Hedefler' : 'Goals'}
                  </label>
                  <input
                    value={form.goalsComma}
                    onChange={(event) => setForm((c) => ({ ...c, goalsComma: event.target.value }))}
                    placeholder={tr ? 'zaman, özgürlük, gelir (virgülle)' : 'time, freedom, income (comma-separated)'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Sıkıntılar' : 'Pain points'}
                  </label>
                  <input
                    value={form.pain_points}
                    onChange={(event) => setForm((c) => ({ ...c, pain_points: event.target.value }))}
                    placeholder={tr ? 'zaman yok, bütçe…' : 'no time, budget…'}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                    {tr ? 'Etiketler' : 'Tags'}
                  </label>
                  <input
                    value={form.tagsComma}
                    onChange={(event) => setForm((c) => ({ ...c, tagsComma: event.target.value }))}
                    placeholder={tr ? 'müşteri, sıcak, zoom (virgülle)' : 'customer, hot, zoom (comma-separated)'}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-border bg-elevated/95 p-5">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tr ? 'İptal' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              <span className="inline-flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                {tr ? 'Kaydet' : 'Save'}
              </span>
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
