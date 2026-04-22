'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { usePersistentState } from '@/hooks/usePersistentState'
import { queueAIMessageDraftPreset } from '@/lib/clientStorage'
import { fetchContacts } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import { Crown, Sparkles, Users, ShoppingBag, Target, NotebookPen, Send } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

type PersonNote = {
  contactId: string
  note: string
  updatedAt: string
}

export default function LeaderPage() {
  const { locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const { currentUser } = useAppStore()
  const router = useRouter()
  const [selectedContactId, setSelectedContactId] = useState<string>('self')
  const [draftNote, setDraftNote] = useState('')
  const [savedNotes, setSavedNotes] = usePersistentState<PersonNote[]>('nmu-leader-person-notes', [], { version: 1 })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null
  const selectedPersonName = selectedContact?.full_name ?? (currentUser?.name || 'Leader')

  const noteMap = useMemo(() => new Map(savedNotes.map((entry) => [entry.contactId, entry])), [savedNotes])
  const selectedSavedNote = selectedContact ? noteMap.get(selectedContact.id)?.note ?? '' : ''

  function saveNote() {
    if (!selectedContact || !draftNote.trim()) return
    const next: PersonNote = {
      contactId: selectedContact.id,
      note: draftNote.trim(),
      updatedAt: new Date().toISOString(),
    }
    setSavedNotes((prev) => [next, ...prev.filter((item) => item.contactId !== selectedContact.id)])
    setDraftNote('')
  }

  function openAiForPerson() {
    const context = selectedContact
      ? [
          `Kişi: ${selectedContact.full_name}`,
          selectedContact.profession ? `Meslek: ${selectedContact.profession}` : '',
          selectedContact.location ? `Lokasyon: ${selectedContact.location}` : '',
          selectedContact.interests ? `İlgi alanları: ${selectedContact.interests}` : '',
          selectedContact.pain_points ? `Sıkıntılar: ${selectedContact.pain_points}` : '',
          selectedSavedNote ? `Lider Notu: ${selectedSavedNote}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : currentLocale === 'tr'
        ? 'Lider için genel ekip iletişim mesajı üret.'
        : 'Generate a general team communication message for the leader.'

    queueAIMessageDraftPreset({
      category: 'follow_up',
      tone: 'friendly',
      extraContext: context,
    })
    router.push('/ai')
  }

  const totalCustomers = contacts.filter((contact) => contact.pipeline_stage === 'became_customer').length
  const totalTeam = contacts.filter((contact) => contact.pipeline_stage === 'became_member').length

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px] mx-auto">
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {currentLocale === 'tr' ? 'Lider Kontrol Merkezi' : 'Leader Control Center'}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-text-primary flex items-center gap-2">
              <Crown className="w-6 h-6 text-warning" />
              {currentUser?.name ?? 'Suat Tayfun TOPAK'}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {currentLocale === 'tr'
                ? 'Notlarını yönet, AI ile mesaj üret ve ekip operasyonunu tek panelden yönet.'
                : 'Manage notes, generate AI messages, and run your team operation from one panel.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" icon={<Users className="w-4 h-4" />} onClick={() => router.push('/contacts')}>
              {currentLocale === 'tr' ? 'Kontaklar' : 'Contacts'}
            </Button>
            <Button size="sm" variant="outline" icon={<ShoppingBag className="w-4 h-4" />} onClick={() => router.push('/customers')}>
              {currentLocale === 'tr' ? 'Müşteriler' : 'Customers'}
            </Button>
            <Button size="sm" icon={<Target className="w-4 h-4" />} onClick={() => router.push('/team')}>
              {currentLocale === 'tr' ? 'Ekip & Organizasyon' : 'Team & Organization'}
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Toplam Kontak' : 'Total Contacts'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{contacts.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Ekip Üyesi' : 'Team Members'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalTeam}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Müşteri' : 'Customers'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalCustomers}</p>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <NotebookPen className="w-4 h-4 text-primary" />
              {currentLocale === 'tr' ? 'Kişi Notları' : 'People Notes'}
            </CardTitle>
            <CardDescription>
              {currentLocale === 'tr'
                ? 'Seçtiğin kişi için lider notu tut, daha sonra AI mesaj üretiminde kullan.'
                : 'Keep leader notes per person and reuse them in AI message generation.'}
            </CardDescription>
          </CardHeader>

          <div className="space-y-3">
            <select
              value={selectedContactId}
              onChange={(event) => setSelectedContactId(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none"
            >
              <option value="self">{currentLocale === 'tr' ? 'Lider notu (genel)' : 'Leader note (general)'}</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.full_name}</option>
              ))}
            </select>

            <textarea
              value={draftNote}
              onChange={(event) => setDraftNote(event.target.value)}
              placeholder={
                currentLocale === 'tr'
                  ? `${selectedPersonName} için notlarını yaz...`
                  : `Write your notes for ${selectedPersonName}...`
              }
              className="min-h-[150px] w-full rounded-xl border border-border bg-surface p-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<NotebookPen className="w-4 h-4" />} onClick={saveNote}>
                {currentLocale === 'tr' ? 'Notu Kaydet' : 'Save Note'}
              </Button>
              <Button size="sm" variant="outline" icon={<Sparkles className="w-4 h-4" />} onClick={openAiForPerson}>
                {currentLocale === 'tr' ? 'YZ ile Mesaj Üret' : 'Generate with AI'}
              </Button>
            </div>

            {selectedSavedNote && (
              <div className="rounded-xl border border-border-subtle bg-surface/50 p-3">
                <p className="text-xs text-text-tertiary mb-1">
                  {currentLocale === 'tr' ? 'Kayıtlı Not' : 'Saved Note'}
                </p>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{selectedSavedNote}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-secondary" />
              {currentLocale === 'tr' ? 'Hızlı Lider Aksiyonları' : 'Leader Quick Actions'}
            </CardTitle>
          </CardHeader>

          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/contacts')}>
              {currentLocale === 'tr' ? 'Kontak sayfasına git ve kişi yönet' : 'Open Contacts and manage people'}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/customers')}>
              {currentLocale === 'tr' ? 'Müşteri tabanını yönet' : 'Manage customer base'}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/team')}>
              {currentLocale === 'tr' ? 'Organizasyon görünümüne dön' : 'Back to organization view'}
            </Button>
            <Button className="w-full justify-start" onClick={openAiForPerson} icon={<Sparkles className="w-4 h-4" />}>
              {currentLocale === 'tr' ? 'Seçili kişi için AI mesaj üret' : 'Generate AI message for selected person'}
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
