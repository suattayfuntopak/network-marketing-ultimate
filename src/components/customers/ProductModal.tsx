'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addProduct, updateProduct, type ProductRow } from '@/lib/queries'
import { ModalOverlay } from './ModalOverlay'
import { useHeadingCase } from '@/hooks/useHeadingCase'

const CATEGORIES = ['Cilt Bakımı', 'Beslenme', 'Wellness', 'Başlangıç Seti', 'Kişisel Bakım', 'Diğer']

interface Props {
  onClose: () => void
  userId: string
  editProduct?: ProductRow | null
}

export function ProductModal({ onClose, userId, editProduct }: Props) {
  const h = useHeadingCase()
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: editProduct?.name ?? '',
    category: editProduct?.category ?? '',
    description: editProduct?.description ?? '',
    image_url: editProduct?.image_url ?? '',
    price_try: editProduct ? String(editProduct.price_try) : '',
    tags: editProduct?.tags.join(', ') ?? '',
    reorder_cycle_days: editProduct?.reorder_cycle_days ? String(editProduct.reorder_cycle_days) : '',
  })
  const [error, setError] = useState('')
  const isEdit = Boolean(editProduct)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        image_url: form.image_url.trim() || null,
        price_try: parseFloat(form.price_try) || 0,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        reorder_cycle_days: form.reorder_cycle_days ? parseInt(form.reorder_cycle_days) : undefined,
      }
      if (isEdit) await updateProduct(editProduct!.id, payload)
      else await addProduct(userId, payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); onClose() },
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim()) { setError('Ürün adı zorunludur.'); return }
    if (!form.price_try || Number.isNaN(parseFloat(form.price_try))) { setError('Geçerli bir fiyat giriniz.'); return }
    setError(''); mutation.mutate()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {isEdit ? h('Ürünü düzenle') : h('Yeni ürün ekle')}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">Fiyatı Türk Lirası (₺) olarak girin</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Ürün Adı *</label>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Örn: Radiance Serum"
              className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Kategori</label>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all appearance-none"
              >
                <option value="">Seç...</option>
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Fiyat (₺) *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm font-semibold">₺</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_try}
                  onChange={(event) => setForm((current) => ({ ...current, price_try: event.target.value }))}
                  placeholder="0.00"
                  className="w-full h-10 bg-surface border border-border rounded-xl pl-8 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Açıklama</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Ürün hakkında kısa açıklama..."
              rows={2}
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Ürün Görseli URL</label>
            <input
              value={form.image_url}
              onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
              placeholder="https://.../product-image.jpg"
              className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Etiketler</label>
              <input
                value={form.tags}
                onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                placeholder="cilt_bakımı, çok_satan"
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
              <p className="text-[10px] text-text-muted">Virgülle ayır</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Yeniden Sipariş (gün)</label>
              <input
                type="number"
                min="1"
                value={form.reorder_cycle_days}
                onChange={(event) => setForm((current) => ({ ...current, reorder_cycle_days: event.target.value }))}
                placeholder="30"
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 rounded-xl border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button
            type="submit"
            size="sm"
            loading={mutation.isPending}
            icon={isEdit ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          >
            {isEdit ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
          </Button>
        </div>
      </form>
    </ModalOverlay>
  )
}
