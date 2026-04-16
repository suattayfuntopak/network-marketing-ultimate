'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { academyCourses, achievements } from '@/data/mockData'
import type { AcademyLesson } from '@/types'
import {
  GraduationCap, Play, BookOpen, FileText, Mic, Download,
  CheckCircle2, Clock, Award, Zap, ChevronRight,
  Trophy, Target, Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const lessonTypeIcons: Record<AcademyLesson['type'], LucideIcon> = {
  video: Play,
  text: BookOpen,
  audio: Mic,
  checklist: CheckCircle2,
  quiz: Target,
  roleplay: Sparkles,
  download: Download,
  worksheet: FileText,
  challenge: Trophy,
}

export default function AcademyPage() {
  const { t } = useLanguage()
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const course = selectedCourse ? academyCourses.find(c => c.id === selectedCourse) : null

  const totalLessons = academyCourses.reduce((acc, c) => acc + c.modules.reduce((a, m) => a + m.lessons.length, 0), 0)
  const completedLessons = 12
  const totalXP = achievements.reduce((acc, a) => acc + a.xpReward, 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.academy.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.academy.subtitle}</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.academy.courses, value: academyCourses.length, icon: GraduationCap, color: 'text-primary' },
          { label: t.academy.completed, value: `${completedLessons}/${totalLessons}`, icon: CheckCircle2, color: 'text-success' },
          { label: t.academy.xpEarned, value: totalXP.toLocaleString(), icon: Zap, color: 'text-warning' },
          { label: t.academy.certifications, value: 2, icon: Award, color: 'text-secondary' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-text-primary kpi-number">{stat.value}</p>
                <p className="text-xs text-text-tertiary">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </motion.div>

      {selectedCourse && course ? (
        /* Course Detail View */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCourse(null)} className="mb-4">
            ← {t.academy.backToCourses}
          </Button>
          <Card>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Badge variant={course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'secondary'}>
                  {t.academy.levels[course.level as keyof typeof t.academy.levels]}
                </Badge>
                <h2 className="text-xl font-bold text-text-primary mt-2">{course.title}</h2>
                <p className="text-sm text-text-secondary mt-1">{course.description}</p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><Clock className="w-3 h-3" /> {course.estimatedMinutes} dk</span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><Zap className="w-3 h-3" /> {course.xpReward} XP</span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.modules.reduce((a, m) => a + m.lessons.length, 0)} {t.academy.lessons}</span>
                </div>
                <Progress value={45} className="mt-4" showLabel label={t.common.progress} />
              </div>
            </div>
          </Card>

          {/* Modules */}
          <div className="space-y-4 mt-6">
            {course.modules.map((module, mi) => (
              <Card key={module.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">{mi + 1}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{module.title}</h3>
                    <p className="text-xs text-text-tertiary">{module.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {module.lessons.map((lesson, li) => {
                    const Icon = lessonTypeIcons[lesson.type] || BookOpen
                    const isCompleted = li < 1
                    return (
                      <div key={lesson.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isCompleted ? 'bg-success/5 border border-success/10' : 'bg-surface/50 border border-border-subtle hover:border-border'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-tertiary'}`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-success' : 'text-text-primary'}`}>{lesson.title}</p>
                          <p className="text-[10px] text-text-tertiary">{lesson.type} · {lesson.durationMinutes} dk · +{lesson.xpReward} XP</p>
                        </div>
                        {!isCompleted && (
                          <Button size="sm" variant="ghost">
                            {lesson.type === 'video' ? t.academy.watch : lesson.type === 'quiz' ? t.academy.start : t.academy.begin}
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      ) : (
        /* Course Grid */
        <>
          {/* Learning Path */}
          <motion.div variants={item}>
            <Card glow="primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t.academy.yourLearningPath}
                </CardTitle>
              </CardHeader>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {academyCourses.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3 shrink-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer transition-all ${i === 0 ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-surface-hover text-text-tertiary hover:text-text-primary'}`}
                      onClick={() => setSelectedCourse(c.id)}>
                      {i + 1}
                    </div>
                    {i < academyCourses.length - 1 && <ChevronRight className="w-4 h-4 text-text-muted" />}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Course Grid */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {academyCourses.map((c, i) => {
              const totalLessonsInCourse = c.modules.reduce((a, m) => a + m.lessons.length, 0)
              const progress = i === 0 ? 60 : i === 1 ? 20 : 0
              return (
                <motion.div key={c.id} variants={item}>
                  <Card hover onClick={() => setSelectedCourse(c.id)} className="h-full flex flex-col">
                    <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                      <GraduationCap className="w-10 h-10 text-primary/40" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={c.level === 'beginner' ? 'success' : c.level === 'intermediate' ? 'warning' : c.level === 'advanced' ? 'error' : 'secondary'} size="sm">{t.academy.levels[c.level as keyof typeof t.academy.levels]}</Badge>
                        <span className="text-[10px] text-text-tertiary">{c.estimatedMinutes} dk</span>
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">{c.title}</h3>
                      <p className="text-xs text-text-tertiary line-clamp-2">{c.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <Progress value={progress} size="sm" variant="primary" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-text-tertiary">{totalLessonsInCourse} {t.academy.lessons}</span>
                        <span className="text-[10px] text-warning font-medium">+{c.xpReward} XP</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          {/* Badges & Achievements */}
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {t.academy.achievements}
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {achievements.map((ach) => (
                  <div key={ach.id} className="flex flex-col items-center p-3 rounded-xl bg-surface/50 border border-border-subtle text-center">
                    <span className="text-2xl mb-1">{ach.iconUrl}</span>
                    <p className="text-[11px] font-semibold text-text-primary">{ach.title}</p>
                    <p className="text-[9px] text-text-tertiary mt-0.5">+{ach.xpReward} XP</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
