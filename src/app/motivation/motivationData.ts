export type QuoteCategory = 'Disiplin' | 'Liderlik' | 'İstikrar' | 'Cesaret' | 'Odak' | 'Empati'

export type MotivationQuote = {
  text: string
  author: string
  role: string
  category: QuoteCategory
}

export const MOTIVATION_QUOTES: MotivationQuote[] = [
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
    author: 'Pat Summit',
    role: 'Koç, takım psikolojisi',
    category: 'Liderlik',
  },
  {
    text: 'Durduramayacağın şey, ritmini; ritmini kontrol edersen yönü de kontrol edersin.',
    author: 'Suat Tayfun Topak',
    role: 'Ekip tavsiyesi',
    category: 'Odak',
  },
  {
    text: 'Dinlemek, ikna değil; güven inşa etmektir.',
    author: 'Brené Brown',
    role: 'Araştırmacı, empati & güven',
    category: 'Empati',
  },
  {
    text: 'Her “hayır”, bir hikâyenin sadece cümle sonu. Paragraf sende devam ediyor.',
    author: 'Ekip stüdyosu',
    role: 'Reddedilmeyi normalize eden sakin bir geri bildirim',
    category: 'Cesaret',
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
    text: 'Dürüst küçük adım, abartılı vaatten daha çok lider inşa eder.',
    author: 'Takım liderliği notu',
    role: 'Dürüst iletişim ve net adımlar',
    category: 'Liderlik',
  },
]

export const FEATURED_VIDEO = {
  id: 'mgvkIS6FVHk',
  /** Uzun açıklama (tooltip / ileri kullanım) */
  title: 'Eylem ve tutarlılık: kısa not',
  /** Kart üzerinde 1 satır */
  titleShort: 'Eylem ve tutarlılık',
  duration: '~2 dk (altyazı YouTube’dan açılabilir)',
  /** Kompakt süre etiketi */
  durationShort: '~2 dk',
  category: 'Disiplin & eylem',
} as const
