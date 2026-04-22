'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import {
  Activity,
  AlertTriangle,
  Crown,
  ShoppingBag,
  Target,
  Users,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type DirectoryCard = {
  id: string
  name: string
  headline: string
  role: 'leader' | 'distributor' | 'customer'
  lastActive: string
  temperature?: ContactRow['temperature']
  temperatureScore?: number
  relationshipStrength: number
  openTasks: number
  overdueTasks: number
  route: string
}

function daysSince(value: string) {
  const today = Date.now()
  const diff = today - new Date(value).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function buildContactDirectoryCard(contact: ContactRow, tasks: TaskRow[]): DirectoryCard {
  const relatedTasks = tasks.filter((task) => task.contact_id === contact.id && task.status !== 'completed' && task.status !== 'skipped')

  return {
    id: contact.id,
    name: contact.full_name,
    headline: [contact.profession, contact.location].filter(Boolean).join(' · ') || contact.source || 'NMU',
    role: contact.pipeline_stage === 'became_customer' ? 'customer' : 'distributor',
    lastActive: contact.last_contact_date ?? contact.updated_at,
    temperature: contact.temperature,
    temperatureScore: contact.temperature_score,
    relationshipStrength: contact.relationship_strength,
    openTasks: relatedTasks.length,
    overdueTasks: relatedTasks.filter((task) => task.status === 'overdue').length,
    route: `/contacts?contact=${contact.id}&returnTo=%2Fteam`,
  }
}

function CategorySection({
  title,
  description,
  count,
  cards,
  locale,
  emptyLabel,
}: {
  title: string
  description: string
  count: number
  cards: DirectoryCard[]
  locale: 'tr' | 'en'
  emptyLabel: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-1 text-xs text-text-tertiary">{description}</p>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-tertiary">
            {emptyLabel}
          </div>
        ) : (
          cards.map((card) => (
            <Link
              key={card.id}
              href={card.route}
              className="block rounded-xl border border-border-subtle bg-card px-4 py-3 transition-colors hover:border-border hover:bg-card-hover"
            >
              <div className="flex items-start gap-3">
                <Avatar name={card.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary leading-5 break-words">{card.name}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary break-words">{card.headline}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {card.temperature && (
                      <TemperatureBadge temperature={card.temperature} score={card.temperatureScore} />
                    )}
                    {card.overdueTasks > 0 && (
                      <Badge variant="warning">{card.overdueTasks} {locale === 'tr' ? 'gecikmiş' : 'overdue'}</Badge>
                    )}
                    {card.openTasks > 0 && (
                      <Badge>{card.openTasks} {locale === 'tr' ? 'açık görev' : 'open tasks'}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export default function TeamPage() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const { currentUser } = useAppStore()
  const router = useRouter()

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const distributorCards = contacts
    .filter((contact) => contact.pipeline_stage === 'became_member')
    .map((contact) => buildContactDirectoryCard(contact, tasks))
    .sort((a, b) => (b.relationshipStrength + b.openTasks * 4) - (a.relationshipStrength + a.openTasks * 4))

  const customerCards = contacts
    .filter((contact) => contact.pipeline_stage === 'became_customer')
    .map((contact) => buildContactDirectoryCard(contact, tasks))
    .sort((a, b) => (b.relationshipStrength + b.openTasks * 4) - (a.relationshipStrength + a.openTasks * 4))

  const leaderCards: DirectoryCard[] = currentUser
    ? [{
        id: currentUser.id,
        name: currentUser.name,
        headline: currentUser.rank ?? (currentLocale === 'tr' ? 'Organizasyon Lideri' : 'Organization Leader'),
        role: 'leader',
        lastActive: new Date().toISOString(),
        relationshipStrength: currentUser.momentumScore,
        openTasks: tasks.filter((task) => !task.contact_id && task.status !== 'completed' && task.status !== 'skipped').length,
        overdueTasks: tasks.filter((task) => !task.contact_id && task.status === 'overdue').length,
        route: '/team/leader',
      }]
    : []

  const attentionList = [...distributorCards, ...customerCards]
    .filter((card) => card.overdueTasks > 0 || daysSince(card.lastActive) > 14 || card.relationshipStrength < 45)
    .sort((a, b) => {
      const scoreA = a.overdueTasks * 10 + daysSince(a.lastActive) + (100 - a.relationshipStrength)
      const scoreB = b.overdueTasks * 10 + daysSince(b.lastActive) + (100 - b.relationshipStrength)
      return scoreB - scoreA
    })
    .slice(0, 5)

  const totalOrg = leaderCards.length + distributorCards.length + customerCards.length
  const openFollowUps = tasks.filter((task) => task.status === 'pending' || task.status === 'overdue').length
  const riskWatch = attentionList.length

  const stats = [
    {
      label: currentLocale === 'tr' ? 'Toplam Organizasyon' : 'Total Organization',
      value: totalOrg,
      icon: Users,
      color: 'text-primary',
    },
    {
      label: currentLocale === 'tr' ? 'Lider' : 'Leaders',
      value: leaderCards.length,
      icon: Crown,
      color: 'text-secondary',
    },
    {
      label: currentLocale === 'tr' ? 'Distribütör' : 'Distributors',
      value: distributorCards.length,
      icon: Target,
      color: 'text-success',
    },
    {
      label: currentLocale === 'tr' ? 'Müşteri' : 'Customers',
      value: customerCards.length,
      icon: ShoppingBag,
      color: 'text-accent',
    },
    {
      label: currentLocale === 'tr' ? 'Takip Gerektirenler' : 'Needs Attention',
      value: riskWatch,
      icon: AlertTriangle,
      color: 'text-warning',
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1500px] mx-auto">
      <motion.div variants={item} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {h(currentLocale === 'tr' ? 'Ekip & Organizasyon' : 'Team & Organization')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {currentLocale === 'tr'
              ? 'Tek ekranda lider, distribütör ve müşteri görünümü ile organizasyon fotoğrafı.'
              : 'A single-screen organization view for leaders, distributors, and customers.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push('/customers')}>
            {h(currentLocale === 'tr' ? 'Müşterilere Göz At' : 'Browse Customers')}
          </Button>
          <Button size="sm" onClick={() => router.push('/contacts')}>
            {h(currentLocale === 'tr' ? 'Kontaklara Göz At' : 'Browse Contacts')}
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-hover">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-tertiary">{h(stat.label)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="grid gap-4 xl:grid-cols-[1.55fr_0.9fr]">
        <Card className="overflow-hidden" padding="none">
          <div className="border-b border-border px-5 py-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {h(currentLocale === 'tr' ? 'Organizasyon Görünümü' : 'Organization view')}
            </CardTitle>
            <CardDescription>
              {currentLocale === 'tr'
                ? 'Rol bazlı gruplar sayesinde kim nerede duruyor hızlıca gör.'
                : 'See each role group clearly without leaving the page.'}
            </CardDescription>
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-1 xl:grid-cols-3">
            <CategorySection
              title={h(currentLocale === 'tr' ? 'Lider' : 'Leader')}
              description={currentLocale === 'tr' ? 'Organizasyonu yöneten çekirdek görünüm.' : 'Core leadership visibility.'}
              count={leaderCards.length}
              cards={leaderCards}
              locale={currentLocale}
              emptyLabel={currentLocale === 'tr' ? 'Henüz lider görünümü yok.' : 'No leader view yet.'}
            />
            <CategorySection
              title={h(currentLocale === 'tr' ? 'Distribütör' : 'Distributor')}
              description={currentLocale === 'tr' ? 'Takip ve ivme isteyen ekip üyeleri.' : 'Members who need momentum and follow-up.'}
              count={distributorCards.length}
              cards={distributorCards}
              locale={currentLocale}
              emptyLabel={currentLocale === 'tr' ? 'Henüz distribütör yok.' : 'No distributors yet.'}
            />
            <CategorySection
              title={h(currentLocale === 'tr' ? 'Müşteri' : 'Customer')}
              description={currentLocale === 'tr' ? 'Korunması ve büyütülmesi gereken müşteri tabanı.' : 'Customer relationships to retain and grow.'}
              count={customerCards.length}
              cards={customerCards}
              locale={currentLocale}
              emptyLabel={currentLocale === 'tr' ? 'Henüz müşteri yok.' : 'No customers yet.'}
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" />
                {h(currentLocale === 'tr' ? 'Bugünün operasyon özeti' : 'Today’s operating snapshot')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/40 px-3 py-3">
                <span className="text-text-secondary">{h(currentLocale === 'tr' ? 'Açık takipler' : 'Open follow-ups')}</span>
                <strong className="text-text-primary">{openFollowUps}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/40 px-3 py-3">
                <span className="text-text-secondary">{h(currentLocale === 'tr' ? 'Distribütör havuzu' : 'Distributor pool')}</span>
                <strong className="text-text-primary">{distributorCards.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface/40 px-3 py-3">
                <span className="text-text-secondary">{h(currentLocale === 'tr' ? 'Müşteri tabanı' : 'Customer base')}</span>
                <strong className="text-text-primary">{customerCards.length}</strong>
              </div>
            </div>
          </Card>

          <Card glow={attentionList.length > 0 ? 'warning' : 'none'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                {h(currentLocale === 'tr' ? 'Yakın destek gerektirenler' : 'Needs support soon')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {attentionList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle px-4 py-6 text-center text-sm text-text-tertiary">
                  {currentLocale === 'tr'
                    ? 'Şu an kritik destek gerektiren kayıt görünmüyor.'
                    : 'No critical support cases are visible right now.'}
                </div>
              ) : (
                attentionList.map((card) => (
                  <Link
                    key={card.id}
                    href={card.route}
                    className="block rounded-xl border border-border-subtle bg-surface/40 px-4 py-3 transition-colors hover:border-border hover:bg-card-hover"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{card.name}</p>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {card.overdueTasks > 0
                            ? (currentLocale === 'tr'
                              ? `${card.overdueTasks} gecikmiş görev var`
                              : `${card.overdueTasks} overdue tasks`)
                            : (currentLocale === 'tr'
                              ? `${daysSince(card.lastActive)} gündür temas yok`
                              : `No touch for ${daysSince(card.lastActive)} days`)}
                        </p>
                      </div>
                      <Badge variant={card.overdueTasks > 0 ? 'warning' : 'default'}>
                        {card.role === 'customer'
                          ? (currentLocale === 'tr' ? 'Müşteri' : 'Customer')
                          : (currentLocale === 'tr' ? 'Distribütör' : 'Distributor')}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
