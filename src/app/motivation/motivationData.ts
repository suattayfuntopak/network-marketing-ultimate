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

