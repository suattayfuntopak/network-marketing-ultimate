// ============================================================
// Network Marketing Ultimate (NMU)
// Core Type Definitions
// ============================================================

export type UserRole = 'solo' | 'member' | 'leader' | 'org_leader' | 'academy_manager' | 'content_manager' | 'admin' | 'super_admin'

export type PipelineStage =
  | 'new'
  | 'contact_planned'
  | 'first_contact'
  | 'interested'
  | 'invited'
  | 'presentation_sent'
  | 'presentation_done'
  | 'followup_pending'
  | 'objection_handling'
  | 'ready_to_buy'
  | 'became_customer'
  | 'ready_to_join'
  | 'became_member'
  | 'nurture_later'
  | 'dormant'
  | 'lost'

export type ContactTemperature = 'cold' | 'warm' | 'hot' | 'frozen'
export type InterestType = 'product' | 'business' | 'both' | 'unknown'
export type CommunicationChannel = 'phone' | 'whatsapp' | 'sms' | 'email' | 'in_person' | 'social_dm' | 'video_call'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  timezone: string
  language: string
  organizationId?: string
  teamId?: string
  leaderId?: string
  rank?: string
  joinDate: string
  streak: number
  xp: number
  level: number
  momentumScore: number
  settings: UserSettings
}

export interface UserSettings {
  theme: 'dark' | 'light'
  notifications: boolean
  reducedMotion: boolean
  dailyGoalReminders: boolean
  aiSuggestions: boolean
}

export interface Contact {
  id: string
  userId: string
  fullName: string
  avatar?: string
  email?: string
  phone?: string
  location?: string
  timezone?: string
  language?: string
  tags: string[]
  source: string
  status: 'active' | 'inactive' | 'do_not_contact'
  pipelineStage: PipelineStage
  interestType: InterestType
  temperature: ContactTemperature
  temperatureScore: number
  relationshipStrength: number
  lastContactDate?: string
  nextFollowUpDate?: string
  preferredChannel: CommunicationChannel
  referredBy?: string
  assignedLeader?: string
  birthday?: string
  profession?: string
  familyNotes?: string
  goalsNotes?: string
  complianceNotes?: string
  objectionTags: string[]
  createdAt: string
  updatedAt: string
}

export interface Interaction {
  id: string
  contactId: string
  userId: string
  type: 'call' | 'message' | 'meeting' | 'email' | 'note' | 'presentation' | 'follow_up'
  channel: CommunicationChannel
  content: string
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response'
  nextAction?: string
  date: string
  duration?: number
}

export interface Task {
  id: string
  userId: string
  contactId?: string
  title: string
  description?: string
  type: 'follow_up' | 'call' | 'message' | 'meeting' | 'presentation' | 'onboarding' | 'training' | 'motivation' | 'custom'
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  completedAt?: string
  createdAt: string
}

export interface Pipeline {
  id: string
  userId: string
  name: string
  stages: PipelineStageConfig[]
  isDefault: boolean
}

export interface PipelineStageConfig {
  stage: PipelineStage
  label: string
  color: string
  order: number
  probability: number
  requiredActions: string[]
  automationTriggers: string[]
}

export interface Product {
  id: string
  name: string
  category: string
  description: string
  price: number
  imageUrl?: string
  tags: string[]
  reorderCycleDays?: number
}

export interface CustomerOrder {
  id: string
  contactId: string
  userId: string
  products: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned'
  orderDate: string
  nextReorderDate?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

export interface Recruit {
  id: string
  contactId: string
  sponsorId: string
  status: 'prospect' | 'signed_up' | 'onboarding' | 'active' | 'inactive' | 'churned'
  joinDate?: string
  onboardingFlowId?: string
  onboardingProgress: number
  launchMomentumScore: number
  firstCustomerDate?: string
  firstRecruitDate?: string
}

export interface OnboardingFlow {
  id: string
  name: string
  description: string
  steps: OnboardingStep[]
  createdBy: string
  isTemplate: boolean
}

export interface OnboardingStep {
  id: string
  order: number
  title: string
  description: string
  type: 'task' | 'training' | 'checklist' | 'quiz' | 'meeting'
  resourceUrl?: string
  dueAfterDays: number
  isRequired: boolean
}

export interface AcademyCourse {
  id: string
  title: string
  description: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'leader'
  modules: AcademyModule[]
  thumbnailUrl?: string
  xpReward: number
  estimatedMinutes: number
  order: number
  isPublished: boolean
}

export interface AcademyModule {
  id: string
  courseId: string
  title: string
  description: string
  lessons: AcademyLesson[]
  order: number
}

export interface AcademyLesson {
  id: string
  moduleId: string
  title: string
  type: 'video' | 'text' | 'audio' | 'checklist' | 'quiz' | 'roleplay' | 'download' | 'worksheet' | 'challenge'
  content: string
  resourceUrl?: string
  durationMinutes: number
  xpReward: number
  order: number
}

export interface UserProgress {
  id: string
  userId: string
  courseId: string
  moduleId: string
  lessonId: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: string
  score?: number
  xpEarned: number
}

export interface Certification {
  id: string
  userId: string
  courseId: string
  title: string
  earnedAt: string
  score: number
  badgeUrl?: string
}

export interface Script {
  id: string
  title: string
  category: string
  subcategory: string
  content: string
  tags: string[]
  language: string
  createdBy: string
  usageCount: number
  rating: number
}

export interface Objection {
  id: string
  category: string
  objection: string
  responses: ObjectionResponse[]
  tags: string[]
}

export interface ObjectionResponse {
  id: string
  tone: 'empathetic' | 'direct' | 'storytelling' | 'data_driven'
  script: string
}

export interface Event {
  id: string
  userId: string
  title: string
  description: string
  type: 'online_presentation' | 'home_meeting' | 'team_zoom' | 'training' | 'workshop' | 'leadership' | 'local' | 'regional' | 'global'
  startDate: string
  endDate: string
  location?: string
  meetingUrl?: string
  maxAttendees?: number
  attendees: EventAttendee[]
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled'
  followUpFlowId?: string
}

export interface EventAttendee {
  contactId: string
  name: string
  rsvpStatus: 'invited' | 'confirmed' | 'attended' | 'no_show' | 'declined'
  followUpStatus: 'pending' | 'sent' | 'converted' | 'lost'
}

export interface Achievement {
  id: string
  userId: string
  type: 'first_sale' | 'first_recruit' | 'streak_7' | 'streak_30' | 'course_complete' | 'rank_advance' | 'team_10' | 'team_50' | 'team_100'
  title: string
  description: string
  iconUrl: string
  earnedAt: string
  xpReward: number
}

export interface Rank {
  id: string
  name: string
  level: number
  requirements: RankRequirement[]
  benefits: string[]
  badgeUrl: string
  color: string
}

export interface RankRequirement {
  type: 'personal_sales' | 'team_size' | 'team_volume' | 'frontline' | 'rank_advances' | 'training_complete'
  value: number
  label: string
}

export interface RankProgress {
  userId: string
  currentRankId: string
  nextRankId?: string
  requirements: RankRequirementProgress[]
  overallProgress: number
}

export interface RankRequirementProgress {
  requirement: RankRequirement
  current: number
  percentage: number
  isMet: boolean
}

export interface Notification {
  id: string
  userId: string
  type: 'follow_up_due' | 'task_overdue' | 'achievement' | 'rank_progress' | 'team_alert' | 'ai_suggestion' | 'event_reminder' | 'course_reminder' | 'system'
  title: string
  message: string
  actionUrl?: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface AIRecommendation {
  id: string
  userId: string
  type: 'next_action' | 'follow_up_draft' | 'script_suggestion' | 'coaching_tip' | 'lead_heat' | 'reorder_alert' | 'course_recommendation' | 'weekly_summary'
  title: string
  description: string
  actionLabel?: string
  actionUrl?: string
  confidence: number
  context: Record<string, unknown>
  isDismissed: boolean
  createdAt: string
}

export interface Automation {
  id: string
  userId: string
  name: string
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  isActive: boolean
  runCount: number
  lastRun?: string
}

export interface AutomationTrigger {
  type: 'stage_change' | 'task_overdue' | 'date_reached' | 'inactivity' | 'order_placed' | 'course_completed' | 'event_attended' | 'manual'
  config: Record<string, unknown>
}

export interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'days_since' | 'is_empty' | 'is_not_empty'
  value: unknown
}

export interface AutomationAction {
  type: 'send_notification' | 'create_task' | 'update_stage' | 'send_message' | 'add_tag' | 'assign_training' | 'ai_suggest'
  config: Record<string, unknown>
}

export interface AnalyticsEvent {
  id: string
  userId: string
  event: string
  properties: Record<string, unknown>
  timestamp: string
}

export interface DashboardWidget {
  id: string
  type: string
  title: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  position: { x: number; y: number }
  config: Record<string, unknown>
  isVisible: boolean
}

export interface TeamMember {
  user: User
  recruit?: Recruit
  activityScore: number
  lastActive: string
  pipelineHealth: 'strong' | 'moderate' | 'weak' | 'critical'
  onboardingStatus: 'not_started' | 'in_progress' | 'completed'
  riskLevel: 'low' | 'medium' | 'high'
}
