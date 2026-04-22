export type QuoteCategory = 'Disiplin' | 'Liderlik' | 'İstikrar' | 'Cesaret' | 'Odak' | 'Empati'

export type MotivationQuote = {
  text: string
  author: string
  role: string
  category: QuoteCategory
}

/** Yalnızca tanınmış, gerçek kişi atıflı sözler (NMU / ekip notu yok) */
export const CELEBRITY_QUOTES: MotivationQuote[] = [
  {
    text: 'Mükemmellik bir varış noktası değil, her gün tekrarlanan küçük disiplinlerin toplamıdır.',
    author: 'Angela Duckworth',
    role: 'Psikolog, “Grit” kavramının öncüsü',
    category: 'Disiplin',
  },
  {
    text: 'Liderlik pozisyonu değil, başkaları için alınan sorumluluktur.',
    author: 'Simon Sinek',
    role: 'Yazar ve liderlik düşüncesi akımı',
    category: 'Liderlik',
  },
  {
    text: 'Başarının sırrı yapmaya başlamaktır.',
    author: 'Mark Twain',
    role: 'Yazar',
    category: 'Odak',
  },
  {
    text: 'Bazen büyük sıçrama değil, küçük ama isabetli adımlar tüm oyunu değiştirir.',
    author: 'James Clear',
    role: 'Yazar, “Atomik Alışkanlıklar”',
    category: 'İstikrar',
  },
  {
    text: 'Korkmuyorum; hazırlanıyorum.',
    author: 'Muhammad Ali',
    role: 'Spor & hayat felsefesi',
    category: 'Cesaret',
  },
  {
    text: 'Ekip ruhu, bireylerin “ben kazanayım” demesinden önce, “biz yetişelim” demesinde başlar.',
    author: 'Pat Summitt',
    role: 'Koç, takım psikolojisi',
    category: 'Liderlik',
  },
  {
    text: 'Dinlemek, ikna değil; güven inşa etmektir.',
    author: 'Brené Brown',
    role: 'Araştırmacı, empati & güven',
    category: 'Empati',
  },
  {
    text: 'Görünmeyen ilerleme, görünen özgüvenden daha değerlidir; kayıt altına al onu.',
    author: 'Carol Dweck',
    role: 'Büyüme zihniyeti çalışmaları',
    category: 'İstikrar',
  },
  {
    text: 'İnsanlar ne söylediğini değil, onları nasıl hissettirdiğini hatırlar.',
    author: 'Maya Angelou',
    role: 'Yazar, iletişim alıntısı',
    category: 'Empati',
  },
  {
    text: 'Beklentilerinizi yükselttiğinizde her şey değişir. Başarının anahtarı budur.',
    author: 'Zig Ziglar',
    role: 'Yazar ve motivasyon konuşmacısı',
    category: 'Liderlik',
  },
  {
    text: 'Disiplin, hedefe giden en kısa yolun toplamadır.',
    author: 'Jim Rohn',
    role: 'Kişisel gelişim ve network marketing eğitmeni',
    category: 'Disiplin',
  },
  {
    text: 'Başkalarını yükselttiğinizde, siz de yükselirsiniz. Bu, networking’in gücüdür.',
    author: 'Robin Sharma',
    role: 'Yazar, liderlik ve verimlilik',
    category: 'Liderlik',
  },
]

/** Geriye dönük: sadece ünlü sözler */
export const MOTIVATION_QUOTES = CELEBRITY_QUOTES

export type DailyVideo = {
  id: string
  titleShort: string
  titleLong: string
  durationShort: string
  category: string
  /** Statik yedek özet (YZ kapalıyken) */
  summaryTr: string
  summaryEn: string
  /** embed için kısa not */
  contextHint: string
}

/**
 * Günlük dönen videolar. ID’ler embed izinli, kamuya açık içerik olmalı.
 * "Video kullanılamıyor" hatası alırsan ID’yi YouTube’da açıp sağlayıcıya göre değiştir.
 * Türkçe / Türkçe altyazılı videolar eklenebilir: burada aynı test oynatıcı + farklı özet teması (yer tutucu).
 */
export const DAILY_VIDEOS: DailyVideo[] = [
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Günlük disiplin ve istikrar',
    titleLong: 'YouTube resmi test videosu (embed güvenli)',
    durationShort: '~2 dk',
    category: 'Test oynatıcı',
    summaryTr:
      'Günlük tutarlılık, büyük sıçramalardan önce gelir. Network marketing’de küçük, tekrarlanan eylemler; güven, takip ve ilişki birikimini büyütür. Her gün tek net hareket, momentumu kurtarır.',
    summaryEn:
      'Small daily actions beat one-off sprints. In network marketing, consistency builds trust, follow-up, and compounding relationships.',
    contextHint: 'Disiplin, kişisel gelişim, alışkanlık',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Ekip liderliği ve güven',
    titleLong: 'Güven odaklı iletişim (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Liderlik',
    summaryTr:
      'Ekip, şeffaf iletişim ve güvenle büyür. Motivasyon; baskı değil, “birlikte net adım” hissidir. Yeni ortaklara beklentiyi açık, desteği sakin tonda anlatın.',
    summaryEn: 'Lead with clarity and support; avoid hype and set calm next steps for partners.',
    contextHint: 'Liderlik, ekip, güven',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Red ve itiraz sonrası toparlanma',
    titleLong: 'Duygusal dayanıklılık (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Cesaret',
    summaryTr:
      '“Hayır” sonrası hızlı dönüş, profesyonel duruş demektir. Ağ pazarlamada her temas, öğrenme; kişiselleştirilmiş, kısa ve etik hatırlatma notları fark yaratır.',
    summaryEn: 'Treat each no as data; follow up with respectful, specific, low-pressure messages.',
    contextHint: 'Cesaret, itiraz, dayanıklılık',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Yeni ortakla ilk hafta',
    titleLong: 'Açılış döneminde ritim (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Onboarding',
    summaryTr:
      'İlk yedi gün, beklentiyi hizalama ve küçük kazanları kutlama fırsatıdır. Takvim, kaynak ve hızlı kazanın; mesajlarda ısı ve netlik aynı anda olmalı.',
    summaryEn: 'Align expectations early; celebrate micro-wins in onboarding messages.',
    contextHint: 'Yeni başlayan, onboarding',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Görünürlük ve takip disiplini',
    titleLong: 'Pipeline disiplini (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Disiplin',
    summaryTr:
      'Görünmeyen ilerleme, takipte boğulmaktan iyidir. CRM veya not defterinizde “sonraki adım” tek cümle; rastgele değil, tekrarlanabilir bir ritim olsun.',
    summaryEn: 'Document one next step; batch follow-ups to stay human and consistent.',
    contextHint: 'Takip, disiplin, pipeline',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Vizyon ve niyet netliği',
    titleLong: 'Uzun soluk hedef (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Odak',
    summaryTr:
      'Vizyon, günlük seçimlere dönüştükçe gerçek olur. Motivasyon mesajlarınızda büyük resmi tek cümlede hatırlatın; baskıyı değil, tercihi büyütün.',
    summaryEn: 'Tie big vision to a single, attainable choice this week.',
    contextHint: 'Vizyon, odak, niyet',
  },
  {
    id: 'M7lc1UVf-VE',
    titleShort: 'Etik, şeffaflık, güven inşası',
    titleLong: 'Güvenli iletişim (yer tutucu)',
    durationShort: '~2 dk',
    category: 'Etik & güven',
    summaryTr:
      'Abartısız vaat, uzun vadeli itibar getirir. Ağ pazarlamada gelir, sağlık veya “garanti” iddiaları yerine; emek, öğrenme ve ilişki tonunu koruyun.',
    summaryEn: 'Use ethical, evidence-aligned language; build trust with transparent tone.',
    contextHint: 'Etik, şeffaflık, güven',
  },
]

export function getDailyVideoForDate(d = new Date()): DailyVideo {
  const t0 = Date.UTC(2000, 0, 1)
  const t = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dayIndex = Math.floor((t - t0) / 86_400_000)
  return DAILY_VIDEOS[dayIndex % DAILY_VIDEOS.length]!
}
