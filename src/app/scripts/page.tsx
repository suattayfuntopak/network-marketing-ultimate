'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { queueCoachPrompt } from '@/lib/clientStorage'
import { scripts, objections } from '@/data/mockData'
import type { Objection, Script } from '@/types'
import {
  FileText,
  Copy,
  Star,
  ChevronRight,
  MessageSquare,
  Shield,
  Users,
  Megaphone,
  Heart,
  Zap,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const categoryIcons: Record<string, LucideIcon> = {
  Davet: MessageSquare,
  Takip: ChevronRight,
  'Müşteri İlişkileri': Heart,
  'Sosyal Medya': Megaphone,
  Oryantasyon: Users,
  İtirazlar: Shield,
  'Potansiyel Müşteri': Zap,
}

type ActivePanel =
  | { type: 'script'; script: Script }
  | { type: 'objection'; objection: Objection }
  | null

export default function ScriptsPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>('nmu-script-favorites', [])
  const favoritesLabel = locale === 'tr' ? 'Favoriler' : 'Favorites'
  const categories = ['all', 'favorites', ...new Set(scripts.map((script) => script.category))]

  const filteredScripts = scripts.filter((script) => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'favorites') return favoriteIds.includes(script.id)
    return script.category === selectedCategory
  })

  async function handleCopy(id: string, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  function openAIWithPrompt(prompt: string) {
    queueCoachPrompt(prompt)
    router.push('/ai')
  }

  function toggleFavorite(scriptId: string) {
    setFavoriteIds((current) =>
      current.includes(scriptId)
        ? current.filter((id) => id !== scriptId)
        : [scriptId, ...current],
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.scripts.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.scripts.subtitle}</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === category ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-surface border border-border text-text-secondary hover:text-text-primary'}`}
          >
            {category === 'all' ? t.scripts.allScripts : category === 'favorites' ? favoritesLabel : category}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredScripts.map((script) => {
          const Icon = categoryIcons[script.category] || FileText
          const isFavorite = favoriteIds.includes(script.id)
          return (
            <Card key={script.id} hover onClick={() => setActivePanel({ type: 'script', script })}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-text-primary">{script.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="default" size="sm">{script.category}</Badge>
                    <span className="text-[10px] text-text-tertiary flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-warning" /> {script.rating}</span>
                    <span className="text-[10px] text-text-tertiary">{script.usageCount} {t.scripts.uses}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border-subtle text-sm text-text-secondary leading-relaxed mb-3">
                {script.content}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {script.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleFavorite(script.id)
                  }}
                >
                  <Star className={`w-3 h-3 ${isFavorite ? 'fill-warning text-warning' : ''}`} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleCopy(script.id, script.content)
                  }}
                >
                  {copiedId === script.id ? `✓ ${t.common.copied}` : <><Copy className="w-3 h-3" /> {t.scripts.copy}</>}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={(event) => {
                    event.stopPropagation()
                    openAIWithPrompt(`${script.title} senaryosunu bana kisilestir: ${script.content}`)
                  }}
                >
                  <Sparkles className="w-3 h-3" /> AI
                </Button>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-error" />
              {t.scripts.objectionHandling}
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {objections.map((objection) => (
              <div key={objection.id} className="p-4 rounded-xl bg-surface/50 border border-border-subtle">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <p className="text-sm font-semibold text-text-primary">&quot;{objection.objection}&quot;</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setActivePanel({ type: 'objection', objection })}
                  >
                    {t.common.view}
                  </Button>
                </div>
                <div className="space-y-2">
                  {objection.responses.map((response) => (
                    <div key={response.id} className="p-3 rounded-lg bg-card border border-border">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Badge variant={response.tone === 'empathetic' ? 'success' : response.tone === 'direct' ? 'primary' : response.tone === 'storytelling' ? 'secondary' : 'warning'} size="sm">
                          {response.tone === 'empathetic' ? 'Empatik' : response.tone === 'direct' ? 'Doğrudan' : response.tone === 'storytelling' ? 'Hikaye' : 'Veriye Dayalı'}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              void handleCopy(response.id, response.script)
                            }}
                          >
                            <Copy className="w-3 h-3" /> {copiedId === response.id ? t.common.copied : t.common.copy}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openAIWithPrompt(`Su itiraza daha guclu bir cevap yaz: "${objection.objection}". Mevcut yanit: ${response.script}`)}
                          >
                            <Sparkles className="w-3 h-3" /> AI
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{response.script}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      <Modal
        open={Boolean(activePanel)}
        onClose={() => setActivePanel(null)}
        title={
          activePanel?.type === 'script'
            ? activePanel.script.title
            : activePanel?.type === 'objection'
              ? activePanel.objection.objection
              : undefined
        }
        description={
          activePanel?.type === 'script'
            ? `${activePanel.script.category} · ${activePanel.script.subcategory}`
            : activePanel?.type === 'objection'
              ? (locale === 'tr' ? 'İtiraz yanit paketleri' : 'Objection response pack')
              : undefined
        }
      >
        {activePanel?.type === 'script' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {activePanel.script.tags.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-sm leading-relaxed text-text-secondary">{activePanel.script.content}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleFavorite(activePanel.script.id)}>
                <Star className={`w-3 h-3 ${favoriteIds.includes(activePanel.script.id) ? 'fill-warning text-warning' : ''}`} />
                {favoriteIds.includes(activePanel.script.id)
                  ? (locale === 'tr' ? 'Favoriden çıkar' : 'Remove favorite')
                  : (locale === 'tr' ? 'Favoriye ekle' : 'Add favorite')}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { void handleCopy(activePanel.script.id, activePanel.script.content) }}>
                <Copy className="w-3 h-3" /> {copiedId === activePanel.script.id ? t.common.copied : t.common.copy}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => openAIWithPrompt(`Bu senaryoyu kisilestir ve 2 alternatif versiyon yaz: ${activePanel.script.content}`)}
              >
                <Sparkles className="w-3 h-3" /> {locale === 'tr' ? 'AI Koçu ile geliştir' : 'Refine with AI Coach'}
              </Button>
              <Button type="button" size="sm" onClick={() => router.push('/prospects')}>
                {locale === 'tr' ? 'Potansiyellere git' : 'Go to prospects'}
              </Button>
            </div>
          </div>
        )}

        {activePanel?.type === 'objection' && (
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              {activePanel.objection.responses.map((response) => (
                <div key={response.id} className="rounded-xl border border-border-subtle bg-surface/50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant={response.tone === 'empathetic' ? 'success' : response.tone === 'direct' ? 'primary' : response.tone === 'storytelling' ? 'secondary' : 'warning'}>
                      {response.tone === 'empathetic' ? 'Empatik' : response.tone === 'direct' ? 'Doğrudan' : response.tone === 'storytelling' ? 'Hikaye' : 'Veriye Dayalı'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => { void handleCopy(response.id, response.script) }}>
                        <Copy className="w-3 h-3" /> {copiedId === response.id ? t.common.copied : t.common.copy}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openAIWithPrompt(`Su itiraz icin daha net ve ikna edici cevap yaz: "${activePanel.objection.objection}". Temel yanit: ${response.script}`)}
                      >
                        <Sparkles className="w-3 h-3" /> AI
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{response.script}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
