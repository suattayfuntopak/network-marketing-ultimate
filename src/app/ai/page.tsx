'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import {
  AIMessageStudio,
  type AudienceKey,
  type CategoryKey,
} from '@/components/ai/AIMessageStudio'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { deriveCoachInsights } from '@/lib/coach'
import { consumeCoachPrompt, queueCoachPrompt } from '@/lib/clientStorage'
import {
  fetchAllOrders,
  fetchContacts,
  fetchTasks,
  type ContactRow,
  type OrderRow,
  type TaskRow,
} from '@/lib/queries'
import { postAiChat } from '@/lib/aiClient'
import {
  Bot,
  Sparkles,
  Send,
  Target,
  MessageSquare,
  UserCog,
  ShoppingBag,
  Lightbulb,
  TrendingUp,
  CakeSlice,
  Clock3,
  ArrowRight,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type ChatMsg = { role: 'user' | 'ai'; content: string }

async function readResponseError(response: Response, fallback: string) {
  const body = await response.text()
  if (!body) return fallback
  try {
    const parsed = JSON.parse(body) as { error?: string }
    return parsed.error || fallback
  } catch {
    return body
  }
}

const VALID_AUDIENCES: readonly AudienceKey[] = ['prospect', 'customer', 'team']

function isValidAudience(value: string | null): value is AudienceKey {
  return value !== null && (VALID_AUDIENCES as readonly string[]).includes(value)
}

export default function AIPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useLanguage()
  const { currentUser, setAIPanelOpen } = useAppStore()
  const [message, setMessage] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'ai', content: t.ai.welcome },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const studioRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

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

  const audienceParam = searchParams.get('audience')
  const contactParam = searchParams.get('contact')
  const categoryParam = searchParams.get('category')

  const initialAudience: AudienceKey = isValidAudience(audienceParam) ? audienceParam : 'prospect'
  const initialContactId = contactParam ?? undefined
  const initialCategory = (categoryParam as CategoryKey | null) ?? undefined

  useEffect(() => {
    if (audienceParam || contactParam || categoryParam) {
      studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [audienceParam, contactParam, categoryParam])

  const insights = useMemo(
    () => deriveCoachInsights(contacts, tasks, orders, locale),
    [contacts, tasks, orders, locale],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleSend = useCallback(
    async (text?: string) => {
      const userText = (text ?? message).trim()
      if (!userText || streaming) return

      setMessage('')
      let snapshot: ChatMsg[] = []
      setChatMessages((prev) => {
        const withUser: ChatMsg[] = [...prev, { role: 'user', content: userText }]
        snapshot = withUser
        return [...withUser, { role: 'ai', content: '' }]
      })
      setStreaming(true)

      try {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const apiMessages = snapshot.map((entry) => ({
          role: entry.role === 'ai' ? ('assistant' as const) : ('user' as const),
          content: entry.content,
        }))

        const response = await postAiChat(apiMessages, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(
            await readResponseError(
              response,
              locale === 'tr' ? 'AI yaniti alinamadi.' : 'Failed to get an AI response.',
            ),
          )
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('Missing stream')

        const decoder = new TextDecoder()
        let done = false
        while (!done) {
          const { value, done: completed } = await reader.read()
          done = completed
          if (!value) continue
          if (controller.signal.aborted) return

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
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setChatMessages((current) => {
          const next = [...current]
          next[next.length - 1] = {
            role: 'ai',
            content:
              error instanceof Error && error.message
                ? error.message
                : locale === 'tr'
                  ? 'Bir hata oldu. Lutfen tekrar dene.'
                  : 'Something went wrong. Please try again.',
          }
          return next
        })
      } finally {
        abortRef.current = null
        setStreaming(false)
      }
    },
    [locale, message, streaming],
  )

  useEffect(() => {
    const prompt = consumeCoachPrompt()
    if (prompt) {
      void handleSend(prompt)
    }
    // Intentionally run once on mount — consuming a queued prompt is one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const shortcuts = [
    {
      key: 'self' as const,
      title: t.ai.shortcuts.self,
      desc: t.ai.shortcuts.selfDesc,
      icon: Target,
      color: 'text-primary',
      onClick: () => {
        void handleSend(
          locale === 'tr'
            ? 'Bugün için net bir plan çıkar: en sıcak 3 aday, gecikmiş takipler, yeniden sipariş penceresi açılan müşteri ve bugünün ritmi. Her başlık için tek bir aksiyon öner.'
            : 'Give me a clear plan for today: top 3 prospects, overdue follow-ups, customers with an open reorder window, and the daily rhythm. Suggest one action per heading.',
        )
      },
    },
    {
      key: 'outreach' as const,
      title: t.ai.shortcuts.outreach,
      desc: t.ai.shortcuts.outreachDesc,
      icon: MessageSquare,
      color: 'text-secondary',
      onClick: () => {
        router.replace('/ai?audience=prospect')
        studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    },
    {
      key: 'team' as const,
      title: t.ai.shortcuts.team,
      desc: t.ai.shortcuts.teamDesc,
      icon: UserCog,
      color: 'text-warning',
      onClick: () => {
        router.replace('/ai?audience=team')
        studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    },
  ]

  function openInsight(route: string, prompt: string) {
    if (route.startsWith('/ai')) {
      router.replace(route)
      studioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    queueCoachPrompt(prompt)
    setAIPanelOpen(true)
    router.push(route)
  }

  function insightIconColor(type: string) {
    switch (type) {
      case 'next_action':
        return 'bg-error/15 text-error'
      case 'reorder_alert':
        return 'bg-success/15 text-success'
      case 'coaching_tip':
        return 'bg-primary/15 text-primary'
      case 'lead_heat':
        return 'bg-warning/15 text-warning'
      case 'birthday_soon':
        return 'bg-secondary/15 text-secondary'
      case 'dormant_reconnect':
        return 'bg-accent/15 text-accent'
      default:
        return 'bg-surface text-text-secondary'
    }
  }

  function insightIcon(type: string) {
    switch (type) {
      case 'next_action':
        return <Target className="w-4 h-4" />
      case 'reorder_alert':
        return <ShoppingBag className="w-4 h-4" />
      case 'coaching_tip':
        return <Lightbulb className="w-4 h-4" />
      case 'lead_heat':
        return <TrendingUp className="w-4 h-4" />
      case 'birthday_soon':
        return <CakeSlice className="w-4 h-4" />
      case 'dormant_reconnect':
        return <Clock3 className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
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

      <motion.div variants={item} className="grid sm:grid-cols-3 gap-3">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon
          return (
            <button
              key={shortcut.key}
              type="button"
              onClick={shortcut.onClick}
              className="p-4 rounded-xl bg-card border border-border hover:border-border-strong cursor-pointer transition-colors text-left"
            >
              <Icon className={`w-5 h-5 ${shortcut.color} mb-2`} />
              <p className="text-sm font-semibold text-text-primary">{shortcut.title}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{shortcut.desc}</p>
            </button>
          )
        })}
      </motion.div>

      <motion.div variants={item} ref={studioRef}>
        <AIMessageStudio
          key={`${initialAudience}-${initialContactId ?? 'none'}-${initialCategory ?? 'none'}`}
          contacts={contacts}
          initialAudience={initialAudience}
          initialContactId={initialContactId}
          initialCategory={initialCategory}
        />
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-secondary" /> {t.ai.todaysInsights}
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.button
                key={insight.id}
                type="button"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => openInsight(insight.route, insight.prompt)}
                className="w-full flex items-start gap-3 p-4 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer group transition-all text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${insightIconColor(insight.type)}`}>
                  {insightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">{insight.title}</p>
                    <Badge variant="secondary" size="sm">{insight.actionLabel}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{insight.description}</p>
                  <span className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1">
                    {insight.actionLabel} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card padding="none" className="overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-secondary" /> {t.ai.chatWithAI}
            </h3>
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
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && !streaming && void handleSend()}
                placeholder={t.ai.chatPlaceholder}
                className="flex-1 h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { void handleSend() }}
                className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                disabled={streaming}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
