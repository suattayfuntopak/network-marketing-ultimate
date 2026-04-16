'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { deriveCoachInsights } from '@/lib/coach'
import { fetchAllOrders, fetchContacts, fetchTasks, type ContactRow, type OrderRow, type TaskRow } from '@/lib/queries'
import { Bot, Sparkles, Send, Target, TrendingUp, ShoppingBag, GraduationCap, Lightbulb, MessageSquare, Zap, ArrowRight } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type ChatMsg = { role: 'user' | 'ai'; content: string }

export default function AIPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const [message, setMessage] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'ai',
      content:
        locale === 'tr'
          ? 'AI Büyüme Koçuna hos geldin. Asagidaki canli icgorulerden birini acabilir ya da dogrudan soru sorabilirsin.'
          : 'Welcome to the AI Growth Coach. Open one of the live insights below or ask anything directly.',
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    staleTime: 30_000,
  })

  const { data: orders = [] } = useQuery<OrderRow[]>({
    queryKey: ['orders-all'],
    queryFn: fetchAllOrders,
    staleTime: 30_000,
  })

  const capabilities = [
    { title: t.ai.capabilities.nextBestAction, desc: t.ai.capabilities.nextBestActionDesc, icon: Target, color: 'text-primary', prompt: locale === 'tr' ? 'Bugun icin sonraki en iyi aksiyonu cikar.' : 'Show me the next best action for today.' },
    { title: t.ai.capabilities.messageDrafting, desc: t.ai.capabilities.messageDraftingDesc, icon: MessageSquare, color: 'text-secondary', prompt: locale === 'tr' ? 'Bugun kullanabilecegim bir takip mesaji yaz.' : 'Write a follow-up message I can use today.' },
    { title: t.ai.capabilities.leadScoring, desc: t.ai.capabilities.leadScoringDesc, icon: TrendingUp, color: 'text-success', prompt: locale === 'tr' ? 'Hangi kisiler isiniyor, sirala.' : 'Rank the contacts whose interest is heating up.' },
    { title: t.ai.capabilities.pipelineAnalysis, desc: t.ai.capabilities.pipelineAnalysisDesc, icon: Zap, color: 'text-warning', prompt: locale === 'tr' ? 'Hunideki tikanikliklari analiz et.' : 'Analyze the bottlenecks in the pipeline.' },
    { title: t.ai.capabilities.courseRecommendations, desc: t.ai.capabilities.courseRecommendationsDesc, icon: GraduationCap, color: 'text-accent', prompt: locale === 'tr' ? 'Bugunku seviyeme gore hangi akademi modulu faydali?' : 'Which academy module would help most at my current stage?' },
    { title: t.ai.capabilities.weeklyReview, desc: t.ai.capabilities.weeklyReviewDesc, icon: Lightbulb, color: 'text-amber-400', prompt: locale === 'tr' ? 'Bu haftanin performans ozetini cikar.' : 'Give me a review of this week’s performance.' },
  ]

  const insights = deriveCoachInsights(contacts, tasks, orders, locale)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleSend(text?: string) {
    const userText = (text ?? message).trim()
    if (!userText || streaming) return

    setMessage('')
    const updated: ChatMsg[] = [...chatMessages, { role: 'user', content: userText }]
    setChatMessages(updated)
    setStreaming(true)
    setChatMessages((current) => [...current, { role: 'ai', content: '' }])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((entry) => ({
            role: entry.role === 'ai' ? 'assistant' : 'user',
            content: entry.content,
          })),
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Missing stream')
      }

      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: completed } = await reader.read()
        done = completed
        if (!value) continue

        const chunk = decoder.decode(value)
        setChatMessages((current) => {
          const next = [...current]
          next[next.length - 1] = {
            role: 'ai',
            content: next[next.length - 1].content + chunk,
          }
          return next
        })
      }
    } catch {
      setChatMessages((current) => {
        const next = [...current]
        next[next.length - 1] = {
          role: 'ai',
          content: locale === 'tr' ? 'Bir hata oldu. Lutfen tekrar dene.' : 'Something went wrong. Please try again.',
        }
        return next
      })
    }

    setStreaming(false)
  }

  async function openInsight(route: string, prompt: string) {
    router.push(route)
    await handleSend(prompt)
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

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {capabilities.map((capability) => {
          const Icon = capability.icon
          return (
            <button
              key={capability.title}
              type="button"
              onClick={() => {
                void handleSend(capability.prompt)
              }}
              className="p-4 rounded-xl bg-card border border-border hover:border-border-strong cursor-pointer transition-colors text-left"
            >
              <Icon className={`w-5 h-5 ${capability.color} mb-2`} />
              <p className="text-sm font-semibold text-text-primary">{capability.title}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{capability.desc}</p>
            </button>
          )
        })}
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> {t.ai.todaysInsights}</CardTitle></CardHeader>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.button
                key={insight.id}
                type="button"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => {
                  void openInsight(insight.route, insight.prompt)
                }}
                className="w-full flex items-start gap-3 p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer group transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${insight.type === 'next_action' ? 'bg-error/15 text-error' : insight.type === 'reorder_alert' ? 'bg-success/15 text-success' : insight.type === 'coaching_tip' ? 'bg-primary/15 text-primary' : 'bg-warning/15 text-warning'}`}>
                  {insight.type === 'next_action' ? <Target className="w-4 h-4" /> : insight.type === 'reorder_alert' ? <ShoppingBag className="w-4 h-4" /> : insight.type === 'coaching_tip' ? <Lightbulb className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                    <Badge variant="secondary" size="sm">{insight.actionLabel}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{insight.description}</p>
                  <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1">{insight.actionLabel} <ArrowRight className="w-3 h-3" /></span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><MessageSquare className="w-4 h-4 text-secondary" /> {t.ai.chatWithAI}</h3>
          </div>
          <div className="h-[420px] overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <Avatar name={currentUser?.name ?? 'NMU'} size="xs" />
                )}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-surface border border-border rounded-tl-md text-text-primary' : 'bg-primary/15 text-text-primary rounded-tr-md'}`}>
                  {msg.content.split('\n').map((line, lineIndex) => (
                    <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                      {line.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {streaming && chatMessages[chatMessages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-tl-md px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !streaming && void handleSend()} placeholder={t.ai.chatPlaceholder} className="flex-1 h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { void handleSend() }} className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50" disabled={streaming}><Send className="w-4 h-4" /></motion.button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
