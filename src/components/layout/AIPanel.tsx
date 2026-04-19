'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { consumeCoachPrompt, queueCoachPrompt } from '@/lib/clientStorage'
import { postAiChat } from '@/lib/aiClient'
import {
  fetchAllOrders,
  fetchContacts,
  fetchTasks,
  type ContactRow,
  type OrderRow,
  type TaskRow,
} from '@/lib/queries'
import {
  Bot,
  X,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  ShoppingBag,
  GraduationCap,
  Target,
  ChevronRight,
  Lightbulb,
  MessageSquare,
} from 'lucide-react'
import { buildInsights, type InsightCard } from './aiPanelInsights'

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

export function AIPanel() {
  const { aiPanelOpen, toggleAIPanel, currentUser } = useAppStore()
  const { t, locale } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchString = searchParams.toString()
  const [message, setMessage] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['ai-panel', 'contacts'],
    queryFn: fetchContacts,
    enabled: aiPanelOpen,
    staleTime: 30_000,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['ai-panel', 'tasks'],
    queryFn: fetchTasks,
    enabled: aiPanelOpen,
    staleTime: 30_000,
  })

  const { data: orders = [] } = useQuery<OrderRow[]>({
    queryKey: ['ai-panel', 'orders'],
    queryFn: fetchAllOrders,
    enabled: aiPanelOpen,
    staleTime: 30_000,
  })

  const quickPrompts = [
    { label: t.ai.capabilities.nextBestAction, icon: Users },
    { label: t.dashboard.weeklyActivity, icon: TrendingUp },
    { label: t.ai.capabilities.messageDrafting, icon: MessageSquare },
    { label: t.ai.capabilities.courseRecommendations, icon: GraduationCap },
  ]

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'ai',
      content:
        locale === 'tr'
          ? 'Merhaba! Ben NMU AI Koçun. Ustteki akilli icgoruleri dogrudan eyleme cevirebilir, kisi ve musteri bazli net bir sonraki adimi birlikte cikarabiliriz.'
          : 'Hello! I am your NMU AI Coach. You can turn the smart insights above into action and we can work out the clearest next step for each contact or customer.',
    },
  ])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!aiPanelOpen) return

    const prompt = consumeCoachPrompt()
    if (prompt) {
      void handleSend(prompt)
    }
  // A queued prompt should only be consumed when the panel is visible on the latest route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiPanelOpen, pathname, searchString])

  async function handleSend(text?: string) {
    const userText = (text ?? message).trim()
    if (!userText || streaming) return
    setMessage('')

    const updated: ChatMsg[] = [...chatMessages, { role: 'user', content: userText }]
    setChatMessages(updated)
    setStreaming(true)

    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = updated.map(
      (entry) => ({
        role: entry.role === 'ai' ? 'assistant' : 'user',
        content: entry.content,
      })
    )

    setChatMessages((prev) => [...prev, { role: 'ai', content: '' }])

    try {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const res = await postAiChat(apiMessages, { signal: controller.signal })

      if (!res.ok) {
        throw new Error(
          await readResponseError(
            res,
            locale === 'tr' ? 'AI yaniti alinamadi.' : 'Failed to get an AI response.'
          )
        )
      }

      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error('Missing response stream')
      }

      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: completed } = await reader.read()
        done = completed
        if (!value) continue
        if (controller.signal.aborted) return

        const chunk = decoder.decode(value)
        setChatMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = {
            role: 'ai',
            content: next[next.length - 1].content + chunk,
          }
          return next
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setChatMessages((prev) => {
        const next = [...prev]
        next[next.length - 1] = {
          role: 'ai',
          content:
            error instanceof Error && error.message
              ? error.message
              : locale === 'tr'
                ? 'Bir hata olustu. Lutfen tekrar dene.'
                : 'Something went wrong. Please try again.',
        }
        return next
      })
    } finally {
      abortRef.current = null
      setStreaming(false)
    }
  }

  const insights = buildInsights({ contacts, orders, tasks, locale })

  async function handleInsightAction(insight: InsightCard) {
    const currentRoute = `${pathname}${searchString ? `?${searchString}` : ''}`

    if (insight.route === currentRoute) {
      await handleSend(insight.prompt)
      return
    }

    queueCoachPrompt(insight.prompt)
    router.push(insight.route)
  }

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleAIPanel}
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-graphite border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{t.ai.title}</h3>
                  <p className="text-[10px] text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    {t.common.active}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAIPanel}
                className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-border shrink-0">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">{t.common.smartInsights}</p>
              <div className="space-y-2">
                {insights.slice(0, 3).map((insight, index) => (
                  <motion.button
                    key={insight.id}
                    type="button"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    onClick={() => {
                      void handleInsightAction(insight)
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl bg-surface/50 border border-border-subtle hover:border-border cursor-pointer group transition-colors text-left"
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        insight.type === 'next_action' && 'bg-error/15 text-error',
                        insight.type === 'reorder_alert' && 'bg-success/15 text-success',
                        insight.type === 'coaching_tip' && 'bg-primary/15 text-primary',
                        insight.type === 'lead_heat' && 'bg-warning/15 text-warning',
                      )}
                    >
                      {insight.type === 'next_action' && <Target className="w-3.5 h-3.5" />}
                      {insight.type === 'reorder_alert' && <ShoppingBag className="w-3.5 h-3.5" />}
                      {insight.type === 'coaching_tip' && <Lightbulb className="w-3.5 h-3.5" />}
                      {insight.type === 'lead_heat' && <TrendingUp className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary">{insight.title}</p>
                      <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2">{insight.description}</p>
                      <p className="text-[10px] text-secondary mt-2 font-medium">{insight.actionLabel}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0 mt-1" />
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
                >
                  {msg.role === 'ai' ? (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <Avatar name={currentUser?.name ?? '?'} size="xs" />
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed',
                      msg.role === 'ai'
                        ? 'bg-surface border border-border text-text-primary rounded-tl-md'
                        : 'bg-primary/15 text-text-primary rounded-tr-md',
                    )}
                  >
                    {msg.content.split('\n').map((line, lineIndex) => (
                      <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                        {line.replace(/\*\*(.*?)\*\*/g, (_, text: string) => text)}
                      </p>
                    ))}
                  </div>
                </motion.div>
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

            <div className="px-4 pb-2 shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {quickPrompts.map((prompt, index) => {
                  const Icon = prompt.icon
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        void handleSend(prompt.label)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border-subtle text-[11px] text-text-secondary hover:text-text-primary hover:border-border whitespace-nowrap transition-colors"
                    >
                      <Icon className="w-3 h-3" />
                      {prompt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 border-t border-border shrink-0">
              <div className="flex items-center gap-2">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !streaming) {
                      void handleSend()
                    }
                  }}
                  disabled={streaming}
                  placeholder={t.ai.chatPlaceholder}
                  className="flex-1 h-11 px-4 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/50 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    void handleSend()
                  }}
                  disabled={streaming}
                  className="h-11 w-11 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
