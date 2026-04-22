'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { usePersistentState } from '@/hooks/usePersistentState'
import { queueAIMessageDraftPreset } from '@/lib/clientStorage'
import { addInteraction, deleteInteraction, fetchContacts, fetchInteractionsByContact, updateInteraction } from '@/lib/queries'
import type { ContactRow, InteractionRow } from '@/lib/queries'
import { Check, Copy, Crown, Pencil, Sparkles, Trash2, Users, ShoppingBag, Target, NotebookPen, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

type LeaderListKey = 'contacts' | 'team' | 'customers' | null
const LEADER_NOTE_PREFIX = '[LIDER_NOTU]'

export default function LeaderPage() {
  const { locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const { currentUser } = useAppStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [selectedContactId, setSelectedContactId] = useState<string>('self')
  const [draftNote, setDraftNote] = useState('')
  const [generalLeaderNote, setGeneralLeaderNote] = usePersistentState<string>('nmu-leader-general-note', '', { version: 1 })
  const [activeList, setActiveList] = useState<LeaderListKey>(null)
  const [isEditingSavedNote, setIsEditingSavedNote] = useState(false)
  const [savedNoteDraft, setSavedNoteDraft] = useState('')
  const [copiedSavedNote, setCopiedSavedNote] = useState(false)

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const isGeneralNoteSelected = selectedContactId === 'self'
  const selectedContact = contacts.find((contact) => contact.id === selectedContactId) ?? null
  const selectedPersonName = isGeneralNoteSelected ? (currentUser?.name || 'Leader') : (selectedContact?.full_name ?? 'Leader')
  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name, currentLocale === 'tr' ? 'tr' : 'en')),
    [contacts, currentLocale],
  )
  const sortedTeamMembers = useMemo(
    () => sortedContacts.filter((contact) => contact.pipeline_stage === 'became_member'),
    [sortedContacts],
  )
  const sortedCustomers = useMemo(
    () => sortedContacts.filter((contact) => contact.pipeline_stage === 'became_customer'),
    [sortedContacts],
  )

  const { data: selectedLeaderNotes = [] } = useQuery<InteractionRow[]>({
    queryKey: ['leader-contact-notes', selectedContact?.id],
    queryFn: () => fetchInteractionsByContact(selectedContact!.id),
    enabled: Boolean(selectedContact?.id),
  })

  const latestLeaderNote = useMemo(() => {
    if (isGeneralNoteSelected) return generalLeaderNote.trim()
    if (!selectedContact) return ''
    const rows = selectedLeaderNotes
      .filter((entry) => entry.type === 'note' && entry.content.startsWith(LEADER_NOTE_PREFIX))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    if (!rows.length) return ''
    return rows[0].content.replace(LEADER_NOTE_PREFIX, '').trim()
  }, [isGeneralNoteSelected, selectedContact, selectedLeaderNotes, generalLeaderNote])

  const latestLeaderNoteRow = useMemo(() => {
    const rows = selectedLeaderNotes
      .filter((entry) => entry.type === 'note' && entry.content.startsWith(LEADER_NOTE_PREFIX))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return rows[0] ?? null
  }, [selectedLeaderNotes])

  const addLeaderNoteMutation = useMutation({
    mutationFn: (payload: { contactId: string; note: string }) =>
      addInteraction(currentUser!.id, {
        contact_id: payload.contactId,
        type: 'note',
        channel: 'manual',
        content: `${LEADER_NOTE_PREFIX} ${payload.note}`,
        date: new Date().toISOString(),
      }),
    onSuccess: () => {
      if (selectedContact?.id) {
        qc.invalidateQueries({ queryKey: ['leader-contact-notes', selectedContact.id] })
      }
    },
  })

  const updateLeaderNoteMutation = useMutation({
    mutationFn: (payload: { interactionId: string; note: string }) =>
      updateInteraction(payload.interactionId, { content: `${LEADER_NOTE_PREFIX} ${payload.note}` }),
    onSuccess: () => {
      if (selectedContact?.id) {
        qc.invalidateQueries({ queryKey: ['leader-contact-notes', selectedContact.id] })
      }
    },
  })

  const deleteLeaderNoteMutation = useMutation({
    mutationFn: (interactionId: string) => deleteInteraction(interactionId),
    onSuccess: () => {
      if (selectedContact?.id) {
        qc.invalidateQueries({ queryKey: ['leader-contact-notes', selectedContact.id] })
      }
    },
  })

  function saveNote() {
    const note = draftNote.trim()
    if (!note) return
    if (isGeneralNoteSelected) {
      setGeneralLeaderNote(note)
      setDraftNote('')
      return
    }
    if (!selectedContact) return
    addLeaderNoteMutation.mutate({ contactId: selectedContact.id, note })
    setDraftNote('')
  }

  function beginEditSavedNote() {
    if (!latestLeaderNote) return
    setSavedNoteDraft(latestLeaderNote)
    setIsEditingSavedNote(true)
  }

  function saveEditedNote() {
    const note = savedNoteDraft.trim()
    if (!note) return
    if (isGeneralNoteSelected) {
      setGeneralLeaderNote(note)
      setIsEditingSavedNote(false)
      return
    }
    if (!latestLeaderNoteRow) return
    updateLeaderNoteMutation.mutate({ interactionId: latestLeaderNoteRow.id, note })
    setIsEditingSavedNote(false)
  }

  async function copySavedNote() {
    if (!latestLeaderNote) return
    await navigator.clipboard.writeText(latestLeaderNote)
    setCopiedSavedNote(true)
    window.setTimeout(() => setCopiedSavedNote(false), 1200)
  }

  function deleteSavedNote() {
    if (isGeneralNoteSelected) {
      setGeneralLeaderNote('')
      return
    }
    if (!latestLeaderNoteRow) return
    deleteLeaderNoteMutation.mutate(latestLeaderNoteRow.id)
  }

  function openAiForPerson() {
    const context = selectedContact
      ? [
          `Kişi: ${selectedContact.full_name}`,
          selectedContact.profession ? `Meslek: ${selectedContact.profession}` : '',
          selectedContact.location ? `Lokasyon: ${selectedContact.location}` : '',
          selectedContact.interests ? `İlgi alanları: ${selectedContact.interests}` : '',
          selectedContact.pain_points ? `Sıkıntılar: ${selectedContact.pain_points}` : '',
          latestLeaderNote ? `Lider Notu: ${latestLeaderNote}` : '',
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
          <Card
            hover
            className={cn(activeList === 'contacts' && 'ring-1 ring-primary/35')}
            onClick={() => setActiveList((current) => (current === 'contacts' ? null : 'contacts'))}
          >
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Toplam Kontak' : 'Total Contacts'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{contacts.length}</p>
        </Card>
        <Card
          hover
          className={cn(activeList === 'team' && 'ring-1 ring-primary/35')}
          onClick={() => setActiveList((current) => (current === 'team' ? null : 'team'))}
        >
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Ekip Üyesi' : 'Team Members'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalTeam}</p>
        </Card>
        <Card
          hover
          className={cn(activeList === 'customers' && 'ring-1 ring-primary/35')}
          onClick={() => setActiveList((current) => (current === 'customers' ? null : 'customers'))}
        >
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Müşteri' : 'Customers'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalCustomers}</p>
        </Card>
      </motion.div>

      {activeList && (
        <motion.div variants={item}>
          <Card>
            <p className="text-sm font-semibold text-text-primary">
              {activeList === 'contacts'
                ? (currentLocale === 'tr' ? 'Tüm Kişiler (A-Z)' : 'All People (A-Z)')
                : activeList === 'team'
                  ? (currentLocale === 'tr' ? 'Ekip Üyeleri (A-Z)' : 'Team Members (A-Z)')
                  : (currentLocale === 'tr' ? 'Müşteriler (A-Z)' : 'Customers (A-Z)')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(activeList === 'contacts'
                ? sortedContacts
                : activeList === 'team'
                  ? sortedTeamMembers
                  : sortedCustomers
              ).map((person) => (
                <span key={person.id} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  {person.full_name}
                </span>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

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
              onChange={(event) => {
                const nextValue = event.target.value
                setSelectedContactId(nextValue)
                setDraftNote(nextValue === 'self' ? generalLeaderNote : '')
              }}
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

            {latestLeaderNote && (
              <div className="group rounded-xl border border-border-subtle bg-surface/50 p-3">
                <p className="text-xs text-text-tertiary mb-1">
                  {currentLocale === 'tr' ? 'Kayıtlı Not' : 'Saved Note'}
                </p>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {isEditingSavedNote ? (
                      <textarea
                        value={savedNoteDraft}
                        onChange={(event) => setSavedNoteDraft(event.target.value)}
                        className="min-h-[84px] w-full rounded-xl border border-border bg-surface p-3 text-sm text-text-primary outline-none"
                      />
                    ) : (
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{latestLeaderNote}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => void copySavedNote()}
                      className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
                      title={currentLocale === 'tr' ? 'Kopyala' : 'Copy'}
                    >
                      {copiedSavedNote ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={beginEditSavedNote}
                      className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
                      title={currentLocale === 'tr' ? 'Düzenle' : 'Edit'}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={deleteSavedNote}
                      className="rounded-lg p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                      title={currentLocale === 'tr' ? 'Sil' : 'Delete'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isEditingSavedNote && (
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingSavedNote(false)}>
                      {currentLocale === 'tr' ? 'İptal' : 'Cancel'}
                    </Button>
                    <Button size="sm" onClick={saveEditedNote}>
                      {currentLocale === 'tr' ? 'Kaydet' : 'Save'}
                    </Button>
                  </div>
                )}
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
