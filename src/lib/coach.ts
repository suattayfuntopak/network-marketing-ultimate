'use client'

import type { Notification, User } from '@/types'
import type { ContactRow, OrderRow, TaskRow } from '@/lib/queries'

export type CoachInsightType =
  | 'next_action'
  | 'reorder_alert'
  | 'coaching_tip'
  | 'lead_heat'
  | 'birthday_soon'
  | 'dormant_reconnect'

export type CoachInsight = {
  id: string
  type: CoachInsightType
  title: string
  description: string
  actionLabel: string
  prompt: string
  route: string
}

const ACTIVE_TASK_STATUSES: TaskRow['status'][] = ['pending', 'in_progress', 'overdue']
const MAX_INSIGHTS = 5
const DORMANT_THRESHOLD_DAYS = 21
const BIRTHDAY_WINDOW_DAYS = 7

const STAGE_LABELS = {
  tr: {
    new: 'yeni potansiyel',
    contact_planned: 'iletişim planlandı',
    first_contact: 'ilk iletişim',
    interested: 'ilgileniyor',
    invited: 'davet edildi',
    presentation_sent: 'sunum gönderildi',
    presentation_done: 'sunum yapıldı',
    followup_pending: 'takip ediliyor',
    objection_handling: 'itiraz yönetimi',
    ready_to_buy: 'karar aşamasında',
    became_customer: 'müşteri oldu',
    ready_to_join: 'ekibe katılmaya hazır',
    became_member: 'ekip üyesi',
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

export function getStageLabel(stage: string, locale: 'tr' | 'en') {
  const labels = STAGE_LABELS[locale]
  return stage in labels ? labels[stage as keyof typeof labels] : stage
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

function daysUntilBirthday(birthday: string | null | undefined) {
  if (!birthday) return null
  const parsed = new Date(birthday)
  if (Number.isNaN(parsed.getTime())) return null

  const today = startOfToday()
  const next = new Date(today.getFullYear(), parsed.getMonth(), parsed.getDate())
  next.setHours(0, 0, 0, 0)
  if (next.getTime() < today.getTime()) {
    next.setFullYear(next.getFullYear() + 1)
  }
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

function daysSinceContact(date: string | null | undefined) {
  const target = dateOnly(date)
  if (!target) return null
  const diff = startOfToday().getTime() - target.getTime()
  return Math.round(diff / 86_400_000)
}

type DeriveInput = {
  contacts: ContactRow[]
  tasks: TaskRow[]
  orders: OrderRow[]
  locale: 'tr' | 'en'
}

export function deriveCoachInsights(
  contactsOrInput: ContactRow[] | DeriveInput,
  tasks?: TaskRow[],
  orders?: OrderRow[],
  locale?: 'tr' | 'en',
): CoachInsight[] {
  const input: DeriveInput = Array.isArray(contactsOrInput)
    ? { contacts: contactsOrInput, tasks: tasks ?? [], orders: orders ?? [], locale: locale ?? 'tr' }
    : contactsOrInput

  const contactsById = new Map(input.contacts.map((contact) => [contact.id, contact]))
  const insights: CoachInsight[] = []

  const hotLead = [...input.contacts]
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

  if (hotLead) {
    const dueDelta = daysFromToday(hotLead.next_follow_up_date)
    const followUpText =
      dueDelta === null
        ? input.locale === 'tr'
          ? `${getStageLabel(hotLead.pipeline_stage, input.locale)} aşamasında ilerliyor.`
          : `Currently in the ${getStageLabel(hotLead.pipeline_stage, input.locale)} stage.`
        : dueDelta <= 0
          ? input.locale === 'tr'
            ? `Takip tarihi ${formatShortDate(hotLead.next_follow_up_date, input.locale)}, gecikme riski var.`
            : `Follow-up due ${formatShortDate(hotLead.next_follow_up_date, input.locale)} and needs attention now.`
          : input.locale === 'tr'
            ? `Sıradaki takip ${formatShortDate(hotLead.next_follow_up_date, input.locale)} için planlı.`
            : `Next follow-up scheduled for ${formatShortDate(hotLead.next_follow_up_date, input.locale)}.`

    insights.push({
      id: `hot-${hotLead.id}`,
      type: 'lead_heat',
      title: input.locale === 'tr' ? `${hotLead.full_name} ile bugün ilerle` : `Move ${hotLead.full_name} forward today`,
      description:
        input.locale === 'tr'
          ? `${followUpText} Kişi detayını açıp hazır bir konuşma planıyla ilerleyebilirsin.`
          : `${followUpText} Open the contact workspace and move forward with a ready-made plan.`,
      actionLabel: input.locale === 'tr' ? 'Kişi planını aç' : 'Open contact plan',
      prompt:
        input.locale === 'tr'
          ? `${hotLead.full_name} için bugünün en iyi aksiyonunu çıkar. Aşama ${getStageLabel(hotLead.pipeline_stage, input.locale)}, sıcaklık ${hotLead.temperature}. Kısa açılış, olası itiraz ve net kapanış öner.`
          : `Work out the best next action for ${hotLead.full_name} today. Stage: ${getStageLabel(hotLead.pipeline_stage, input.locale)}, temperature: ${hotLead.temperature}. Give me an opener, likely objection, and a clean close.`,
      route: `/contacts?contact=${hotLead.id}`,
    })
  }

  const reorderOpportunity = [...input.orders]
    .filter((order) => order.status !== 'cancelled' && Boolean(order.next_reorder_date) && contactsById.has(order.contact_id))
    .sort((left, right) => {
      const leftDate = dateOnly(left.next_reorder_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightDate = dateOnly(right.next_reorder_date)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftDate - rightDate
    })[0]

  if (reorderOpportunity) {
    const reorderContact = contactsById.get(reorderOpportunity.contact_id)

    if (reorderContact) {
      insights.push({
        id: `reorder-${reorderOpportunity.id}`,
        type: 'reorder_alert',
        title:
          input.locale === 'tr'
            ? `${reorderContact.full_name} için yeniden sipariş fırsatı`
            : `Reorder opportunity for ${reorderContact.full_name}`,
        description:
          input.locale === 'tr'
            ? `${formatShortDate(reorderOpportunity.next_reorder_date, input.locale)} tarihli yeniden sipariş penceresi açık. Son sipariş toplamı ${formatCurrency(reorderOpportunity.total_try, input.locale)}.`
            : `Reorder window opens ${formatShortDate(reorderOpportunity.next_reorder_date, input.locale)}. Last order value: ${formatCurrency(reorderOpportunity.total_try, input.locale)}.`,
        actionLabel: input.locale === 'tr' ? 'Müşteri akışını aç' : 'Open customer flow',
        prompt:
          input.locale === 'tr'
            ? `${reorderContact.full_name} için yeniden sipariş görüşme planı hazırla. Son sipariş toplamı ${formatCurrency(reorderOpportunity.total_try, input.locale)} ve sonraki sipariş tarihi ${formatShortDate(reorderOpportunity.next_reorder_date, input.locale)}.`
            : `Prepare a reorder conversation plan for ${reorderContact.full_name}. Their last order was ${formatCurrency(reorderOpportunity.total_try, input.locale)} and the next reorder date is ${formatShortDate(reorderOpportunity.next_reorder_date, input.locale)}.`,
        route: '/customers',
      })
    }
  }

  const coachingTask = [...input.tasks]
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

  if (coachingTask?.contact_id) {
    const member = contactsById.get(coachingTask.contact_id)

    if (member) {
      insights.push({
        id: `coach-${coachingTask.id}`,
        type: 'coaching_tip',
        title:
          input.locale === 'tr'
            ? `${member.full_name} için koçluk dokunuşu`
            : `Coaching touchpoint for ${member.full_name}`,
        description:
          input.locale === 'tr'
            ? `${coachingTask.title} görevi ${formatShortDate(coachingTask.due_date, input.locale)} için planlı. ${coachingTask.status === 'overdue' ? 'Gecikme var, kısa bir destek dokunuşu faydalı olur.' : 'Bugün tamamlanması ivmeyi korur.'}`
            : `${coachingTask.title} is due ${formatShortDate(coachingTask.due_date, input.locale)}. ${coachingTask.status === 'overdue' ? 'It is overdue, so a short coaching touch would help.' : 'Completing it today will protect momentum.'}`,
        actionLabel: input.locale === 'tr' ? 'Koçluk çalışma alanını aç' : 'Open coaching workspace',
        prompt:
          input.locale === 'tr'
            ? `${member.full_name} ekip üyesi için hızlı bir koçluk planı oluştur. Görev: ${coachingTask.title}. Durum: ${coachingTask.status}. Bugün atmam gereken 3 net adımı yaz.`
            : `Create a quick coaching plan for team member ${member.full_name}. Task: ${coachingTask.title}. Status: ${coachingTask.status}. Give me the three clearest actions for today.`,
        route: `/contacts?contact=${member.id}`,
      })
    }
  }

  const birthdayContact = [...input.contacts]
    .filter((contact) => !['lost'].includes(contact.pipeline_stage))
    .map((contact) => ({ contact, delta: daysUntilBirthday(contact.birthday) }))
    .filter((entry): entry is { contact: ContactRow; delta: number } => entry.delta !== null && entry.delta >= 0 && entry.delta <= BIRTHDAY_WINDOW_DAYS)
    .sort((left, right) => left.delta - right.delta)[0]

  if (birthdayContact) {
    const { contact, delta } = birthdayContact
    const dayLabel =
      delta === 0
        ? input.locale === 'tr' ? 'bugün' : 'today'
        : delta === 1
          ? input.locale === 'tr' ? 'yarın' : 'tomorrow'
          : input.locale === 'tr' ? `${delta} gün sonra` : `in ${delta} days`

    insights.push({
      id: `birthday-${contact.id}`,
      type: 'birthday_soon',
      title:
        input.locale === 'tr'
          ? `${contact.full_name} için doğum günü fırsatı`
          : `Birthday opportunity for ${contact.full_name}`,
      description:
        input.locale === 'tr'
          ? `Doğum günü ${dayLabel}. Sıcak bir dokunuş, ilişkinizi tazeler.`
          : `Birthday is ${dayLabel}. A warm touch refreshes the relationship.`,
      actionLabel: input.locale === 'tr' ? 'Kutlama mesajı üret' : 'Generate birthday message',
      prompt:
        input.locale === 'tr'
          ? `${contact.full_name} için sıcak ve kısa bir doğum günü mesajı üret. Ek satış veya davet içeriği ekleme, sadece içten bir kutlama olsun.`
          : `Draft a warm and short birthday message for ${contact.full_name}. No upsell or invitation — just a genuine greeting.`,
      route: `/ai?audience=${contact.pipeline_stage === 'became_member' ? 'team' : contact.pipeline_stage === 'became_customer' ? 'customer' : 'prospect'}&contact=${contact.id}&category=birthday`,
    })
  }

  const dormantContact = [...input.contacts]
    .filter((contact) => ['interested', 'invited', 'presentation_sent', 'presentation_done', 'followup_pending', 'nurture_later'].includes(contact.pipeline_stage))
    .map((contact) => ({ contact, since: daysSinceContact(contact.last_contact_date) }))
    .filter((entry): entry is { contact: ContactRow; since: number } => entry.since !== null && entry.since >= DORMANT_THRESHOLD_DAYS)
    .sort((left, right) => right.since - left.since)[0]

  if (dormantContact) {
    const { contact, since } = dormantContact
    insights.push({
      id: `dormant-${contact.id}`,
      type: 'dormant_reconnect',
      title:
        input.locale === 'tr'
          ? `${contact.full_name} ile bağ yeniden kurulmalı`
          : `Reconnect with ${contact.full_name}`,
      description:
        input.locale === 'tr'
          ? `Son temas ${since} gün önce. Kısa bir tekrar-temas ile huniye geri çekilebilir.`
          : `Last contact ${since} days ago. A short reconnect message can pull them back into the funnel.`,
      actionLabel: input.locale === 'tr' ? 'Yeniden bağlan mesajı üret' : 'Draft reconnect message',
      prompt:
        input.locale === 'tr'
          ? `${contact.full_name} ile ${since} gündür konuşulmamış. Baskı kurmadan, sıcak ve kısa bir yeniden-bağlanma mesajı hazırla. Aşama: ${getStageLabel(contact.pipeline_stage, input.locale)}.`
          : `It has been ${since} days since ${contact.full_name} was contacted. Draft a warm, low-pressure reconnect message. Stage: ${getStageLabel(contact.pipeline_stage, input.locale)}.`,
      route: `/ai?audience=prospect&contact=${contact.id}&category=reactivation`,
    })
  }

  const fallbackInsights: CoachInsight[] = [
    {
      id: 'pipeline-focus',
      type: 'next_action',
      title: input.locale === 'tr' ? 'Huniyi bugün hızlandır' : 'Accelerate the pipeline today',
      description:
        input.locale === 'tr'
          ? 'Takip bekleyen ve sunum gönderilen aşamaları tarayıp günlük öncelik listesini çıkar.'
          : 'Scan follow-up and presentation stages and extract the strongest priorities for today.',
      actionLabel: input.locale === 'tr' ? 'Huniyi aç' : 'Open pipeline',
      prompt:
        input.locale === 'tr'
          ? 'Mevcut huniye göre bugün odaklanmam gereken 3 potansiyeli ve nedenlerini yaz.'
          : 'Based on the current pipeline, tell me the top three prospects I should focus on today and why.',
      route: '/pipeline',
    },
    {
      id: 'task-focus',
      type: 'next_action',
      title: input.locale === 'tr' ? 'Bugünün görev ritmini kur' : 'Set today’s task rhythm',
      description:
        input.locale === 'tr'
          ? 'Gecikmiş ve öncelikli takipleri tek ekranda görüp net bir uygulama sırası çıkar.'
          : 'Review overdue and high-priority follow-ups in one place and create a practical execution order.',
      actionLabel: input.locale === 'tr' ? 'Görevleri aç' : 'Open tasks',
      prompt:
        input.locale === 'tr'
          ? 'Bugünkü görevlerimi önceliklendir. En yüksek etkiyi yaratacak sıra ve odağı öner.'
          : 'Prioritize my tasks for today. Suggest the execution order that will create the most impact.',
      route: '/tasks',
    },
    {
      id: 'new-growth',
      type: 'next_action',
      title: input.locale === 'tr' ? 'Yeni potansiyel akışını besle' : 'Feed the new prospect flow',
      description:
        input.locale === 'tr'
          ? 'Bugün huniye taze giriş eklemek için hızlı bir potansiyel yakalama ve mesaj planı kur.'
          : 'Set up a quick prospect-capture and outreach plan to add fresh opportunities to the funnel today.',
      actionLabel: input.locale === 'tr' ? 'Potansiyel ekle' : 'Add prospect',
      prompt:
        input.locale === 'tr'
          ? 'Bugün yeni potansiyel kazanmak için kullanabileceğim kısa bir mesaj ve aksiyon planı hazırla.'
          : 'Prepare a short message and action plan I can use to win new prospects today.',
      route: '/contacts?segment=prospects&new=1',
    },
  ]

  for (const fallback of fallbackInsights) {
    if (insights.length >= MAX_INSIGHTS) break
    if (!insights.some((item) => item.id === fallback.id)) {
      insights.push(fallback)
    }
  }

  return insights.slice(0, MAX_INSIGHTS)
}

export function deriveNotifications(
  contacts: ContactRow[],
  tasks: TaskRow[],
  orders: OrderRow[],
  currentUser: User | null,
  locale: 'tr' | 'en',
): Notification[] {
  if (!currentUser) return []

  const contactsById = new Map(contacts.map((contact) => [contact.id, contact]))
  const notifications: Notification[] = []

  const overdueTask = tasks
    .filter((task) => task.status === 'overdue')
    .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime())[0]

  if (overdueTask) {
    const contact = overdueTask.contact_id ? contactsById.get(overdueTask.contact_id) : null
    notifications.push({
      id: `task-${overdueTask.id}`,
      userId: currentUser.id,
      type: 'follow_up_due',
      title: locale === 'tr' ? 'Gecikmiş görev' : 'Overdue task',
      message:
        locale === 'tr'
          ? `${overdueTask.title}${contact ? ` · ${contact.full_name}` : ''}. Bugun temizlemek iyi olur.`
          : `${overdueTask.title}${contact ? ` · ${contact.full_name}` : ''}. Worth clearing today.`,
      actionUrl: overdueTask.contact_id ? `/contacts?contact=${overdueTask.contact_id}` : '/tasks',
      isRead: false,
      priority: 'high',
      createdAt: overdueTask.created_at,
    })
  }

  const dueFollowUp = contacts
    .filter((contact) => {
      const delta = daysFromToday(contact.next_follow_up_date)
      return delta !== null && delta <= 0 && !['lost', 'dormant'].includes(contact.pipeline_stage)
    })
    .sort((left, right) => {
      const leftDelta = daysFromToday(left.next_follow_up_date) ?? 999
      const rightDelta = daysFromToday(right.next_follow_up_date) ?? 999
      return leftDelta - rightDelta
    })[0]

  if (dueFollowUp) {
    notifications.push({
      id: `followup-${dueFollowUp.id}`,
      userId: currentUser.id,
      type: 'follow_up_due',
      title: locale === 'tr' ? 'Takip zamanı' : 'Follow-up due',
      message:
        locale === 'tr'
          ? `${dueFollowUp.full_name} için takip tarihi geldi. Huni aşaması: ${getStageLabel(dueFollowUp.pipeline_stage, locale)}.`
          : `${dueFollowUp.full_name} is due for follow-up. Stage: ${getStageLabel(dueFollowUp.pipeline_stage, locale)}.`,
      actionUrl: `/contacts?contact=${dueFollowUp.id}`,
      isRead: false,
      priority: 'high',
      createdAt: dueFollowUp.created_at,
    })
  }

  const reorderDue = orders
    .filter((order) => order.status !== 'cancelled' && Boolean(order.next_reorder_date) && (daysFromToday(order.next_reorder_date) ?? 999) <= 0)
    .sort((left, right) => new Date(left.order_date).getTime() - new Date(right.order_date).getTime())[0]

  if (reorderDue) {
    const contact = contactsById.get(reorderDue.contact_id)
    notifications.push({
      id: `reorder-${reorderDue.id}`,
      userId: currentUser.id,
      type: 'ai_suggestion',
      title: locale === 'tr' ? 'Yeniden sipariş fırsatı' : 'Reorder opportunity',
      message:
        locale === 'tr'
          ? `${contact?.full_name ?? 'Müşteri'} için yeniden sipariş penceresi açıldı.`
          : `The reorder window is open for ${contact?.full_name ?? 'this customer'}.`,
      actionUrl: '/customers',
      isRead: false,
      priority: 'medium',
      createdAt: reorderDue.created_at,
    })
  }

  const teamRisk = contacts
    .filter((contact) => contact.pipeline_stage === 'became_member')
    .find((contact) => {
      const memberTasks = tasks.filter((task) => task.contact_id === contact.id && ACTIVE_TASK_STATUSES.includes(task.status))
      return memberTasks.some((task) => task.status === 'overdue')
    })

  if (teamRisk) {
    notifications.push({
      id: `team-${teamRisk.id}`,
      userId: currentUser.id,
      type: 'team_alert',
      title: locale === 'tr' ? 'Ekip üyesi desteğe ihtiyaç duyuyor' : 'Team member needs support',
      message:
        locale === 'tr'
          ? `${teamRisk.full_name} için bekleyen koçluk veya takip görevleri var.`
          : `${teamRisk.full_name} has pending coaching or follow-up work.`,
      actionUrl: `/contacts?contact=${teamRisk.id}`,
      isRead: false,
      priority: 'medium',
      createdAt: teamRisk.created_at,
    })
  }

  return notifications.slice(0, 5)
}
