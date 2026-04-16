'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useTheme } from '@/components/common/ThemeProvider'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import { User, Bell, Palette, Sparkles, Moon, Sun, Monitor, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function SettingsPage() {
  const { t } = useLanguage()
  const { currentUser, setCurrentUser } = useAppStore()
  const { theme, setTheme } = useTheme()

  const [name, setName] = useState(currentUser?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [notifToggles, setNotifToggles] = useState([true, true, true, true, true, false])
  const [aiSuggestions, setAiSuggestions] = useState(true)
  const [dailyGoals, setDailyGoals] = useState(true)
  const [coachingStyle, setCoachingStyle] = useState('encouraging')

  function handleTheme(value: 'dark' | 'light' | 'system') {
    if (value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    } else {
      setTheme(value)
    }
  }

  useEffect(() => {
    setName(currentUser?.name ?? '')
  }, [currentUser?.name])

  async function handleSaveProfile() {
    if (!currentUser || !name.trim()) return
    setSaving(true)
    setSaveStatus('idle')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('nmu_user_profiles')
      .update({ name: name.trim() })
      .eq('id', currentUser.id)

    if (error) {
      setSaveStatus('error')
    } else {
      setCurrentUser({ ...currentUser, name: name.trim() })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    setSaving(false)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[900px] mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-text-primary">{t.settings.title}</h1>
        <p className="text-sm text-text-secondary mt-0.5">{t.settings.subtitle}</p>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> {t.settings.profile}
            </CardTitle>
          </CardHeader>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="text-center shrink-0">
              <Avatar name={currentUser?.name ?? '?'} size="xl" />
              <p className="text-[10px] text-text-tertiary mt-2">{currentUser?.email}</p>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{t.settings.fullName}</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Adın Soyadın"
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">{t.settings.email}</label>
                  <input
                    value={currentUser?.email ?? ''}
                    readOnly
                    className="w-full px-3 py-2.5 bg-surface/50 border border-border rounded-xl text-text-muted text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  disabled={saving || !name.trim() || name.trim() === currentUser?.name}
                  onClick={handleSaveProfile}
                >
                  {saving ? 'Kaydediliyor...' : t.settings.saveChanges}
                </Button>
                {saveStatus === 'success' && (
                  <span className="flex items-center gap-1.5 text-sm text-success">
                    <CheckCircle2 className="w-4 h-4" /> Kaydedildi
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="flex items-center gap-1.5 text-sm text-error">
                    <AlertCircle className="w-4 h-4" /> Hata oluştu
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-secondary" /> {t.settings.appearance}
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-text-secondary mb-3">{t.settings.theme}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t.settings.dark,   icon: Moon,    value: 'dark'   as const },
                  { label: t.settings.light,  icon: Sun,     value: 'light'  as const },
                  { label: t.settings.system, icon: Monitor, value: 'system' as const },
                ].map((opt) => {
                  const Icon = opt.icon
                  const active = opt.value === 'system' ? false : theme === opt.value
                  return (
                    <button key={opt.value} onClick={() => handleTheme(opt.value)} className={`p-4 rounded-xl border text-center transition-all ${active ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface border-border text-text-secondary hover:border-border-strong'}`}>
                      <Icon className="w-5 h-5 mx-auto mb-1.5" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border-subtle">
              <div>
                <p className="text-sm font-medium text-text-primary">{t.settings.reducedMotion}</p>
                <p className="text-xs text-text-tertiary">{t.settings.reducedMotionDesc}</p>
              </div>
              <button onClick={() => setReducedMotion(v => !v)} className={`w-10 h-6 rounded-full relative transition-colors ${reducedMotion ? 'bg-primary' : 'bg-surface-hover'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${reducedMotion ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-warning" /> {t.settings.notifications}
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: t.settings.followUpReminders,  desc: t.settings.followUpRemindersDesc },
              { label: t.settings.teamAlerts,          desc: t.settings.teamAlertsDesc },
              { label: t.settings.aiSuggestions,       desc: t.settings.aiSuggestionsDesc },
              { label: t.settings.eventReminders,      desc: t.settings.eventRemindersDesc },
              { label: t.settings.achievementUnlocks,  desc: t.settings.achievementUnlocksDesc },
              { label: t.settings.weeklySummary,       desc: t.settings.weeklySummaryDesc },
            ].map((notif, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border-subtle">
                <div>
                  <p className="text-sm font-medium text-text-primary">{notif.label}</p>
                  <p className="text-xs text-text-tertiary">{notif.desc}</p>
                </div>
                <button
                  onClick={() => setNotifToggles(prev => prev.map((v, idx) => idx === i ? !v : v))}
                  className={`w-10 h-6 rounded-full relative transition-colors ${notifToggles[i] ? 'bg-primary' : 'bg-surface-hover'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${notifToggles[i] ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* AI Settings */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> {t.settings.aiPreferences}
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border-subtle">
              <div>
                <p className="text-sm font-medium text-text-primary">{t.settings.aiSuggestionsToggle}</p>
                <p className="text-xs text-text-tertiary">{t.settings.aiSuggestionsToggleDesc}</p>
              </div>
              <button onClick={() => setAiSuggestions(v => !v)} className={`w-10 h-6 rounded-full relative transition-colors ${aiSuggestions ? 'bg-primary' : 'bg-surface-hover'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${aiSuggestions ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border-subtle">
              <div>
                <p className="text-sm font-medium text-text-primary">{t.settings.dailyGoalReminders}</p>
                <p className="text-xs text-text-tertiary">{t.settings.dailyGoalRemindersDesc}</p>
              </div>
              <button onClick={() => setDailyGoals(v => !v)} className={`w-10 h-6 rounded-full relative transition-colors ${dailyGoals ? 'bg-primary' : 'bg-surface-hover'}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${dailyGoals ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
            <Select
              label={t.settings.aiCoachingStyle}
              options={[
                { value: 'encouraging', label: t.settings.encouraging },
                { value: 'direct', label: t.settings.direct },
                { value: 'analytical', label: t.settings.analytical },
              ]}
              value={coachingStyle}
              onChange={e => setCoachingStyle(e.target.value)}
            />
          </div>
        </Card>
      </motion.div>

      {/* Subscription */}
      <motion.div variants={item}>
        <Card glow="primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-success" /> {t.settings.subscription}
            </CardTitle>
          </CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-text-primary">{t.settings.proPlan}</p>
                <Badge variant="success" size="sm">{t.common.active}</Badge>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">{t.settings.planFeatures}</p>
            </div>
            <Button variant="outline" size="sm">{t.settings.managePlan}</Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
