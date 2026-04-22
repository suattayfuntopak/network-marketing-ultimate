'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Plus, ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { addOrder, type ContactRow, type OrderItem, type OrderRow, type ProductRow } from '@/lib/queries'
import { ModalOverlay } from './ModalOverlay'
import { useHeadingCase } from '@/hooks/useHeadingCase'

interface AddOrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price_try: number
}

const formatTRY = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(amount)

interface Props {
  onClose: () => void
  userId: string
  contact: ContactRow
  products: ProductRow[]
}

export function AddOrderModal({ onClose, userId, contact, products }: Props) {
  const h = useHeadingCase()
  const qc = useQueryClient()
  const [items, setItems] = useState<AddOrderItem[]>([
    { product_id: '', product_name: '', quantity: 1, unit_price_try: 0 },
  ])
  const [note, setNote] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<OrderRow['status']>('delivered')
  const [error, setError] = useState('')

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price_try, 0)

  function calculateNextReorderDate(orderDateValue: string, orderItems: AddOrderItem[]) {
    const reorderCandidates = orderItems
      .map((item) => products.find((product) => product.id === item.product_id)?.reorder_cycle_days ?? null)
      .filter((value): value is number => typeof value === 'number' && value > 0)

    if (reorderCandidates.length === 0) return undefined

    const nextDate = new Date(orderDateValue)
    nextDate.setDate(nextDate.getDate() + Math.min(...reorderCandidates))
    return nextDate.toISOString().split('T')[0]
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((candidate) => candidate.id === productId)
    if (!product) return
    setItems((previous) => previous.map((item, i) => i === index
      ? { product_id: product.id, product_name: product.name, quantity: item.quantity, unit_price_try: product.price_try }
      : item
    ))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const validItems = items.filter((item) => item.product_id && item.quantity > 0)
      return addOrder(userId, {
        contact_id: contact.id,
        items: validItems as OrderItem[],
        total_try: validItems.reduce((sum, item) => sum + item.quantity * item.unit_price_try, 0),
        status,
        note: note || undefined,
        order_date: orderDate,
        next_reorder_date: calculateNextReorderDate(orderDate, validItems),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['orders', contact.id] })
      qc.invalidateQueries({ queryKey: ['orders-all'] })
      onClose()
    },
    onError: (e: Error) => setError(e.message),
  })

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const valid = items.filter((item) => item.product_id && item.quantity > 0)
    if (valid.length === 0) { setError('En az bir ürün seçin.'); return }
    setError(''); mutation.mutate()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{h('Sipariş ekle')}</h2>
            <p className="text-xs text-text-tertiary mt-0.5">{contact.full_name} için yeni sipariş</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text-primary p-1 rounded-lg hover:bg-surface-hover">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">Ürünler</label>
              <button
                type="button"
                onClick={() => setItems((previous) => [...previous, { product_id: '', product_name: '', quantity: 1, unit_price_try: 0 }])}
                className="text-xs text-primary hover:text-primary-dim font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Ürün Ekle
              </button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px_80px_28px] gap-2 items-center">
                <select
                  value={item.product_id}
                  onChange={(event) => selectProduct(index, event.target.value)}
                  className="h-9 bg-surface border border-border rounded-xl px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none"
                >
                  <option value="">Ürün seç...</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => setItems((previous) => previous.map((row, i) => i === index ? { ...row, quantity: parseInt(event.target.value) || 1 } : row))}
                  className="h-9 bg-surface border border-border rounded-xl px-2 text-xs text-text-primary text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                  placeholder="Adet"
                />
                <div className="h-9 flex items-center px-2 bg-surface/50 border border-border-subtle rounded-xl text-xs text-text-secondary">
                  {item.unit_price_try > 0 ? formatTRY(item.unit_price_try) : '₺0'}
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems((previous) => previous.filter((_, i) => i !== index))}
                    className="p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/15 rounded-xl">
              <span className="text-sm font-medium text-text-secondary">Toplam</span>
              <span className="text-base font-bold text-primary">{formatTRY(total)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Sipariş Tarihi</label>
              <input
                type="date"
                value={orderDate}
                onChange={(event) => setOrderDate(event.target.value)}
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary">Durum</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderRow['status'])}
                className="w-full h-10 bg-surface border border-border rounded-xl px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none"
              >
                <option value="pending">Bekliyor</option>
                <option value="processing">İşlemde</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-secondary">Not (isteğe bağlı)</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="Sipariş notu..."
              className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-error/10 rounded-xl border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button type="submit" size="sm" loading={mutation.isPending} icon={<ShoppingCart className="w-3.5 h-3.5" />}>
            Siparişi Kaydet
          </Button>
        </div>
      </form>
    </ModalOverlay>
  )
}
