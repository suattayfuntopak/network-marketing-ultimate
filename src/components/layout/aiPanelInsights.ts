import type { ContactRow, OrderRow, TaskRow } from '@/lib/queries'

export type InsightType = 'next_action' | 'reorder_alert' | 'coaching_tip' | 'lead_heat'

export type InsightCard = {
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

export function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function dateOnly(date: string | null | undefined) {
  if (!date) return null
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return null
  value.setHours(0, 0, 0, 0)
  return value
}

export function daysFromToday(date: string | null | undefined) {
  const target = dateOnly(date)
  if (!target) return null
  const diff = target.getTime() - startOfToday().getTime()
  return Math.round(diff / 86_400_000)
}

export function formatShortDate(date: string | null | undefined, locale: 'tr' | 'en') {
  if (!date) return locale === 'tr' ? 'belirsiz' : 'unscheduled'
  const value = new Date(date)
  if (Number.isNaN(value.getTime())) return locale === 'tr' ? 'belirsiz' : 'unscheduled'
  return value.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })
}

export function formatCurrency(amount: number, locale: 'tr' | 'en') {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function isPipelineCandidate(stage: ContactRow['pipeline_stage']) {
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

export function getStageLabel(stage: string, locale: 'tr' | 'en') {
  const labels = STAGE_LABELS[locale]
  return stage in labels ? labels[stage as keyof typeof labels] : stage
}

type BuildInsightsInput = {
  contacts: ContactRow[]
  orders: OrderRow[]
  tasks: TaskRow[]
  locale: 'tr' | 'en'
}

export function buildInsights({ contacts, orders, tasks, locale }: BuildInsightsInput): InsightCard[] {
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

  return insights
}
