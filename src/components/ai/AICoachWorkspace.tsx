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

  const starterQuestions = useMemo(
    () => (currentLocale === 'tr'
      ? [
          'Bugün sıcak adaylarımı satışa yaklaştırmak için 3 adımlı plan ver.',
          'Ekibimde motivasyonu düşen üyeyi toparlamak için koçluk akışı yaz.',
          'Bu hafta görevler, takvim ve etkinlikleri tek plana dönüştür.',
          'Yeni başlayan bir üyeye 7 günlük onboarding planı çıkar.',
        ]
      : [
          'Give me a 3-step plan to move hot prospects toward a sale today.',
          'Write a coaching flow for a team member with low motivation.',
          'Turn this week tasks, calendar, and events into one action plan.',
          'Create a 7-day onboarding plan for a new team member.',
        ]),
    [currentLocale],
  )

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: currentLocale === 'tr'
        ? 'Merhaba, ben YZ Koçun. Network marketing, ekip yönetimi, süreç takibi, görevler, etkinlikler ve motivasyon konularında net, uygulanabilir öneriler verebilirim.'
        : 'Hi, I am your AI Coach. I can help with network marketing, team leadership, pipeline execution, tasks, events, and motivation with practical advice.',
    },
  ])
  const [prompt, setPrompt] = useState('')
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
        ? 'Sen NMU icin bir YZ Kocusun. Cevaplarin kisa, uygulanabilir, network marketing odakli olsun. Gerekirse adim adim eylem plani, mesaj taslagi ve takip adimi ver.'
        : 'You are an AI Coach for NMU. Keep answers practical and concise. Focus on network marketing execution with concrete next steps.'

      const payload = [
        { role: 'user' as const, content: systemPrompt },
        ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
      ]
      const response = await postAiChat(payload)
      if (!response.ok) throw new Error(currentLocale === 'tr' ? 'YZ yaniti alinamadi.' : 'Could not get AI response.')
      const assistantText = (await response.text()).trim()
      if (!assistantText) throw new Error(currentLocale === 'tr' ? 'Bos yanit dondu.' : 'Empty response.')

      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: 'assistant', content: assistantText },
      ])
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : (currentLocale === 'tr' ? 'Bir hata olustu.' : 'Something went wrong.'))
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
        <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {currentLocale === 'tr' ? 'YZ Koçu' : 'AI Coach'}
        </p>
        <h1 className="text-2xl font-bold text-text-primary">{h(currentLocale === 'tr' ? 'YZ Koçu' : 'AI Coach')}</h1>
        <p className="text-sm text-text-secondary">
          {currentLocale === 'tr'
            ? 'Sorunu yaz, net bir eylem plani al. Bu alan network marketing akisinin tamamina koçluk eder.'
            : 'Ask anything and get a practical action plan. This space coaches your full network marketing flow.'}
        </p>
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-primary/20 bg-gradient-to-br from-primary/12 to-secondary/5">
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Lightbulb className="h-4 w-4 text-primary" />
            {currentLocale === 'tr' ? 'Hizli baslangic sorulari' : 'Quick starter prompts'}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {starterQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => setPrompt(question)}
                className="rounded-full border border-border-strong bg-surface/45 px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary"
              >
                {question}
              </button>
            ))}
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
                {currentLocale === 'tr' ? 'YZ Koç dusunuyor...' : 'AI Coach is thinking...'}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border p-4 sm:p-5">
            <div className="space-y-3">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                placeholder={currentLocale === 'tr'
                  ? 'Ornek: Bu hafta ekip, kontaklar, gorevler ve etkinliklerim icin tek bir calisma plani ver.'
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
