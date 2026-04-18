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

type ChatMsg = { role: 'user' | 'ai'; content: string }
type InsightType = 'next_action' | 'reorder_alert' | 'coaching_tip' | 'lead_heat'

type InsightCard = {
  id: string
  type: InsightType
  title: string
  description: string
  actionLabel: string
  prompt: string
  route: string
}

const ACTIVE_TASK_STATUSES: TaskRow['status'][] = ['pending', 'in_progress', 'overdue']

const STAGE_LABELS = {
  tr: {
    new: 'yeni potansiyel',
    contact_planned: 'iletisim planlandi',
    first_contact: 'ilk iletisim',
    interested: 'ilgileniyor',
    invited: 'davet edildi',
    presentation_sent: 'sunum gonderildi',
    presentation_done: 'sunum yapildi',
    followup_pending: 'takip ediliyor',
    objection_handling: 'itiraz yonetimi',
    ready_to_buy: 'karar asamasinda',
    became_customer: 'musteri oldu',
    ready_to_join: 'ekibe katilmaya hazir',
    became_member: 'ekip uyesi',
    nurture_later: 'sonra ilgilen',
    dormant: 'pasif',
    lost: 'kaybedildi',
  },
  en: {
    new: 'new lead',
    contact_planned: 'contact planned',
    first_contact: 'first contact',
    interested: 'interested',
    invited: 'invited',
    presentation_sent: 'presentation sent',
    presentation_done: 'presentation done',
    followup_pending: 'follow-up active',
    objection_handling: 'objection handling',
    ready_to_buy: 'decision stage',
    became_customer: 'became customer',
    ready_to_join: 'ready to join',
    became_member: 'team member',
    nurture_later: 'nurture later',
    dormant: 'dormant',
    lost: 'lost',
  },
} as const

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function dateOnly(date: string | null | undefined) {
  if (!date) return null
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return null
  value.setHours(0, 0, 0, 0)
  return value
}

function daysFromToday(date: string | null | undefined) {
  const target = dateOnly(date)
  if (!target) return null
  const diff = target.getTime() - startOfToday().getTime()
  return Math.round(diff / 86_400_000)
}

function formatShortDate(date: string | null | undefined, locale: 'tr' | 'en') {
  if (!date) return locale === 'tr' ? 'belirsiz' : 'unscheduled'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return locale === 'tr' ? 'belirsiz' : 'unscheduled'
  return value.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })
}

function formatCurrency(amount: number, locale: 'tr' | 'en') {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount)
}

function isPipelineCandidate(stage: ContactRow['pipeline_stage']) {
  return [
    'interested',
    'invited',
    'presentation_sent',
    'presentation_done',
    'followup_pending',
    'objection_handling',
    'ready_to_buy',
    'ready_to_join',
  ].includes(stage)
}

function getStageLabel(stage: string, locale: 'tr' | 'en') {
  const labels = STAGE_LABELS[locale]
  return stage in labels
    ? labels[stage as keyof typeof labels]
    : stage
}

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

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]))

  const hotLead = [...contacts]
    .filter((contact) => !['lost', 'dormant', 'became_customer', 'became_member'].includes(contact.pipeline_stage))
    .filter((contact) => {
      const followUpDelta = daysFromToday(contact.next_follow_up_date)
      return contact.temperature === 'hot' || isPipelineCandidate(contact.pipeline_stage) || (followUpDelta !== null && followUpDelta <= 0)
    })
    .sort((left, right) => {
      const leftFollowUp = daysFromToday(left.next_follow_up_date)
      const rightFollowUp = daysFromToday(right.next_follow_up_date)
      const leftScore =
        (left.temperature === 'hot' ? 6 : left.temperature === 'warm' ? 3 : 0) +
        (leftFollowUp !== null && leftFollowUp <= 0 ? 5 : 0) +
        (isPipelineCandidate(left.pipeline_stage) ? 2 : 0)
      const rightScore =
        (right.temperature === 'hot' ? 6 : right.temperature === 'warm' ? 3 : 0) +
        (rightFollowUp !== null && rightFollowUp <= 0 ? 5 : 0) +
        (isPipelineCandidate(right.pipeline_stage) ? 2 : 0)

      if (rightScore !== leftScore) return rightScore - leftScore
      return (leftFollowUp ?? 999) - (rightFollowUp ?? 999)
    })[0]

  const reorderOpportunity = [...orders]
    .filter((order) => order.status !== 'cancelled' && Boolean(order.next_reorder_date) && contactsById.has(order.contact_id))
    .sort((left, right) => {
      const leftDate = dateOnly(left.next_reorder_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightDate = dateOnly(right.next_reorder_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftDate - rightDate
    })[0]

  const coachingTask = [...tasks]
    .filter((task) => ACTIVE_TASK_STATUSES.includes(task.status))
    .filter((task) => Boolean(task.contact_id))
    .filter((task) => {
      const contact = task.contact_id ? contactsById.get(task.contact_id) : null
      return contact?.pipeline_stage === 'became_member'
    })
    .sort((left, right) => {
      const leftWeight = left.status === 'overdue' ? 0 : 1
      const rightWeight = right.status === 'overdue' ? 0 : 1
      if (leftWeight !== rightWeight) return leftWeight - rightWeight
      return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
    })[0]

  const insights: InsightCard[] = []

  if (hotLead) {
    const dueDelta = daysFromToday(hotLead.next_follow_up_date)
    const followUpText =
      dueDelta === null
        ? locale === 'tr'
          ? `${getStageLabel(hotLead.pipeline_stage, locale)} asamasinda ilerliyor.`
          : `They are currently in the ${getStageLabel(hotLead.pipeline_stage, locale)} stage.`
        : dueDelta <= 0
          ? locale === 'tr'
            ? `Takip tarihi ${formatShortDate(hotLead.next_follow_up_date, locale)} ve gecikme riski var.`
            : `The follow-up is due on ${formatShortDate(hotLead.next_follow_up_date, locale)} and needs attention now.`
          : locale === 'tr'
            ? `Siradaki takip ${formatShortDate(hotLead.next_follow_up_date, locale)} icin planli.`
            : `The next follow-up is scheduled for ${formatShortDate(hotLead.next_follow_up_date, locale)}.`

    insights.push({
      id: `hot-${hotLead.id}`,
      type: 'lead_heat',
      title: locale === 'tr' ? `${hotLead.full_name} ile bugun ilerle` : `Move ${hotLead.full_name} forward today`,
      description:
        locale === 'tr'
          ? `${followUpText} Kisi detayini acip hazir bir konusma planiyla ilerleyebilirsin.`
          : `${followUpText} Open the contact workspace and move forward with a ready-made conversation plan.`,
      actionLabel: locale === 'tr' ? 'Kisi planini ac' : 'Open contact plan',
      prompt:
        locale === 'tr'
          ? `${hotLead.full_name} icin bugunun en iyi aksiyonunu cikar. Asama ${getStageLabel(hotLead.pipeline_stage, locale)}, sicaklik ${hotLead.temperature}. Kisa acilis, olasi itiraz ve net kapanis oner.`
          : `Work out the best next action for ${hotLead.full_name} today. Stage: ${getStageLabel(hotLead.pipeline_stage, locale)}, temperature: ${hotLead.temperature}. Give me an opener, likely objection, and a clean close.`,
      route: `/contacts?contact=${hotLead.id}`,
    })
  }

  if (reorderOpportunity) {
    const reorderContact = contactsById.get(reorderOpportunity.contact_id)

    if (reorderContact) {
      insights.push({
        id: `reorder-${reorderOpportunity.id}`,
        type: 'reorder_alert',
        title:
          locale === 'tr'
            ? `${reorderContact.full_name} icin yeniden siparis firsati`
            : `Reorder opportunity for ${reorderContact.full_name}`,
        description:
          locale === 'tr'
            ? `${formatShortDate(reorderOpportunity.next_reorder_date, locale)} tarihli yeniden siparis penceresi acik. Son siparis toplami ${formatCurrency(reorderOpportunity.total_try, locale)}.`
            : `The reorder window is open for ${formatShortDate(reorderOpportunity.next_reorder_date, locale)}. Last order value: ${formatCurrency(reorderOpportunity.total_try, locale)}.`,
        actionLabel: locale === 'tr' ? 'Musteri akisini ac' : 'Open customer flow',
        prompt:
          locale === 'tr'
            ? `${reorderContact.full_name} icin yeniden siparis gorusme plani hazirla. Son siparis toplami ${formatCurrency(reorderOpportunity.total_try, locale)} ve sonraki siparis tarihi ${formatShortDate(reorderOpportunity.next_reorder_date, locale)}.`
            : `Prepare a reorder conversation plan for ${reorderContact.full_name}. Their last order was ${formatCurrency(reorderOpportunity.total_try, locale)} and the next reorder date is ${formatShortDate(reorderOpportunity.next_reorder_date, locale)}.`,
        route: '/customers',
      })
    }
  }

  if (coachingTask?.contact_id) {
    const member = contactsById.get(coachingTask.contact_id)

    if (member) {
      insights.push({
        id: `coach-${coachingTask.id}`,
        type: 'coaching_tip',
        title:
          locale === 'tr'
            ? `${member.full_name} icin koçluk dokunusu`
            : `Coaching touchpoint for ${member.full_name}`,
        description:
          locale === 'tr'
            ? `${coachingTask.title} gorevi ${formatShortDate(coachingTask.due_date, locale)} icin planli. ${coachingTask.status === 'overdue' ? 'Gecikme var, kisa bir destek dokunusu faydali olur.' : 'Bugun tamamlanmasi ivmeyi korur.'}`
            : `${coachingTask.title} is due ${formatShortDate(coachingTask.due_date, locale)}. ${coachingTask.status === 'overdue' ? 'It is overdue, so a short coaching touch would help.' : 'Completing it today will protect momentum.'}`,
        actionLabel: locale === 'tr' ? 'Koçluk calisma alanini ac' : 'Open coaching workspace',
        prompt:
          locale === 'tr'
            ? `${member.full_name} ekip uyesi icin hizli bir koçluk plani olustur. Gorev: ${coachingTask.title}. Durum: ${coachingTask.status}. Bugun atmam gereken 3 net adimi yaz.`
            : `Create a quick coaching plan for team member ${member.full_name}. Task: ${coachingTask.title}. Status: ${coachingTask.status}. Give me the three clearest actions for today.`,
        route: `/contacts?contact=${member.id}`,
      })
    }
  }

  const fallbackInsights: InsightCard[] = [
    {
      id: 'pipeline-focus',
      type: 'next_action',
      title: locale === 'tr' ? 'Huniyi bugun hizlandir' : 'Accelerate the pipeline today',
      description:
        locale === 'tr'
          ? 'Takip bekleyen ve sunum gonderilen asamalari tarayip gunluk oncelik listesini cikar.'
          : 'Scan follow-up and presentation stages and extract the strongest priorities for today.',
      actionLabel: locale === 'tr' ? 'Huniyi ac' : 'Open pipeline',
      prompt:
        locale === 'tr'
          ? 'Mevcut huniye gore bugun odaklanmam gereken 3 potansiyeli ve nedenlerini yaz.'
          : 'Based on the current pipeline, tell me the top three prospects I should focus on today and why.',
      route: '/pipeline',
    },
    {
      id: 'task-focus',
      type: 'next_action',
      title: locale === 'tr' ? 'Bugunun gorev ritmini kur' : 'Set today’s task rhythm',
      description:
        locale === 'tr'
          ? 'Gecikmis ve oncelikli takipleri tek ekranda gorup net bir uygulama sirasi cikar.'
          : 'Review overdue and high-priority follow-ups in one place and create a practical execution order.',
      actionLabel: locale === 'tr' ? 'Gorevleri ac' : 'Open tasks',
      prompt:
        locale === 'tr'
          ? 'Bugunku gorevlerimi onceliklendir. En yuksek etkiyi yaratacak sira ve odagi oner.'
          : 'Prioritize my tasks for today. Suggest the execution order that will create the most impact.',
      route: '/tasks',
    },
    {
      id: 'new-growth',
      type: 'next_action',
      title: locale === 'tr' ? 'Yeni potansiyel akisini besle' : 'Feed the new prospect flow',
      description:
        locale === 'tr'
          ? 'Bugun huniye taze giris eklemek icin hizli bir potansiyel yakalama ve mesaj plani kur.'
          : 'Set up a quick prospect-capture and outreach plan to add fresh opportunities to the funnel today.',
      actionLabel: locale === 'tr' ? 'Potansiyel ekle' : 'Add prospect',
      prompt:
        locale === 'tr'
          ? 'Bugun yeni potansiyel kazanmak icin kullanabilecegim kisa bir mesaj ve aksiyon plani hazirla.'
          : 'Prepare a short message and action plan I can use to win new prospects today.',
      route: '/contacts?segment=prospects&new=1',
    },
  ]

  for (const fallback of fallbackInsights) {
    if (insights.length >= 3) break
    if (!insights.some((item) => item.id === fallback.id)) {
      insights.push(fallback)
    }
  }

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
