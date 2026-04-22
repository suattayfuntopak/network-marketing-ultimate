'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Package, Pencil, Plus, ShoppingCart } from 'lucide-react'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ProductModal } from '@/components/customers/ProductModal'
import { useAppStore } from '@/store/appStore'
import { addOrder, fetchAllOrders, fetchContacts, fetchProducts, type ContactRow, type OrderItem, type ProductRow } from '@/lib/queries'

const formatTRY = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(amount)

type AssignForm = {
  contactId: string
  quantity: number
  orderDate: string
  note: string
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const { currentUser } = useAppStore()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'

  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState<AssignForm>({
    contactId: '',
    quantity: 1,
    orderDate: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [assignError, setAssignError] = useState('')

  const { data: products = [] } = useQuery<ProductRow[]>({ queryKey: ['products'], queryFn: fetchProducts })
  const { data: orders = [] } = useQuery({ queryKey: ['orders-all'], queryFn: fetchAllOrders })
  const { data: contacts = [] } = useQuery<ContactRow[]>({ queryKey: ['contacts'], queryFn: fetchContacts })

  const product = products.find((item) => item.id === params.id) ?? null

  const productOrderRows = useMemo(() => {
    if (!product) return []
    return orders
      .filter((order) => order.status !== 'cancelled')
      .map((order) => {
        const matchedItem = (order.items ?? []).find((item) => item.product_id === product.id || item.product_name === product.name)
        return matchedItem ? { order, item: matchedItem } : null
      })
      .filter(Boolean) as { order: (typeof orders)[number]; item: OrderItem }[]
  }, [orders, product])

  const summary = useMemo(() => {
    const units = productOrderRows.reduce((sum, row) => sum + row.item.quantity, 0)
    const revenue = productOrderRows.reduce((sum, row) => sum + row.item.quantity * row.item.unit_price_try, 0)
    const contactCount = new Set(productOrderRows.map((row) => row.order.contact_id)).size
    return { units, revenue, contactCount }
  }, [productOrderRows])

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error('Ürün bulunamadı.')
      if (!assignForm.contactId) throw new Error('Lütfen kişi seçin.')
      const selectedContact = contacts.find((contact) => contact.id === assignForm.contactId)
      if (!selectedContact) throw new Error('Kişi bulunamadı.')
      const quantity = Math.max(1, Number(assignForm.quantity) || 1)
      await addOrder(currentUser!.id, {
        contact_id: selectedContact.id,
        items: [
          {
            product_id: product.id,
            product_name: product.name,
            quantity,
            unit_price_try: product.price_try,
          },
        ],
        total_try: quantity * product.price_try,
        status: 'delivered',
        order_date: assignForm.orderDate,
        note: assignForm.note.trim() || undefined,
        next_reorder_date: product.reorder_cycle_days
          ? new Date(new Date(assignForm.orderDate).setDate(new Date(assignForm.orderDate).getDate() + product.reorder_cycle_days))
            .toISOString()
            .split('T')[0]
          : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders-all'] })
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setAssignError('')
      setShowAssignModal(false)
      setAssignForm((current) => ({ ...current, note: '', quantity: 1 }))
    },
    onError: (error: Error) => setAssignError(error.message),
  })

  if (!product) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/products')}>
          {currentLocale === 'tr' ? 'Ürün Kataloğuna Dön' : 'Back to products'}
        </Button>
        <Card>
          <p className="text-sm text-text-secondary">{currentLocale === 'tr' ? 'Ürün bulunamadı.' : 'Product not found.'}</p>
        </Card>
      </div>
    )
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-[1400px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => router.push('/products')}>
            {currentLocale === 'tr' ? 'Ürün Kataloğuna Dön' : 'Back to products'}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setShowEditModal(true)}>
              {currentLocale === 'tr' ? h('Düzenle') : h('Edit')}
            </Button>
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowAssignModal(true)}>
              {currentLocale === 'tr' ? h('Kişiye Ekle') : h('Assign to contact')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <div className="mb-4 flex items-center justify-center rounded-2xl border border-border-subtle bg-surface/40 p-6">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="h-56 w-56 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-border-subtle bg-surface">
                  <Package className="h-12 w-12 text-primary/70" />
                </div>
              )}
            </div>
            <h1 className="text-xl font-semibold text-text-primary">{product.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">{product.category || (currentLocale === 'tr' ? 'Kategori yok' : 'No category')}</p>
            <p className="mt-3 text-3xl font-bold text-text-primary">{formatTRY(product.price_try)}</p>
            {product.description && <p className="mt-4 text-sm leading-6 text-text-secondary">{product.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {(product.tags ?? []).map((tag) => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
          </Card>

          <div className="space-y-4 lg:col-span-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card>
                <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{currentLocale === 'tr' ? 'Satılan Adet' : 'Units sold'}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{summary.units}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{currentLocale === 'tr' ? 'Toplam Ciro' : 'Total revenue'}</p>
                <p className="mt-2 text-3xl font-semibold text-success">{formatTRY(summary.revenue)}</p>
              </Card>
              <Card>
                <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{currentLocale === 'tr' ? 'Ulaşan Kişi' : 'Contacts reached'}</p>
                <p className="mt-2 text-3xl font-semibold text-text-primary">{summary.contactCount}</p>
              </Card>
            </div>

            <Card>
              <h2 className="text-base font-semibold text-text-primary">{currentLocale === 'tr' ? h('Son Ürün Hareketleri') : h('Recent product activity')}</h2>
              <div className="mt-3 space-y-2">
                {productOrderRows.length === 0 ? (
                  <p className="text-sm text-text-secondary">{currentLocale === 'tr' ? 'Henüz bu ürün için sipariş yok.' : 'No orders yet for this product.'}</p>
                ) : (
                  productOrderRows.slice(0, 8).map((row) => {
                    const person = contacts.find((contact) => contact.id === row.order.contact_id)
                    return (
                      <div key={row.order.id} className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/30 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{person?.full_name ?? '—'}</p>
                          <p className="text-xs text-text-tertiary">{row.order.order_date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-primary">{row.item.quantity} x {formatTRY(row.item.unit_price_try)}</p>
                          <p className="text-xs text-success">{formatTRY(row.item.quantity * row.item.unit_price_try)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>
        </div>
      </motion.div>

      {showEditModal && (
        <ProductModal
          userId={currentUser?.id ?? ''}
          editProduct={product}
          onClose={() => setShowEditModal(false)}
        />
      )}

      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={currentLocale === 'tr' ? 'Kişiye Ürün Ekle' : 'Assign product to contact'}
        description={currentLocale === 'tr' ? 'Ürünü seçtiğin kişiye sipariş olarak ekle.' : 'Create an order for the selected contact.'}
      >
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">{currentLocale === 'tr' ? 'Kişi' : 'Contact'}</label>
            <select
              value={assignForm.contactId}
              onChange={(event) => setAssignForm((current) => ({ ...current, contactId: event.target.value }))}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/40"
            >
              <option value="">{currentLocale === 'tr' ? 'Kişi seç...' : 'Select contact...'}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.full_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">{currentLocale === 'tr' ? 'Adet' : 'Quantity'}</label>
              <input
                type="number"
                min={1}
                value={assignForm.quantity}
                onChange={(event) => setAssignForm((current) => ({ ...current, quantity: Math.max(1, Number(event.target.value) || 1) }))}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">{currentLocale === 'tr' ? 'Sipariş Tarihi' : 'Order date'}</label>
              <input
                type="date"
                value={assignForm.orderDate}
                onChange={(event) => setAssignForm((current) => ({ ...current, orderDate: event.target.value }))}
                className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">{currentLocale === 'tr' ? 'Not' : 'Note'}</label>
            <textarea
              value={assignForm.note}
              onChange={(event) => setAssignForm((current) => ({ ...current, note: event.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/40"
            />
          </div>
          {assignError && <p className="text-sm text-error">{assignError}</p>}
          <div className="flex justify-end">
            <Button size="sm" icon={<ShoppingCart className="h-3.5 w-3.5" />} loading={assignMutation.isPending} onClick={() => assignMutation.mutate()}>
              {currentLocale === 'tr' ? h('Kişiye Ekle') : h('Add to contact')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
