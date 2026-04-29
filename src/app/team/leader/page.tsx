'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useDeleteConfirm } from '@/components/common/DeleteConfirmProvider'
import { stageMeta } from '@/components/contacts/contactLabels'
import { useAppStore } from '@/store/appStore'
import { usePersistentState } from '@/hooks/usePersistentState'
import { AIMessageGeneratorModal } from '@/components/ai/AIMessageGeneratorModal'
import { fetchContacts } from '@/lib/queries'
import type { ContactRow } from '@/lib/queries'
import { Check, Copy, Crown, Pencil, Search, Sparkles, Trash2, Users, ShoppingBag, Target, NotebookPen } from 'lucide-react'
import { cn } from '@/lib/utils'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

type LeaderListKey = 'contacts' | 'team' | 'customers' | null

export default function LeaderPage() {
  const { locale } = useLanguage()
  const { requestDelete } = useDeleteConfirm()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const { currentUser } = useAppStore()
  const router = useRouter()
  const [selectedContactId, setSelectedContactId] = useState<string>('self')
  const [draftNote, setDraftNote] = useState('')
  const [generalLeaderNote, setGeneralLeaderNote] = usePersistentState<string>('nmu-leader-general-note', '', { version: 1 })
  const [leaderNotesByContact, setLeaderNotesByContact] = usePersistentState<Record<string, string>>('nmu-leader-notes-by-contact', {}, { version: 1 })
  const [activeList, setActiveList] = useState<LeaderListKey>(null)
  const [isEditingSavedNote, setIsEditingSavedNote] = useState(false)
  const [savedNoteDraft, setSavedNoteDraft] = useState('')
  const [copiedSavedNote, setCopiedSavedNote] = useState(false)
  const [listSearch, setListSearch] = useState('')
  const [listAiModalOpen, setListAiModalOpen] = useState(false)
  const [listAiContact, setListAiContact] = useState<ContactRow | null>(null)
  const [listAiExtraContext, setListAiExtraContext] = useState('')

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

  const latestLeaderNote = useMemo(() => {
    if (isGeneralNoteSelected) return generalLeaderNote.trim()
    if (!selectedContact) return ''
    return leaderNotesByContact[selectedContact.id]?.trim() ?? ''
  }, [isGeneralNoteSelected, selectedContact, generalLeaderNote, leaderNotesByContact])

  function saveNote() {
    const note = draftNote.trim()
    if (!note) return
    if (isGeneralNoteSelected) {
      setGeneralLeaderNote(note)
      setDraftNote('')
      return
    }
    if (!selectedContact) return
    setLeaderNotesByContact((current) => ({ ...current, [selectedContact.id]: note }))
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
    if (!selectedContact) return
    setLeaderNotesByContact((current) => ({ ...current, [selectedContact.id]: note }))
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
      requestDelete({
        detail: currentLocale === 'tr' ? 'Genel lider notu silinecek.' : 'The general leader note will be cleared.',
        onConfirm: () => {
          setGeneralLeaderNote('')
        },
      })
      return
    }
    if (!selectedContact) return
    requestDelete({
      detail: latestLeaderNote?.trim().slice(0, 160),
      onConfirm: () => {
        setLeaderNotesByContact((current) => {
          const next = { ...current }
          delete next[selectedContact.id]
          return next
        })
      },
    })
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
  const filteredLeaderListContacts = useMemo(() => {
    const needle = listSearch.trim().toLowerCase()
    const filtered = selectedPool.filter((contact) => {
      if (!needle) return true
      return (
        contact.full_name.toLowerCase().includes(needle) ||
        (contact.phone?.toLowerCase().includes(needle) ?? false) ||
        (contact.email?.toLowerCase().includes(needle) ?? false)
      )
    })
    return filtered.sort((a, b) => a.full_name.localeCompare(b.full_name, currentLocale === 'tr' ? 'tr' : 'en'))
  }, [listSearch, selectedPool, currentLocale])

  function openLeaderContactDetail(contactId: string) {
    if (!activeList) return
    const segment = activeList === 'team' ? 'team' : activeList === 'customers' ? 'customers' : 'all'
    router.push(`/contacts?segment=${segment}&contact=${contactId}&returnTo=%2Fteam%2Fleader`)
  }

  async function openAiForListContact(contact: ContactRow) {
    const latestLeaderForContact = leaderNotesByContact[contact.id]?.trim() ?? ''
    const context = [
      `Kişi: ${contact.full_name}`,
      contact.profession ? `Meslek: ${contact.profession}` : '',
      contact.location ? `Lokasyon: ${contact.location}` : '',
      contact.interests ? `İlgi alanları: ${contact.interests}` : '',
      contact.pain_points ? `Sıkıntılar: ${contact.pain_points}` : '',
      latestLeaderForContact ? `Lider Notu: ${latestLeaderForContact}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    setListAiContact(contact)
    setListAiExtraContext(context)
    setListAiModalOpen(true)
  }

  function closeListAiModal() {
    setListAiModalOpen(false)
    setListAiContact(null)
    setListAiExtraContext('')
  }

  return (
    <>
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
            onClick={() => {
              setListSearch('')
              setActiveList((current) => (current === 'contacts' ? null : 'contacts'))
            }}
          >
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Toplam Kontak' : 'Total Contacts'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{contacts.length}</p>
        </Card>
        <Card
          hover
          className={cn(activeList === 'team' && 'ring-1 ring-primary/35')}
          onClick={() => {
            setListSearch('')
            setActiveList((current) => (current === 'team' ? null : 'team'))
          }}
        >
          <p className="text-xs text-text-tertiary">{currentLocale === 'tr' ? 'Ekip Üyesi' : 'Team Members'}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{totalTeam}</p>
        </Card>
        <Card
          hover
          className={cn(activeList === 'customers' && 'ring-1 ring-primary/35')}
          onClick={() => {
            setListSearch('')
            setActiveList((current) => (current === 'customers' ? null : 'customers'))
          }}
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
                setDraftNote(nextValue === 'self' ? generalLeaderNote : (leaderNotesByContact[nextValue] ?? ''))
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

        <Card
          className="flex min-h-0 max-h-[min(72vh,640px)] flex-col overflow-hidden xl:max-h-[min(80vh,720px)]"
          padding="none"
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden />
              <input
                value={listSearch}
                onChange={(event) => setListSearch(event.target.value)}
                disabled={!activeList}
                placeholder={
                  currentLocale === 'tr'
                    ? 'Ad, telefon, e-posta ara...'
                    : 'Search name, phone, email...'
                }
                className="h-10 w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {!activeList ? (
              <p className="py-8 text-center text-sm text-text-tertiary">
                {currentLocale === 'tr'
                  ? 'Yukarıdaki sayaçlardan birine tıklayın; bu panelde o gruptaki kişileri göreceksiniz.'
                  : 'Click one of the three counters above to load people in this panel.'}
              </p>
            ) : selectedPool.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-tertiary">
                {currentLocale === 'tr' ? 'Bu grupta kayıt yok.' : 'No people in this group.'}
              </p>
            ) : filteredLeaderListContacts.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-tertiary">
                {currentLocale === 'tr' ? 'Aramaya uyan kişi yok.' : 'No matches for your search.'}
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredLeaderListContacts.map((contact) => {
                  const stage = stageMeta(contact.pipeline_stage)
                  return (
                    <li
                      key={contact.id}
                      className="flex min-w-0 items-center gap-2 rounded-xl border border-border-subtle bg-surface/50 p-2.5 pl-3"
                    >
                      <button
                        type="button"
                        onClick={() => openLeaderContactDetail(contact.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <Avatar name={contact.full_name} size="sm" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-text-primary">{contact.full_name}</p>
                          {contact.profession?.trim() && (
                            <p className="truncate text-xs text-text-tertiary">{contact.profession}</p>
                          )}
                          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                stage.className,
                              )}
                            >
                              {stage[currentLocale]}
                            </span>
                          </div>
                        </div>
                      </button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void openAiForListContact(contact)}
                        className="shrink-0 gap-1 border border-warning/30 bg-warning/10 px-2.5 text-[11px] font-semibold text-warning hover:bg-warning/20"
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                      >
                        {currentLocale === 'tr' ? 'YZ Mesajı Üret' : 'AI message'}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>

    <AIMessageGeneratorModal
      key={listAiContact?.id ?? 'leader-list-ai'}
      open={listAiModalOpen}
      onClose={closeListAiModal}
      locale={currentLocale}
      contact={listAiContact}
      initialCategory="follow_up"
      initialChannel="whatsapp"
      initialTone="friendly"
      initialExtraContext={listAiExtraContext}
      autoGenerate={false}
      presetLabel={null}
      presetReason={listAiExtraContext}
      onGenerated={() => undefined}
      onSaveTemplate={() => undefined}
    />
    </>
  )
}
