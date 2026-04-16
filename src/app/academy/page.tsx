'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useLanguage } from '@/components/common/LanguageProvider'
import { academyCourses, achievements } from '@/data/mockData'
import type { AcademyCourse, AcademyLesson } from '@/types'
import {
  GraduationCap,
  Play,
  BookOpen,
  FileText,
  Mic,
  Download,
  CheckCircle2,
  Clock,
  Award,
  Zap,
  ChevronRight,
  Trophy,
  Target,
  Sparkles,
  Copy,
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

const initialCompletedLessonIds = academyCourses
  .flatMap((course) => course.modules.flatMap((module) => module.lessons))
  .slice(0, 12)
  .map((lesson) => lesson.id)

type LessonSelection = {
  course: AcademyCourse
  lesson: AcademyLesson
}

export default function AcademyPage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonSelection | null>(null)
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(initialCompletedLessonIds)
  const [copiedLessonId, setCopiedLessonId] = useState<string | null>(null)

  const selectedCourse = selectedCourseId
    ? academyCourses.find((course) => course.id === selectedCourseId) ?? null
    : null

  const totalLessons = academyCourses.reduce(
    (count, course) => count + course.modules.reduce((moduleCount, module) => moduleCount + module.lessons.length, 0),
    0,
  )
  const completedLessons = completedLessonIds.length
  const totalXP = achievements.reduce((count, achievement) => count + achievement.xpReward, 0)

  function courseProgress(course: AcademyCourse) {
    const lessonIds = course.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id))
    const completed = lessonIds.filter((lessonId) => completedLessonIds.includes(lessonId)).length
    return {
      completed,
      total: lessonIds.length,
      percentage: lessonIds.length === 0 ? 0 : Math.round((completed / lessonIds.length) * 100),
    }
  }

  function openLesson(course: AcademyCourse, lesson: AcademyLesson) {
    setSelectedLesson({ course, lesson })
  }

  function toggleLessonComplete(lessonId: string) {
    setCompletedLessonIds((current) =>
      current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId],
    )
  }

  async function copyLessonContent(lesson: AcademyLesson) {
    await navigator.clipboard.writeText(lesson.content)
    setCopiedLessonId(lesson.id)
    window.setTimeout(() => setCopiedLessonId(null), 2000)
  }

  function downloadLessonContent(lesson: AcademyLesson) {
    const blob = new Blob([lesson.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${lesson.title.toLowerCase().replace(/\s+/g, '-')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const lessonModalTitle = selectedLesson?.lesson.title
  const lessonModalDescription = selectedLesson
    ? `${selectedLesson.course.title} · ${selectedLesson.lesson.durationMinutes} dk · +${selectedLesson.lesson.xpReward} XP`
    : undefined

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.academy.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{t.academy.subtitle}</p>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.academy.courses, value: academyCourses.length, icon: GraduationCap, color: 'text-primary' },
          { label: t.academy.completed, value: `${completedLessons}/${totalLessons}`, icon: CheckCircle2, color: 'text-success' },
          { label: t.academy.xpEarned, value: totalXP.toLocaleString(), icon: Zap, color: 'text-warning' },
          { label: t.academy.certifications, value: 2, icon: Award, color: 'text-secondary' },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
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

      {selectedCourse ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCourseId(null)}
            className="mb-4"
          >
            ← {t.academy.backToCourses}
          </Button>

          <Card>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <Badge variant={selectedCourse.level === 'beginner' ? 'success' : selectedCourse.level === 'intermediate' ? 'warning' : 'secondary'}>
                  {t.academy.levels[selectedCourse.level as keyof typeof t.academy.levels]}
                </Badge>
                <h2 className="text-xl font-bold text-text-primary mt-2">{selectedCourse.title}</h2>
                <p className="text-sm text-text-secondary mt-1">{selectedCourse.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedCourse.estimatedMinutes} dk</span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><Zap className="w-3 h-3" /> {selectedCourse.xpReward} XP</span>
                  <span className="text-xs text-text-tertiary flex items-center gap-1"><BookOpen className="w-3 h-3" /> {courseProgress(selectedCourse).total} {t.academy.lessons}</span>
                </div>
                <Progress value={courseProgress(selectedCourse).percentage} className="mt-4" showLabel label={t.common.progress} />
              </div>
            </div>
          </Card>

          <div className="space-y-4 mt-6">
            {selectedCourse.modules.map((module, moduleIndex) => (
              <Card key={module.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">{moduleIndex + 1}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{module.title}</h3>
                    <p className="text-xs text-text-tertiary">{module.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {module.lessons.map((lesson) => {
                    const Icon = lessonTypeIcons[lesson.type] || BookOpen
                    const isCompleted = completedLessonIds.includes(lesson.id)
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => openLesson(selectedCourse, lesson)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${isCompleted ? 'bg-success/5 border border-success/10' : 'bg-surface/50 border border-border-subtle hover:border-border'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-success/15 text-success' : 'bg-surface-hover text-text-tertiary'}`}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isCompleted ? 'text-success' : 'text-text-primary'}`}>{lesson.title}</p>
                          <p className="text-[10px] text-text-tertiary">{lesson.type} · {lesson.durationMinutes} dk · +{lesson.xpReward} XP</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation()
                            openLesson(selectedCourse, lesson)
                          }}
                        >
                          {isCompleted
                            ? t.common.view
                            : lesson.type === 'video'
                              ? t.academy.watch
                              : lesson.type === 'quiz'
                                ? t.academy.start
                                : t.academy.begin}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div variants={item}>
            <Card glow="primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {t.academy.yourLearningPath}
                </CardTitle>
              </CardHeader>
              <div className="flex items-center gap-4 overflow-x-auto pb-2">
                {academyCourses.map((course, index) => (
                  <div key={course.id} className="flex items-center gap-3 shrink-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer transition-all ${index === 0 ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-surface-hover text-text-tertiary hover:text-text-primary'}`}
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      {index + 1}
                    </div>
                    {index < academyCourses.length - 1 && <ChevronRight className="w-4 h-4 text-text-muted" />}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {academyCourses.map((course) => {
              const progress = courseProgress(course)
              return (
                <motion.div key={course.id} variants={item}>
                  <Card hover onClick={() => setSelectedCourseId(course.id)} className="h-full flex flex-col">
                    <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
                      <GraduationCap className="w-10 h-10 text-primary/40" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : course.level === 'advanced' ? 'error' : 'secondary'} size="sm">
                          {t.academy.levels[course.level as keyof typeof t.academy.levels]}
                        </Badge>
                        <span className="text-[10px] text-text-tertiary">{course.estimatedMinutes} dk</span>
                      </div>
                      <h3 className="text-sm font-semibold text-text-primary mb-1">{course.title}</h3>
                      <p className="text-xs text-text-tertiary line-clamp-2">{course.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <Progress value={progress.percentage} size="sm" variant="primary" />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-text-tertiary">{progress.completed}/{progress.total} {t.academy.lessons}</span>
                        <span className="text-[10px] text-warning font-medium">+{course.xpReward} XP</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {t.academy.achievements}
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex flex-col items-center p-3 rounded-xl bg-surface/50 border border-border-subtle text-center">
                    <span className="text-2xl mb-1">{achievement.iconUrl}</span>
                    <p className="text-[11px] font-semibold text-text-primary">{achievement.title}</p>
                    <p className="text-[9px] text-text-tertiary mt-0.5">+{achievement.xpReward} XP</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </>
      )}

      <Modal
        open={Boolean(selectedLesson)}
        onClose={() => setSelectedLesson(null)}
        title={lessonModalTitle}
        description={lessonModalDescription}
      >
        {selectedLesson && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">{selectedLesson.course.category}</Badge>
              <Badge variant={completedLessonIds.includes(selectedLesson.lesson.id) ? 'success' : 'secondary'}>
                {completedLessonIds.includes(selectedLesson.lesson.id) ? t.common.completed : t.common.pending}
              </Badge>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface/50 p-4">
              <p className="text-sm leading-relaxed text-text-secondary">{selectedLesson.lesson.content}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Copy className="w-3.5 h-3.5" />}
                onClick={() => {
                  void copyLessonContent(selectedLesson.lesson)
                }}
              >
                {copiedLessonId === selectedLesson.lesson.id ? t.common.copied : t.common.copy}
              </Button>

              {(selectedLesson.lesson.type === 'download' || selectedLesson.lesson.type === 'worksheet') && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => downloadLessonContent(selectedLesson.lesson)}
                >
                  {locale === 'tr' ? 'Dosyayi indir' : 'Download file'}
                </Button>
              )}

              {selectedLesson.lesson.type === 'roleplay' && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSelectedLesson(null)
                    router.push('/ai')
                  }}
                >
                  {locale === 'tr' ? 'AI Koçu ile pratik yap' : 'Practice with AI Coach'}
                </Button>
              )}

              <Button
                type="button"
                size="sm"
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => toggleLessonComplete(selectedLesson.lesson.id)}
              >
                {completedLessonIds.includes(selectedLesson.lesson.id)
                  ? (locale === 'tr' ? 'Tamamlanmis' : 'Completed')
                  : (locale === 'tr' ? 'Tamamlandi isaretle' : 'Mark complete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}
