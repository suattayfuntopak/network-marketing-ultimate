'use client'

import { type FormEvent, startTransition, useDeferredValue, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import {
  academyLibraryCategories,
  academyLibraryItemTypes,
  academyLibraryItems,
  academyLibraryLevels,
  academyObjectionCategories,
  academyObjectionGuides,
  type AcademyLibraryCategory,
  type AcademyLibraryItem,
  type AcademyLibraryItemType,
  type AcademyLibraryLevel,
  type AcademyObjectionCategory,
  type AcademyObjectionGuide,
} from '@/data/academyLibrary'
import { queueCoachPrompt } from '@/lib/clientStorage'
import { cn, generateId } from '@/lib/utils'
import {
  Clock,
  Copy,
  Filter,
  Heart,
  Library,
  MessageSquareQuote,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const ITEMS_PER_PAGE = 10

const validTabs = ['library', 'objections', 'favorites'] as const
type AcademyTab = (typeof validTabs)[number]

const libraryCategoryLabels: Record<AcademyLibraryCategory, { tr: string; en: string }> = {
  mindset: { tr: 'Zihniyet', en: 'Mindset' },
  prospecting: { tr: 'Aday Bulma', en: 'Prospecting' },
  inviting: { tr: 'Davet', en: 'Inviting' },
  presenting: { tr: 'Sunum', en: 'Presenting' },
  closing: { tr: 'Karar Aşaması', en: 'Closing' },
  follow_up: { tr: 'Takip', en: 'Follow-up' },
  team_building: { tr: 'Ekip Kurma', en: 'Team Building' },
  leadership: { tr: 'Liderlik', en: 'Leadership' },
  social_media: { tr: 'Sosyal Medya', en: 'Social Media' },
  product_knowledge: { tr: 'Ürün Bilgisi', en: 'Product Knowledge' },
  company_info: { tr: 'Şirket Bilgisi', en: 'Company Info' },
  compliance: { tr: 'Etik ve Uyum', en: 'Compliance' },
}

const libraryTypeLabels: Record<AcademyLibraryItemType, { tr: string; en: string }> = {
  lesson: { tr: 'Ders Notu', en: 'Lesson Note' },
  article: { tr: 'Makale', en: 'Article' },
  script: { tr: 'Senaryo', en: 'Script' },
  cheat_sheet: { tr: 'Hızlı Rehber', en: 'Cheat Sheet' },
  role_play: { tr: 'Rol Canlandırma', en: 'Role Play' },
  success_story: { tr: 'Başarı Hikayesi', en: 'Success Story' },
}

const libraryLevelLabels: Record<AcademyLibraryLevel, { tr: string; en: string }> = {
  beginner: { tr: 'Başlangıç', en: 'Beginner' },
  intermediate: { tr: 'Orta Seviye', en: 'Intermediate' },
  advanced: { tr: 'İleri Seviye', en: 'Advanced' },
}

const objectionCategoryLabels: Record<AcademyObjectionCategory, { tr: string; en: string }> = {
  money: { tr: 'Para', en: 'Money' },
  time: { tr: 'Zaman', en: 'Time' },
  trust: { tr: 'Güven', en: 'Trust' },
  family: { tr: 'Aile / Çevre', en: 'Family / Circle' },
  fear: { tr: 'Korku', en: 'Fear' },
  experience: { tr: 'Deneyim', en: 'Experience' },
  product: { tr: 'Ürün', en: 'Product' },
  company: { tr: 'Şirket', en: 'Company' },
  pyramid: { tr: 'Model Şüphesi', en: 'Model Skepticism' },
  no_network: { tr: 'Çevrem Yok', en: 'No Network' },
  introvert: { tr: 'İçe Dönüklük', en: 'Introvert' },
  employed: { tr: 'Çalışıyorum', en: 'Employed' },
  wait: { tr: 'Erteleme', en: 'Delay' },
  other: { tr: 'Diğer', en: 'Other' },
}

type LibraryResource = {
  id: string
  source: 'academy' | 'custom'
  title: string
  summary: string
  content: string
  categoryKey: AcademyLibraryCategory
  categoryLabel: string
  typeKey: AcademyLibraryItemType
  typeLabel: string
  levelLabel: string
  readingMinutes: number
  tags: string[]
  coachPrompt: string
}

type ObjectionResource = {
  id: string
  source: 'academy' | 'custom'
  title: string
  categoryKey: AcademyObjectionCategory
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

type LibraryFormState = {
  title: string
  summary: string
  content: string
  category: AcademyLibraryCategory
  type: AcademyLibraryItemType
  level: AcademyLibraryLevel
  tags: string
}

type ObjectionFormState = {
  objection: string
  shortResponse: string
  fullResponse: string
  approach: string
  exampleDialog: string
  category: AcademyObjectionCategory
  tags: string
}

function createLibraryFormState(): LibraryFormState {
  return {
    title: '',
    summary: '',
    content: '',
    category: 'mindset',
    type: 'lesson',
    level: 'beginner',
    tags: '',
  }
}

function createObjectionFormState(): ObjectionFormState {
  return {
    objection: '',
    shortResponse: '',
    fullResponse: '',
    approach: '',
    exampleDialog: '',
    category: 'trust',
    tags: '',
  }
}

function makeLocalizedText(value: string) {
  return {
    tr: value,
    en: value,
  }
}

function parseTags(raw: string) {
  return raw
    .split(/[,\n;]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

function getReadingMinutes(content: string) {
  return Math.max(2, Math.ceil(content.split(/\s+/).filter(Boolean).length / 180))
}

function typeIconForResource(type: AcademyLibraryItemType): LucideIcon {
  if (type === 'article' || type === 'success_story') return Library
  if (type === 'cheat_sheet') return Zap
  if (type === 'role_play') return Sparkles
  return MessageSquareQuote
}

export default function AcademyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const requestedTab = searchParams.get('tab')
  const activeTab: AcademyTab = requestedTab && validTabs.includes(requestedTab as AcademyTab)
    ? (requestedTab as AcademyTab)
    : 'library'

  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState('all')
  const [selectedObjectionCategory, setSelectedObjectionCategory] = useState('all')
  const [currentLibraryPage, setCurrentLibraryPage] = useState(1)
  const [currentObjectionPage, setCurrentObjectionPage] = useState(1)
  const [showLibraryForm, setShowLibraryForm] = useState(false)
  const [showObjectionForm, setShowObjectionForm] = useState(false)
  const [libraryForm, setLibraryForm] = useState<LibraryFormState>(createLibraryFormState)
  const [objectionForm, setObjectionForm] = useState<ObjectionFormState>(createObjectionFormState)
  const [customLibraryItems, setCustomLibraryItems] = usePersistentState<AcademyLibraryItem[]>(
    'nmu-academy-custom-library-v1',
    [],
  )
  const [customObjectionGuides, setCustomObjectionGuides] = usePersistentState<AcademyObjectionGuide[]>(
    'nmu-academy-custom-objections-v1',
    [],
  )
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

  const libraryCategoryOptions = useMemo(
    () =>
      academyLibraryCategories.map((category) => ({
        value: category,
        label: libraryCategoryLabels[category][currentLocale],
      })),
    [currentLocale],
  )

  const libraryTypeOptions = useMemo(
    () =>
      academyLibraryItemTypes.map((type) => ({
        value: type,
        label: libraryTypeLabels[type][currentLocale],
      })),
    [currentLocale],
  )

  const libraryLevelOptions = useMemo(
    () =>
      academyLibraryLevels.map((level) => ({
        value: level,
        label: libraryLevelLabels[level][currentLocale],
      })),
    [currentLocale],
  )

  const objectionCategoryOptions = useMemo(
    () =>
      academyObjectionCategories.map((category) => ({
        value: category,
        label: objectionCategoryLabels[category][currentLocale],
      })),
    [currentLocale],
  )

  const libraryResources = useMemo<LibraryResource[]>(() => {
    return [...academyLibraryItems, ...customLibraryItems].map((resource) => ({
      id: resource.id,
      source: resource.id.startsWith('custom-library-') ? 'custom' : 'academy',
      title: resource.title[currentLocale],
      summary: resource.summary[currentLocale],
      content: resource.content[currentLocale],
      categoryKey: resource.category,
      categoryLabel: libraryCategoryLabels[resource.category][currentLocale],
      typeKey: resource.type,
      typeLabel: libraryTypeLabels[resource.type][currentLocale],
      levelLabel: libraryLevelLabels[resource.level][currentLocale],
      readingMinutes: resource.readingMinutes,
      tags: resource.tags,
      coachPrompt: resource.coachPrompt[currentLocale],
    }))
  }, [currentLocale, customLibraryItems])

  const objectionResources = useMemo<ObjectionResource[]>(() => {
    return [...academyObjectionGuides, ...customObjectionGuides].map((guide) => ({
      id: guide.id,
      source: guide.id.startsWith('custom-objection-') ? 'custom' : 'academy',
      title: guide.objection[currentLocale],
      categoryKey: guide.category,
      categoryLabel: objectionCategoryLabels[guide.category][currentLocale],
      shortResponse: guide.shortResponse[currentLocale],
      fullResponse: guide.fullResponse[currentLocale],
      approach: guide.approach[currentLocale],
      exampleDialog: guide.exampleDialog[currentLocale],
      tags: guide.tags,
      coachPrompt: guide.coachPrompt[currentLocale],
    }))
  }, [currentLocale, customObjectionGuides])

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

  const totalLibraryPages = Math.max(1, Math.ceil(filteredLibrary.length / ITEMS_PER_PAGE))
  const totalObjectionPages = Math.max(1, Math.ceil(filteredObjections.length / ITEMS_PER_PAGE))
  const paginatedLibrary = filteredLibrary.slice(
    (currentLibraryPage - 1) * ITEMS_PER_PAGE,
    currentLibraryPage * ITEMS_PER_PAGE,
  )
  const paginatedObjections = filteredObjections.slice(
    (currentObjectionPage - 1) * ITEMS_PER_PAGE,
    currentObjectionPage * ITEMS_PER_PAGE,
  )

  const favoriteLibrary = libraryResources.filter((resource) => favoriteLibraryIds.includes(resource.id))
  const favoriteObjections = objectionResources.filter((resource) => favoriteObjectionIds.includes(resource.id))
  const totalFavorites = favoriteLibrary.length + favoriteObjections.length
  const totalViewed = viewedLibraryIds.length + viewedObjectionIds.length
  const totalAvailable = libraryResources.length + objectionResources.length

  function updateTab(tab: AcademyTab) {
    setSearchTerm('')
    setSelectedLibraryCategory('all')
    setSelectedObjectionCategory('all')
    setCurrentLibraryPage(1)
    setCurrentObjectionPage(1)
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
    setFavoriteLibraryIds((current) => (
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [id, ...current]
    ))
  }

  function toggleObjectionFavorite(id: string) {
    setFavoriteObjectionIds((current) => (
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [id, ...current]
    ))
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

  function submitLibraryForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = libraryForm.title.trim()
    const summary = libraryForm.summary.trim()
    const content = libraryForm.content.trim()
    if (!title || !summary || !content) return

    const itemToCreate: AcademyLibraryItem = {
      id: `custom-library-${generateId()}`,
      category: libraryForm.category,
      type: libraryForm.type,
      level: libraryForm.level,
      readingMinutes: getReadingMinutes(content),
      tags: parseTags(libraryForm.tags),
      title: makeLocalizedText(title),
      summary: makeLocalizedText(summary),
      content: makeLocalizedText(content),
      coachPrompt: makeLocalizedText(
        currentLocale === 'tr'
          ? `${title} içeriğini bana göre kişiselleştir ve sahada uygulama planı çıkar.`
          : `Personalize ${title} for me and turn it into a field plan.`,
      ),
    }

    setCustomLibraryItems((current) => [itemToCreate, ...current])
    setLibraryForm(createLibraryFormState())
    setShowLibraryForm(false)
    setCurrentLibraryPage(1)
  }

  function submitObjectionForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const objection = objectionForm.objection.trim()
    const shortResponse = objectionForm.shortResponse.trim()
    const fullResponse = objectionForm.fullResponse.trim()
    const approach = objectionForm.approach.trim()
    const exampleDialog = objectionForm.exampleDialog.trim()
    if (!objection || !shortResponse || !fullResponse || !approach || !exampleDialog) return

    const guideToCreate: AcademyObjectionGuide = {
      id: `custom-objection-${generateId()}`,
      category: objectionForm.category,
      tags: parseTags(objectionForm.tags),
      objection: makeLocalizedText(objection),
      shortResponse: makeLocalizedText(shortResponse),
      fullResponse: makeLocalizedText(fullResponse),
      approach: makeLocalizedText(approach),
      exampleDialog: makeLocalizedText(exampleDialog),
      coachPrompt: makeLocalizedText(
        currentLocale === 'tr'
          ? `${objection} itirazına daha sıcak, daha doğal ve ikna edici bir cevap yaz.`
          : `Write a warmer and more persuasive response to the objection "${objection}".`,
      ),
    }

    setCustomObjectionGuides((current) => [guideToCreate, ...current])
    setObjectionForm(createObjectionFormState())
    setShowObjectionForm(false)
    setCurrentObjectionPage(1)
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
      value: libraryResources.length.toString(),
      icon: Library,
      color: 'text-secondary',
    },
    {
      label: currentLocale === 'tr' ? 'İtiraz Rehberi' : 'Objection Guides',
      value: objectionResources.length.toString(),
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

  function renderPagination(currentPage: number, totalPages: number, onChange: (page: number) => void) {
    if (totalPages <= 1) return null

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1
          return (
            <button
              key={page}
              type="button"
              onClick={() => onChange(page)}
              className={cn(
                'min-w-9 h-9 px-3 rounded-xl text-sm font-medium transition-all border',
                currentPage === page
                  ? 'bg-primary/15 text-primary border-primary/20'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary',
              )}
            >
              {page}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.academy.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {currentLocale === 'tr'
              ? 'Master projedeki zengin kütüphane artık burada: içerikler, itirazlar ve kendi eklemelerin tek merkezde.'
              : 'The richer master library now lives here: content, objections, and your own additions in one place.'}
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
        <motion.div variants={item} className="space-y-4">
          <Card>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value)
                    if (activeTab === 'library') setCurrentLibraryPage(1)
                    else setCurrentObjectionPage(1)
                  }}
                  placeholder={
                    activeTab === 'library'
                      ? (currentLocale === 'tr' ? 'İçerik, etiket veya kategori ara...' : 'Search content, tags, or category...')
                      : (currentLocale === 'tr' ? 'İtiraz, yaklaşım veya etiket ara...' : 'Search objections, approaches, or tags...')
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
                      ? libraryCategoryLabels[category as AcademyLibraryCategory][currentLocale]
                      : objectionCategoryLabels[category as AcademyObjectionCategory][currentLocale]
                  const isSelected = activeTab === 'library'
                    ? selectedLibraryCategory === category
                    : selectedObjectionCategory === category

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        if (activeTab === 'library') {
                          setSelectedLibraryCategory(category)
                          setCurrentLibraryPage(1)
                        } else {
                          setSelectedObjectionCategory(category)
                          setCurrentObjectionPage(1)
                        }
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

          {activeTab === 'library' && (
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      {currentLocale === 'tr' ? 'Kendi İçeriğini Ekle' : 'Add Your Own Content'}
                    </h2>
                    <p className="text-xs text-text-tertiary mt-1">
                      {currentLocale === 'tr'
                        ? 'Master kütüphanenin üstüne kendi script, ders notu veya rehberini ekleyebilirsin.'
                        : 'Layer your own scripts, lesson notes, or guides on top of the master library.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={showLibraryForm ? 'ghost' : 'secondary'}
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowLibraryForm((current) => !current)}
                  >
                    {showLibraryForm
                      ? (currentLocale === 'tr' ? 'Formu Kapat' : 'Close Form')
                      : (currentLocale === 'tr' ? 'İçerik Ekle' : 'Add Content')}
                  </Button>
                </div>

                {showLibraryForm && (
                  <form onSubmit={submitLibraryForm} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Input
                      label={currentLocale === 'tr' ? 'Başlık' : 'Title'}
                      value={libraryForm.title}
                      onChange={(event) => setLibraryForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder={currentLocale === 'tr' ? 'Örn. İlk sunum sonrası mini takip planı' : 'Ex. Mini follow-up plan after the first presentation'}
                    />
                    <Input
                      label={currentLocale === 'tr' ? 'Özet' : 'Summary'}
                      value={libraryForm.summary}
                      onChange={(event) => setLibraryForm((current) => ({ ...current, summary: event.target.value }))}
                      placeholder={currentLocale === 'tr' ? 'İçeriğin ne iş gördüğünü kısa anlat.' : 'Describe what this content helps with.'}
                    />
                    <Select
                      label={currentLocale === 'tr' ? 'Kategori' : 'Category'}
                      value={libraryForm.category}
                      options={libraryCategoryOptions}
                      onChange={(event) => setLibraryForm((current) => ({ ...current, category: event.target.value as AcademyLibraryCategory }))}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label={currentLocale === 'tr' ? 'Tür' : 'Type'}
                        value={libraryForm.type}
                        options={libraryTypeOptions}
                        onChange={(event) => setLibraryForm((current) => ({ ...current, type: event.target.value as AcademyLibraryItemType }))}
                      />
                      <Select
                        label={currentLocale === 'tr' ? 'Seviye' : 'Level'}
                        value={libraryForm.level}
                        options={libraryLevelOptions}
                        onChange={(event) => setLibraryForm((current) => ({ ...current, level: event.target.value as AcademyLibraryLevel }))}
                      />
                    </div>
                    <div className="xl:col-span-2">
                      <Textarea
                        label={currentLocale === 'tr' ? 'İçerik' : 'Content'}
                        value={libraryForm.content}
                        onChange={(event) => setLibraryForm((current) => ({ ...current, content: event.target.value }))}
                        rows={8}
                        placeholder={currentLocale === 'tr' ? 'Tam içerik metnini buraya yaz...' : 'Write the full content here...'}
                      />
                    </div>
                    <div className="xl:col-span-2">
                      <Input
                        label={currentLocale === 'tr' ? 'Etiketler' : 'Tags'}
                        value={libraryForm.tags}
                        onChange={(event) => setLibraryForm((current) => ({ ...current, tags: event.target.value }))}
                        placeholder={currentLocale === 'tr' ? 'örn. takip, whatsapp, kapanış' : 'ex. follow-up, whatsapp, closing'}
                        hint={currentLocale === 'tr' ? 'Virgül ile ayır.' : 'Separate with commas.'}
                      />
                    </div>
                    <div className="xl:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => {
                        setLibraryForm(createLibraryFormState())
                        setShowLibraryForm(false)
                      }}>
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}>
                        {currentLocale === 'tr' ? 'Kütüphaneye Ekle' : 'Save to Library'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'objections' && (
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">
                      {currentLocale === 'tr' ? 'Kendi İtirazını Ekle' : 'Add Your Own Objection'}
                    </h2>
                    <p className="text-xs text-text-tertiary mt-1">
                      {currentLocale === 'tr'
                        ? 'Sahada duyduğun yeni itirazları kısa ve detaylı cevaplarıyla birlikte bankaya ekleyebilirsin.'
                        : 'Capture new field objections with short and detailed responses.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={showObjectionForm ? 'ghost' : 'secondary'}
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowObjectionForm((current) => !current)}
                  >
                    {showObjectionForm
                      ? (currentLocale === 'tr' ? 'Formu Kapat' : 'Close Form')
                      : (currentLocale === 'tr' ? 'İtiraz Ekle' : 'Add Objection')}
                  </Button>
                </div>

                {showObjectionForm && (
                  <form onSubmit={submitObjectionForm} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Input
                      label={currentLocale === 'tr' ? 'İtiraz' : 'Objection'}
                      value={objectionForm.objection}
                      onChange={(event) => setObjectionForm((current) => ({ ...current, objection: event.target.value }))}
                      placeholder={currentLocale === 'tr' ? 'Örn. Bu iş uzun vadede yorucu gelmiyor mu?' : 'Ex. Does not this feel exhausting over time?'}
                    />
                    <Select
                      label={currentLocale === 'tr' ? 'Kategori' : 'Category'}
                      value={objectionForm.category}
                      options={objectionCategoryOptions}
                      onChange={(event) => setObjectionForm((current) => ({ ...current, category: event.target.value as AcademyObjectionCategory }))}
                    />
                    <div className="xl:col-span-2">
                      <Textarea
                        label={currentLocale === 'tr' ? 'Kısa Cevap' : 'Short Response'}
                        value={objectionForm.shortResponse}
                        onChange={(event) => setObjectionForm((current) => ({ ...current, shortResponse: event.target.value }))}
                        rows={3}
                        placeholder={currentLocale === 'tr' ? 'Kısa ve hızlı saha cevabı...' : 'Short field-ready response...'}
                      />
                    </div>
                    <div className="xl:col-span-2">
                      <Textarea
                        label={currentLocale === 'tr' ? 'Detaylı Cevap' : 'Detailed Response'}
                        value={objectionForm.fullResponse}
                        onChange={(event) => setObjectionForm((current) => ({ ...current, fullResponse: event.target.value }))}
                        rows={5}
                        placeholder={currentLocale === 'tr' ? 'Detaylı cevap metni...' : 'Detailed response...'}
                      />
                    </div>
                    <Textarea
                      label={currentLocale === 'tr' ? 'Yaklaşım' : 'Approach'}
                      value={objectionForm.approach}
                      onChange={(event) => setObjectionForm((current) => ({ ...current, approach: event.target.value }))}
                      rows={4}
                      placeholder={currentLocale === 'tr' ? 'Bu itirazı nasıl ele almak gerektiğini yaz...' : 'Explain how this objection should be handled...'}
                    />
                    <Textarea
                      label={currentLocale === 'tr' ? 'Örnek Diyalog' : 'Example Dialogue'}
                      value={objectionForm.exampleDialog}
                      onChange={(event) => setObjectionForm((current) => ({ ...current, exampleDialog: event.target.value }))}
                      rows={4}
                      placeholder={currentLocale === 'tr' ? 'Kısa örnek konuşma...' : 'Short example dialogue...'}
                    />
                    <div className="xl:col-span-2">
                      <Input
                        label={currentLocale === 'tr' ? 'Etiketler' : 'Tags'}
                        value={objectionForm.tags}
                        onChange={(event) => setObjectionForm((current) => ({ ...current, tags: event.target.value }))}
                        placeholder={currentLocale === 'tr' ? 'örn. güven, fiyat, zamanlama' : 'ex. trust, price, timing'}
                        hint={currentLocale === 'tr' ? 'Virgül ile ayır.' : 'Separate with commas.'}
                      />
                    </div>
                    <div className="xl:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => {
                        setObjectionForm(createObjectionFormState())
                        setShowObjectionForm(false)
                      }}>
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}>
                        {currentLocale === 'tr' ? 'Bankaya Ekle' : 'Save to Bank'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          )}
        </motion.div>
      )}

      {activeTab === 'library' && (
        <motion.div variants={item} className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {paginatedLibrary.map((resource) => {
            const Icon = typeIconForResource(resource.typeKey)
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
                      <Badge variant={resource.source === 'custom' ? 'success' : 'secondary'} size="sm">
                        {resource.source === 'custom'
                          ? (currentLocale === 'tr' ? 'Özel İçerik' : 'Custom')
                          : resource.typeLabel}
                      </Badge>
                      {resource.source === 'custom' && (
                        <Badge variant="secondary" size="sm">{resource.typeLabel}</Badge>
                      )}
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
                  {currentLocale === 'tr' ? 'Aramayı sadeleştir veya yeni bir içerik ekle.' : 'Try a broader search or add a new content entry.'}
                </p>
              </div>
            </Card>
          )}
          </div>
          {renderPagination(currentLibraryPage, totalLibraryPages, setCurrentLibraryPage)}
        </motion.div>
      )}

      {activeTab === 'objections' && (
        <motion.div variants={item} className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {paginatedObjections.map((resource) => {
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
                      <Badge variant={resource.source === 'custom' ? 'success' : 'secondary'} size="sm">
                        {resource.source === 'custom'
                          ? (currentLocale === 'tr' ? 'Özel Rehber' : 'Custom Guide')
                          : (currentLocale === 'tr' ? 'Master Rehber' : 'Master Guide')}
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
                <p className="text-xs text-text-tertiary mt-1">
                  {currentLocale === 'tr' ? 'Filtreyi gevşet veya yeni bir itiraz rehberi ekle.' : 'Broaden the filter or add a new objection guide.'}
                </p>
              </div>
            </Card>
          )}
          </div>
          {renderPagination(currentObjectionPage, totalObjectionPages, setCurrentObjectionPage)}
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
              <Badge variant={selectedLibraryResource.source === 'custom' ? 'success' : 'secondary'}>
                {selectedLibraryResource.source === 'custom'
                  ? (currentLocale === 'tr' ? 'Özel İçerik' : 'Custom')
                  : selectedLibraryResource.typeLabel}
              </Badge>
              {selectedLibraryResource.source === 'custom' && (
                <Badge variant="secondary">{selectedLibraryResource.typeLabel}</Badge>
              )}
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
              <Badge variant={selectedObjectionResource.source === 'custom' ? 'success' : 'secondary'}>
                {selectedObjectionResource.source === 'custom'
                  ? (currentLocale === 'tr' ? 'Özel Rehber' : 'Custom Guide')
                  : (currentLocale === 'tr' ? 'Master Rehber' : 'Master Guide')}
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
