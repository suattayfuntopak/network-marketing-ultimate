'use client'

import { type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  PIPELINE_STAGE_OPTIONS,
  stageMeta,
  type AddContactForm,
  type PipelineStage,
} from '@/components/contacts/contactLabels'

interface Props {
  currentLocale: 'tr' | 'en'
  form: AddContactForm
  setForm: Dispatch<SetStateAction<AddContactForm>>
  error: string
  loading: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ContactCreateModal({ currentLocale, form, setForm, error, loading, onClose, onSubmit }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-elevated border border-border rounded-3xl shadow-float overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={onSubmit} className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/12 text-primary flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'Kontak Ekle' : 'Add Contact'}
                </h2>
                <p className="text-sm text-text-tertiary mt-0.5">
                  {currentLocale === 'tr'
                    ? 'Kontak merkezine hızlıca yeni bir kişi ekle.'
                    : 'Create a new person inside your contact workspace.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <div className="rounded-2xl border border-border bg-surface/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                {currentLocale === 'tr' ? 'Temel Bilgiler' : 'Core Details'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Ad Soyad *' : 'Full Name *'}
                  </label>
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder={currentLocale === 'tr' ? 'Örnek: Ayşe Kaya' : 'Example: Ayse Kaya'}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Telefon' : 'Phone'}
                  </label>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder={currentLocale === 'tr' ? '05xx xxx xx xx' : '+90 5xx xxx xx xx'}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'E-posta' : 'Email'}
                  </label>
                  <input
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="ornek@mail.com"
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Konum' : 'Location'}
                  </label>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    placeholder={currentLocale === 'tr' ? 'Şehir / İlçe' : 'City / District'}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Meslek' : 'Profession'}
                  </label>
                  <input
                    value={form.profession}
                    onChange={(event) => setForm((current) => ({ ...current, profession: event.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Kaynak' : 'Source'}
                  </label>
                  <input
                    value={form.source}
                    onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                    placeholder={currentLocale === 'tr' ? 'Instagram, referans, etkinlik...' : 'Instagram, referral, event...'}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                {currentLocale === 'tr' ? 'Süreç Ayarları' : 'Pipeline Settings'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Sıcaklık' : 'Temperature'}
                  </label>
                  <select
                    value={form.temperature}
                    onChange={(event) => setForm((current) => ({ ...current, temperature: event.target.value as AddContactForm['temperature'] }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="hot">{currentLocale === 'tr' ? 'Sıcak' : 'Hot'}</option>
                    <option value="warm">{currentLocale === 'tr' ? 'Ilık' : 'Warm'}</option>
                    <option value="cold">{currentLocale === 'tr' ? 'Soğuk' : 'Cold'}</option>
                    <option value="frozen">{currentLocale === 'tr' ? 'Donuk' : 'Frozen'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'İlgi Türü' : 'Interest Type'}
                  </label>
                  <select
                    value={form.interest_type}
                    onChange={(event) => setForm((current) => ({ ...current, interest_type: event.target.value as AddContactForm['interest_type'] }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="unknown">{currentLocale === 'tr' ? 'Belirsiz' : 'Unknown'}</option>
                    <option value="product">{currentLocale === 'tr' ? 'Ürün' : 'Product'}</option>
                    <option value="business">{currentLocale === 'tr' ? 'İş' : 'Business'}</option>
                    <option value="both">{currentLocale === 'tr' ? 'Her İkisi' : 'Both'}</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    {currentLocale === 'tr' ? 'Aşama' : 'Stage'}
                  </label>
                  <select
                    value={form.pipeline_stage}
                    onChange={(event) => setForm((current) => ({ ...current, pipeline_stage: event.target.value as PipelineStage }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    {PIPELINE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>{stageMeta(stage)[currentLocale]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Notlar' : 'Notes'}
              </label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={3}
                placeholder={currentLocale === 'tr' ? 'Kısa bir hatırlatma veya ilk notlarını yaz...' : 'Add a quick context note...'}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-2xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t border-border bg-elevated/95">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {currentLocale === 'tr' ? 'İptal' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {currentLocale === 'tr' ? 'Kontağı Kaydet' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
