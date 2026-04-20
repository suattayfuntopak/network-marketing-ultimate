'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchContacts, type ContactRow,
  fetchProducts, deleteProduct, type ProductRow,
  fetchAllOrders, fetchOrdersByContact, updateOrderStatus, deleteOrder,
  type OrderRow, type OrderItem,
} from '@/lib/queries'
import { useAppStore } from '@/store/appStore'
import {
  ShoppingBag, Plus, RefreshCw, TrendingUp, Package,
  Pencil, Trash2, ArrowLeft,
  ShoppingCart, Clock, Receipt, ChevronRight, Phone, MapPin,
} from 'lucide-react'
import { AddCustomerModal } from '@/components/customers/AddCustomerModal'
import { ProductModal } from '@/components/customers/ProductModal'
import { AddOrderModal } from '@/components/customers/AddOrderModal'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const itemAnim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

// ─── FORMATTERS ──────────────────────────────────────────────
const formatTRY = (amount: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(amount)

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── MÜŞTERİ DETAY VIEW ──────────────────────────────────────
const ORDER_STATUS_LABELS: Record<string, { tr: string; en: string }> = {
  pending: { tr: 'Bekliyor', en: 'Pending' },
  processing: { tr: 'İşlemde', en: 'Processing' },
  delivered: { tr: 'Teslim Edildi', en: 'Delivered' },
  cancelled: { tr: 'İptal', en: 'Cancelled' },
}
const ORDER_STATUS_VARIANTS: Record<string, string> = {
  pending: 'warning', processing: 'primary', delivered: 'success', cancelled: 'error'
}

function CustomerDetail({ customer, products, userId, onBack }: {
  customer: ContactRow; products: ProductRow[]; userId: string; onBack: () => void
}) {
  const qc = useQueryClient()
  const { locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const [showAddOrder, setShowAddOrder] = useState(false)

  const { data: orders = [], isLoading } = useQuery<OrderRow[]>({
    queryKey: ['orders', customer.id],
    queryFn: () => fetchOrdersByContact(customer.id),
  })

  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_try, 0)

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', customer.id] })
      qc.invalidateQueries({ queryKey: ['orders-all'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderRow['status'] }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders', customer.id] })
      qc.invalidateQueries({ queryKey: ['orders-all'] })
    },
  })

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-[1200px] mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />} onClick={onBack}>
          Müşterilere Dön
        </Button>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddOrder(true)}>
          Sipariş Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Profil */}
        <Card className="lg:col-span-1 h-fit">
          <div className="text-center mb-5">
            <Avatar name={customer.full_name} size="xl" className="mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text-primary">{customer.full_name}</h2>
            {customer.profession && <p className="text-sm text-text-tertiary mt-0.5">{customer.profession}</p>}
            {customer.location && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-text-tertiary">
                <MapPin className="w-3 h-3" />{customer.location}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold text-text-primary">{orders.filter(o => o.status !== 'cancelled').length}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Sipariş</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-success truncate">{formatTRY(totalSpent)}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Toplam</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-text-primary">{customer.relationship_strength}%</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">Sadakat</p>
            </div>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border text-sm text-text-secondary">
              <Phone className="w-4 h-4 text-text-tertiary" />{customer.phone}
            </div>
          )}
        </Card>

        {/* Sağ: Siparişler */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" /> Sipariş Geçmişi
              </CardTitle>
              <Badge variant="default">{orders.length} sipariş</Badge>
            </CardHeader>
            {isLoading ? (
              <div className="py-8 text-center text-sm text-text-tertiary">Yükleniyor...</div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-text-muted opacity-40" />
                <p className="text-sm text-text-secondary">Henüz sipariş yok</p>
                <button onClick={() => setShowAddOrder(true)} className="mt-2 text-xs text-primary hover:text-primary-dim font-medium">
                  İlk siparişi ekle →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-surface/50 border border-border-subtle group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{formatTRY(order.total_try)}</span>
                          <Badge variant={ORDER_STATUS_VARIANTS[order.status] as 'success' | 'warning' | 'primary' | 'error'} size="sm">
                            {ORDER_STATUS_LABELS[order.status]?.[currentLocale]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-text-tertiary">
                          <Clock className="w-3 h-3" />{formatDate(order.order_date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <select
                          value={order.status}
                          onChange={e => statusMutation.mutate({ id: order.id, status: e.target.value as OrderRow['status'] })}
                          className="h-7 px-2 bg-surface border border-border rounded-lg text-xs text-text-secondary focus:outline-none appearance-none"
                        >
                          <option value="pending">Bekliyor</option>
                          <option value="processing">İşlemde</option>
                          <option value="delivered">Teslim</option>
                          <option value="cancelled">İptal</option>
                        </select>
                        <button onClick={() => deleteOrderMutation.mutate(order.id)}
                          className="p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {(order.items as OrderItem[]).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-text-secondary">{item.product_name} × {item.quantity}</span>
                          <span className="text-text-primary font-medium">{formatTRY(item.unit_price_try * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    {order.next_reorder_date && order.status !== 'cancelled' && (
                      <div className="mt-2 pt-2 border-t border-border-subtle text-xs text-text-secondary">
                        Sonraki yeniden siparis: <span className="font-medium text-text-primary">{formatDate(order.next_reorder_date)}</span>
                      </div>
                    )}
                    {order.note && (
                      <p className="mt-2 pt-2 border-t border-border-subtle text-xs text-text-tertiary italic">{order.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {showAddOrder && (
        <AddOrderModal
          userId={userId} contact={customer} products={products}
          onClose={() => setShowAddOrder(false)}
        />
      )}
    </motion.div>
  )
}

// ─── ANA SAYFA ────────────────────────────────────────────────
export default function CustomersPage() {
  const { t } = useLanguage()
  const qc = useQueryClient()
  const { currentUser } = useAppStore()

  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const { data: allContacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })
  const customers = allContacts.filter(c => c.pipeline_stage === 'became_customer')
  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) ?? null : null

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductRow[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const { data: allOrders = [] } = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalRevenue = allOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_try, 0)
  const avgOrder = allOrders.filter(o => o.status !== 'cancelled').length > 0
    ? totalRevenue / allOrders.filter(o => o.status !== 'cancelled').length : 0
  const reordersDue = allOrders.filter(order => {
    if (order.status === 'cancelled' || !order.next_reorder_date) return false
    const reorderDate = new Date(order.next_reorder_date)
    reorderDate.setHours(0, 0, 0, 0)
    return reorderDate <= today
  }).length

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); setDeletingProductId(null) },
  })

  const userId = currentUser?.id ?? ''

  // Müşteri detay görünümü
  if (selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        products={products}
        userId={userId}
        onBack={() => setSelectedCustomerId(null)}
      />
    )
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div variants={itemAnim} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t.customers.title}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{customers.length} {t.customers.subtitle}</p>
          </div>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddCustomer(true)} id="btn-add-customer">
            {t.customers.addCustomer}
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={itemAnim} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t.customers.activeCustomers, value: customers.length, icon: ShoppingBag, color: 'text-success' },
            { label: 'Toplam Gelir', value: formatTRY(totalRevenue), icon: TrendingUp, color: 'text-primary' },
            { label: 'Ort. Sipariş', value: formatTRY(avgOrder), icon: TrendingUp, color: 'text-secondary' },
            { label: t.customers.reordersDue, value: reordersDue, icon: RefreshCw, color: 'text-warning' },
          ].map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary kpi-number">{s.value}</p>
                  <p className="text-xs text-text-tertiary">{s.label}</p>
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Customer List */}
        <motion.div variants={itemAnim}>
          {customers.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz hiç müşteri yok.</p>
              <p className="text-xs mt-1">Sağ üstteki &quot;Müşteri Ekle&quot; butonunu kullan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {customers.map(c => {
                const cOrders = allOrders.filter(o => o.contact_id === c.id && o.status !== 'cancelled')
                const spent = cOrders.reduce((s, o) => s + o.total_try, 0)
                return (
                  <motion.div key={c.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                    <Card hover className="cursor-pointer group" onClick={() => setSelectedCustomerId(c.id)}>
                      <div className="flex items-start gap-4">
                        <Avatar name={c.full_name} size="lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-text-primary">{c.full_name}</h3>
                            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5">
                            {[c.profession, c.location].filter(Boolean).join(' · ')}
                          </p>
                          <div className="grid grid-cols-3 gap-3 mt-3">
                            <div>
                              <p className="text-lg font-bold text-text-primary kpi-number">{cOrders.length}</p>
                              <p className="text-[10px] text-text-tertiary">{t.customers.orders}</p>
                            </div>
                            <div>
                              <p className="text-base font-bold text-success kpi-number truncate">{formatTRY(spent)}</p>
                              <p className="text-[10px] text-text-tertiary">{t.customers.totalSpent}</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-text-primary kpi-number">{c.relationship_strength}%</p>
                              <p className="text-[10px] text-text-tertiary">{t.customers.loyalty}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Ürün Kataloğu */}
        <motion.div variants={itemAnim}>
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  <Package className="w-4 h-4 text-primary shrink-0" />
                  <span>{t.common.productCatalog}</span>
                  <Badge variant="default" size="sm">{products.length} ürün</Badge>
                </CardTitle>
                <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}
                  className="sm:ml-auto shrink-0"
                  onClick={() => { setEditingProduct(null); setShowProductModal(true) }} id="btn-add-product">
                  Ürün Ekle
                </Button>
              </div>
            </CardHeader>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface/50 border border-border-subtle h-32 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-text-tertiary">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz ürün eklenmedi.</p>
                <p className="text-xs mt-1">Yukarıdaki &quot;Ürün Ekle&quot; butonunu kullan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {products.map(p => (
                  <div key={p.id}
                    className="group relative p-3 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer transition-all hover:shadow-lg">
                    {/* Edit/Delete */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={e => { e.stopPropagation(); setEditingProduct(p); setShowProductModal(true) }}
                        className="p-1 rounded-lg bg-card/90 border border-border hover:bg-primary/10 hover:text-primary transition-colors">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setDeletingProductId(p.id) }}
                        className="p-1 rounded-lg bg-card/90 border border-border hover:bg-error/10 hover:text-error transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Confirm Delete */}
                    {deletingProductId === p.id && (
                      <div className="absolute inset-0 z-20 rounded-xl bg-card/95 border border-error/30 flex flex-col items-center justify-center p-2 gap-2">
                        <p className="text-[10px] text-error font-medium text-center">Silinsin mi?</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => deleteProductMutation.mutate(p.id)}
                            className="px-2 py-0.5 rounded-lg bg-error text-white text-[10px] font-medium hover:bg-error/80 transition-colors">
                            {deleteProductMutation.isPending ? '...' : 'Evet'}
                          </button>
                          <button onClick={() => setDeletingProductId(null)}
                            className="px-2 py-0.5 rounded-lg bg-surface border border-border text-text-secondary text-[10px] font-medium hover:bg-surface-hover transition-colors">
                            İptal
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mx-auto mb-2">
                      <Package className="w-5 h-5 text-primary/60" />
                    </div>
                    <p className="text-xs font-medium text-text-primary truncate text-center leading-tight" title={p.name}>{p.name}</p>
                    {p.category && <p className="text-[10px] text-text-tertiary text-center mt-0.5 truncate">{p.category}</p>}
                    <p className="text-sm font-bold text-primary mt-1.5 text-center">{formatTRY(p.price_try)}</p>
                    {p.reorder_cycle_days && (
                      <p className="text-[9px] text-text-muted text-center mt-0.5">{p.reorder_cycle_days}g yenile</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showAddCustomer && (
        <AddCustomerModal userId={userId} onClose={() => setShowAddCustomer(false)} />
      )}
      {showProductModal && (
        <ProductModal userId={userId} editProduct={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null) }} />
      )}
    </>
  )
}
