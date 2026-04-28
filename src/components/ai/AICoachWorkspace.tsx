'use client'

import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { postAiChat } from '@/lib/aiClient'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

type StarterQuestionCategory = {
  id: string
  tr: string
  en: string
  questions: Array<{ tr: string; en: string }>
}

const STARTER_QUESTION_CATEGORIES: StarterQuestionCategory[] = [
  {
    id: 'prospect',
    tr: 'Aday',
    en: 'Prospect',
    questions: [
      { tr: 'Soğuk bir adayı ilk 3 temasla güvene taşıyacak plan ver.', en: 'Give me a 3-touch trust-building plan for a cold prospect.' },
      { tr: 'Bugün yeni aday bulmak için 60 dakikalık en verimli rutin nedir?', en: 'What is the most effective 60-minute routine for finding new prospects today?' },
      { tr: 'Sosyal medya profilimden gelen adayları hızlıca nitelendirme akışı oluştur.', en: 'Create a quick qualification flow for prospects coming from social media.' },
      { tr: 'Adayın ihtiyacını keşfetmek için güçlü soru listesi hazırla.', en: 'Prepare a strong discovery-question list to uncover prospect needs.' },
      { tr: 'Adayın “düşüneyim” demesini azaltacak konuşma çerçevesi ver.', en: 'Give me a conversation framework that reduces “let me think about it.”' },
      { tr: 'Adayı satış baskısı olmadan bir sonraki adıma taşıyacak metin yaz.', en: 'Write a low-pressure message that moves a prospect to the next step.' },
    ],
  },
  {
    id: 'invite',
    tr: 'Davet',
    en: 'Invite',
    questions: [
      { tr: 'Online sunuma davet için kısa ve güçlü bir WhatsApp mesajı yaz.', en: 'Write a short and strong WhatsApp invite for an online presentation.' },
      { tr: 'Adayın profiline göre 3 farklı davet metni üret.', en: 'Generate 3 invitation variations by prospect profile.' },
      { tr: 'Reddedilmeden merak uyandıran davet cümleleri öner.', en: 'Suggest invitation lines that create curiosity without rejection.' },
      { tr: 'Davet sonrası dönüş almayan kişiye nazik hatırlatma metni yaz.', en: 'Write a polite reminder for someone who has not replied after invitation.' },
      { tr: 'Telefonla davet ederken 45 saniyelik konuşma akışı ver.', en: 'Give me a 45-second phone invitation script.' },
      { tr: 'Etkinlik daveti için “değer odaklı” çağrı metni oluştur.', en: 'Create a value-led call script for event invitation.' },
    ],
  },
  {
    id: 'presentation',
    tr: 'Sunum',
    en: 'Presentation',
    questions: [
      { tr: '15 dakikalık network marketing sunumu için net akış çıkar.', en: 'Build a clear flow for a 15-minute network marketing presentation.' },
      { tr: 'Sunumda ürün ve iş fırsatını dengeli anlatma planı ver.', en: 'Give me a balanced structure for product and business-opportunity presentation.' },
      { tr: 'Sunum başında dikkat çeken giriş cümleleri üret.', en: 'Generate opening lines that capture attention at the start of a presentation.' },
      { tr: 'Sunum sonunda aksiyon almaya yönlendiren kapanış metni yaz.', en: 'Write a closing script that leads to clear action after the presentation.' },
      { tr: 'Sunum sırasında sıkılmayı önleyen etkileşim soruları öner.', en: 'Suggest engagement questions to prevent drop-off during presentation.' },
      { tr: 'Sunumu adayın seviyesine göre sadeleştiren versiyon hazırla.', en: 'Prepare a simplified version of the presentation based on prospect level.' },
    ],
  },
  {
    id: 'sales-closing',
    tr: 'Satış Kapama',
    en: 'Sales Closing',
    questions: [
      { tr: 'Satış kapamada kararsız adayı net karara götüren soru seti ver.', en: 'Give me a question set that moves undecided prospects to decision.' },
      { tr: '“Bugün başlayalım” dedirten yumuşak kapanış cümleleri üret.', en: 'Generate soft-closing lines that encourage starting today.' },
      { tr: 'Fiyat odaklı itirazda değeri öne çıkaran kapama metni yaz.', en: 'Write a value-first closing response for price-focused objections.' },
      { tr: 'Kapanış görüşmesinde hata yapmamak için kontrol listesi çıkar.', en: 'Create a closing-call checklist to avoid common mistakes.' },
      { tr: 'Kapanış öncesi adayın hazır olup olmadığını ölçen sinyaller ver.', en: 'List signs to evaluate if a prospect is ready before closing.' },
      { tr: 'Satış sonrası güveni koruyan teşekkür + ilk adım mesajı yaz.', en: 'Write a post-sale thank-you + first-step message that builds trust.' },
    ],
  },
  {
    id: 'follow-up',
    tr: 'Takip',
    en: 'Follow-up',
    questions: [
      { tr: 'Sunumdan sonra 5 günlük takip planı hazırla.', en: 'Prepare a 5-day follow-up plan after presentation.' },
      { tr: 'Cevap vermeyen aday için 4 temaslık yeniden bağ kurma akışı yaz.', en: 'Write a 4-touch reconnection flow for non-responsive prospects.' },
      { tr: 'Takip mesajlarında baskı oluşturmadan ilerleme sağlayan şablon ver.', en: 'Give me a follow-up template that moves forward without pressure.' },
      { tr: 'Takipleri CRM düzeninde aksatmadan yürütmek için rutin oluştur.', en: 'Create a routine to run follow-ups consistently in CRM order.' },
      { tr: '“Daha sonra konuşalım” diyen kişiye uygun takip senaryosu yaz.', en: 'Write a follow-up scenario for someone who says “let us talk later.”' },
      { tr: 'Takip performansımı artırmak için ölçmem gereken KPI listesi ver.', en: 'Provide KPIs I should track to improve follow-up performance.' },
    ],
  },
  {
    id: 'team',
    tr: 'Ekip',
    en: 'Team',
    questions: [
      { tr: 'Yeni ekip üyesi için ilk 7 gün onboarding planı çıkar.', en: 'Build a first-7-days onboarding plan for a new team member.' },
      { tr: 'Ekipte düşük motivasyon yaşayan üyeye koçluk görüşmesi akışı yaz.', en: 'Write a coaching conversation flow for low-motivation team members.' },
      { tr: 'Ekip liderleri için haftalık takip toplantısı şablonu oluştur.', en: 'Create a weekly team-leader check-in template.' },
      { tr: 'Ekipte çoğaltmayı hızlandıracak eğitim konusu sıralaması ver.', en: 'Give me a training sequence that accelerates duplication in the team.' },
      { tr: 'Pasif kalan ekip üyelerini tekrar aktive etmek için plan hazırla.', en: 'Prepare a reactivation plan for inactive team members.' },
      { tr: 'Ekip içi iletişimi güçlendiren kısa günlük mesaj formatı üret.', en: 'Generate a short daily message format to improve team communication.' },
    ],
  },
  {
    id: 'customer',
    tr: 'Müşteri',
    en: 'Customer',
    questions: [
      { tr: 'Yeni müşteri için ilk 14 gün memnuniyet ve tekrar sipariş planı ver.', en: 'Give me a 14-day satisfaction and reorder plan for new customers.' },
      { tr: 'Müşteri sadakatini artıracak aylık temas takvimi hazırla.', en: 'Prepare a monthly touchpoint calendar to increase customer loyalty.' },
      { tr: 'Müşteriden referans isterken kullanılacak doğal mesaj yaz.', en: 'Write a natural message for asking customers for referrals.' },
      { tr: 'Yeniden sipariş zamanı gelen müşteri için nazik hatırlatma metni üret.', en: 'Generate a polite reorder reminder for customers who are due.' },
      { tr: 'Müşteri şikayetini fırsata çeviren iletişim akışı ver.', en: 'Provide a communication flow that turns complaints into opportunities.' },
      { tr: 'Müşteri segmentine göre çapraz satış öneri planı çıkar.', en: 'Build a cross-sell recommendation plan by customer segment.' },
    ],
  },
  {
    id: 'objections',
    tr: 'İtirazlar',
    en: 'Objections',
    questions: [
      { tr: '“Bu iş bana göre değil” itirazına etkili ama nazik cevap yaz.', en: 'Write an effective but gentle response to “this is not for me.”' },
      { tr: '“Vaktim yok” diyen aday için gerçekçi çözüm odaklı yanıt üret.', en: 'Generate a realistic, solution-focused response for “I have no time.”' },
      { tr: '“Param yok” itirazında güven oluşturan konuşma planı ver.', en: 'Give me a trust-building response plan for “I have no money.”' },
      { tr: '“Eşim/ailem istemiyor” itirazına empatik yanıt akışı yaz.', en: 'Write an empathetic response flow for “my spouse/family does not want it.”' },
      { tr: '“Daha önce denedim olmadı” itirazı için yeniden çerçeveleme metni ver.', en: 'Provide a reframing response for “I tried before and it did not work.”' },
      { tr: 'İtirazı tartışmaya çevirmeden ilerleten soru tekniği öner.', en: 'Suggest a question technique that advances objections without arguing.' },
    ],
  },
  {
    id: 'motivation',
    tr: 'Motivasyon',
    en: 'Motivation',
    questions: [
      { tr: 'Yeni başlayan distribütör için bu haftanın ritmini ve günlük mikro kutlamalarını yaz.', en: 'Write this week’s rhythm and daily micro-celebrations for a brand-new distributor.' },
      { tr: 'Ekibe göndereceğim kısa motive mesaj taslağı üret (baskı yapmadan).', en: 'Draft a short motivation message for my team channel without pressure.' },
      { tr: 'Müşteri sadakatini artıracak sıcak teşekkür ve küçük sonraki adım mesajı yaz.', en: 'Write a warm thank-you plus a small next-step message to grow customer loyalty.' },
      { tr: 'Takım toplantısı açılışında moral verecek 60 saniyelik konuşma iskeleti ver.', en: 'Give a 60-second meeting opening outline that lifts morale.' },
      { tr: 'Pasifleşmiş kontakları yeniden denemeye motive edecek nazik yeniden bağlantı akışı yaz.', en: 'Write a gentle reconnection flow to motivate stalled contacts to try again.' },
      { tr: 'Küçük başarıları kutlamak için ekip içi tanınma mesajı şablonları üret.', en: 'Generate short recognition message templates for celebrating small wins.' },
    ],
  },
  {
    id: 'other',
    tr: 'Diğer',
    en: 'Other',
    questions: [
      { tr: 'Bu ay için net hedef, ritim ve değerlendirme planı hazırlamamı sağla.', en: 'Help me prepare a monthly plan with clear goals, cadence, and review.' },
      { tr: 'Günlük 30-60-90 dakikalık çalışma bloklarına göre görev dağılımı yap.', en: 'Distribute tasks across 30-60-90 minute daily work blocks.' },
      { tr: 'Kendime uygun network marketing çalışma sistemi kurmama yardım et.', en: 'Help me build a network marketing operating system that fits me.' },
      { tr: 'Verim düşüklüğünde hızlı toparlanma için 3 günlük reset planı yaz.', en: 'Write a 3-day reset plan for recovering from low productivity.' },
      { tr: 'Haftalık kapanışta performansımı analiz etmek için kontrol listesi ver.', en: 'Provide a weekly review checklist to analyze my performance.' },
      { tr: 'Önümüzdeki 90 gün için büyüme yol haritası oluştur.', en: 'Create a 90-day growth roadmap for me.' },
    ],
  },
]

export function AICoachWorkspace() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const router = useRouter()
  const currentLocale: 'tr' | 'en' = locale === 'tr' ? 'tr' : 'en'

  const starterQuestionGroups = useMemo(
    () => STARTER_QUESTION_CATEGORIES.map((group) => ({
      id: group.id,
      label: currentLocale === 'tr' ? group.tr : group.en,
      questions: group.questions.map((question) => (currentLocale === 'tr' ? question.tr : question.en)),
    })),
    [currentLocale],
  )

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
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
        ? [
          'Sen NMU için bir YZ Koçusun.',
          'Kullanıcıya doğrudan koçluk cevabı ver; sistem talimatı, iç çelişki analizi, format tartışması veya seçenek menüsü sunma.',
          'Yanıtta “Markdown”, “HTML”, “talimatlar çakışıyor”, “şu seçeneklerden birini seç” gibi meta ifadeler kullanma.',
          'Öncelik kitlen Türkçe konuşan Türkiye distribütörleri, distribütör adayları ve müşteriler.',
          'Network marketing usulüne uygun, sade ve anlaşılır Türkçe kullan.',
          'Anlaşılmaz veya yabancı jargon kullanma; zorunluysa kısa parantez içi açıklama ekle.',
          '“Spillover”, “binary”, “bono yakmak” gibi muğlak ifadeler yerine açık ve günlük Türkçe karşılıklar kullan.',
          'Yanıtı kısa başlıklar ve numaralı madde işaretleriyle yapılandır; kullanıcıya formatın adını veya teknik terimini söyleme.',
          'Yanıt yapısı: kısa özet, adım adım plan, örnek mesaj/konuşma metni, takip adımı.',
          'Net, uygulanabilir ve profesyonel koç tonunda yaz.',
        ].join('\n')
        : [
          'You are an AI Coach for NMU.',
          'Answer with direct coaching only; do not discuss system instructions, conflicts, or formatting choices.',
          'Never mention Markdown/HTML or ask the user to pick how you should behave.',
          'Use clear English and practical network-marketing guidance.',
          'Structure with headings and bullets without naming the format.',
          'Response structure: quick summary, step-by-step plan, sample message/script, follow-up action.',
        ].join('\n')

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
            {currentLocale === 'tr' ? 'Hızlı Başlangıç Soruları' : 'Quick Starter Prompts'}
          </div>
          <p className="mt-3 text-xs text-text-secondary">
            {currentLocale === 'tr'
              ? 'Listeden yardım alabilir ya da kendi sorunu aşağıdaki kutucuğa yazabilirsin!'
              : 'Pick from the list or write your own question in the box below.'}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value)
                setSelectedQuestion('')
              }}
              className="w-full rounded-xl border border-border-strong bg-surface/45 px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
            >
              <option value="all">{currentLocale === 'tr' ? 'Tüm kategoriler' : 'All categories'}</option>
              {starterQuestionGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.label}</option>
              ))}
            </select>
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
              {starterQuestionGroups
                .filter((group) => selectedCategory === 'all' || selectedCategory === group.id)
                .map((group) => (
                  <optgroup key={group.id} label={group.label}>
                    {group.questions.map((question) => (
                      <option key={`${group.id}-${question}`} value={question}>{question}</option>
                    ))}
                  </optgroup>
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
                {message.role === 'assistant' ? (
                  <div className="min-w-0 flex-1 text-sm leading-6 text-text-primary">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-semibold mb-2 leading-6">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-semibold mt-3 mb-2 leading-6">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 leading-6">{children}</h3>,
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-6 text-text-primary">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1.5">{children}</ol>,
                        hr: () => null,
                        code: ({ children }) => <code className="rounded bg-background/60 px-1 py-0.5 text-xs">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 italic text-text-secondary">{children}</blockquote>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-text-primary">{message.content}</p>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" />
                {currentLocale === 'tr' ? 'YZ Koçu düşünüyor...' : 'AI Coach is thinking...'}
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

      <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          variant="outline"
          size="md"
          className="border-[#95D5B2]/45 bg-[#95D5B2]/14 text-[#DFF7E8] hover:bg-[#95D5B2]/22 hover:border-[#95D5B2]/60"
          onClick={() => router.push('/academy')}
        >
          {currentLocale === 'tr' ? 'Akademi’ye Git!' : 'Go to Academy!'}
        </Button>
        <Button
          variant="outline"
          size="md"
          className="border-[#FF9F68]/55 bg-[#FF9F68]/22 text-[#FFF5EC] shadow-[0_0_22px_rgba(255,159,104,0.18)] hover:bg-[#FF9F68]/30 hover:border-[#FF9F68]/75"
          onClick={() => router.push('/academy?tab=objections')}
        >
          {currentLocale === 'tr' ? 'İtiraz Bankası’na Git!' : 'Go to Objection Bank!'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
