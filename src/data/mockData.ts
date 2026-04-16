import type {
  User, Contact, Task, Interaction, PipelineStageConfig, Product, CustomerOrder,
  AcademyCourse, Script, Objection, Event, Campaign, Achievement, Rank,
  Notification, AIRecommendation, Automation, TeamMember
} from '@/types'

// ============================================================
// CURRENT USER
// ============================================================
export const currentUser: User = {
  id: 'u1',
  email: 'sarah.chen@email.com',
  name: 'Sarah Chen',
  avatar: '',
  role: 'leader',
  timezone: 'America/Los_Angeles',
  language: 'tr',
  organizationId: 'org1',
  teamId: 'team1',
  rank: 'Altın Direktör',
  joinDate: '2024-03-15',
  streak: 23,
  xp: 12450,
  level: 18,
  momentumScore: 87,
  settings: {
    theme: 'dark',
    notifications: true,
    reducedMotion: false,
    dailyGoalReminders: true,
    aiSuggestions: true,
  }
}

// ============================================================
// CONTACTS
// ============================================================
export const contacts: Contact[] = [
  {
    id: 'c1', userId: 'u1', fullName: 'Marcus Johnson', email: 'marcus.j@email.com',
    phone: '+1-555-0101', location: 'Austin, TX', timezone: 'CST', language: 'en',
    tags: ['ılık', 'fitness', 'girişimci'], source: 'Instagram DM', status: 'active',
    pipelineStage: 'interested', interestType: 'both', temperature: 'hot', temperatureScore: 92,
    relationshipStrength: 78, lastContactDate: '2026-04-12', nextFollowUpDate: '2026-04-15',
    preferredChannel: 'whatsapp', profession: 'Kişisel Antrenör', birthday: '1990-06-15',
    familyNotes: 'Evli, 2 çocuk', goalsNotes: 'Finansal özgürlük, pasif gelir oluşturmak',
    objectionTags: ['zaman_kaygısı'], createdAt: '2026-03-01', updatedAt: '2026-04-12'
  },
  {
    id: 'c2', userId: 'u1', fullName: 'Elena Rodriguez', email: 'elena.r@email.com',
    phone: '+1-555-0102', location: 'Miami, FL', timezone: 'EST', language: 'es',
    tags: ['sıcak', 'cilt_bakımı', 'sadık_müşteri'], source: 'Referans - Maria S.', status: 'active',
    pipelineStage: 'ready_to_buy', interestType: 'product', temperature: 'hot', temperatureScore: 95,
    relationshipStrength: 88, lastContactDate: '2026-04-13', nextFollowUpDate: '2026-04-14',
    preferredChannel: 'phone', profession: 'Pazarlama Müdürü', birthday: '1988-03-22',
    familyNotes: 'Bekar, 1 kız çocuk', goalsNotes: 'Harika cilt, sağlıklı yaşam tarzı',
    objectionTags: [], createdAt: '2026-01-15', updatedAt: '2026-04-13'
  },
  {
    id: 'c3', userId: 'u1', fullName: 'James Park', email: 'james.park@email.com',
    phone: '+1-555-0103', location: 'Seattle, WA', timezone: 'PST', language: 'en',
    tags: ['soğuk', 'teknoloji', 'şüpheci'], source: 'LinkedIn', status: 'active',
    pipelineStage: 'first_contact', interestType: 'business', temperature: 'cold', temperatureScore: 35,
    relationshipStrength: 22, lastContactDate: '2026-04-08', nextFollowUpDate: '2026-04-16',
    preferredChannel: 'email', profession: 'Yazılım Mühendisi', birthday: '1992-11-08',
    familyNotes: 'Evli, çocuk yok', goalsNotes: 'Ek gelir, erken emeklilik',
    objectionTags: ['mlm_şüphe', 'zaman_kaygısı'], createdAt: '2026-04-05', updatedAt: '2026-04-08'
  },
  {
    id: 'c4', userId: 'u1', fullName: 'Aisha Williams', email: 'aisha.w@email.com',
    phone: '+1-555-0104', location: 'Atlanta, GA', timezone: 'EST', language: 'en',
    tags: ['ılık', 'wellness', 'influencer'], source: 'Facebook Grubu', status: 'active',
    pipelineStage: 'invited', interestType: 'both', temperature: 'warm', temperatureScore: 72,
    relationshipStrength: 65, lastContactDate: '2026-04-11', nextFollowUpDate: '2026-04-15',
    preferredChannel: 'social_dm', profession: 'Yoga Eğitmeni', birthday: '1995-01-30',
    familyNotes: 'Nişanlı', goalsNotes: 'Marka oluşturmak, finansal bağımsızlık',
    objectionTags: ['yatırım_kaygısı'], createdAt: '2026-02-20', updatedAt: '2026-04-11'
  },
  {
    id: 'c5', userId: 'u1', fullName: 'David Kim', email: 'david.kim@email.com',
    phone: '+1-555-0105', location: 'San Francisco, CA', timezone: 'PST', language: 'en',
    tags: ['müşteri', 'beslenme', 'sadık'], source: 'Ürün Demo Etkinliği', status: 'active',
    pipelineStage: 'became_customer', interestType: 'product', temperature: 'warm', temperatureScore: 68,
    relationshipStrength: 82, lastContactDate: '2026-04-10', nextFollowUpDate: '2026-04-20',
    preferredChannel: 'email', profession: 'Şef', birthday: '1985-09-12',
    familyNotes: 'Evli, 3 çocuk', goalsNotes: 'Sağlıklı aile, beslenme bilgisi',
    objectionTags: [], createdAt: '2025-11-01', updatedAt: '2026-04-10'
  },
  {
    id: 'c6', userId: 'u1', fullName: 'Priya Sharma', email: 'priya.s@email.com',
    phone: '+1-555-0106', location: 'Chicago, IL', timezone: 'CST', language: 'en',
    tags: ['yeni_üye', 'motiveli', 'kurucu'], source: 'Webinar', status: 'active',
    pipelineStage: 'became_member', interestType: 'business', temperature: 'hot', temperatureScore: 88,
    relationshipStrength: 70, lastContactDate: '2026-04-13', nextFollowUpDate: '2026-04-14',
    preferredChannel: 'whatsapp', profession: 'Muhasebeci', birthday: '1993-07-19',
    familyNotes: 'Evli, 1 çocuk', goalsNotes: 'Geliri değiştirmek, aile için zaman özgürlüğü',
    objectionTags: [], createdAt: '2026-04-01', updatedAt: '2026-04-13'
  },
  {
    id: 'c7', userId: 'u1', fullName: 'Tom Bradley', email: 'tom.b@email.com',
    phone: '+1-555-0107', location: 'Denver, CO', timezone: 'MST', language: 'en',
    tags: ['ılık', 'spor', 'ilgili'], source: 'Spor Salonu Referansı', status: 'active',
    pipelineStage: 'presentation_sent', interestType: 'business', temperature: 'warm', temperatureScore: 65,
    relationshipStrength: 45, lastContactDate: '2026-04-09', nextFollowUpDate: '2026-04-15',
    preferredChannel: 'phone', profession: 'Fizyoterapist', birthday: '1987-04-03',
    familyNotes: 'Boşanmış, 2 çocuk', goalsNotes: 'Ek gelir, başkalarına sağlıklı olmada yardım',
    objectionTags: ['zaman_kaygısı', 'önceki_deneyim'], createdAt: '2026-03-15', updatedAt: '2026-04-09'
  },
  {
    id: 'c8', userId: 'u1', fullName: 'Sophie Laurent', email: 'sophie.l@email.com',
    phone: '+1-555-0108', location: 'New York, NY', timezone: 'EST', language: 'fr',
    tags: ['soğuk', 'lüks', 'ağ_kurucu'], source: 'İş Konferansı', status: 'active',
    pipelineStage: 'contact_planned', interestType: 'unknown', temperature: 'cold', temperatureScore: 28,
    relationshipStrength: 15, lastContactDate: '2026-04-06', nextFollowUpDate: '2026-04-17',
    preferredChannel: 'email', profession: 'Lüks Gayrimenkul', birthday: '1991-12-25',
    familyNotes: 'Bekar', goalsNotes: 'Ağı genişletmek, lüks yaşam markası',
    objectionTags: [], createdAt: '2026-04-06', updatedAt: '2026-04-06'
  },
  {
    id: 'c9', userId: 'u1', fullName: 'Carlos Mendez', email: 'carlos.m@email.com',
    phone: '+1-555-0109', location: 'Phoenix, AZ', timezone: 'MST', language: 'es',
    tags: ['müşteri', 'takviye', 'tutkulu'], source: 'Instagram Reklamı', status: 'active',
    pipelineStage: 'became_customer', interestType: 'product', temperature: 'warm', temperatureScore: 75,
    relationshipStrength: 60, lastContactDate: '2026-04-07', nextFollowUpDate: '2026-04-21',
    preferredChannel: 'whatsapp', profession: 'İtfaiyeci', birthday: '1989-08-14',
    familyNotes: 'Evli, çocuk yok', goalsNotes: 'Zirve fitness, vardiyalar için enerji',
    objectionTags: [], createdAt: '2026-02-01', updatedAt: '2026-04-07'
  },
  {
    id: 'c10', userId: 'u1', fullName: 'Rachel Green', email: 'rachel.g@email.com',
    phone: '+1-555-0110', location: 'Portland, OR', timezone: 'PST', language: 'en',
    tags: ['ılık', 'eko', 'bilinçli'], source: 'Wellness Retreat', status: 'active',
    pipelineStage: 'followup_pending', interestType: 'both', temperature: 'warm', temperatureScore: 60,
    relationshipStrength: 55, lastContactDate: '2026-04-05', nextFollowUpDate: '2026-04-15',
    preferredChannel: 'in_person', profession: 'Çevre Danışmanı', birthday: '1994-02-17',
    familyNotes: 'Partner, çocuk yok', goalsNotes: 'Sürdürülebilir iş, etik gelir',
    objectionTags: ['fiyat_kaygısı'], createdAt: '2026-03-10', updatedAt: '2026-04-05'
  },
  {
    id: 'c11', userId: 'u1', fullName: 'Michael Foster', email: 'michael.f@email.com',
    phone: '+1-555-0111', location: 'Nashville, TN', timezone: 'CST', language: 'en',
    tags: ['yeni_üye', 'müzikçi', 'yaratıcı'], source: 'Ekip Etkinliği', status: 'active',
    pipelineStage: 'became_member', interestType: 'both', temperature: 'hot', temperatureScore: 85,
    relationshipStrength: 72, lastContactDate: '2026-04-13', nextFollowUpDate: '2026-04-14',
    preferredChannel: 'phone', profession: 'Müzik Prodüktörü', birthday: '1990-10-05',
    familyNotes: 'Bekar', goalsNotes: 'Yaratıcı özgürlük, topluluk oluşturmak',
    objectionTags: [], createdAt: '2026-04-05', updatedAt: '2026-04-13'
  },
  {
    id: 'c12', userId: 'u1', fullName: 'Nina Volkov', email: 'nina.v@email.com',
    phone: '+1-555-0112', location: 'Boston, MA', timezone: 'EST', language: 'en',
    tags: ['soğuk', 'akademik', 'analitik'], source: 'LinkedIn Paylaşımı', status: 'active',
    pipelineStage: 'nurture_later', interestType: 'business', temperature: 'cold', temperatureScore: 20,
    relationshipStrength: 18, lastContactDate: '2026-03-20', nextFollowUpDate: '2026-05-01',
    preferredChannel: 'email', profession: 'Üniversite Profesörü', birthday: '1982-05-11',
    familyNotes: 'Evli, 2 genç', goalsNotes: 'Araştırma fonu, izin dönemi geliri',
    objectionTags: ['mlm_şüphe', 'itibar_kaygısı'], createdAt: '2026-03-15', updatedAt: '2026-03-20'
  },
]

// ============================================================
// TASKS
// ============================================================
export const tasks: Task[] = [
  { id: 't1', userId: 'u1', contactId: 'c2', title: 'Elena ile takip - yeniden sipariş hatırlatması', description: 'Geçen hafta serumunun azaldığını söyledi. Kontrol etmek için mükemmel zaman.', type: 'follow_up', status: 'pending', priority: 'high', dueDate: '2026-04-14', createdAt: '2026-04-13' },
  { id: 't2', userId: 'u1', contactId: 'c1', title: 'Marcus\'ı ara - sunum takibi', description: 'İş genel bakış videosunu gönderdi. Düşüncelerini takip et.', type: 'call', status: 'pending', priority: 'high', dueDate: '2026-04-15', createdAt: '2026-04-12' },
  { id: 't3', userId: 'u1', contactId: 'c6', title: 'Priya oryantasyon kontrolü - 3. Gün', description: 'İlk listesini gözden geçir, davet senaryolarında yardım et.', type: 'onboarding', status: 'pending', priority: 'high', dueDate: '2026-04-14', createdAt: '2026-04-11' },
  { id: 't4', userId: 'u1', contactId: 'c4', title: 'Aisha\'ya etkinlik daveti gönder', description: 'Gelecek Cumartesi yerel ürün tanıtımı. Çok sevecek.', type: 'custom', status: 'pending', priority: 'medium', dueDate: '2026-04-15', createdAt: '2026-04-11' },
  { id: 't5', userId: 'u1', contactId: 'c7', title: 'Tom\'u ara - sunum geri bildirimi', description: '2 gün önce videoyu izledi. Soruları yanıtlama zamanı.', type: 'call', status: 'pending', priority: 'medium', dueDate: '2026-04-15', createdAt: '2026-04-09' },
  { id: 't6', userId: 'u1', contactId: 'c10', title: 'Rachel\'e mesaj - itiraz yönetimi', description: 'Fiyat kaygıları vardı. Değer karşılaştırma belgesi gönder.', type: 'follow_up', status: 'pending', priority: 'medium', dueDate: '2026-04-15', createdAt: '2026-04-05' },
  { id: 't7', userId: 'u1', contactId: 'c11', title: 'Michael 1. Gün başlangıç araması', description: 'Yeni ekip üyesi! İlk 48 saat aksiyon planını uygula.', type: 'onboarding', status: 'pending', priority: 'urgent', dueDate: '2026-04-14', createdAt: '2026-04-13' },
  { id: 't8', userId: 'u1', contactId: 'c8', title: 'Sophie\'ye ilk ulaşım', description: 'Konferansta tanıştı. Kişiselleştirilmiş tanıtım mesajı gönder.', type: 'follow_up', status: 'pending', priority: 'low', dueDate: '2026-04-17', createdAt: '2026-04-06' },
  { id: 't9', userId: 'u1', title: 'Ekip Zoom - haftalık strateji çağrısı', description: 'Haftalık ekip çağrısı, kazanımları gözden geçir, haftalık hedefleri belirle.', type: 'meeting', status: 'pending', priority: 'medium', dueDate: '2026-04-16', createdAt: '2026-04-10' },
  { id: 't10', userId: 'u1', contactId: 'c5', title: 'David yeniden sipariş hatırlatması', description: '30 günlük tedarik yakında bitiyor. Memnuniyeti kontrol et ve yeniden sipariş ver.', type: 'follow_up', status: 'pending', priority: 'medium', dueDate: '2026-04-20', createdAt: '2026-04-10' },
  { id: 't11', userId: 'u1', title: 'Liderlik Modül 4\'i tamamla', description: 'Akademi görevi bu hafta teslim edilmeli.', type: 'training', status: 'pending', priority: 'low', dueDate: '2026-04-18', createdAt: '2026-04-08' },
  { id: 't12', userId: 'u1', contactId: 'c3', title: 'James\'e değer içeriği gönder', description: 'Bir sonraki temastan önce girişimci zihniyet makalesini paylaş.', type: 'follow_up', status: 'pending', priority: 'low', dueDate: '2026-04-16', createdAt: '2026-04-08' },
]

// ============================================================
// INTERACTIONS
// ============================================================
export const interactions: Interaction[] = [
  { id: 'i1', contactId: 'c1', userId: 'u1', type: 'call', channel: 'phone', content: 'İş fırsatını tartıştık. Kazanç planı detaylarıyla çok ilgileniyor. Sayıları görmek istiyor.', outcome: 'positive', nextAction: 'Kazanç planı dökümünü gönder', date: '2026-04-12', duration: 25 },
  { id: 'i2', contactId: 'c2', userId: 'u1', type: 'message', channel: 'whatsapp', content: 'Yeni serumu çok sevdi! Sıradaki gece kremini denemek istiyor. Bir arkadaşının ilgilenebileceğini belirtti.', outcome: 'positive', nextAction: 'Ürün numunelerini gönder, arkadaşını sor', date: '2026-04-13' },
  { id: 'i3', contactId: 'c6', userId: 'u1', type: 'meeting', channel: 'video_call', content: 'Oryantasyon oturumu. 25 kişilik ilk iletişim listesini oluşturdu. Çok motiveli ve organize.', outcome: 'positive', nextAction: 'Davet yaklaşımını gözden geçir', date: '2026-04-13', duration: 45 },
  { id: 'i4', contactId: 'c3', userId: 'u1', type: 'message', channel: 'email', content: 'Ürün bilgisi ile tanıtım e-postası gönderildi. İş modeli hakkında daha fazla detay soran kısa yanıt.', outcome: 'neutral', nextAction: 'İş genel bakış videosunu gönder', date: '2026-04-08' },
  { id: 'i5', contactId: 'c7', userId: 'u1', type: 'presentation', channel: 'video_call', content: 'Ekran paylaşımı yapıldı ve iş sunumu gezdirildi. Zaman taahhüdü hakkında iyi sorular sordu.', outcome: 'positive', nextAction: 'Zaman kaygısını takip et', date: '2026-04-09', duration: 35 },
]

// ============================================================
// PIPELINE STAGES
// ============================================================
export const pipelineStages: PipelineStageConfig[] = [
  { stage: 'new', label: 'Yeni Potansiyel', color: '#64748b', order: 0, probability: 5, requiredActions: [], automationTriggers: ['auto_welcome'] },
  { stage: 'contact_planned', label: 'İletişim Planlandı', color: '#8b5cf6', order: 1, probability: 10, requiredActions: ['İlk iletişimi planla'], automationTriggers: [] },
  { stage: 'first_contact', label: 'İlk İletişim', color: '#6366f1', order: 2, probability: 15, requiredActions: ['İlk etkileşimi kaydet'], automationTriggers: [] },
  { stage: 'interested', label: 'İlgileniyor', color: '#0ea5e9', order: 3, probability: 30, requiredActions: ['İlgi türünü belirle'], automationTriggers: [] },
  { stage: 'invited', label: 'Davet Edildi', color: '#06b6d4', order: 4, probability: 40, requiredActions: ['Sunum linkini gönder'], automationTriggers: [] },
  { stage: 'presentation_sent', label: 'Sunum Gönderildi', color: '#14b8a6', order: 5, probability: 50, requiredActions: ['Takip planla'], automationTriggers: ['auto_followup_48h'] },
  { stage: 'followup_pending', label: 'Takip Bekleniyor', color: '#f59e0b', order: 6, probability: 55, requiredActions: ['Takip iletişimi kur'], automationTriggers: ['reminder_24h'] },
  { stage: 'objection_handling', label: 'İtiraz Yönetimi', color: '#f97316', order: 7, probability: 60, requiredActions: ['İtirazları etiketle', 'Yanıt gönder'], automationTriggers: [] },
  { stage: 'ready_to_buy', label: 'Satın Almaya Hazır', color: '#22c55e', order: 8, probability: 80, requiredActions: ['Siparişi işle'], automationTriggers: ['auto_order_followup'] },
  { stage: 'became_customer', label: 'Müşteri', color: '#10b981', order: 9, probability: 100, requiredActions: ['Karşılama sekansı', 'Yeniden sipariş hatırlatması ayarla'], automationTriggers: ['customer_onboarding'] },
  { stage: 'ready_to_join', label: 'Katılmaya Hazır', color: '#a855f7', order: 10, probability: 85, requiredActions: ['Kayıt işlemini gerçekleştir'], automationTriggers: [] },
  { stage: 'became_member', label: 'Ekip Üyesi', color: '#d946ef', order: 11, probability: 100, requiredActions: ['Oryantasyon akışını başlat'], automationTriggers: ['member_onboarding'] },
  { stage: 'nurture_later', label: 'Sonra İlgilen', color: '#94a3b8', order: 12, probability: 10, requiredActions: ['Gelecek hatırlatma ayarla'], automationTriggers: ['nurture_sequence'] },
  { stage: 'dormant', label: 'Pasif', color: '#6b7280', order: 13, probability: 5, requiredActions: [], automationTriggers: ['reactivation_30d'] },
  { stage: 'lost', label: 'Kaybedildi', color: '#ef4444', order: 14, probability: 0, requiredActions: [], automationTriggers: [] },
]

// ============================================================
// PRODUCTS
// ============================================================
export const products: Product[] = [
  { id: 'p1', name: 'Radiance Serum', category: 'Cilt Bakımı', description: 'C vitamini ve hyaluronik asit ile gelişmiş anti-aging serum', price: 89.99, tags: ['çok_satan', 'cilt_bakımı', 'anti_aging'], reorderCycleDays: 30 },
  { id: 'p2', name: 'Vitality Greens', category: 'Beslenme', description: 'Günlük enerji ve sağlık için organik süper gıda karışımı', price: 69.99, tags: ['beslenme', 'enerji', 'günlük'], reorderCycleDays: 30 },
  { id: 'p3', name: 'Night Recovery Cream', category: 'Cilt Bakımı', description: 'Retinol kompleksi ile derin gece onarım tedavisi', price: 79.99, tags: ['cilt_bakımı', 'gece', 'onarım'], reorderCycleDays: 45 },
  { id: 'p4', name: 'Focus Nootropic', category: 'Wellness', description: 'Zihinsel berraklık için bilişsel geliştirme karışımı', price: 59.99, tags: ['wellness', 'odak', 'beyin'], reorderCycleDays: 30 },
  { id: 'p5', name: 'Collagen Peptides', category: 'Beslenme', description: 'Cilt, saç ve eklem desteği için deniz kolajeni', price: 54.99, tags: ['beslenme', 'güzellik', 'eklemler'], reorderCycleDays: 30 },
  { id: 'p6', name: 'İş Kurucu Seti', category: 'Başlangıç Seti', description: 'En iyi ürünler ve iş araçları ile eksiksiz başlangıç paketi', price: 299.99, tags: ['başlangıç', 'iş', 'paket'] },
]

// ============================================================
// CUSTOMER ORDERS
// ============================================================
export const customerOrders: CustomerOrder[] = [
  { id: 'o1', contactId: 'c2', userId: 'u1', products: [{ productId: 'p1', productName: 'Radiance Serum', quantity: 2, price: 89.99 }], total: 179.98, status: 'delivered', orderDate: '2026-03-15', nextReorderDate: '2026-04-14' },
  { id: 'o2', contactId: 'c5', userId: 'u1', products: [{ productId: 'p2', productName: 'Vitality Greens', quantity: 1, price: 69.99 }, { productId: 'p4', productName: 'Focus Nootropic', quantity: 1, price: 59.99 }], total: 129.98, status: 'delivered', orderDate: '2026-03-10', nextReorderDate: '2026-04-10' },
  { id: 'o3', contactId: 'c9', userId: 'u1', products: [{ productId: 'p2', productName: 'Vitality Greens', quantity: 1, price: 69.99 }, { productId: 'p5', productName: 'Collagen Peptides', quantity: 1, price: 54.99 }], total: 124.98, status: 'shipped', orderDate: '2026-04-05' },
]

// ============================================================
// ACADEMY COURSES
// ============================================================
export const academyCourses: AcademyCourse[] = [
  {
    id: 'ac1', title: 'Başlangıç: İlk 30 Günün', description: 'İşini güvenle başlatmak için ihtiyacın olan her şey. Zihniyetten ilk müşterine.', category: 'Oryantasyon', level: 'beginner', thumbnailUrl: '', xpReward: 500, estimatedMinutes: 180, order: 1, isPublished: true,
    modules: [
      { id: 'm1', courseId: 'ac1', title: 'Karşılama & Zihniyet', description: 'Başarının temeli', order: 1, lessons: [
        { id: 'l1', moduleId: 'm1', title: 'Yeni İşine Hoş Geldin', type: 'video', content: 'Fırsata giriş ve neler bekleyeceğin.', durationMinutes: 12, xpReward: 50, order: 1 },
        { id: 'l2', moduleId: 'm1', title: 'Girişimci Zihniyeti', type: 'video', content: 'İş sahibi gibi nasıl düşünülür.', durationMinutes: 18, xpReward: 50, order: 2 },
        { id: 'l3', moduleId: 'm1', title: 'Nedenini Belirle', type: 'worksheet', content: 'Kişisel motivasyonunu ve hedeflerini tanımla.', durationMinutes: 15, xpReward: 30, order: 3 },
      ]},
      { id: 'm2', courseId: 'ac1', title: 'İletişim Listeni Oluştur', description: 'Kimi tanıyorsun?', order: 2, lessons: [
        { id: 'l4', moduleId: 'm2', title: 'Hafıza Canlandırma Tekniği', type: 'video', content: '100+ kişilik iletişim listesi nasıl oluşturulur.', durationMinutes: 15, xpReward: 50, order: 1 },
        { id: 'l5', moduleId: 'm2', title: 'Liste Oluşturma Egzersizi', type: 'worksheet', content: 'İlk iletişim listeni oluştur.', durationMinutes: 30, xpReward: 75, order: 2 },
        { id: 'l6', moduleId: 'm2', title: 'Liste Oluşturma Quiz', type: 'quiz', content: 'İletişim stratejileri bilgini test et.', durationMinutes: 10, xpReward: 40, order: 3 },
      ]},
      { id: 'm3', courseId: 'ac1', title: 'İlk Konuşmaların', description: 'Nasıl davet edilir', order: 3, lessons: [
        { id: 'l7', moduleId: 'm3', title: 'Davet Sanatı', type: 'video', content: 'Zorlamadan nasıl davet edilir.', durationMinutes: 20, xpReward: 50, order: 1 },
        { id: 'l8', moduleId: 'm3', title: 'Pratik: Davet Rol Yapma', type: 'roleplay', content: 'AI ile davetini pratik yap.', durationMinutes: 15, xpReward: 75, order: 2 },
      ]},
    ]
  },
  {
    id: 'ac2', title: 'Potansiyel Müşteri Bulma Ustalığı', description: 'Tüm kanallarda kaliteli potansiyel müşteriler bulma ve bağlantı kurma sanatında ustalaş.', category: 'Potansiyel Müşteri', level: 'intermediate', thumbnailUrl: '', xpReward: 750, estimatedMinutes: 240, order: 2, isPublished: true,
    modules: [
      { id: 'm4', courseId: 'ac2', title: 'Ilık Pazar Stratejileri', description: 'Mevcut ağını kullanmak', order: 1, lessons: [
        { id: 'l9', moduleId: 'm4', title: 'Ilık Pazar Yaklaşımı', type: 'video', content: 'Arkadaşlara ve aileye profesyonelce nasıl yaklaşılır.', durationMinutes: 22, xpReward: 60, order: 1 },
        { id: 'l10', moduleId: 'm4', title: 'Referans Üretim Sistemi', type: 'video', content: 'Her konuşmadan nasıl referans alınır.', durationMinutes: 18, xpReward: 60, order: 2 },
      ]},
      { id: 'm5', courseId: 'ac2', title: 'Soğuk Pazar & Sosyal Medya', description: 'Yeni insanlar bulmak', order: 2, lessons: [
        { id: 'l11', moduleId: 'm5', title: 'Sosyal Medya Potansiyel Müşteri', type: 'video', content: 'Potansiyel müşterileri bulmak için sosyal platformları kullanmak.', durationMinutes: 25, xpReward: 60, order: 1 },
        { id: 'l12', moduleId: 'm5', title: 'İşleyen Soğuk Ulaşım', type: 'video', content: 'Soğuk kişiler için senaryolar ve stratejiler.', durationMinutes: 20, xpReward: 60, order: 2 },
        { id: 'l13', moduleId: 'm5', title: 'İtiraz Yönetimi Simülatörü', type: 'roleplay', content: 'Yaygın itirazları ele almayı pratik yap.', durationMinutes: 20, xpReward: 80, order: 3 },
      ]},
    ]
  },
  {
    id: 'ac3', title: 'Liderlik & Çoğaltma', description: 'Takipçi değil, lider yetiştir. Senden öteye ölçeklenen sistemler oluştur.', category: 'Liderlik', level: 'leader', thumbnailUrl: '', xpReward: 1000, estimatedMinutes: 300, order: 3, isPublished: true,
    modules: [
      { id: 'm6', courseId: 'ac3', title: 'Çoğaltma Zihniyeti', description: 'Lider gibi düşün', order: 1, lessons: [
        { id: 'l14', moduleId: 'm6', title: 'Çoğaltma Nedir?', type: 'video', content: 'Ölçeklenebilir ekiplerin bilimi.', durationMinutes: 20, xpReward: 75, order: 1 },
        { id: 'l15', moduleId: 'm6', title: 'Sistemler vs Motivasyon', type: 'video', content: 'Neden sistemler her zaman hype\'ı yener.', durationMinutes: 22, xpReward: 75, order: 2 },
      ]},
      { id: 'm7', courseId: 'ac3', title: 'Ekibini Koçluk Yap', description: 'Başkalarını geliştir', order: 2, lessons: [
        { id: 'l16', moduleId: 'm7', title: '1:1 Koçluk Çerçevesi', type: 'video', content: 'Etkili koçluk çağrıları nasıl yapılır.', durationMinutes: 25, xpReward: 75, order: 1 },
        { id: 'l17', moduleId: 'm7', title: 'Koçluk Çağrısı Hazırlık Şablonu', type: 'download', content: 'İndirilebilir koçluk şablonu.', durationMinutes: 5, xpReward: 30, order: 2 },
      ]},
    ]
  },
  {
    id: 'ac4', title: 'Sosyal Medya & Kişisel Marka', description: 'Potansiyel müşterileri sana çeken otantik bir kişisel marka oluştur.', category: 'Pazarlama', level: 'intermediate', thumbnailUrl: '', xpReward: 600, estimatedMinutes: 200, order: 4, isPublished: true,
    modules: [
      { id: 'm8', courseId: 'ac4', title: 'Marka Temeli', description: 'Çevrimiçi kimsin?', order: 1, lessons: [
        { id: 'l18', moduleId: 'm8', title: 'Marka Sesini Tanımla', type: 'video', content: 'Otantik bir çevrimiçi varlık oluştur.', durationMinutes: 18, xpReward: 50, order: 1 },
        { id: 'l19', moduleId: 'm8', title: 'İçerik Stratejisi Planı', type: 'worksheet', content: 'İçerik takvimini planla.', durationMinutes: 25, xpReward: 60, order: 2 },
      ]},
    ]
  },
]

// ============================================================
// SCRIPTS
// ============================================================
export const scripts: Script[] = [
  { id: 's1', title: 'Ilık Pazar - Samimi Davet', category: 'Davet', subcategory: 'Ilık Pazar', content: "Merhaba [İsim]! Yeni bir şeye başladım ve gerçekten çok heyecanlıyım. Senin bakış açını değerli bulduğum için fikrini almak isterim. Bu hafta bakmak için 15 dakikan olur mu? Hiç baskı yok - sadece görüşünü değerli buluyorum.", tags: ['ılık', 'samimi', 'davet'], language: 'tr', createdBy: 'system', usageCount: 1250, rating: 4.8 },
  { id: 's2', title: 'Sunum Sonrası Takip', category: 'Takip', subcategory: 'Sunum Sonrası', content: "Merhaba [İsim], dün sunuma zaman ayırdığın için çok teşekkürler! Merak ediyorum - en çok ne dikkatini çekti? Ve yardımcı olabileceğim soruların var mı?", tags: ['takip', 'sunum'], language: 'tr', createdBy: 'system', usageCount: 980, rating: 4.7 },
  { id: 's3', title: 'Yeniden Sipariş Hatırlatması', category: 'Müşteri İlişkileri', subcategory: 'Yeniden Sipariş', content: "Merhaba [İsim]! [Ürün] ürününü sevdiğini umarım! Sipariş verdiğin tarihe göre, yakında bitmek üzere olmalı. Taze bir sipariş hazırlamamı ister misin? Ayrıca en iyi sonuçları almak için bazı ipuçları da paylaşabilirim.", tags: ['müşteri', 'yeniden_sipariş', 'ilgi'], language: 'tr', createdBy: 'system', usageCount: 750, rating: 4.6 },
  { id: 's4', title: 'Sosyal Medya - Hikaye Etkileşimi', category: 'Sosyal Medya', subcategory: 'Hikaye', content: "[Konu] hakkındaki son paylaşımını çok beğendim! Ben de bununla ilgili bir şey keşfediyorum ve ilginç bulacağını düşünüyorum. Paylaşabilir miyim?", tags: ['sosyal', 'etkileşim', 'soğuk'], language: 'tr', createdBy: 'system', usageCount: 2100, rating: 4.5 },
  { id: 's5', title: 'Yeni Üye Karşılama', category: 'Oryantasyon', subcategory: 'Karşılama', content: "Ekibe hoş geldin, [İsim]! 🎉 Seni aramızda görmekten çok mutluyum. İşte önümüzdeki 48 saatin planı: 1) Hesabını birlikte kuracağız, 2) İlk iletişim listeni oluşturacaksın, 3) İlk davetini pratik yapacağız. Her adımda yanındayım!", tags: ['oryantasyon', 'karşılama', 'yeni_üye'], language: 'tr', createdBy: 'system', usageCount: 450, rating: 4.9 },
  { id: 's6', title: 'İtiraz: "Zamanım Yok"', category: 'İtirazlar', subcategory: 'Zaman', content: "Tamamen anlıyorum - hepimiz meşgulüz! Aslında bu işi sevdiğim şeylerden biri bu. Çoğu insan günde sadece 30 dakika ile başlıyor. Dolu hayatlar için tasarlanmış. İşten sonraki tipik akşamın nasıl görünüyor?", tags: ['itiraz', 'zaman', 'yönetim'], language: 'tr', createdBy: 'system', usageCount: 1800, rating: 4.7 },
  { id: 's7', title: 'İtiraz: "Bu MLM mi?"', category: 'İtirazlar', subcategory: 'Şüphecilik', content: "Harika soru! Evet, bir network marketing modeli kullanıyoruz - yani milyonlarca TV reklamına harcamak yerine, şirket sevdiğimiz ürünleri paylaştığımız için bizi ödüllendiriyor. Fortune 500 şirketlerinin çoğu tarafından kullanılan meşru bir iş modeli. Temel fark, sadece üye kaydetmeye değil, gerçek ürün müşterilerine odaklanmamız.", tags: ['itiraz', 'mlm', 'şüphecilik'], language: 'tr', createdBy: 'system', usageCount: 1500, rating: 4.6 },
  { id: 's8', title: 'Referans İsteği', category: 'Potansiyel Müşteri', subcategory: 'Referans', content: "Bu senin için uygun olmasa bile, [ürün/ek gelir kazanmak] ile ilgilenebilecek 2-3 kişi tanıyor musun? Bir tanıtım gerçekten çok değerli olur. Ve daha sonra aklına biri gelirse, bana yönlendirmekten çekinme!", tags: ['referans', 'potansiyel_müşteri'], language: 'tr', createdBy: 'system', usageCount: 620, rating: 4.5 },
]

// ============================================================
// OBJECTIONS
// ============================================================
export const objections: Objection[] = [
  { id: 'ob1', category: 'Zaman', objection: "Bunun için zamanım yok", tags: ['zaman', 'yaygın'], responses: [
    { id: 'r1', tone: 'empathetic', script: "Tamamen anlıyorum. En iyi liderlerimizin çoğu tam zamanlı işlerle başladı. Güzel yanı, günde sadece 20-30 dakika ile başlayabilmen. Tipik akşamın nasıl görünüyor?" },
    { id: 'r2', tone: 'data_driven', script: "Ortalama bir insan günde 2+ saatini sosyal medyada geçiriyor. Bunun sadece 30 dakikasını finansal geleceğini değiştirebilecek bir şeye yönlendirsek ne olur?" },
  ]},
  { id: 'ob2', category: 'Şüphecilik', objection: "Bu MLM işlerinden biri mi?", tags: ['şüphecilik', 'mlm', 'yaygın'], responses: [
    { id: 'r3', tone: 'direct', script: "Evet, bir network marketing modeli kullanıyoruz. Costco ve Amazon gibi şirketler de referans tabanlı modeller kullanıyor. Buradaki fark, kişisel olarak kullandığın ve sevdiğin ürünleri paylaştığın için doğrudan ödüllendirilmen." },
    { id: 'r4', tone: 'storytelling', script: "Benim de aynı kaygım vardı! Fikrimi değiştiren şey, gerçek ürünleri ve onları kullanan insanları görmek oldu. Hiç iş taahhüdü olmadan önce sadece ürünleri denemeye açık mısın?" },
  ]},
  { id: 'ob3', category: 'Para', objection: "Başlangıç maliyetini karşılayamam", tags: ['para', 'maliyet'], responses: [
    { id: 'r5', tone: 'empathetic', script: "Seni duyuyorum. Şunu sorayım - bu iş ilk ay içinde başlangıç maliyetini karşılayabilse, fikrin değişir mi? Birçok insan ilk birkaç müşterisiyle yatırımını geri kazanıyor." },
  ]},
  { id: 'ob4', category: 'Güven', objection: "Bir düşünmem lazım", tags: ['güven', 'erteleme'], responses: [
    { id: 'r6', tone: 'empathetic', script: "Kesinlikle, buna saygı duyuyorum. Düşünmene yardımcı olacak spesifik şey ne olabilir? Sana bazı müşteri deneyimleri, ürün bilgileri gönderebilirim veya benzer soruları olan bir ekibimle hızlı bir arama planlayabiliriz." },
  ]},
]

// ============================================================
// EVENTS
// ============================================================
export const events: Event[] = [
  {
    id: 'e1', userId: 'u1', title: 'Bahar Ürün Tanıtımı', description: 'En yeni cilt bakım serimizin canlı tanıtımı. Bir arkadaşını getir!',
    type: 'local', startDate: '2026-04-19T14:00:00', endDate: '2026-04-19T16:00:00',
    location: 'Downtown Community Center, Austin TX', maxAttendees: 30,
    attendees: [
      { contactId: 'c1', name: 'Marcus Johnson', rsvpStatus: 'confirmed', followUpStatus: 'pending' },
      { contactId: 'c4', name: 'Aisha Williams', rsvpStatus: 'invited', followUpStatus: 'pending' },
      { contactId: 'c10', name: 'Rachel Green', rsvpStatus: 'invited', followUpStatus: 'pending' },
    ],
    status: 'published'
  },
  {
    id: 'e2', userId: 'u1', title: 'Haftalık Ekip Strateji Çağrısı', description: 'Tüm ekip üyeleri için haftalık uyum çağrısı. Kazanımları gözden geçir, hedefleri belirle.',
    type: 'team_zoom', startDate: '2026-04-16T19:00:00', endDate: '2026-04-16T20:00:00',
    meetingUrl: 'https://zoom.us/j/team-call', maxAttendees: 50,
    attendees: [
      { contactId: 'c6', name: 'Priya Sharma', rsvpStatus: 'confirmed', followUpStatus: 'pending' },
      { contactId: 'c11', name: 'Michael Foster', rsvpStatus: 'confirmed', followUpStatus: 'pending' },
    ],
    status: 'published'
  },
  {
    id: 'e3', userId: 'u1', title: 'İş Fırsatı Webinarı', description: 'Potansiyel ekip üyeleri için online sunum. İş modeli hakkında bilgi edinin.',
    type: 'online_presentation', startDate: '2026-04-22T20:00:00', endDate: '2026-04-22T21:30:00',
    meetingUrl: 'https://zoom.us/j/opportunity', maxAttendees: 100,
    attendees: [
      { contactId: 'c1', name: 'Marcus Johnson', rsvpStatus: 'invited', followUpStatus: 'pending' },
      { contactId: 'c7', name: 'Tom Bradley', rsvpStatus: 'confirmed', followUpStatus: 'pending' },
    ],
    status: 'published'
  },
]

// ============================================================
// CAMPAIGNS
// ============================================================
export const campaigns: Campaign[] = [
  { id: 'camp1', userId: 'u1', name: '7 Günlük Yeni Üye Başlangıcı', type: 'launch', description: 'İlk haftalarında yeni ekip üyeleri için yapılandırılmış başlangıç planı.', startDate: '2026-04-01', endDate: '2026-04-30', status: 'active', enrollments: [{ contactId: 'c6', enrolledAt: '2026-04-01', status: 'active', progress: 60 }, { contactId: 'c11', enrolledAt: '2026-04-05', status: 'active', progress: 20 }], metrics: { totalEnrolled: 2, totalCompleted: 0, conversionRate: 0 } },
  { id: 'camp2', userId: 'u1', name: 'Bahar Cilt Bakımı Kampanyası', type: 'product_promo', description: 'Özel paketlerle cilt bakım serisi için sezonluk promosyon.', startDate: '2026-04-10', endDate: '2026-04-25', status: 'active', enrollments: [{ contactId: 'c2', enrolledAt: '2026-04-10', status: 'active', progress: 30 }, { contactId: 'c5', enrolledAt: '2026-04-10', status: 'active', progress: 50 }], metrics: { totalEnrolled: 2, totalCompleted: 0, conversionRate: 0 } },
]

// ============================================================
// ACHIEVEMENTS
// ============================================================
export const achievements: Achievement[] = [
  { id: 'a1', userId: 'u1', type: 'streak_7', title: '7 Günlük Seri', description: '7 gün üst üste günlük aksiyonları tamamladı', iconUrl: '🔥', earnedAt: '2026-03-22', xpReward: 100 },
  { id: 'a2', userId: 'u1', type: 'streak_30', title: '30 Günlük Seri', description: '30 gün üst üste günlük aksiyonları tamamladı', iconUrl: '⚡', earnedAt: '2026-04-14', xpReward: 500 },
  { id: 'a3', userId: 'u1', type: 'first_sale', title: 'İlk Müşteri', description: 'İlk müşterini kazandın', iconUrl: '🎯', earnedAt: '2025-11-15', xpReward: 200 },
  { id: 'a4', userId: 'u1', type: 'first_recruit', title: 'İlk Ekip Üyesi', description: 'İlk ekip üyeni kayıt ettin', iconUrl: '🌟', earnedAt: '2025-12-01', xpReward: 300 },
  { id: 'a5', userId: 'u1', type: 'team_10', title: '10 Kişilik Ekip', description: '10 aktif üyeden oluşan bir ekip kurdun', iconUrl: '🏆', earnedAt: '2026-03-01', xpReward: 750 },
  { id: 'a6', userId: 'u1', type: 'course_complete', title: 'Kurs Mezunu', description: 'Başlangıç kursunu tamamladı', iconUrl: '🎓', earnedAt: '2026-03-15', xpReward: 250 },
]

// ============================================================
// RANKS
// ============================================================
export const ranks: Rank[] = [
  { id: 'r1', name: 'Ortak', level: 1, requirements: [{ type: 'personal_sales', value: 200, label: '$200 kişisel satış' }], benefits: ['Ürün indirimi', 'Temel eğitim erişimi'], badgeUrl: '🥉', color: '#cd7f32' },
  { id: 'r2', name: 'Kıdemli Ortak', level: 2, requirements: [{ type: 'personal_sales', value: 500, label: '$500 kişisel satış' }, { type: 'frontline', value: 1, label: '1 aktif ön hat' }], benefits: ['Yüksek komisyon', 'Ekip bonusları'], badgeUrl: '🥈', color: '#c0c0c0' },
  { id: 'r3', name: 'Direktör', level: 3, requirements: [{ type: 'personal_sales', value: 1000, label: '$1,000 kişisel satış' }, { type: 'frontline', value: 3, label: '3 aktif ön hat' }, { type: 'team_size', value: 5, label: '5 ekip üyesi' }], benefits: ['Direktör bonusu', 'Liderlik eğitimi'], badgeUrl: '🥇', color: '#ffd700' },
  { id: 'r4', name: 'Altın Direktör', level: 4, requirements: [{ type: 'personal_sales', value: 2000, label: '$2,000 kişisel satış' }, { type: 'frontline', value: 5, label: '5 aktif ön hat' }, { type: 'team_size', value: 15, label: '15 ekip üyesi' }, { type: 'rank_advances', value: 2, label: '2 ön hat rütbe ilerlemesi' }], benefits: ['Altın bonus havuzu', 'Yönetici kamp erişimi'], badgeUrl: '👑', color: '#ffd700' },
  { id: 'r5', name: 'Platin Direktör', level: 5, requirements: [{ type: 'personal_sales', value: 3000, label: '$3,000 kişisel satış' }, { type: 'frontline', value: 8, label: '8 aktif ön hat' }, { type: 'team_size', value: 50, label: '50 ekip üyesi' }, { type: 'rank_advances', value: 4, label: '4 ön hat rütbe ilerlemesi' }], benefits: ['Platin bonus', 'Araç bonusu', 'Küresel etkinlikler'], badgeUrl: '💎', color: '#e5e4e2' },
]

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'follow_up_due', title: 'Takip Zamanı', message: 'Elena Rodriguez bugün takip edilmeli. Serumunun azaldığını belirtmişti.', actionUrl: '/contacts/c2', isRead: false, priority: 'high', createdAt: '2026-04-14T08:00:00' },
  { id: 'n2', userId: 'u1', type: 'team_alert', title: 'Yeni Üyenin Sana İhtiyacı Var', message: 'Michael Foster oryantasyonun 1. Gününü tamamladı. İlerlemesini gözden geçir ve kontrol planla.', actionUrl: '/team/c11', isRead: false, priority: 'high', createdAt: '2026-04-14T07:30:00' },
  { id: 'n3', userId: 'u1', type: 'achievement', title: 'Başarı Kilidi Açıldı! 🔥', message: '30 Günlük Seri rozetini kazandın! İvmeyi sürdür.', actionUrl: '/rank', isRead: false, priority: 'medium', createdAt: '2026-04-14T07:00:00' },
  { id: 'n4', userId: 'u1', type: 'ai_suggestion', title: 'AI İçgörüsü', message: 'Marcus Johnson\'ın ilgi puanı 15 puan arttı. Takibini hızlandırmayı düşün.', actionUrl: '/contacts/c1', isRead: true, priority: 'medium', createdAt: '2026-04-13T18:00:00' },
  { id: 'n5', userId: 'u1', type: 'event_reminder', title: 'Yarın Etkinlik', message: 'Haftalık Ekip Strateji Çağrısı yarın saat 19:00\'da. 2 üye onayladı.', actionUrl: '/events/e2', isRead: true, priority: 'medium', createdAt: '2026-04-13T09:00:00' },
]

// ============================================================
// AI RECOMMENDATIONS
// ============================================================
export const aiRecommendations: AIRecommendation[] = [
  { id: 'ai1', userId: 'u1', type: 'next_action', title: 'Sıcak Potansiyel Uyarısı', description: 'Marcus Johnson bu hafta kazanç planını 3 kez görüntüledi. İlgisi zirve yapıyor. Bugün spesifik rakamlarla ara.', actionLabel: 'Marcus\'ı Gör', actionUrl: '/contacts/c1', confidence: 92, context: { contactId: 'c1', heatChange: '+15' }, isDismissed: false, createdAt: '2026-04-14T08:00:00' },
  { id: 'ai2', userId: 'u1', type: 'reorder_alert', title: 'Yeniden Sipariş Fırsatı', description: 'Elena Rodriguez\'in serum stoğu muhtemelen bugün bitiyor. Sadık bir müşteri - bu kolay bir yeniden sipariş artı gece kremi için çapraz satış fırsatı.', actionLabel: 'Elena ile İletişime Geç', actionUrl: '/contacts/c2', confidence: 88, context: { contactId: 'c2', product: 'Radiance Serum' }, isDismissed: false, createdAt: '2026-04-14T07:00:00' },
  { id: 'ai3', userId: 'u1', type: 'coaching_tip', title: 'Koçluk Önerisi', description: 'Priya Sharma oryantasyonun 3. Gününde ama henüz ilk temasını yapmadı. Güven desteğine ihtiyacı olabilir. Onunla bir davet rol yapması yapmayı düşün.', actionLabel: 'Priya ile İletişime Geç', actionUrl: '/contacts/c6', confidence: 85, context: { contactId: 'c6', onboardingDay: 3 }, isDismissed: false, createdAt: '2026-04-14T06:30:00' },
  { id: 'ai4', userId: 'u1', type: 'lead_heat', title: 'Isınan Potansiyel', description: 'Tom Bradley iş videosunu izledi ve SSS sayfasında 12 dakika geçirdi. Araştırma yapıyor - ilgi tazeyken 24 saat içinde takip et.', actionLabel: 'Tom\'u Ara', actionUrl: '/contacts/c7', confidence: 78, context: { contactId: 'c7' }, isDismissed: false, createdAt: '2026-04-14T06:00:00' },
  { id: 'ai5', userId: 'u1', type: 'weekly_summary', title: 'Haftalık Performans Özeti', description: 'Bu hafta: 18 temas yapıldı, 3 sunum planlandı, 1 yeni müşteri, 2 yeni ekip üyesi. Dönüşüm oranın geçen haftaya göre %12 arttı. Ana odak: bekleyen 4 ılık potansiyeli takip et.', confidence: 95, context: {}, isDismissed: false, createdAt: '2026-04-13T20:00:00' },
]

// ============================================================
// TEAM MEMBERS
// ============================================================
export const teamMembers: TeamMember[] = [
  { user: { ...currentUser, id: 'u2', name: 'Priya Sharma', email: 'priya.s@email.com', rank: 'Ortak', streak: 3, xp: 450, level: 3, momentumScore: 65 }, recruit: { id: 'rec1', contactId: 'c6', sponsorId: 'u1', status: 'onboarding', joinDate: '2026-04-01', onboardingProgress: 60, launchMomentumScore: 65 }, activityScore: 72, lastActive: '2026-04-13', pipelineHealth: 'moderate', onboardingStatus: 'in_progress', riskLevel: 'low' },
  { user: { ...currentUser, id: 'u3', name: 'Michael Foster', email: 'michael.f@email.com', rank: 'Ortak', streak: 1, xp: 150, level: 1, momentumScore: 45 }, recruit: { id: 'rec2', contactId: 'c11', sponsorId: 'u1', status: 'onboarding', joinDate: '2026-04-05', onboardingProgress: 20, launchMomentumScore: 45 }, activityScore: 40, lastActive: '2026-04-13', pipelineHealth: 'weak', onboardingStatus: 'in_progress', riskLevel: 'medium' },
  { user: { ...currentUser, id: 'u4', name: 'Jordan Lee', email: 'jordan.l@email.com', rank: 'Kıdemli Ortak', streak: 14, xp: 3200, level: 8, momentumScore: 82 }, recruit: { id: 'rec3', contactId: 'c14', sponsorId: 'u1', status: 'active', joinDate: '2026-01-15', onboardingProgress: 100, launchMomentumScore: 82, firstCustomerDate: '2026-01-20', firstRecruitDate: '2026-02-15' }, activityScore: 88, lastActive: '2026-04-14', pipelineHealth: 'strong', onboardingStatus: 'completed', riskLevel: 'low' },
  { user: { ...currentUser, id: 'u5', name: 'Taylor Kim', email: 'taylor.k@email.com', rank: 'Direktör', streak: 45, xp: 8500, level: 14, momentumScore: 91 }, recruit: { id: 'rec4', contactId: 'c15', sponsorId: 'u1', status: 'active', joinDate: '2025-09-01', onboardingProgress: 100, launchMomentumScore: 91, firstCustomerDate: '2025-09-05', firstRecruitDate: '2025-10-01' }, activityScore: 95, lastActive: '2026-04-14', pipelineHealth: 'strong', onboardingStatus: 'completed', riskLevel: 'low' },
  { user: { ...currentUser, id: 'u6', name: 'Alex Rivera', email: 'alex.r@email.com', rank: 'Ortak', streak: 0, xp: 200, level: 2, momentumScore: 15 }, recruit: { id: 'rec5', contactId: 'c16', sponsorId: 'u1', status: 'inactive', joinDate: '2026-02-01', onboardingProgress: 40, launchMomentumScore: 15 }, activityScore: 10, lastActive: '2026-03-15', pipelineHealth: 'critical', onboardingStatus: 'in_progress', riskLevel: 'high' },
]

// ============================================================
// AUTOMATIONS
// ============================================================
export const automations: Automation[] = [
  { id: 'auto1', userId: 'u1', name: 'Yeni Potansiyel Karşılama', trigger: { type: 'stage_change', config: { stage: 'new' } }, conditions: [], actions: [{ type: 'create_task', config: { title: 'İlk iletişim - yeni potansiyel', dueInDays: 1 } }, { type: 'send_notification', config: { message: 'Yeni potansiyel eklendi! 24 saat içinde ilk iletişimi kur.' } }], isActive: true, runCount: 45, lastRun: '2026-04-13' },
  { id: 'auto2', userId: 'u1', name: 'Takip Hatırlatması', trigger: { type: 'date_reached', config: { field: 'nextFollowUpDate' } }, conditions: [{ field: 'pipelineStage', operator: 'not_equals', value: 'lost' }], actions: [{ type: 'send_notification', config: { message: 'Takip zamanı!' } }, { type: 'create_task', config: { type: 'follow_up' } }], isActive: true, runCount: 120, lastRun: '2026-04-14' },
  { id: 'auto3', userId: 'u1', name: 'Yeniden Sipariş Hatırlatması', trigger: { type: 'date_reached', config: { field: 'nextReorderDate' } }, conditions: [{ field: 'pipelineStage', operator: 'equals', value: 'became_customer' }], actions: [{ type: 'send_notification', config: { message: 'Müşteri yeniden sipariş için hazır!' } }, { type: 'ai_suggest', config: { type: 'reorder' } }], isActive: true, runCount: 30, lastRun: '2026-04-12' },
  { id: 'auto4', userId: 'u1', name: 'Pasif Üye Uyarısı', trigger: { type: 'inactivity', config: { days: 7 } }, conditions: [{ field: 'pipelineStage', operator: 'equals', value: 'became_member' }], actions: [{ type: 'send_notification', config: { message: 'Ekip üyesi 7 gündür pasif. Ulaş!' } }], isActive: true, runCount: 8, lastRun: '2026-04-10' },
]

// ============================================================
// ANALYTICS DATA
// ============================================================
export const weeklyActivityData = [
  { day: 'Pzt', contacts: 8, presentations: 1, followUps: 5, newLeads: 2 },
  { day: 'Sal', contacts: 12, presentations: 2, followUps: 7, newLeads: 3 },
  { day: 'Çar', contacts: 6, presentations: 0, followUps: 4, newLeads: 1 },
  { day: 'Per', contacts: 15, presentations: 3, followUps: 8, newLeads: 4 },
  { day: 'Cum', contacts: 10, presentations: 1, followUps: 6, newLeads: 2 },
  { day: 'Cmt', contacts: 5, presentations: 1, followUps: 3, newLeads: 1 },
  { day: 'Paz', contacts: 3, presentations: 0, followUps: 2, newLeads: 0 },
]

export const monthlyConversionData = [
  { month: 'Kas', leads: 25, customers: 5, recruits: 1, rate: 24 },
  { month: 'Ara', leads: 32, customers: 8, recruits: 2, rate: 31 },
  { month: 'Oca', leads: 40, customers: 10, recruits: 3, rate: 33 },
  { month: 'Şub', leads: 38, customers: 9, recruits: 2, rate: 29 },
  { month: 'Mar', leads: 55, customers: 14, recruits: 4, rate: 33 },
  { month: 'Nis', leads: 45, customers: 11, recruits: 3, rate: 31 },
]

export const pipelineDistribution = [
  { stage: 'Yeni', count: 8, color: '#64748b' },
  { stage: 'İletişim', count: 5, color: '#8b5cf6' },
  { stage: 'İlgili', count: 12, color: '#0ea5e9' },
  { stage: 'Davetli', count: 6, color: '#06b6d4' },
  { stage: 'Takip', count: 9, color: '#f59e0b' },
  { stage: 'Müşteri', count: 18, color: '#10b981' },
  { stage: 'Üye', count: 8, color: '#d946ef' },
]

export const teamActivityHeatmap = [
  { name: 'Priya S.', mon: 3, tue: 4, wed: 2, thu: 5, fri: 3, sat: 1, sun: 0 },
  { name: 'Michael F.', mon: 1, tue: 2, wed: 0, thu: 1, fri: 2, sat: 0, sun: 0 },
  { name: 'Jordan L.', mon: 5, tue: 5, wed: 4, thu: 5, fri: 4, sat: 3, sun: 2 },
  { name: 'Taylor K.', mon: 5, tue: 5, wed: 5, thu: 5, fri: 5, sat: 4, sun: 3 },
  { name: 'Alex R.', mon: 0, tue: 1, wed: 0, thu: 0, fri: 1, sat: 0, sun: 0 },
]
