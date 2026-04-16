'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { aiRecommendations } from '@/data/mockData'
import { Bot, Sparkles, Send, Target, TrendingUp, ShoppingBag, GraduationCap, Lightbulb, MessageSquare, Zap, ArrowRight } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function AIPage() {
  const { t } = useLanguage()

  const capabilities = [
    { title: t.ai.capabilities.nextBestAction, desc: t.ai.capabilities.nextBestActionDesc, icon: Target, color: 'text-primary' },
    { title: t.ai.capabilities.messageDrafting, desc: t.ai.capabilities.messageDraftingDesc, icon: MessageSquare, color: 'text-secondary' },
    { title: t.ai.capabilities.leadScoring, desc: t.ai.capabilities.leadScoringDesc, icon: TrendingUp, color: 'text-success' },
    { title: t.ai.capabilities.pipelineAnalysis, desc: t.ai.capabilities.pipelineAnalysisDesc, icon: Zap, color: 'text-warning' },
    { title: t.ai.capabilities.courseRecommendations, desc: t.ai.capabilities.courseRecommendationsDesc, icon: GraduationCap, color: 'text-accent' },
    { title: t.ai.capabilities.weeklyReview, desc: t.ai.capabilities.weeklyReviewDesc, icon: Lightbulb, color: 'text-amber-400' },
  ]
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([
    { role: 'ai', content: "AI Büyüme Koçuna hoş geldin! Huni durumunu, aktivite kaiıplarını ve ekip performansını analiz ederek sana aksiyon alınabilir öneriler sunuyorum. Şunları deneyebilirsin:\n\n• \"Bugün kiminle takip etmeliyim?\"\n• \"Marcus için davet mesajı taşlağı yaz\"\n• \"Bu ayki dönüşüm trendi nasıl?\"\n• \"Hangi ekip üyesi koçluğa ihtiyaç duyuyor?\"\n\nBugün sana nasıl yardımcı olabilirim?" }
  ])

  const handleSend = () => {
    if (!message.trim()) return
    setChatMessages(prev => [...prev, { role: 'user', content: message }])
    setMessage('')
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: "Huni analizine göre bugünkü en önemli 3 önceliğin:\n\n1. **Elena Rodriguez** — yeniden siparişi BUGÜN geliyor. %88 ilişki gücüyle sadık bir müşteri. Gece kremını öner.\n\n2. **Marcus Johnson** — ilgi puanı bu hafta 15 puan arttı. Kazanç planını araştırıyor. Ekibinden spesifik gelir örnekleriyle ara.\n\n3. **Priya Sharma** — Oryantasyonun 3. günü ama henüz ilk temas yok. Bir davet rol yapması yapmanı öneririm.\n\nBu kişiler için özel senaryo yazayım mı?"
      }])
    }, 1500)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1200px] mx-auto">
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{t.ai.title}</h1>
            <p className="text-sm text-text-secondary">{t.ai.subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* AI Capabilities */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {capabilities.map((cap, i) => {
          const Icon = cap.icon
          return (
            <div key={i} className="p-4 rounded-xl bg-card border border-border hover:border-border-strong cursor-pointer transition-colors">
              <Icon className={`w-5 h-5 ${cap.color} mb-2`} />
              <p className="text-sm font-semibold text-text-primary">{cap.title}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{cap.desc}</p>
            </div>
          )
        })}
      </motion.div>

      {/* Smart Insights */}
      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> {t.ai.todaysInsights}</CardTitle></CardHeader>
          <div className="space-y-3">
            {aiRecommendations.map((rec, i) => (
              <motion.div key={rec.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer group transition-all">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rec.type === 'next_action' ? 'bg-error/15 text-error' : rec.type === 'reorder_alert' ? 'bg-success/15 text-success' : rec.type === 'coaching_tip' ? 'bg-primary/15 text-primary' : rec.type === 'lead_heat' ? 'bg-warning/15 text-warning' : 'bg-secondary/15 text-secondary'}`}>
                  {rec.type === 'next_action' ? <Target className="w-4 h-4" /> : rec.type === 'reorder_alert' ? <ShoppingBag className="w-4 h-4" /> : rec.type === 'coaching_tip' ? <Lightbulb className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{rec.title}</p>
                    <Badge variant="secondary" size="sm">{rec.confidence}%</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{rec.description}</p>
                  {rec.actionLabel && (
                    <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1">{rec.actionLabel} <ArrowRight className="w-3 h-3" /></span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Chat */}
      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4 text-secondary" /> {t.ai.chatWithAI}</h3>
          </div>
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5 text-white" /></div>
                ) : (
                  <Avatar name="Sarah Chen" size="xs" />
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-surface border border-border rounded-tl-md text-text-primary' : 'bg-primary/15 text-text-primary rounded-tr-md'}`}>
                  {msg.content.split('\n').map((line, j) => <p key={j} className={j > 0 ? 'mt-2' : ''}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>)}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={t.ai.chatPlaceholder} className="flex-1 h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend} className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]"><Send className="w-4 h-4" /></motion.button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
