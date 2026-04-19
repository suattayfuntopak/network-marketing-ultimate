'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { AcademyLibraryCategory, AcademyLibraryItemType, AcademyObjectionCategory } from '@/data/academyLibrary'
import { Copy, Sparkles, Star } from 'lucide-react'

export type LibraryResource = {
  id: string
  source: 'academy' | 'custom'
  title: string
  summary: string
  content: string
  categoryKey: AcademyLibraryCategory
  categoryLabel: string
  typeKey: AcademyLibraryItemType
  typeLabel: string
  levelLabel: string
  readingMinutes: number
  tags: string[]
  coachPrompt: string
}

export type ObjectionResource = {
  id: string
  source: 'academy' | 'custom'
  title: string
  categoryKey: AcademyObjectionCategory
  categoryLabel: string
  shortResponse: string
  fullResponse: string
  approach: string
  exampleDialog: string
  tags: string[]
  coachPrompt: string
}

export type ActivePanel =
  | { type: 'library'; resource: LibraryResource }
  | { type: 'objection'; resource: ObjectionResource }
  | null

interface Props {
  activePanel: ActivePanel
  onClose: () => void
  currentLocale: 'tr' | 'en'
  copiedId: string | null
  favoriteLibraryIds: string[]
  favoriteObjectionIds: string[]
  onToggleLibraryFavorite: (id: string) => void
  onToggleObjectionFavorite: (id: string) => void
  onCopy: (id: string, text: string) => void
  onOpenCoach: (prompt: string) => void
  labels: {
    copy: string
    copied: string
  }
}

export function ResourcePreviewModal({
  activePanel,
  onClose,
  currentLocale,
  copiedId,
  favoriteLibraryIds,
  favoriteObjectionIds,
  onToggleLibraryFavorite,
  onToggleObjectionFavorite,
  onCopy,
  onOpenCoach,
  labels,
}: Props) {
  const selectedLibraryResource = activePanel?.type === 'library' ? activePanel.resource : null
  const selectedObjectionResource = activePanel?.type === 'objection' ? activePanel.resource : null

  return (
    <Modal
      open={Boolean(activePanel)}
      onClose={onClose}
      title={selectedLibraryResource?.title ?? selectedObjectionResource?.title}
      description={
        selectedLibraryResource
          ? `${selectedLibraryResource.categoryLabel} · ${selectedLibraryResource.typeLabel}`
          : selectedObjectionResource
            ? `${selectedObjectionResource.categoryLabel} · ${currentLocale === 'tr' ? 'İtiraz Rehberi' : 'Objection Guide'}`
            : undefined
      }
    >
      {selectedLibraryResource && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{selectedLibraryResource.categoryLabel}</Badge>
            <Badge variant={selectedLibraryResource.source === 'custom' ? 'success' : 'secondary'}>
              {selectedLibraryResource.source === 'custom'
                ? (currentLocale === 'tr' ? 'Özel İçerik' : 'Custom')
                : selectedLibraryResource.typeLabel}
            </Badge>
            {selectedLibraryResource.source === 'custom' && (
              <Badge variant="secondary">{selectedLibraryResource.typeLabel}</Badge>
            )}
            <Badge variant="default">{selectedLibraryResource.levelLabel}</Badge>
          </div>
          <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
            <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{selectedLibraryResource.content}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedLibraryResource.tags.map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onToggleLibraryFavorite(selectedLibraryResource.id)}>
              <Star className={cn('w-3.5 h-3.5', favoriteLibraryIds.includes(selectedLibraryResource.id) && 'fill-warning text-warning')} />
              {favoriteLibraryIds.includes(selectedLibraryResource.id)
                ? (currentLocale === 'tr' ? 'Favoriden çıkar' : 'Remove favorite')
                : (currentLocale === 'tr' ? 'Favoriye ekle' : 'Save favorite')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => onCopy(selectedLibraryResource.id, selectedLibraryResource.content)}
            >
              {copiedId === selectedLibraryResource.id ? labels.copied : labels.copy}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => onOpenCoach(selectedLibraryResource.coachPrompt)}
            >
              {currentLocale === 'tr' ? 'YZ Koçu ile geliştir' : 'Refine with AI Coach'}
            </Button>
          </div>
        </div>
      )}

      {selectedObjectionResource && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{selectedObjectionResource.categoryLabel}</Badge>
            <Badge variant={selectedObjectionResource.source === 'custom' ? 'success' : 'secondary'}>
              {selectedObjectionResource.source === 'custom'
                ? (currentLocale === 'tr' ? 'Özel Rehber' : 'Custom Guide')
                : (currentLocale === 'tr' ? 'Master Rehber' : 'Master Guide')}
            </Badge>
          </div>
          <div className="grid gap-3">
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                {currentLocale === 'tr' ? 'Kısa cevap' : 'Short response'}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.shortResponse}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                {currentLocale === 'tr' ? 'Yaklaşım' : 'Approach'}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.approach}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                {currentLocale === 'tr' ? 'Detaylı cevap' : 'Detailed response'}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.fullResponse}</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                {currentLocale === 'tr' ? 'Örnek diyalog' : 'Example dialogue'}
              </p>
              <p className="text-sm leading-relaxed text-text-secondary mt-2 whitespace-pre-line">{selectedObjectionResource.exampleDialog}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onToggleObjectionFavorite(selectedObjectionResource.id)}>
              <Star className={cn('w-3.5 h-3.5', favoriteObjectionIds.includes(selectedObjectionResource.id) && 'fill-warning text-warning')} />
              {favoriteObjectionIds.includes(selectedObjectionResource.id)
                ? (currentLocale === 'tr' ? 'Favoriden çıkar' : 'Remove favorite')
                : (currentLocale === 'tr' ? 'Favoriye ekle' : 'Save favorite')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => onCopy(selectedObjectionResource.id, selectedObjectionResource.fullResponse)}
            >
              {copiedId === selectedObjectionResource.id ? labels.copied : labels.copy}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => onOpenCoach(selectedObjectionResource.coachPrompt)}
            >
              {currentLocale === 'tr' ? 'YZ Koçu ile yeniden yaz' : 'Rewrite with AI Coach'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
