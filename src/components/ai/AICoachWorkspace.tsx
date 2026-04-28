'use client'

import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { postAiChat } from '@/lib/aiClient'
import { Bot, Lightbulb, Send, Sparkles, User } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function AICoachWorkspace() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const currentLocale: 'tr' | 'en' = locale === 'tr' ? 'tr' : 'en'

  const starterQuestions = useMemo(() => {
    const questions = [
      {
        tr: 'Bu hafta için günlük 60 dakikalık en yüksek etkili çalışma planımı çıkar.',
        en: 'Build my highest-impact 60-minute daily execution plan for this week.',
      },
      {
        tr: 'Sıcak adayları 48 saat içinde karar aşamasına taşıyacak takip akışı ver.',
        en: 'Give me a follow-up sequence to move hot prospects to decision within 48 hours.',
      },
      {
        tr: 'Soğuk adayları yeniden ısıtmak için 7 günlük mesaj ve temas planı oluştur.',
        en: 'Create a 7-day reactivation plan for cold prospects with messages and touchpoints.',
      },
      {
        tr: 'İtirazları azaltmak için ilk görüşmede kullanacağım soru setini hazırla.',
        en: 'Prepare a first-call question set to reduce objections early.',
      },
      {
        tr: '“Vaktim yok” itirazına karşı 3 farklı kısa cevap yaz.',
        en: 'Write 3 short responses for the “I have no time” objection.',
      },
      {
        tr: '“Para yok” itirazına karşı güven veren bir konuşma akışı ver.',
        en: 'Give me a trust-building response flow for the “I have no money” objection.',
      },
      {
        tr: 'Yeni ekip üyesi için ilk 7 gün onboarding kontrol listesi çıkar.',
        en: 'Create a first-7-days onboarding checklist for a new team member.',
      },
      {
        tr: 'Ekipte düşük motivasyon yaşayan üyeyi toparlamak için koçluk planı yaz.',
        en: 'Write a coaching plan for a team member with low motivation.',
      },
      {
        tr: 'Ekip liderleri için haftalık kontrol toplantısı gündemi oluştur.',
        en: 'Create a weekly check-in agenda for team leaders.',
      },
      {
        tr: 'Günlük, haftalık ve aylık KPI hedeflerimi role göre belirle.',
        en: 'Define daily, weekly, and monthly KPI targets by role.',
      },
      {
        tr: 'Takipleri aksatmadan iş-özel hayat dengesini korumak için sistem kur.',
        en: 'Design a system to protect work-life balance without missing follow-ups.',
      },
      {
        tr: 'Toplantıdan sonra dönüş oranını artıran 3 mesaj şablonu üret.',
        en: 'Generate 3 follow-up templates that increase post-meeting conversion.',
      },
      {
        tr: 'İlk temas mesajını daha doğal ve satış baskısı olmadan yeniden yaz.',
        en: 'Rewrite my first outreach message to feel natural and non-pushy.',
      },
      {
        tr: 'Müşteriden ekip üyesine geçiş için etik ve etkili konuşma planı ver.',
        en: 'Give me an ethical and effective transition script from customer to team member.',
      },
      {
        tr: 'Etkinlik daveti için davet, hatırlatma ve teyit mesajlarını hazırla.',
        en: 'Prepare invite, reminder, and confirmation messages for an event.',
      },
      {
        tr: 'Etkinlik sonrası 5 günlük takip planı ile dönüşümü artır.',
        en: 'Increase conversion with a 5-day post-event follow-up plan.',
      },
      {
        tr: 'Sosyal medyadan gelen sıcak leadleri hızlıca nitelendirme akışı ver.',
        en: 'Give me a quick qualification flow for hot leads from social media.',
      },
      {
        tr: 'Verimsiz görüşmeleri azaltmak için ön eleme soruları üret.',
        en: 'Produce pre-qualification questions to reduce low-quality meetings.',
      },
      {
        tr: 'Bu ay ekip hacmini artırmak için 3 odak alanı ve ölçüm planı ver.',
        en: 'Give me 3 focus areas and a tracking plan to grow team volume this month.',
      },
      {
        tr: 'Haftalık kapanışta kendimi değerlendirmek için koçluk soruları hazırla.',
        en: 'Prepare coaching reflection questions for my weekly review.',
      },
    ]
    return questions.map((entry) => (currentLocale === 'tr' ? entry.tr : entry.en))
  }, [currentLocale])

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function sendMessage(text: string) {
    const cleanText = text.trim()
    if (!cleanText || isSending) return

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: cleanText }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setPrompt('')
    setError('')
    setIsSending(true)

    try {
      const systemPrompt = currentLocale === 'tr'
        ? 'Sen NMU için bir YZ Koçusun. Cevapların kısa, uygulanabilir ve network marketing odaklı olsun. Gerekirse adım adım eylem planı, mesaj taslağı ve takip adımı ver.'
        : 'You are an AI Coach for NMU. Keep answers practical and concise. Focus on network marketing execution with concrete next steps.'

      const payload = [
        { role: 'user' as const, content: systemPrompt },
        ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
      ]
      const response = await postAiChat(payload)
      if (!response.ok) throw new Error(currentLocale === 'tr' ? 'YZ yanıtı alınamadı.' : 'Could not get AI response.')
      const assistantText = (await response.text()).trim()
      if (!assistantText) throw new Error(currentLocale === 'tr' ? 'Boş yanıt döndü.' : 'Empty response.')

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: assistantText },
      ])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : (currentLocale === 'tr' ? 'Bir hata oluştu.' : 'Something went wrong.'))
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(prompt)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">{h(currentLocale === 'tr' ? 'YZ Koçu' : 'AI Coach')}</h1>
        <p className="text-sm text-text-secondary">
          {currentLocale === 'tr'
            ? 'İşini büyütmek için dilediğini sor, net bir plan al!'
            : 'Ask anything and get a practical action plan. This space coaches your full network marketing flow.'}
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/12 to-secondary/5">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Lightbulb className="h-4 w-4 text-primary" />
            {currentLocale === 'tr' ? 'Hızlı başlangıç soruları' : 'Quick starter prompts'}
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            {currentLocale === 'tr'
              ? 'Listeden yardım alabilir ya da kendi sorunu aşağıdaki kutucuğa yazabilirsin!'
              : 'Pick from the list or write your own question in the box below.'}
          </p>
          <div className="mt-2">
            <select
              value={selectedQuestion}
              onChange={(event) => {
                const nextValue = event.target.value
                setSelectedQuestion(nextValue)
                if (nextValue) setPrompt(nextValue)
              }}
              className="w-full rounded-xl border border-border-strong bg-surface/45 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            >
              <option value="">
                {currentLocale === 'tr' ? 'Bir soru seç...' : 'Select a starter question...'}
              </option>
              {starterQuestions.map((question) => (
                <option key={question} value={question}>{question}</option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-0 overflow-hidden">
          <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4 sm:p-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 rounded-2xl border px-3.5 py-3',
                  message.role === 'assistant'
                    ? 'border-primary/20 bg-primary/6'
                    : 'border-border-subtle bg-surface/45',
                )}
              >
                <div className="mt-0.5">
                  {message.role === 'assistant'
                    ? <Bot className="h-4 w-4 text-primary" />
                    : <User className="h-4 w-4 text-text-secondary" />}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-text-primary">{message.content}</p>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                {currentLocale === 'tr' ? 'YZ Koç düşünüyor...' : 'AI Coach is thinking...'}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-4 sm:p-5">
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={8}
                className="min-h-[180px]"
                placeholder={currentLocale === 'tr'
                  ? 'Örnek: Bu hafta ekip, kontaklar, görevler ve etkinliklerim için tek bir çalışma planı ver.'
                  : 'Example: Build one execution plan for my team, contacts, tasks, and events this week.'}
              />
              {error && <p className="text-xs text-error">{error}</p>}
              <div className="flex items-center justify-end">
                <Button type="submit" size="sm" icon={<Send className="h-3.5 w-3.5" />} loading={isSending}>
                  {currentLocale === 'tr' ? 'Koça Sor' : 'Ask Coach'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  )
}
