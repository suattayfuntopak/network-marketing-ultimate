'use client'

import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { objections, scripts } from '@/data/mockData'
import {
  academyLibraryItems,
  academyObjectionGuides,
  type AcademyLibraryItem,
  type AcademyObjectionGuide,
} from '@/data/academyLibrary'
import { queueCoachPrompt } from '@/lib/clientStorage'
import { cn } from '@/lib/utils'
import {
  Clock,
  Copy,
  Filter,
  Heart,
  Library,
  MessageSquareQuote,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const validTabs = ['library', 'objections', 'favorites'] as const
type AcademyTab = (typeof validTabs)[number]

type LibraryResource = {
  id: string
  source: 'academy' | 'script'
  title: string
  summary: string
  content: string
  categoryKey: string
  categoryLabel: string
  typeLabel: string
  levelLabel: string
  readingMinutes: number
  tags: string[]
  coachPrompt: string
}

type ObjectionResource = {
  id: string
  source: 'academy' | 'legacy'
  title: string
  categoryKey: string
  categoryLabel: string
  shortResponse: string
  fullResponse: string
  approach: string
  exampleDialog: string
  tags: string[]
  coachPrompt: string
}

type ActivePanel =
  | { type: 'library'; resource: LibraryResource }
  | { type: 'objection'; resource: ObjectionResource }
  | null

function scriptCategoryLabel(category: string, locale: 'tr' | 'en') {
  const labels: Record<string, { tr: string; en: string }> = {
    Davet: { tr: 'Davet', en: 'Invitation' },
    Takip: { tr: 'Takip', en: 'Follow-up' },
    'Müşteri İlişkileri': { tr: 'Müşteri İlişkileri', en: 'Customer Care' },
    'Sosyal Medya': { tr: 'Sosyal Medya', en: 'Social Media' },
    Oryantasyon: { tr: 'Oryantasyon', en: 'Onboarding' },
    İtirazlar: { tr: 'İtirazlar', en: 'Objections' },
    'Potansiyel Müşteri': { tr: 'Potansiyel', en: 'Prospecting' },
  }

  return labels[category]?.[locale] ?? category
}

function academyCategoryLabel(category: AcademyLibraryItem['category'], locale: 'tr' | 'en') {
  const labels = {
    mindset: { tr: 'Zihniyet', en: 'Mindset' },
    prospecting: { tr: 'Potansiyel', en: 'Prospecting' },
    inviting: { tr: 'Davet', en: 'Inviting' },
    presenting: { tr: 'Sunum', en: 'Presenting' },
    follow_up: { tr: 'Takip', en: 'Follow-up' },
    team_building: { tr: 'Ekip Kurulumu', en: 'Team Building' },
    social_media: { tr: 'Sosyal Medya', en: 'Social Media' },
    product_knowledge: { tr: 'Ürün Bilgisi', en: 'Product Knowledge' },
  } as const

  return labels[category][locale]
}

function academyTypeLabel(type: AcademyLibraryItem['type'], locale: 'tr' | 'en') {
  const labels = {
    lesson: { tr: 'Ders Notu', en: 'Lesson Note' },
    article: { tr: 'Makale', en: 'Article' },
    script: { tr: 'Senaryo', en: 'Script' },
    cheat_sheet: { tr: 'Hızlı Rehber', en: 'Cheat Sheet' },
    role_play: { tr: 'Rol Canlandırma', en: 'Role Play' },
  } as const

  return labels[type][locale]
}

function academyLevelLabel(level: AcademyLibraryItem['level'], locale: 'tr' | 'en') {
  const labels = {
    beginner: { tr: 'Başlangıç', en: 'Beginner' },
    intermediate: { tr: 'Orta Seviye', en: 'Intermediate' },
    advanced: { tr: 'İleri Seviye', en: 'Advanced' },
  } as const

  return labels[level][locale]
}

function objectionCategoryLabel(category: AcademyObjectionGuide['category'], locale: 'tr' | 'en') {
  const labels = {
    money: { tr: 'Para', en: 'Money' },
    time: { tr: 'Zaman', en: 'Time' },
    trust: { tr: 'Güven', en: 'Trust' },
    family: { tr: 'Aile / Çevre', en: 'Family / Circle' },
    fear: { tr: 'Korku', en: 'Fear' },
    experience: { tr: 'Deneyim', en: 'Experience' },
    pyramid: { tr: 'Model Şüphesi', en: 'Model Skepticism' },
    wait: { tr: 'Erteleme', en: 'Delay' },
  } as const

  return labels[category][locale]
}

function typeIconForResource(typeLabel: string): LucideIcon {
  if (typeLabel.toLowerCase().includes('makale') || typeLabel.toLowerCase().includes('article')) return Library
  if (typeLabel.toLowerCase().includes('rehber') || typeLabel.toLowerCase().includes('cheat')) return Zap
  if (typeLabel.toLowerCase().includes('rol') || typeLabel.toLowerCase().includes('role')) return Sparkles
  return MessageSquareQuote
}

export default function AcademyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const activeTab = validTabs.includes((searchParams.get('tab') ?? 'library') as AcademyTab)
    ? ((searchParams.get('tab') ?? 'library') as AcademyTab)
    : 'library'

  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState('all')
  const [selectedObjectionCategory, setSelectedObjectionCategory] = useState('all')
  const [favoriteLibraryIds, setFavoriteLibraryIds] = usePersistentState<string[]>(
    'nmu-academy-library-favorites-v2',
    [],
  )
  const [favoriteObjectionIds, setFavoriteObjectionIds] = usePersistentState<string[]>(
    'nmu-academy-objection-favorites-v2',
    [],
  )
  const [viewedLibraryIds, setViewedLibraryIds] = usePersistentState<string[]>(
    'nmu-academy-library-viewed-v1',
    [],
  )
  const [viewedObjectionIds, setViewedObjectionIds] = usePersistentState<string[]>(
    'nmu-academy-objection-viewed-v1',
    [],
  )

  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLocaleLowerCase(currentLocale))

  const libraryResources = useMemo<LibraryResource[]>(() => {
    const academyResources = academyLibraryItems.map((resource) => ({
      id: resource.id,
      source: 'academy' as const,
      title: resource.title[currentLocale],
      summary: resource.summary[currentLocale],
      content: resource.content[currentLocale],
      categoryKey: resource.category,
      categoryLabel: academyCategoryLabel(resource.category, currentLocale),
      typeLabel: academyTypeLabel(resource.type, currentLocale),
      levelLabel: academyLevelLabel(resource.level, currentLocale),
      readingMinutes: resource.readingMinutes,
      tags: resource.tags,
      coachPrompt: resource.coachPrompt[currentLocale],
    }))

    const legacyScripts = scripts.map((script) => ({
      id: script.id,
      source: 'script' as const,
      title: script.title,
      summary: script.subcategory,
      content: script.content,
      categoryKey: script.category,
      categoryLabel: scriptCategoryLabel(script.category, currentLocale),
      typeLabel: currentLocale === 'tr' ? 'Saha Senaryosu' : 'Field Script',
      levelLabel: currentLocale === 'tr' ? 'Uygulamaya Hazır' : 'Field Ready',
      readingMinutes: Math.max(1, Math.ceil(script.content.split(/\s+/).length / 45)),
      tags: script.tags,
      coachPrompt: currentLocale === 'tr'
        ? `${script.title} içeriğini bana kişiselleştir ve 2 farklı tonla yeniden yaz.`
        : `Personalize ${script.title} for me and rewrite it in 2 different tones.`,
    }))

    return [...academyResources, ...legacyScripts]
  }, [currentLocale])

  const objectionResources = useMemo<ObjectionResource[]>(() => {
    const academyGuides = academyObjectionGuides.map((guide) => ({
      id: guide.id,
      source: 'academy' as const,
      title: guide.objection[currentLocale],
      categoryKey: guide.category,
      categoryLabel: objectionCategoryLabel(guide.category, currentLocale),
      shortResponse: guide.shortResponse[currentLocale],
      fullResponse: guide.fullResponse[currentLocale],
      approach: guide.approach[currentLocale],
      exampleDialog: guide.exampleDialog[currentLocale],
      tags: guide.tags,
      coachPrompt: guide.coachPrompt[currentLocale],
    }))

    const legacyGuides = objections.map((objection) => ({
      id: objection.id,
      source: 'legacy' as const,
      title: objection.objection,
      categoryKey: objection.category,
      categoryLabel: objection.category,
      shortResponse: objection.responses[0]?.script ?? '',
      fullResponse: objection.responses.map((response) => response.script).join('\n\n'),
      approach: currentLocale === 'tr'
        ? 'Farklı tonlarla hazırlanmış hızlı saha cevapları.'
        : 'Quick field-ready responses prepared in multiple tones.',
      exampleDialog: objection.responses.map((response) => response.script).join('\n\n'),
      tags: objection.tags,
      coachPrompt: currentLocale === 'tr'
        ? `"${objection.objection}" itirazına daha doğal bir cevap yaz.`
        : `Write a more natural response to the objection "${objection.objection}".`,
    }))

    return [...academyGuides, ...legacyGuides]
  }, [currentLocale])

  const libraryCategories = useMemo(
    () => ['all', ...new Set(libraryResources.map((resource) => resource.categoryKey))],
    [libraryResources],
  )

  const objectionCategories = useMemo(
    () => ['all', ...new Set(objectionResources.map((resource) => resource.categoryKey))],
    [objectionResources],
  )

  const filteredLibrary = libraryResources.filter((resource) => {
    const matchesCategory = selectedLibraryCategory === 'all' || resource.categoryKey === selectedLibraryCategory
    const haystack = `${resource.title} ${resource.summary} ${resource.tags.join(' ')} ${resource.categoryLabel}`.toLocaleLowerCase(currentLocale)
    const matchesSearch = deferredSearchTerm.length === 0 || haystack.includes(deferredSearchTerm)
    return matchesCategory && matchesSearch
  })

  const filteredObjections = objectionResources.filter((resource) => {
    const matchesCategory = selectedObjectionCategory === 'all' || resource.categoryKey === selectedObjectionCategory
    const haystack = `${resource.title} ${resource.shortResponse} ${resource.tags.join(' ')} ${resource.categoryLabel}`.toLocaleLowerCase(currentLocale)
    const matchesSearch = deferredSearchTerm.length === 0 || haystack.includes(deferredSearchTerm)
    return matchesCategory && matchesSearch
  })

  const favoriteLibrary = libraryResources.filter((resource) => favoriteLibraryIds.includes(resource.id))
  const favoriteObjections = objectionResources.filter((resource) => favoriteObjectionIds.includes(resource.id))
  const totalFavorites = favoriteLibrary.length + favoriteObjections.length
  const totalViewed = viewedLibraryIds.length + viewedObjectionIds.length
  const totalAvailable = libraryResources.length + objectionResources.length

  function updateTab(tab: AcademyTab) {
    startTransition(() => {
      router.replace(tab === 'library' ? '/academy' : `/academy?tab=${tab}`)
    })
  }

  function markLibraryViewed(id: string) {
    setViewedLibraryIds((current) => (current.includes(id) ? current : [id, ...current]))
  }

  function markObjectionViewed(id: string) {
    setViewedObjectionIds((current) => (current.includes(id) ? current : [id, ...current]))
  }

  function openLibraryResource(resource: LibraryResource) {
    markLibraryViewed(resource.id)
    setActivePanel({ type: 'library', resource })
  }

  function openObjectionResource(resource: ObjectionResource) {
    markObjectionViewed(resource.id)
    setActivePanel({ type: 'objection', resource })
  }

  function toggleLibraryFavorite(id: string) {
    setFavoriteLibraryIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [id, ...current],
    )
  }

  function toggleObjectionFavorite(id: string) {
    setFavoriteObjectionIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [id, ...current],
    )
  }

  async function copyText(id: string, value: string) {
    await navigator.clipboard.writeText(value)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 1800)
  }

  function openCoach(prompt: string) {
    queueCoachPrompt(prompt)
    router.push('/ai')
  }

  const tabLabels: Record<AcademyTab, string> = {
    library: currentLocale === 'tr' ? 'İçerik Kütüphanesi' : 'Content Library',
    objections: currentLocale === 'tr' ? 'İtiraz Bankası' : 'Objection Bank',
    favorites: currentLocale === 'tr' ? 'Favoriler' : 'Favorites',
  }

  const stats = [
    {
      label: currentLocale === 'tr' ? 'Çalışılan İçerik' : 'Studied Content',
      value: `${totalViewed}/${totalAvailable}`,
      icon: Sparkles,
      color: 'text-primary',
    },
    {
      label: currentLocale === 'tr' ? 'Kütüphane İçeriği' : 'Library Content',
      value: viewedLibraryIds.length.toString(),
      icon: Library,
      color: 'text-secondary',
    },
    {
      label: currentLocale === 'tr' ? 'İtiraz Rehberi' : 'Objection Guides',
      value: viewedObjectionIds.length.toString(),
      icon: ShieldAlert,
      color: 'text-warning',
    },
    {
      label: currentLocale === 'tr' ? 'Favori İçerik' : 'Saved Favorites',
      value: totalFavorites.toString(),
      icon: Heart,
      color: 'text-success',
    },
  ]

  const selectedLibraryResource = activePanel?.type === 'library' ? activePanel.resource : null
  const selectedObjectionResource = activePanel?.type === 'objection' ? activePanel.resource : null

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.academy.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {currentLocale === 'tr'
              ? 'Senaryolar, içerikler ve itiraz cevapları tek merkezde.'
              : 'Scripts, content, and objection answers live in one center.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {validTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => updateTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                activeTab === tab
                  ? 'bg-primary/15 text-primary border-primary/20'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary',
              )}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-hover flex items-center justify-center">
                <Icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p>
                <p className="text-xs text-text-tertiary">{stat.label}</p>
              </div>
            </Card>
          )
        })}
      </motion.div>

      {(activeTab === 'library' || activeTab === 'objections') && (
        <motion.div variants={item}>
          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={
                    activeTab === 'library'
                      ? (currentLocale === 'tr' ? 'İçerik, senaryo veya etiket ara...' : 'Search content, scripts, or tags...')
                      : (currentLocale === 'tr' ? 'İtiraz, kategori veya etiket ara...' : 'Search objections, categories, or tags...')
                  }
                  className="w-full h-11 rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/30"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-tertiary whitespace-nowrap">
                  <Filter className="w-3.5 h-3.5" />
                  {currentLocale === 'tr' ? 'Filtre' : 'Filter'}
                </div>
                {(activeTab === 'library' ? libraryCategories : objectionCategories).map((category) => {
                  const label = category === 'all'
                    ? (currentLocale === 'tr' ? 'Tümü' : 'All')
                    : activeTab === 'library'
                      ? libraryResources.find((resource) => resource.categoryKey === category)?.categoryLabel ?? category
                      : objectionResources.find((resource) => resource.categoryKey === category)?.categoryLabel ?? category
                  const isSelected = activeTab === 'library'
                    ? selectedLibraryCategory === category
                    : selectedObjectionCategory === category

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        if (activeTab === 'library') setSelectedLibraryCategory(category)
                        else setSelectedObjectionCategory(category)
                      }}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border',
                        isSelected
                          ? 'bg-primary/15 text-primary border-primary/20'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {activeTab === 'library' && (
        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredLibrary.map((resource) => {
            const Icon = typeIconForResource(resource.typeLabel)
            const isFavorite = favoriteLibraryIds.includes(resource.id)
            const isViewed = viewedLibraryIds.includes(resource.id)
            return (
              <Card key={resource.id} hover onClick={() => openLibraryResource(resource)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default" size="sm">{resource.categoryLabel}</Badge>
                      <Badge variant={resource.source === 'academy' ? 'secondary' : 'success'} size="sm">{resource.typeLabel}</Badge>
                      <span className="text-[10px] text-text-tertiary">{resource.levelLabel}</span>
                      {isViewed && (
                        <Badge variant="success" size="sm">
                          {currentLocale === 'tr' ? 'Çalışıldı' : 'Studied'}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">{resource.title}</h3>
                    <p className="text-xs text-text-tertiary mt-1">{resource.summary}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface/50 p-4 mb-4">
                  <p className="text-sm leading-relaxed text-text-secondary line-clamp-4">{resource.content}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {resource.readingMinutes} dk
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleLibraryFavorite(resource.id)
                      }}
                      className="w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 flex items-center justify-center text-text-secondary hover:text-warning"
                    >
                      <Star className={cn('w-3.5 h-3.5', isFavorite && 'fill-warning text-warning')} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredLibrary.length === 0 && (
            <Card className="xl:col-span-2">
              <div className="py-12 text-center">
                <Library className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">
                  {currentLocale === 'tr' ? 'Bu filtrede içerik bulunamadı.' : 'No content matched this filter.'}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {currentLocale === 'tr' ? 'Aramayı sadeleştir veya başka bir kategori seç.' : 'Try a broader search or another category.'}
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {activeTab === 'objections' && (
        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredObjections.map((resource) => {
            const isFavorite = favoriteObjectionIds.includes(resource.id)
            const isViewed = viewedObjectionIds.includes(resource.id)
            return (
              <Card key={resource.id} hover onClick={() => openObjectionResource(resource)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-error" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default" size="sm">{resource.categoryLabel}</Badge>
                      <Badge variant={resource.source === 'academy' ? 'secondary' : 'warning'} size="sm">
                        {resource.source === 'academy'
                          ? (currentLocale === 'tr' ? 'Derin Rehber' : 'Deep Guide')
                          : (currentLocale === 'tr' ? 'Hızlı Paket' : 'Quick Pack')}
                      </Badge>
                      {isViewed && (
                        <Badge variant="success" size="sm">
                          {currentLocale === 'tr' ? 'Çalışıldı' : 'Studied'}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">{resource.title}</h3>
                    <p className="text-xs text-text-tertiary mt-1">{resource.approach}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleObjectionFavorite(resource.id)
                    }}
                    className="w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 flex items-center justify-center text-text-secondary hover:text-warning"
                  >
                    <Star className={cn('w-3.5 h-3.5', isFavorite && 'fill-warning text-warning')} />
                  </button>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface/50 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                      {currentLocale === 'tr' ? 'Kısa cevap' : 'Short response'}
                    </p>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed line-clamp-3">{resource.shortResponse}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredObjections.length === 0 && (
            <Card className="xl:col-span-2">
              <div className="py-12 text-center">
                <ShieldAlert className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary">
                  {currentLocale === 'tr' ? 'Bu filtrede itiraz rehberi bulunamadı.' : 'No objection guide matched this filter.'}
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {activeTab === 'favorites' && (
        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                {currentLocale === 'tr' ? 'Kaydedilen İçerikler' : 'Saved Content'}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {favoriteLibrary.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => openLibraryResource(resource)}
                  className="w-full text-left rounded-xl border border-border-subtle bg-surface/50 p-4 hover:border-border"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{resource.title}</p>
                      <p className="text-xs text-text-tertiary mt-1">{resource.categoryLabel} · {resource.typeLabel}</p>
                    </div>
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  </div>
                </button>
              ))}
              {favoriteLibrary.length === 0 && (
                <p className="text-sm text-text-tertiary">
                  {currentLocale === 'tr' ? 'Henüz içerik favorilemedin.' : 'You have not saved any content yet.'}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-error" />
                {currentLocale === 'tr' ? 'Kaydedilen İtirazlar' : 'Saved Objections'}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {favoriteObjections.map((resource) => (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => openObjectionResource(resource)}
                  className="w-full text-left rounded-xl border border-border-subtle bg-surface/50 p-4 hover:border-border"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{resource.title}</p>
                      <p className="text-xs text-text-tertiary mt-1">{resource.categoryLabel}</p>
                    </div>
                    <Star className="w-4 h-4 text-warning fill-warning" />
                  </div>
                </button>
              ))}
              {favoriteObjections.length === 0 && (
                <p className="text-sm text-text-tertiary">
                  {currentLocale === 'tr' ? 'Henüz itiraz kaydetmedin.' : 'You have not saved any objections yet.'}
                </p>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      <Modal
        open={Boolean(activePanel)}
        onClose={() => setActivePanel(null)}
        title={selectedLibraryResource?.title ?? selectedObjectionResource?.title}
        description={
          selectedLibraryResource
            ? `${selectedLibraryResource.categoryLabel} · ${selectedLibraryResource.typeLabel}`
            : selectedObjectionResource
              ? `${selectedObjectionResource.categoryLabel} · ${currentLocale === 'tr' ? 'İtiraz Rehberi' : 'Objection Guide'}`
              : undefined
        }
      >
        {selectedLibraryResource && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{selectedLibraryResource.categoryLabel}</Badge>
              <Badge variant={selectedLibraryResource.source === 'academy' ? 'secondary' : 'success'}>{selectedLibraryResource.typeLabel}</Badge>
              <Badge variant="default">{selectedLibraryResource.levelLabel}</Badge>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{selectedLibraryResource.content}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedLibraryResource.tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleLibraryFavorite(selectedLibraryResource.id)}
              >
                <Star className={cn('w-3.5 h-3.5', favoriteLibraryIds.includes(selectedLibraryResource.id) && 'fill-warning text-warning')} />
                {favoriteLibraryIds.includes(selectedLibraryResource.id)
                  ? (currentLocale === 'tr' ? 'Favoriden çıkar' : 'Remove favorite')
                  : (currentLocale === 'tr' ? 'Favoriye ekle' : 'Save favorite')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  void copyText(selectedLibraryResource.id, selectedLibraryResource.content)
                }}
              >
                {copiedId === selectedLibraryResource.id ? t.common.copied : t.common.copy}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => openCoach(selectedLibraryResource.coachPrompt)}
              >
                {currentLocale === 'tr' ? 'YZ Koçu ile geliştir' : 'Refine with AI Coach'}
              </Button>
            </div>
          </div>
        )}

        {selectedObjectionResource && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{selectedObjectionResource.categoryLabel}</Badge>
              <Badge variant={selectedObjectionResource.source === 'academy' ? 'secondary' : 'warning'}>
                {selectedObjectionResource.source === 'academy'
                  ? (currentLocale === 'tr' ? 'Derin Rehber' : 'Deep Guide')
                  : (currentLocale === 'tr' ? 'Hızlı Paket' : 'Quick Pack')}
              </Badge>
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                  {currentLocale === 'tr' ? 'Kısa cevap' : 'Short response'}
                </p>
                <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.shortResponse}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                  {currentLocale === 'tr' ? 'Yaklaşım' : 'Approach'}
                </p>
                <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.approach}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                  {currentLocale === 'tr' ? 'Detaylı cevap' : 'Detailed response'}
                </p>
                <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.fullResponse}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
                <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                  {currentLocale === 'tr' ? 'Örnek diyalog' : 'Example dialogue'}
                </p>
                <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.exampleDialog}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleObjectionFavorite(selectedObjectionResource.id)}
              >
                <Star className={cn('w-3.5 h-3.5', favoriteObjectionIds.includes(selectedObjectionResource.id) && 'fill-warning text-warning')} />
                {favoriteObjectionIds.includes(selectedObjectionResource.id)
                  ? (currentLocale === 'tr' ? 'Favoriden çıkar' : 'Remove favorite')
                  : (currentLocale === 'tr' ? 'Favoriye ekle' : 'Save favorite')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  void copyText(selectedObjectionResource.id, selectedObjectionResource.fullResponse)
                }}
              >
                {copiedId === selectedObjectionResource.id ? t.common.copied : t.common.copy}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Sparkles className="w-3.5 h-3.5" />}
                onClick={() => openCoach(selectedObjectionResource.coachPrompt)}
              >
                {currentLocale === 'tr' ? 'YZ Koçu ile yeniden yaz' : 'Rewrite with AI Coach'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
