'use client'

import { startTransition, useDeferredValue, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { academyCourses, achievements, objections, scripts } from '@/data/mockData'
import { academyLibraryItems, academyObjectionGuides, type AcademyLibraryItem, type AcademyObjectionGuide } from '@/data/academyLibrary'
import { queueCoachPrompt, readStoredValue } from '@/lib/clientStorage'
import { cn } from '@/lib/utils'
import type { AcademyCourse, AcademyLesson } from '@/types'
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Heart,
  Library,
  MessageSquareQuote,
  Mic,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const validTabs = ['path', 'library', 'objections', 'favorites'] as const
type AcademyTab = (typeof validTabs)[number]

type LessonSelection = {
  course: AcademyCourse
  lesson: AcademyLesson
}

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
  | { type: 'lesson'; lesson: LessonSelection }
  | { type: 'library'; resource: LibraryResource }
  | { type: 'objection'; resource: ObjectionResource }
  | null

const lessonTypeIcons: Record<AcademyLesson['type'], LucideIcon> = {
  video: Play,
  text: BookOpen,
  audio: Mic,
  checklist: CheckCircle2,
  quiz: Target,
  roleplay: Sparkles,
  download: Download,
  worksheet: FileText,
  challenge: Trophy,
}

const initialCompletedLessonIds = academyCourses
  .flatMap((course) => course.modules.flatMap((module) => module.lessons))
  .slice(0, 12)
  .map((lesson) => lesson.id)

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
    lesson: { tr: 'Ders', en: 'Lesson' },
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
  if (typeLabel.toLowerCase().includes('ders') || typeLabel.toLowerCase().includes('lesson')) return BookOpen
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
  const activeTab = validTabs.includes((searchParams.get('tab') ?? 'path') as AcademyTab)
    ? ((searchParams.get('tab') ?? 'path') as AcademyTab)
    : 'path'

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLibraryCategory, setSelectedLibraryCategory] = useState('all')
  const [selectedObjectionCategory, setSelectedObjectionCategory] = useState('all')
  const [completedLessonIds, setCompletedLessonIds] = usePersistentState<string[]>('nmu-academy-completed-lessons', initialCompletedLessonIds)
  const [favoriteLibraryIds, setFavoriteLibraryIds] = usePersistentState<string[]>(
    'nmu-academy-library-favorites',
    readStoredValue<string[]>('nmu-script-favorites', []),
  )
  const [favoriteObjectionIds, setFavoriteObjectionIds] = usePersistentState<string[]>(
    'nmu-academy-objection-favorites',
    [],
  )

  const deferredSearchTerm = useDeferredValue(searchTerm.trim().toLocaleLowerCase(currentLocale))
  const selectedCourse = selectedCourseId
    ? academyCourses.find((course) => course.id === selectedCourseId) ?? null
    : null

  const allLessons = academyCourses.flatMap((course) => course.modules.flatMap((module) => module.lessons))
  const totalLessons = allLessons.length
  const completedLessons = completedLessonIds.length
  const totalXP = allLessons
    .filter((lesson) => completedLessonIds.includes(lesson.id))
    .reduce((count, lesson) => count + lesson.xpReward, 0)

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

  function updateTab(tab: AcademyTab) {
    startTransition(() => {
      router.replace(tab === 'path' ? '/academy' : `/academy?tab=${tab}`)
    })
  }

  function courseProgress(course: AcademyCourse) {
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))
    const completed = lessonIds.filter((lessonId) => completedLessonIds.includes(lessonId)).length
    return {
      completed,
      total: lessonIds.length,
      percentage: lessonIds.length === 0 ? 0 : Math.round((completed / lessonIds.length) * 100),
    }
  }

  function toggleLessonComplete(lessonId: string) {
    setCompletedLessonIds((current) =>
      current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId],
    )
  }

  function openLesson(course: AcademyCourse, lesson: AcademyLesson) {
    setActivePanel({ type: 'lesson', lesson: { course, lesson } })
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

  function downloadLessonContent(lesson: AcademyLesson) {
    const blob = new Blob([lesson.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${lesson.title.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const tabLabels: Record<AcademyTab, string> = {
    path: currentLocale === 'tr' ? 'Öğrenme Yolu' : 'Learning Path',
    library: currentLocale === 'tr' ? 'İçerik Kütüphanesi' : 'Content Library',
    objections: currentLocale === 'tr' ? 'İtiraz Bankası' : 'Objection Bank',
    favorites: currentLocale === 'tr' ? 'Favoriler' : 'Favorites',
  }

  const stats = [
    {
      label: currentLocale === 'tr' ? 'Tamamlanan Ders' : 'Completed Lessons',
      value: `${completedLessons}/${totalLessons}`,
      icon: GraduationCap,
      color: 'text-primary',
    },
    {
      label: currentLocale === 'tr' ? 'Kütüphane İçeriği' : 'Library Resources',
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

  const selectedLesson = activePanel?.type === 'lesson' ? activePanel.lesson : null
  const selectedLibraryResource = activePanel?.type === 'library' ? activePanel.resource : null
  const selectedObjectionResource = activePanel?.type === 'objection' ? activePanel.resource : null

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.academy.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {currentLocale === 'tr'
              ? 'Öğrenme yolu, senaryolar ve itiraz cevapları artık tek bir merkezde.'
              : 'Learning paths, field scripts, and objection answers now live in one center.'}
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

      <motion.div variants={item}>
        <Card glow="primary">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="default">
                {currentLocale === 'tr' ? 'Birleşik Akademi' : 'Unified Academy'}
              </Badge>
              <h2 className="text-xl font-semibold text-text-primary mt-3">
                {currentLocale === 'tr'
                  ? 'Sahada kullanacağın her şey artık tek çatı altında.'
                  : 'Everything you need in the field now lives under one roof.'}
              </h2>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                {currentLocale === 'tr'
                  ? 'Kurs akışını koruduk; üzerine içerik kütüphanesi, objection bank ve favoriler katmanını ekledik. Böylece öğrenme ile uygulama arasında gidip gelmek yerine aynı merkezden çalışabiliyorsun.'
                  : 'We kept the course flow and layered in a content library, objection bank, and favorites so learning and execution happen in the same place.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
                <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Toplam XP' : 'Total XP'}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">{totalXP}</p>
              </div>
              <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
                <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Tamamlanan Kurs' : 'Completed Courses'}</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {academyCourses.filter((course) => {
                    const progress = courseProgress(course)
                    return progress.total > 0 && progress.completed === progress.total
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </Card>
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

      {activeTab === 'path' && (
        <>
          {selectedCourse ? (
            <motion.div variants={item} className="space-y-6">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCourseId(null)}>
                ← {t.academy.backToCourses}
              </Button>

              <Card>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <Badge variant={selectedCourse.level === 'beginner' ? 'success' : selectedCourse.level === 'intermediate' ? 'warning' : 'secondary'}>
                      {t.academy.levels[selectedCourse.level as keyof typeof t.academy.levels]}
                    </Badge>
                    <h2 className="text-xl font-bold text-text-primary mt-3">{selectedCourse.title}</h2>
                    <p className="text-sm text-text-secondary mt-2">{selectedCourse.description}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {selectedCourse.estimatedMinutes} dk</span>
                      <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {selectedCourse.xpReward} XP</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {courseProgress(selectedCourse).total} {t.academy.lessons}</span>
                    </div>
                  </div>
                  <div className="min-w-[220px] rounded-2xl border border-border-subtle bg-surface/50 p-4">
                    <Progress value={courseProgress(selectedCourse).percentage} showLabel label={t.common.progress} />
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                {selectedCourse.modules.map((module, index) => (
                  <Card key={module.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{module.title}</h3>
                        <p className="text-xs text-text-tertiary">{module.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {module.lessons.map((lesson) => {
                        const Icon = lessonTypeIcons[lesson.type] || BookOpen
                        const isCompleted = completedLessonIds.includes(lesson.id)
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            onClick={() => openLesson(selectedCourse, lesson)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left border',
                              isCompleted
                                ? 'bg-success/5 border-success/10'
                                : 'bg-surface/50 border-border-subtle hover:border-border',
                            )}
                          >
                            <div className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center',
                              isCompleted ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-tertiary',
                            )}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium', isCompleted ? 'text-success' : 'text-text-primary')}>
                                {lesson.title}
                              </p>
                              <p className="text-[11px] text-text-tertiary">
                                {lesson.type} · {lesson.durationMinutes} dk · +{lesson.xpReward} XP
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          </button>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div variants={item}>
                <Card glow="primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      {t.academy.yourLearningPath}
                    </CardTitle>
                  </CardHeader>
                  <div className="flex items-center gap-4 overflow-x-auto pb-2">
                    {academyCourses.map((course, index) => (
                      <div key={course.id} className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all',
                            index === 0
                              ? 'bg-primary/15 text-primary ring-2 ring-primary/30'
                              : 'bg-surface-hover text-text-tertiary hover:text-text-primary',
                          )}
                          onClick={() => setSelectedCourseId(course.id)}
                        >
                          {index + 1}
                        </button>
                        {index < academyCourses.length - 1 && <ChevronRight className="w-4 h-4 text-text-muted" />}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {academyCourses.map((course) => {
                  const progress = courseProgress(course)
                  return (
                    <Card key={course.id} hover onClick={() => setSelectedCourseId(course.id)} className="h-full flex flex-col">
                      <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                        <GraduationCap className="w-10 h-10 text-primary/40" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'secondary'} size="sm">
                            {t.academy.levels[course.level as keyof typeof t.academy.levels]}
                          </Badge>
                          <span className="text-[10px] text-text-tertiary">{course.estimatedMinutes} dk</span>
                        </div>
                        <h3 className="text-sm font-semibold text-text-primary mb-1">{course.title}</h3>
                        <p className="text-xs text-text-tertiary line-clamp-2">{course.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border-subtle">
                        <Progress value={progress.percentage} size="sm" variant="primary" />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-text-tertiary">{progress.completed}/{progress.total} {t.academy.lessons}</span>
                          <span className="text-[10px] text-warning font-medium">+{course.xpReward} XP</span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </motion.div>

              <motion.div variants={item}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      {t.academy.achievements}
                    </CardTitle>
                  </CardHeader>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex flex-col items-center p-3 rounded-xl bg-surface/50 border border-border-subtle text-center">
                        <span className="text-2xl mb-1">{achievement.iconUrl}</span>
                        <p className="text-[11px] font-semibold text-text-primary">{achievement.title}</p>
                        <p className="text-[9px] text-text-tertiary mt-0.5">+{achievement.xpReward} XP</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </>
          )}
        </>
      )}

      {activeTab === 'library' && (
        <motion.div variants={item} className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredLibrary.map((resource) => {
            const Icon = typeIconForResource(resource.typeLabel)
            const isFavorite = favoriteLibraryIds.includes(resource.id)
            return (
              <Card key={resource.id} hover onClick={() => setActivePanel({ type: 'library', resource })}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default" size="sm">{resource.categoryLabel}</Badge>
                      <Badge variant={resource.source === 'academy' ? 'secondary' : 'success'} size="sm">{resource.typeLabel}</Badge>
                      <span className="text-[10px] text-text-tertiary">{resource.levelLabel}</span>
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
            return (
              <Card key={resource.id} hover onClick={() => setActivePanel({ type: 'objection', resource })}>
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
                  onClick={() => setActivePanel({ type: 'library', resource })}
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
                  onClick={() => setActivePanel({ type: 'objection', resource })}
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
        title={
          selectedLesson?.lesson.title
          ?? selectedLibraryResource?.title
          ?? selectedObjectionResource?.title
        }
        description={
          selectedLesson
            ? `${selectedLesson.course.title} · ${selectedLesson.lesson.durationMinutes} dk · +${selectedLesson.lesson.xpReward} XP`
            : selectedLibraryResource
              ? `${selectedLibraryResource.categoryLabel} · ${selectedLibraryResource.typeLabel}`
              : selectedObjectionResource
                ? `${selectedObjectionResource.categoryLabel} · ${currentLocale === 'tr' ? 'İtiraz Rehberi' : 'Objection Guide'}`
                : undefined
        }
      >
        {selectedLesson && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{selectedLesson.course.category}</Badge>
              <Badge variant={completedLessonIds.includes(selectedLesson.lesson.id) ? 'success' : 'secondary'}>
                {completedLessonIds.includes(selectedLesson.lesson.id) ? t.common.completed : t.common.pending}
              </Badge>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{selectedLesson.lesson.content}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  void copyText(selectedLesson.lesson.id, selectedLesson.lesson.content)
                }}
              >
                {copiedId === selectedLesson.lesson.id ? t.common.copied : t.common.copy}
              </Button>

              {(selectedLesson.lesson.type === 'download' || selectedLesson.lesson.type === 'worksheet') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => downloadLessonContent(selectedLesson.lesson)}
                >
                  {currentLocale === 'tr' ? 'Dosyayı indir' : 'Download file'}
                </Button>
              )}

              {selectedLesson.lesson.type === 'roleplay' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setActivePanel(null)
                    openCoach(`${selectedLesson.lesson.title} için benimle bir rol canlandırma yap. Ders bağlamı: ${selectedLesson.lesson.content}`)
                  }}
                >
                  {currentLocale === 'tr' ? 'YZ Koçu ile pratik yap' : 'Practice with AI Coach'}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => toggleLessonComplete(selectedLesson.lesson.id)}
              >
                {completedLessonIds.includes(selectedLesson.lesson.id)
                  ? (currentLocale === 'tr' ? 'Tamamlandı' : 'Completed')
                  : (currentLocale === 'tr' ? 'Tamamlandı işaretle' : 'Mark complete')}
              </Button>
            </div>
          </div>
        )}

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
