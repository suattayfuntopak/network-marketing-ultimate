'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Briefcase, MapPin, Phone, Plus, Tag, User, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addContact } from '@/lib/queries'
import { ModalOverlay } from './ModalOverlay'

interface Props {
  onClose: () => void
  userId: string
}

export function AddCustomerModal({ onClose, userId }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', location: '', profession: '', source: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => addContact(userId, {
      ...form,
      pipeline_stage: 'became_customer',
      interest_type: 'product',
      temperature: 'warm',
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); onClose() },
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.full_name.trim()) { setError('Ad Soyad zorunludur.'); return }
    setError(''); mutation.mutate()
  }

  const fields = [
    { key: 'full_name' as const, label: 'Ad Soyad *', placeholder: 'Ayşe Kaya', icon: <User className="w-4 h-4" /> },
    { key: 'phone' as const, label: 'Telefon', placeholder: '0500 000 00 00', icon: <Phone className="w-4 h-4" /> },
    { key: 'email' as const, label: 'E-posta', placeholder: 'ornek@mail.com', icon: <Tag className="w-4 h-4" /> },
    { key: 'location' as const, label: 'Şehir', placeholder: 'İstanbul', icon: <MapPin className="w-4 h-4" /> },
    { key: 'profession' as const, label: 'Meslek', placeholder: 'Öğretmen', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'source' as const, label: 'Kaynak', placeholder: 'Referans, Instagram...', icon: <Tag className="w-4 h-4" /> },
  ]

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Müşteri Ekle</h2>
            <p className="text-xs text-text-tertiary mt-0.5">Kişi doğrudan müşteri olarak kaydedilir</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">{field.label}</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">{field.icon}</div>
                <input
                  value={form[field.key]}
                  onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full h-10 bg-surface border border-border rounded-xl pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          ))}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 rounded-xl border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button type="submit" size="sm" loading={mutation.isPending} icon={<Plus className="w-3.5 h-3.5" />}>
            Müşteri Ekle
          </Button>
        </div>
      </form>
    </ModalOverlay>
  )
}
