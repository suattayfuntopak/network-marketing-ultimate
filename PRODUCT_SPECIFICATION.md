# NMOS — Network Marketing Operating System
## Complete Product Specification Document

---

## 1. PRODUCT CONCEPT SUMMARY

**NMOS** is a premium, production-grade SaaS platform designed as the unified command center for network marketing professionals worldwide.

**Core Promise:** "Run your entire network marketing business from one intelligent system."

**Secondary Promise:** "From prospect to customer, from customer to teammate, from teammate to leader."

**Brand Personality:** Premium, visionary, magnetic, disciplined, intelligent, inspiring, modern, slightly futuristic, trustworthy, elite but human.

---

## 2. TARGET USERS & PERSONAS

### Persona 1: New Distributor
- **Goals:** Get started quickly, build confidence, make first sale
- **Fears:** Overwhelm, not knowing what to do, looking foolish
- **Dashboard Priorities:** Daily action checklist, scripts, onboarding progress
- **Key Actions:** Add contacts, use scripts, complete academy modules

### Persona 2: Active Seller
- **Goals:** Increase conversions, retain customers, grow revenue
- **Fears:** Losing customers, inconsistent income, burnout
- **Dashboard Priorities:** Follow-ups due, reorder alerts, sales metrics
- **Key Actions:** Log interactions, process orders, send follow-ups

### Persona 3: Builder / Recruiter
- **Goals:** Recruit quality team members, duplicate systems
- **Fears:** Team members quitting, lack of duplication, doing everything alone
- **Dashboard Priorities:** Recruitment pipeline, onboarding status, team activity
- **Key Actions:** Book presentations, onboard new members, assign training

### Persona 4: Team Leader
- **Goals:** Develop leaders, track team performance, identify bottlenecks
- **Fears:** Team stagnation, key people leaving, rank regression
- **Dashboard Priorities:** Team pulse, activity heatmap, rank progress
- **Key Actions:** Coach team members, launch campaigns, monitor analytics

### Persona 5: Organization Builder
- **Goals:** Scale organization, executive insights, geographic expansion
- **Fears:** Losing visibility, cultural misalignment, compliance issues
- **Dashboard Priorities:** Executive analytics, retention insights, leader pipeline
- **Key Actions:** Strategic planning, content distribution, event management

---

## 3. INFORMATION ARCHITECTURE

```
NMOS
├── Dashboard (Command Center)
├── Prospects (Lead Management)
├── Contacts (Full CRM)
├── Customers (Order & Retention)
├── Pipeline (Kanban Board)
├── Tasks & Follow-ups
├── Team / Organization
├── Academy / Learning Hub
│   ├── Onboarding Campus
│   ├── Product Mastery
│   ├── Prospecting Mastery
│   ├── Invitation Mastery
│   ├── Presentation Mastery
│   ├── Follow-up Mastery
│   ├── Closing Mastery
│   ├── Customer Retention
│   ├── Team Building
│   ├── Leadership & Duplication
│   ├── Social Media & Brand
│   ├── Event Building
│   ├── Ethics & Compliance
│   └── Time Management
├── Scripts & Content Vault
├── Events
├── Campaigns
├── Rank & Goals
├── Analytics Center
├── AI Growth Coach
├── Automations
├── Notifications
├── Settings
└── Admin Panel
```

---

## 4. COMPLETE FEATURE MAP

### 4.1 Prospecting OS
- Manual contact entry
- CSV import
- Phone contact import
- Web lead form integration
- Social DM lead capture
- QR/Event lead capture
- Referral tracking
- AI-assisted lead enrichment
- Contact segmentation by tags, source, temperature

### 4.2 Relationship CRM
- Full contact profiles (name, avatar, location, timezone, language)
- Communication history timeline
- Interaction logging (call, message, meeting, email, note)
- Tags and custom fields
- Pipeline stage tracking
- Temperature scoring (cold/warm/hot)
- Relationship strength scoring
- Follow-up scheduling
- Objection tagging
- Preferred channel tracking
- Birthday and personal context notes

### 4.3 Sales Conversion Engine
- Product catalog with categories
- Product recommendation flows
- Order tracking
- Reorder reminders
- Customer satisfaction notes
- Upsell/cross-sell suggestions
- Testimonial collection workflows

### 4.4 Recruiting & Enrollment Engine
- Recruitment funnel tracking
- Presentation booking
- Follow-up sequences
- Objection handling library
- Sign-up processing
- Onboarding flow assignment

### 4.5 Team Duplication System
- Launch checklists (48h, 7-day, 30-day)
- Onboarding templates
- Script packs
- Weekly action plans
- Accountability check-ins
- Leader scorecards
- Mentorship chains
- Team challenges
- Campaign duplication kits

### 4.6 Academy / Learning Hub
- Role-based learning paths
- Video, text, audio lessons
- Interactive checklists
- Quizzes and certifications
- AI roleplay training
- Objection handling simulator
- Progress tracking
- XP and badge system
- AI lesson summaries
- AI Q&A tutor

### 4.7 Performance & Analytics
- Personal activity analytics
- Conversion funnel analytics
- Customer retention analytics
- Team growth analytics
- Academy completion analytics
- Event analytics
- Campaign analytics
- Rank progress analytics
- Cohort analytics
- Leaderboard analytics
- Forecast analytics

### 4.8 AI Growth Assistant
- Next-best action suggestions
- Message drafting
- Script personalization
- Contact history summaries
- Pipeline stagnation detection
- Lead heat prediction
- Course recommendations
- Coaching intervention suggestions
- Weekly business review
- Roleplay training partner

---

## 5. PAGE-BY-PAGE BREAKDOWN

### 5.1 Dashboard (`/dashboard`)
- **Hero Command Card:** Greeting, today's focus, quick actions, momentum score
- **KPI Strip:** 8 key metrics at a glance
- **Today's Tasks:** Prioritized task list with contact avatars
- **Pipeline Overview:** Stage distribution cards
- **Weekly Activity Chart:** Area chart with contacts and presentations
- **AI Recommendations:** Smart insights with confidence scores
- **Hot Leads:** Temperature-sorted lead list
- **Team Pulse:** Member activity and health indicators
- **Upcoming Events:** Event cards with RSVP status
- **Recent Wins:** Achievement feed with XP rewards

### 5.2 Prospects (`/prospects`)
- Temperature summary cards (hot/warm/cold)
- Search and filter controls
- List/Grid view toggle
- Contact table with stage, temperature, interest, last contact
- Card grid with quick action buttons
- Import/Export functionality

### 5.3 Contacts (`/contacts`)
- Contact grid with temperature badges
- Detail view with full profile
- Interaction history timeline
- Related tasks
- Quick action buttons (call, message)
- Tags, notes, personal context

### 5.4 Pipeline (`/pipeline`)
- Kanban board with drag-and-drop
- Stage columns with contact cards
- Temperature and interest badges
- Next follow-up indicators
- Quick action overlays

### 5.5 Academy (`/academy`)
- Learning path visualization
- Course grid with progress indicators
- Course detail with module breakdown
- Lesson player (video, text, quiz, roleplay)
- Achievement badges
- XP tracking

### 5.6 Team (`/team`)
- Team member cards with activity scores
- Risk level indicators
- Onboarding progress bars
- Pipeline health badges
- Duplication toolkit

### 5.7 Analytics (`/analytics`)
- KPI cards with trend indicators
- Activity bar charts
- Conversion area charts
- Pipeline pie chart
- Team activity heatmap
- Conversion funnel visualization

### 5.8 AI Coach (`/ai`)
- Capability cards
- Smart insights feed
- Interactive chat interface
- Quick prompt suggestions

### 5.9 Events (`/events`)
- Event cards with type badges
- RSVP tracking
- Date/time/location details
- Attendee management

### 5.10 Campaigns (`/campaigns`)
- Quick launch templates
- Active campaign cards
- Progress tracking
- Enrollment metrics

### 5.11 Scripts (`/scripts`)
- Category filtering
- Script cards with copy functionality
- Objection handling library
- Usage statistics and ratings

### 5.12 Rank & Goals (`/rank`)
- Current rank hero with circular progress
- Next rank requirements with progress bars
- Rank ladder visualization
- Daily goals tracker

### 5.13 Tasks (`/tasks`)
- Filter tabs (all/pending/completed/overdue)
- Task list with priority badges
- Contact avatars
- Type icons

### 5.14 Customers (`/customers`)
- Customer cards with order history
- Revenue metrics
- Product catalog
- Reorder tracking

### 5.15 Automations (`/automations`)
- Automation list with status
- Template gallery
- Run statistics

### 5.16 Admin (`/admin`)
- System metrics
- Management sections (Users, Content, Settings, Security, Analytics, Localization)

### 5.17 Settings (`/settings`)
- Profile management
- Appearance (theme, reduced motion)
- Notification preferences
- AI preferences
- Subscription management

### 5.18 Notifications (`/notifications`)
- Unread/read sections
- Type-based icons and colors
- Priority badges
- Timestamp display

---

## 6. DESIGN SYSTEM

### Color Palette
- **Background:** Obsidian (#0a0a0f), Graphite (#12121a), Surface (#1e1e2e)
- **Primary:** Electric Cyan (#00d4ff)
- **Secondary:** Violet (#8b5cf6)
- **Accent:** Ultraviolet (#a855f7)
- **Success:** Emerald (#10b981)
- **Warning:** Amber (#f59e0b)
- **Error:** Crimson (#ef4444)
- **Text:** Cool Gray (#f1f5f9) to Muted (#475569)

### Typography
- **Font:** Inter (geometric, highly legible)
- **Headings:** Bold, strong hierarchy
- **Body:** Regular, comfortable reading
- **Numbers:** Tabular nums for KPI alignment

### Components
- **Cards:** Glass-effect backgrounds, subtle borders, hover states
- **Buttons:** Primary (cyan glow), secondary (violet), ghost, outline, danger
- **Badges:** Color-coded variants, temperature badges
- **Avatars:** Gradient fallbacks, status indicators, grouped display
- **Progress:** Animated bars, circular progress rings
- **Inputs:** Dark surface, focus glow states

### Animations
- **Page transitions:** Staggered fade-in with slide-up
- **Hover effects:** Subtle lift, glow intensification
- **Loading:** Shimmer skeletons
- **Charts:** Smooth value transitions
- **Celebrations:** Achievement unlock animations

---

## 7. TECHNICAL ARCHITECTURE

### Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with custom theme
- **State:** Zustand
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Command center
│   ├── prospects/          # Lead management
│   ├── contacts/           # Full CRM
│   ├── customers/          # Customer management
│   ├── pipeline/           # Kanban board
│   ├── tasks/              # Task management
│   ├── academy/            # Learning hub
│   ├── scripts/            # Content vault
│   ├── events/             # Event management
│   ├── campaigns/          # Campaign center
│   ├── team/               # Team management
│   ├── rank/               # Rank & goals
│   ├── analytics/          # Performance center
│   ├── ai/                 # AI coach
│   ├── automations/        # Automation center
│   ├── notifications/      # Notification center
│   ├── settings/           # User settings
│   └── admin/              # Admin panel
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── Input.tsx
│   │   └── Progress.tsx
│   └── layout/             # Layout components
│       ├── AppLayout.tsx
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── AIPanel.tsx
├── lib/
│   └── utils.ts            # Utility functions
├── store/
│   └── appStore.ts         # Zustand state management
├── types/
│   └── index.ts            # TypeScript type definitions
└── data/
    └── mockData.ts         # Rich mock data
```

---

## 8. DATABASE SCHEMA (Recommended)

### Core Tables
- `users` — User accounts with roles and settings
- `organizations` — Team/company groupings
- `contacts` — Full contact records with CRM fields
- `interactions` — Communication history
- `tasks` — Follow-ups and action items
- `products` — Product catalog
- `customer_orders` — Order records
- `academy_courses` — Learning content
- `academy_modules` — Course modules
- `academy_lessons` — Individual lessons
- `user_progress` — Learning progress tracking
- `scripts` — Script library
- `objections` — Objection handling database
- `events` — Event records
- `event_attendees` — RSVP tracking
- `campaigns` — Campaign definitions
- `campaign_enrollments` — Campaign participation
- `automations` — Automation rules
- `notifications` — Notification queue
- `achievements` — Gamification badges
- `ranks` — Rank definitions
- `rank_progress` — User rank tracking
- `ai_recommendations` — AI suggestion cache
- `analytics_events` — Event tracking

---

## 9. API STRUCTURE (Recommended)

### RESTful Endpoints
```
/api/auth/*          — Authentication
/api/users/*         — User management
/api/contacts/*      — Contact CRUD
/api/interactions/*  — Interaction logging
/api/tasks/*         — Task management
/api/pipeline/*      — Pipeline operations
/api/products/*      — Product catalog
/api/orders/*        — Order management
/api/academy/*       — Learning content
/api/scripts/*       — Script library
/api/events/*        — Event management
/api/campaigns/*     — Campaign operations
/api/automations/*   — Automation rules
/api/analytics/*     — Analytics queries
/api/ai/*            — AI recommendations
/api/notifications/* — Notification management
```

---

## 10. MONETIZATION MODEL

### Tiers
1. **Free** — Basic CRM, 50 contacts, limited academy
2. **Pro Individual** ($29/mo) — Unlimited contacts, AI coach, full academy
3. **Team** ($79/mo) — Team management, duplication tools, analytics
4. **Leadership** ($149/mo) — Advanced analytics, campaigns, admin tools
5. **Enterprise** (Custom) — White-label, API access, custom integrations

### Add-ons
- AI Coach Pro — Advanced AI features
- Academy Premium — Exclusive courses
- Template Marketplace — Community-created assets

---

## 11. LAUNCH ROADMAP

### Phase 1: Foundation (Complete)
- Core design system
- Dashboard with widgets
- Contact/CRM module
- Pipeline board
- Task management
- Academy framework
- Team management
- Analytics center
- AI assistant
- Events & campaigns
- Admin panel

### Phase 2: Backend Integration
- PostgreSQL database setup
- Authentication system (NextAuth)
- REST API implementation
- Real-time notifications (WebSocket)
- File storage (S3/Cloudflare R2)

### Phase 3: Advanced Features
- AI integration (OpenAI/Anthropic)
- Email/SMS automation
- Payment processing (Stripe)
- Advanced analytics with ML
- Mobile app (React Native)

### Phase 4: Scale
- Multi-tenancy
- White-label support
- Marketplace
- API for third-party integrations
- Global CDN deployment

---

## 12. KEY DIFFERENTIATORS

1. **Premium Design** — Apple-level emotional first impression with dark premium aesthetics
2. **AI-First** — Embedded AI coach across every module
3. **Duplication Engine** — Systematic approach to team scaling
4. **Academy Integration** — Native learning, not a bolt-on LMS
5. **Gamification** — Premium momentum tracking, not childish badges
6. **Global Ready** — Multi-language, multi-timezone, any company
7. **Unified Platform** — Everything from prospecting to leadership in one place

---

*NMOS — The Network Marketing Operating System*
*Run your entire business from one intelligent system.*
