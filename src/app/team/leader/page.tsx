'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, tr as trLocale } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { ContactChannelRow } from '@/components/contacts/ContactChannelRow'
import { ContactWarmthBar } from '@/components/contacts/ContactWarmthBar'
import { PIPELINE_STAGE_OPTIONS, stageMeta } from '@/components/contacts/contactLabels'
import { useAppStore } from '@/store/appStore'
import { usePersistentState } from '@/hooks/usePersistentState'
import { queueAIMessageDraftPreset } from '@/lib/clientStorage'
import { addInteraction, deleteInteraction, fetchContacts, fetchInteractionsByContact, updateInteraction } from '@/lib/queries'
import type { ContactRow, InteractionRow } from '@/lib/queries'
import { Check, Copy, Crown, LayoutGrid, LayoutList, Pencil, Sparkles, Trash2, Users, ShoppingBag, Target, NotebookPen, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
const TAG_PASTEL_CLASSES = [
  'bg-fuchsia-500/[0.2] text-text-primary border-fuchsia-400/35',
  'bg-cyan-500/[0.2] text-text-primary border-cyan-400/35',
  'bg-amber-500/[0.2] text-text-primary border-amber-400/35',
  'bg-emerald-500/[0.2] text-text-primary border-emerald-400/35',
  'bg-violet-500/[0.2] text-text-primary border-violet-400/35',
  'bg-sky-500/[0.2] text-text-primary border-sky-400/35',
  'bg-rose-500/[0.2] text-text-primary border-rose-400/35',
]

type LeaderListKey = 'contacts' | 'team' | 'customers' | null
const LEADER_NOTE_PREFIX = '[LIDER_NOTU]'

function tagSurfaceClass(index: number) {
  return TAG_PASTEL_CLASSES[index % TAG_PASTEL_CLASSES.length]
}

function lastTouchLabel(iso: string | null | undefined, locale: 'tr' | 'en') {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: locale === 'tr' ? trLocale : enUS,
    })
  } catch {
    return '—'
  }
}

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
  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
  const selectedPool = useMemo(
    () => (
      activeList === 'contacts'
        ? contacts
        : activeList === 'team'
          ? sortedTeamMembers
          : activeList === 'customers'
            ? sortedCustomers
            : []
    ),
    [activeList, contacts, sortedCustomers, sortedTeamMembers],
  )
  const filteredLeaderContacts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const filtered = selectedPool.filter((contact) => {
      const tagsJoined = (contact.tags ?? []).join(' ').toLowerCase()
      const matchesSearch = !needle || (
        contact.full_name.toLowerCase().includes(needle) ||
        (contact.nickname?.toLowerCase().includes(needle) ?? false) ||
        (contact.email?.toLowerCase().includes(needle) ?? false) ||
        (contact.phone?.toLowerCase().includes(needle) ?? false) ||
        (contact.whatsapp_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.telegram_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.instagram_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.location?.toLowerCase().includes(needle) ?? false) ||
        (contact.profession?.toLowerCase().includes(needle) ?? false) ||
        tagsJoined.includes(needle) ||
        (contact.interests?.toLowerCase().includes(needle) ?? false)
      )
      const matchesStage = selectedStage === 'all' || contact.pipeline_stage === selectedStage
      return matchesSearch && matchesStage
    })
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [search, selectedPool, selectedStage])
  const allFilteredSelected = filteredLeaderContacts.length > 0
    && filteredLeaderContacts.every((contact) => selectedIds.has(contact.id))

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredLeaderContacts.map((contact) => contact.id)))
  }

  function toggleRowSelected(contactId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  function openLeaderContactDetail(contactId: string) {
    const segment = activeList === 'team' ? 'team' : activeList === 'customers' ? 'customers' : 'all'
    router.push(`/contacts?segment=${segment}&contact=${contactId}&returnTo=%2Fteam%2Fleader`)
  }

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

      {activeList && (
        <motion.div variants={item} className="space-y-4">
          <Card>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    currentLocale === 'tr'
                      ? 'Ad, takma ad, telefon, kanal, etiket ara...'
                      : 'Search name, nickname, phone, channels, tags...'
                  }
                  className="w-full h-11 rounded-xl border border-border bg-surface pl-4 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/30"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                  className="h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-primary outline-none"
                >
                  <option value="all">{currentLocale === 'tr' ? 'Tüm Aşamalar' : 'All Stages'}</option>
                  {PIPELINE_STAGE_OPTIONS.map((stage) => (
                    <option key={stage} value={stage}>{stageMeta(stage)[currentLocale]}</option>
                  ))}
                </select>
                <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={cn('h-11 px-3 text-text-secondary', viewMode === 'table' && 'bg-primary/15 text-primary')}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn('h-11 px-3 text-text-secondary', viewMode === 'cards' && 'bg-primary/15 text-primary')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {filteredLeaderContacts.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <p className="text-base font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'Bu görünümde kontak bulunamadı.' : 'No contacts matched this view.'}
                </p>
                <p className="text-sm text-text-tertiary mt-2">
                  {currentLocale === 'tr'
                    ? 'Filtreleri sadeleştir veya başka bir kutu seç.'
                    : 'Broaden the filters or choose a different box.'}
                </p>
              </div>
            </Card>
          ) : viewMode === 'table' ? (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/40">
                      <th className="w-10 px-2 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                          aria-label={currentLocale === 'tr' ? 'Tümünü seç' : 'Select all'}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'İsim' : 'Name'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Kanallar' : 'Channels'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Aşama' : 'Stage'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Sıcaklık' : 'Warmth'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium min-w-[140px]">
                        {currentLocale === 'tr' ? 'Etiketler' : 'Tags'}
                      </th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium whitespace-nowrap">
                        {currentLocale === 'tr' ? 'Son Temas' : 'Last touch'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderContacts.map((contact) => {
                      const stage = stageMeta(contact.pipeline_stage)
                      const tags = contact.tags ?? []
                      return (
                        <tr
                          key={contact.id}
                          onClick={() => openLeaderContactDetail(contact.id)}
                          className="border-b border-border last:border-0 hover:bg-surface/30 cursor-pointer transition-colors"
                        >
                          <td className="px-2 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleRowSelected(contact.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                              aria-label={currentLocale === 'tr' ? 'Satırı seç' : 'Select row'}
                            />
                          </td>
                          <td className="px-4 py-4 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <Avatar name={contact.full_name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-text-primary truncate">{contact.full_name}</p>
                                <p className="text-xs text-text-tertiary truncate">
                                  {(() => {
                                    const meta = [contact.profession, contact.location].filter(Boolean).join(' · ')
                                    const nick = contact.nickname?.trim()
                                    if (nick) return meta ? `${nick} · ${meta}` : nick
                                    return meta || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact record')
                                  })()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <ContactChannelRow contact={contact} />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span
                              className={cn(
                                'inline-flex max-w-[11rem] items-center rounded-full border px-2.5 py-1 text-xs font-semibold truncate',
                                stage.className,
                              )}
                            >
                              {stage[currentLocale]}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <ContactWarmthBar score={contact.temperature_score} />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            {tags.length === 0 ? (
                              <span className="text-xs text-text-muted">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag, index) => (
                                  <span
                                    key={`${contact.id}-${tag}`}
                                    className={cn(
                                      'inline-flex max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                      tagSurfaceClass(index),
                                    )}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-text-secondary whitespace-nowrap">
                            {lastTouchLabel(contact.last_contact_date, currentLocale)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLeaderContacts.map((contact) => {
                const stage = stageMeta(contact.pipeline_stage)
                return (
                  <Card key={contact.id} hover onClick={() => openLeaderContactDetail(contact.id)}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.full_name} size="md" />
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{contact.full_name}</h3>
                          <p className="text-xs text-text-tertiary">
                            {[contact.profession, contact.location].filter(Boolean).join(' · ') || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact record')}
                          </p>
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold', stage.className)}>
                        {stage[currentLocale]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <ContactChannelRow contact={contact} />
                      <ContactWarmthBar score={contact.temperature_score} className="max-w-[10rem]" />
                    </div>

                    <div className="text-xs">
                      <p className="text-text-tertiary">{currentLocale === 'tr' ? 'Son temas' : 'Last touch'}</p>
                      <p className="text-text-primary mt-1">{lastTouchLabel(contact.last_contact_date, currentLocale)}</p>
                    </div>
                    {(contact.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(contact.tags ?? []).map((tag, index) => (
                          <span
                            key={`${contact.id}-card-${tag}`}
                            className={cn(
                              'inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              tagSurfaceClass(index),
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
