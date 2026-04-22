'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchContacts, type ContactRow,
  fetchCustomerContactIds,
  type ProductRow,
  fetchAllOrders, fetchOrdersByContact, updateOrderStatus, deleteOrder,
  type OrderRow, type OrderItem,
} from '@/lib/queries'
import {
  ShoppingBag, Plus, TrendingUp, Trash2, ArrowLeft,
  ShoppingCart, Clock, Receipt, ChevronRight, Phone, MapPin, Users, CalendarRange, CalendarDays, Sun, Package,
} from 'lucide-react'
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

export function CustomerDetail({ customer, products, userId, onBack }: {
  customer: ContactRow; products: ProductRow[]; userId: string; onBack: () => void
}) {
  const qc = useQueryClient()
  const { locale } = useLanguage()
  const h = useHeadingCase()
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
          {currentLocale === 'tr' ? h('Müşterilere Dön') : h('Back to customers')}
        </Button>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAddOrder(true)}>
          {currentLocale === 'tr' ? h('Sipariş Ekle') : h('Add order')}
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
              <p className="text-[10px] text-text-tertiary mt-0.5">{h('Sipariş')}</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-success truncate">{formatTRY(totalSpent)}</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{h('Toplam')}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-text-primary">{customer.relationship_strength}%</p>
              <p className="text-[10px] text-text-tertiary mt-0.5">{h('Sadakat')}</p>
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
                <Receipt className="w-4 h-4 text-primary" /> {h('Sipariş Geçmişi')}
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
                        {locale === 'tr' ? 'Sonraki yeniden sipariş' : 'Next reorder'}: <span className="font-medium text-text-primary">{formatDate(order.next_reorder_date)}</span>
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
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const router = useRouter()

  const { data: allContacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })
  const { data: customerContactIds = null } = useQuery<string[] | null>({
    queryKey: ['customer-contact-ids'],
    queryFn: fetchCustomerContactIds,
  })
  const customers = useMemo(() => {
    if (!customerContactIds) {
      return allContacts.filter((contact) => contact.pipeline_stage === 'became_customer')
    }
    const idSet = new Set(customerContactIds)
    return allContacts.filter((contact) => idSet.has(contact.id))
  }, [allContacts, customerContactIds])
  const { data: allOrders = [] } = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
  })

  const startOfToday = useMemo(() => {
    const value = new Date()
    value.setHours(0, 0, 0, 0)
    return value
  }, [])

  const startOfWeek = useMemo(() => {
    const value = new Date(startOfToday)
    const day = value.getDay()
    const diff = day === 0 ? -6 : 1 - day
    value.setDate(value.getDate() + diff)
    value.setHours(0, 0, 0, 0)
    return value
  }, [startOfToday])

  const startOfMonth = useMemo(() => {
    const value = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1)
    value.setHours(0, 0, 0, 0)
    return value
  }, [startOfToday])

  const customerKpis = useMemo(() => {
    let total = 0
    let month = 0
    let week = 0
    let today = 0
    for (const customer of customers) {
      total += 1
      const createdAt = new Date(customer.created_at)
      if (Number.isNaN(createdAt.getTime())) continue
      if (createdAt >= startOfMonth) month += 1
      if (createdAt >= startOfWeek) week += 1
      if (createdAt >= startOfToday) today += 1
    }
    return { total, month, week, today }
  }, [customers, startOfMonth, startOfWeek, startOfToday])

  const validOrders = useMemo(() => allOrders.filter((order) => order.status !== 'cancelled'), [allOrders])

  const revenueKpis = useMemo(() => {
    let total = 0
    let month = 0
    let week = 0
    let today = 0
    for (const order of validOrders) {
      const amount = Number(order.total_try) || 0
      total += amount
      const orderDate = new Date(order.order_date)
      if (Number.isNaN(orderDate.getTime())) continue
      if (orderDate >= startOfMonth) month += amount
      if (orderDate >= startOfWeek) week += amount
      if (orderDate >= startOfToday) today += amount
    }
    return { total, month, week, today }
  }, [startOfMonth, startOfWeek, startOfToday, validOrders])

  const orderKpis = useMemo(() => {
    let total = 0
    let month = 0
    let week = 0
    let today = 0
    for (const order of validOrders) {
      total += 1
      const orderDate = new Date(order.order_date)
      if (Number.isNaN(orderDate.getTime())) continue
      if (orderDate >= startOfMonth) month += 1
      if (orderDate >= startOfWeek) week += 1
      if (orderDate >= startOfToday) today += 1
    }
    return { total, month, week, today }
  }, [startOfMonth, startOfWeek, startOfToday, validOrders])

  const customerRows = useMemo(() => {
    return customers.map((customer) => {
      const orders = validOrders.filter((order) => order.contact_id === customer.id)
      const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total_try) || 0), 0)
      return {
        customer,
        orderCount: orders.length,
        totalSpent,
        lastOrderDate: orders[0]?.order_date ?? null,
      }
    })
  }, [customers, validOrders])

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <motion.div variants={itemAnim} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{h(t.customers.title)}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{customers.length} {t.customers.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Package className="w-3.5 h-3.5" />}
              onClick={() => router.push('/products')}
            >
              {locale === 'tr' ? h('Ürün Kataloğu') : h('Product Catalog')}
            </Button>
            <Button
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => router.push('/contacts?segment=customers&new=1')}
              id="btn-add-customer"
            >
              {h(t.customers.addCustomer)}
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: locale === 'tr' ? 'AKTİF MÜŞTERİLER' : 'ACTIVE CUSTOMERS', value: customerKpis.total, icon: Users },
            { label: locale === 'tr' ? 'BU AYKİ MÜŞTERİLER' : 'CUSTOMERS THIS MONTH', value: customerKpis.month, icon: CalendarRange },
            { label: locale === 'tr' ? 'BU HAFTAKİ MÜŞTERİLER' : 'CUSTOMERS THIS WEEK', value: customerKpis.week, icon: CalendarDays },
            { label: locale === 'tr' ? 'BUGÜNKÜ MÜŞTERİLER' : 'CUSTOMERS TODAY', value: customerKpis.today, icon: Sun },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{s.label}</span>
                </div>
                <p className="text-3xl font-semibold text-text-primary kpi-number">{s.value}</p>
              </Card>
            )
          })}
        </motion.div>

        <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: locale === 'tr' ? 'TOPLAM GELİR' : 'TOTAL REVENUE', value: formatTRY(revenueKpis.total) },
            { label: locale === 'tr' ? 'BU AYKİ GELİR' : 'REVENUE THIS MONTH', value: formatTRY(revenueKpis.month) },
            { label: locale === 'tr' ? 'BU HAFTAKİ GELİR' : 'REVENUE THIS WEEK', value: formatTRY(revenueKpis.week) },
            { label: locale === 'tr' ? 'BUGÜNKÜ GELİR' : 'REVENUE TODAY', value: formatTRY(revenueKpis.today) },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span>{s.label}</span>
              </div>
              <p className="text-3xl font-semibold text-text-primary kpi-number">{s.value}</p>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { label: locale === 'tr' ? 'TOPLAM SİPARİŞ' : 'TOTAL ORDERS', value: orderKpis.total },
            { label: locale === 'tr' ? 'BU AYKİ SİPARİŞ' : 'ORDERS THIS MONTH', value: orderKpis.month },
            { label: locale === 'tr' ? 'BU HAFTAKİ SİPARİŞ' : 'ORDERS THIS WEEK', value: orderKpis.week },
            { label: locale === 'tr' ? 'BUGÜNKÜ SİPARİŞ' : 'ORDERS TODAY', value: orderKpis.today },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                <span>{s.label}</span>
              </div>
              <p className="text-3xl font-semibold text-text-primary kpi-number">{s.value}</p>
            </Card>
          ))}
        </motion.div>

        <motion.div variants={itemAnim}>
          {customers.length === 0 ? (
            <div className="text-center py-16 text-text-tertiary">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Henüz hiç müşteri yok.</p>
              <p className="text-xs mt-1">Sağ üstteki &quot;Müşteri Ekle&quot; butonunu kullan.</p>
            </div>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full hidden md:table">
                  <thead className="bg-surface/60 border-b border-border">
                    <tr className="text-left text-xs uppercase tracking-[0.14em] text-text-tertiary">
                      <th className="px-4 py-3">{locale === 'tr' ? 'Müşteri' : 'Customer'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Telefon' : 'Phone'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Konum' : 'Location'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Son sipariş' : 'Last order'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Toplam harcama' : 'Total spent'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Sipariş' : 'Orders'}</th>
                      <th className="px-4 py-3">{locale === 'tr' ? 'Sadakat' : 'Loyalty'}</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {customerRows.map(({ customer, orderCount, totalSpent, lastOrderDate }) => (
                      <tr
                        key={customer.id}
                        onClick={() => router.push(`/contacts?segment=customers&contact=${customer.id}&returnTo=%2Fcustomers`)}
                        className="cursor-pointer border-b border-border-subtle/70 hover:bg-surface/35 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.full_name} size="sm" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{customer.full_name}</p>
                              <p className="text-xs text-text-secondary">{customer.profession || (locale === 'tr' ? 'Meslek belirtilmedi' : 'No profession')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{customer.phone || '—'}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{customer.location || '—'}</td>
                        <td className="px-4 py-3 text-sm text-text-secondary">{lastOrderDate ? formatDate(lastOrderDate) : '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-success">{formatTRY(totalSpent)}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">{orderCount}</td>
                        <td className="px-4 py-3 text-sm text-text-primary">{customer.relationship_strength}%</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="w-4 h-4 text-text-muted" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-border-subtle">
                {customerRows.map(({ customer, orderCount, totalSpent, lastOrderDate }) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => router.push(`/contacts?segment=customers&contact=${customer.id}&returnTo=%2Fcustomers`)}
                    className="w-full p-4 text-left hover:bg-surface/35 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={customer.full_name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-primary">{customer.full_name}</p>
                          <p className="truncate text-xs text-text-secondary">{customer.phone || '—'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-text-tertiary">{locale === 'tr' ? 'Sipariş' : 'Orders'}</p>
                        <p className="font-semibold text-text-primary">{orderCount}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">{locale === 'tr' ? 'Toplam' : 'Total'}</p>
                        <p className="font-semibold text-success">{formatTRY(totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">{locale === 'tr' ? 'Son sipariş' : 'Last order'}</p>
                        <p className="font-semibold text-text-primary">{lastOrderDate ? formatDate(lastOrderDate) : '—'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      </motion.div>

      {/* Customer add now uses shared Contacts modal flow via route params */}
    </>
  )
}
