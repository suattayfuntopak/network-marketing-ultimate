'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { events } from '@/data/mockData'
import { Calendar, MapPin, Video, Clock, Plus } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const eventTypeColors: Record<string, string> = {
  online_presentation: 'bg-primary/15 text-primary',
  home_meeting: 'bg-success/15 text-success',
  team_zoom: 'bg-secondary/15 text-secondary',
  training: 'bg-warning/15 text-warning',
  workshop: 'bg-accent/15 text-accent',
  local: 'bg-emerald-500/15 text-emerald-400',
  regional: 'bg-amber-500/15 text-amber-400',
  global: 'bg-rose-500/15 text-rose-400',
}

// snake_case → i18n camelCase key haritası
const EVENT_TYPE_KEY: Record<string, string> = {
  online_presentation: 'onlinePresentation',
  home_meeting: 'homeMeeting',
  team_zoom: 'teamZoom',
  training: 'training',
  workshop: 'workshop',
  local: 'local',
  regional: 'regional',
  global: 'global',
}

export default function EventsPage() {
  const { t } = useLanguage()

  const eventTypeLabel = (type: string) => {
    const key = EVENT_TYPE_KEY[type]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return key ? (t.events.types as any)[key] ?? type.replace(/_/g, ' ') : type.replace(/_/g, ' ')
  }

  const eventStatusLabel = (status: string) =>
    (t.events.status as Record<string, string>)[status] ?? status

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.events.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.events.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>{t.events.createEvent}</Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event) => {
          const confirmed = event.attendees.filter(a => a.rsvpStatus === 'confirmed').length
          const invited = event.attendees.length
          return (
            <motion.div key={event.id} variants={item}>
              <Card hover className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={eventTypeColors[event.type] || 'bg-surface-hover text-text-secondary'} size="md">
                    {eventTypeLabel(event.type)}
                  </Badge>
                  <Badge variant={event.status === 'published' ? 'success' : 'default'} size="sm">
                    {eventStatusLabel(event.status)}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">{event.title}</h3>
                <p className="text-xs text-text-tertiary line-clamp-2 mb-4">{event.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                    {new Date(event.startDate).toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                    {new Date(event.startDate).toLocaleTimeString('tr-TR', { hour: 'numeric', minute: '2-digit' })} - {new Date(event.endDate).toLocaleTimeString('tr-TR', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                      {event.location}
                    </div>
                  )}
                  {event.meetingUrl && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Video className="w-3.5 h-3.5 text-text-tertiary" />
                      <span className="text-primary">{t.common.virtualMeeting}</span>
                    </div>
                  )}
                </div>
                <div className="mt-auto pt-3 border-t border-border-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AvatarGroup names={event.attendees.slice(0, 3).map(a => a.name)} size="xs" />
                      <span className="text-xs text-text-tertiary">{confirmed}/{invited} {t.common.confirmed}</span>
                    </div>
                    <Button size="sm" variant="ghost">{t.common.manage}</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}

        {/* Create New Card */}
        <motion.div variants={item}>
          <Card hover className="h-full min-h-[280px] flex flex-col items-center justify-center border-dashed border-2 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-text-primary">{t.common.createNewEvent}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{t.common.schedulePresentation}</p>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
