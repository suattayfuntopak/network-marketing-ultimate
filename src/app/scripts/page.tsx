'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { scripts, objections } from '@/data/mockData'
import { FileText, Search, Copy, Star, ChevronRight, MessageSquare, Shield, Users, Megaphone, Heart, Zap } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const categoryIcons: Record<string, any> = {
  Davet: MessageSquare, Takip: ChevronRight, 'Müşteri İlişkileri': Heart,
  'Sosyal Medya': Megaphone, Oryantasyon: Users, İtirazlar: Shield, 'Potansiyel Müşteri': Zap,
}

export default function ScriptsPage() {
  const { t } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const categories = ['all', ...new Set(scripts.map(s => s.category))]

  const filtered = scripts.filter(s => selectedCategory === 'all' || s.category === selectedCategory)

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.scripts.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.scripts.subtitle}</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-surface border border-border text-text-secondary hover:text-text-primary'}`}>
            {cat === 'all' ? t.scripts.allScripts : cat}
          </button>
        ))}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((script, i) => {
          const Icon = categoryIcons[script.category] || FileText
          return (
            <Card key={script.id} hover>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
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
                  {script.tags.map(tag => <Badge key={tag} variant="default" size="sm">{tag}</Badge>)}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(script.id, script.content)}>
                  {copiedId === script.id ? `✓ ${t.common.copied}` : <><Copy className="w-3 h-3" /> {t.scripts.copy}</>}
                </Button>
              </div>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-error" /> {t.scripts.objectionHandling}</CardTitle></CardHeader>
          <div className="space-y-4">
            {objections.map(obj => (
              <div key={obj.id} className="p-4 rounded-xl bg-surface/50 border border-border-subtle">
                <p className="text-sm font-semibold text-text-primary mb-2">"{obj.objection}"</p>
                <div className="space-y-2">
                  {obj.responses.map(r => (
                    <div key={r.id} className="p-3 rounded-lg bg-card border border-border">
                      <Badge variant={r.tone === 'empathetic' ? 'success' : r.tone === 'direct' ? 'primary' : r.tone === 'storytelling' ? 'secondary' : 'warning'} size="sm">
                        {r.tone === 'empathetic' ? 'Empatik' : r.tone === 'direct' ? 'Doğrudan' : r.tone === 'storytelling' ? 'Hikaye' : r.tone === 'data_driven' ? 'Veriye Dayalı' : r.tone}
                      </Badge>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{r.script}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
