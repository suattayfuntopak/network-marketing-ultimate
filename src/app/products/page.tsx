'use client'

import { type ReactNode, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProductModal } from '@/components/customers/ProductModal'
import { useAppStore } from '@/store/appStore'
import { fetchProducts, fetchAllOrders, deleteProduct, type ProductRow, type OrderRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { Plus, Star, Package, Sparkles, Flame, BarChart3, Trash2, Pencil } from 'lucide-react'

type TabKey = 'all' | 'popular' | 'insights'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function ProductsPage() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const qc = useQueryClient()
  const router = useRouter()
  const { currentUser } = useAppStore()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'

  const [tab, setTab] = useState<TabKey>('all')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null)

  const { data: products = [] } = useQuery<ProductRow[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  const { data: orders = [] } = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const productStats = useMemo(() => {
    const productMap = new Map<string, { quantity: number; revenue: number }>()
    for (const order of orders) {
      if (order.status === 'cancelled') continue
      const items = order.items ?? []
      for (const item of items) {
        const key = item.product_id || item.product_name
        const row = productMap.get(key) ?? { quantity: 0, revenue: 0 }
        row.quantity += item.quantity
        row.revenue += item.quantity * item.unit_price_try
        productMap.set(key, row)
      }
    }

    const withStats = products.map((product) => {
      const stat = productMap.get(product.id) ?? productMap.get(product.name) ?? { quantity: 0, revenue: 0 }
      return { product, quantity: stat.quantity, revenue: stat.revenue }
    })

    const topByQuantity = [...withStats].sort((a, b) => b.quantity - a.quantity)
    const totalRevenue = withStats.reduce((sum, row) => sum + row.revenue, 0)
    return { withStats, topByQuantity, totalRevenue }
  }, [orders, products])

  const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: 'all', label: currentLocale === 'tr' ? 'Tüm Ürünler' : 'All Products', icon: <Package className="h-4 w-4" /> },
    { key: 'popular', label: currentLocale === 'tr' ? 'En Çok Tercih Edilenler' : 'Most Preferred', icon: <Flame className="h-4 w-4" /> },
    { key: 'insights', label: currentLocale === 'tr' ? 'Ürün Analitiği' : 'Product Insights', icon: <BarChart3 className="h-4 w-4" /> },
  ]

  const visibleProducts = tab === 'popular' ? productStats.topByQuantity.filter((p) => p.quantity > 0) : productStats.withStats
  const userId = currentUser?.id ?? ''

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
        <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{h(currentLocale === 'tr' ? 'Ürün Kataloğu' : 'Product catalog')}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {currentLocale === 'tr'
                ? `${products.length} aktif ürün • ${productStats.totalRevenue.toLocaleString('tr-TR')} TL toplam satış etkisi`
                : `${products.length} active products • ${productStats.totalRevenue.toLocaleString('en-US')} TRY total sales impact`}
            </p>
          </div>
          <Button
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setEditingProduct(null)
              setShowProductModal(true)
            }}
          >
            {h(currentLocale === 'tr' ? 'Ürün ekle' : 'Add product')}
          </Button>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl border border-border bg-card p-1.5">
          <div className="flex flex-wrap gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                  tab === t.key ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-surface/70 hover:text-text-primary',
                )}
              >
                {t.icon}
                {h(t.label)}
              </button>
            ))}
          </div>
        </motion.div>

        {tab === 'insights' ? (
          <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{h(currentLocale === 'tr' ? 'Toplam Ürün' : 'Total products')}</p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">{products.length}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{h(currentLocale === 'tr' ? 'Satılan Adet' : 'Units sold')}</p>
              <p className="mt-3 text-3xl font-semibold text-text-primary">
                {productStats.withStats.reduce((sum, row) => sum + row.quantity, 0)}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.14em] text-text-tertiary">{h(currentLocale === 'tr' ? 'Toplam Ciro' : 'Total revenue')}</p>
              <p className="mt-3 text-3xl font-semibold text-success">
                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(productStats.totalRevenue)}
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.length === 0 ? (
              <Card className="sm:col-span-2 xl:col-span-4">
                <div className="py-14 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-text-muted" />
                  <p className="mt-3 text-sm text-text-secondary">
                    {currentLocale === 'tr' ? 'Bu sekmede görüntülenecek ürün yok.' : 'No products to show in this tab.'}
                  </p>
                </div>
              </Card>
            ) : (
              visibleProducts.map(({ product, quantity, revenue }) => (
                <Card
                  key={product.id}
                  className="relative overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <div className="absolute right-3 top-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setEditingProduct(product)
                        setShowProductModal(true)
                      }}
                      className="rounded-lg border border-border bg-surface/80 p-1.5 text-text-secondary hover:text-primary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteMutation.mutate(product.id)
                      }}
                      className="rounded-lg border border-border bg-surface/80 p-1.5 text-text-secondary hover:text-error"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-xl object-cover border border-border-subtle" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border-subtle bg-surface/60">
                        <Package className="h-5 w-5 text-primary/70" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{product.name}</p>
                      <p className="truncate text-xs text-text-secondary">{product.category || (currentLocale === 'tr' ? 'Kategori yok' : 'No category')}</p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-text-primary">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(product.price_try)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="default" size="sm">
                      {currentLocale === 'tr' ? `${quantity} adet` : `${quantity} units`}
                    </Badge>
                    <Badge variant="success" size="sm">
                      {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(revenue)}
                    </Badge>
                    {quantity > 0 && (
                      <Badge variant="warning" size="sm">
                        <Star className="mr-1 h-3 w-3" />
                        {currentLocale === 'tr' ? 'Tercih Edilen' : 'Preferred'}
                      </Badge>
                    )}
                  </div>
                </Card>
              ))
            )}
          </motion.div>
        )}
      </motion.div>

      {showProductModal && (
        <ProductModal
          userId={userId}
          editProduct={editingProduct}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
        />
      )}
    </>
  )
}
