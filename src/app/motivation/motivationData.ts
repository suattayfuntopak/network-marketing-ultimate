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

/** "Bugünün önerisi" — görev değil, ekip/kişisel motive edici; sayfa yükü başına rastgele */
export const DAILY_SUGGESTION_LINES: { tr: string; en: string }[] = [
  { tr: 'Küçük bir ilerleme, sessiz bıraktığın ekip arkadaşını yeniden ayağa kaldırmak için yeterlidir.', en: "A small bit of progress is enough to lift a teammate you’ve been leaving behind." },
  { tr: 'Dinlemeden konuştuğun sürece motive edemezsin; bugün en az birine gerçekten kulak ver.', en: "You can’t truly motivate if you don’t listen—give one person your full attention today." },
  { tr: 'Başkalarının potansiyelini hatırlatan bir cümle, onların o günkü tüm oyun planını değiştirebilir.', en: "One line that names someone’s potential can change their whole day." },
  { tr: 'Mükemmel fırsat yok; cesaretlendirdiğin an vardır. Bugün birini o ana davet et.', en: "There is no ‘perfect’ moment—only the moment you choose to encourage. Invite someone into it today." },
  { tr: 'Büyük konuşmandan çok, son gördüğün kişide bıraktığın his önemlidir.', en: "What matters isn’t the big speech—the feeling you leave with the last person you saw." },
  { tr: 'Vazgeçmek üzere olan birine, ‘seni gördüm’ demek bazen tüm eğitimden büyüktür.', en: "Saying ‘I see you’ to someone about to quit can outweigh any training." },
  { tr: 'Lider büyüttüğüne değil, birlikte taşıdığı yükü paylaştığına büyür.', en: "A leader grows not on what they sell, but on the load they help carry—together." },
  { tr: 'Bugün birine sadece ‘buradasın, iyi ki’ deme cesaretini topla.', en: "Find the courage to tell someone, simply: ‘I’m glad you’re here.’" },
  { tr: 'Görünmeyen emeği adıyla an, görünen şöhretten çok tokluk verir.', en: "Naming unseen effort feeds people more than any spotlight." },
  { tr: 'Başkalarını yükselttiğinde kendin de hafifler; ağır taşıyorsan ekiple paylaş.', en: "When you lift others, you get lighter too—share the load with your team." },
  { tr: 'Bir cümlelik teşekkür, aylar süren şüpheden güçlü olabilir.', en: "A single line of thanks can outweigh months of doubt." },
  { tr: 'Dün kötü gideni bugün fark eden, yarının güvenen ekibini kurar.', en: "The leader who notices yesterday’s bad day builds tomorrow’s loyal team." },
  { tr: 'Senin ısındığın oda, ekibin performansıdır. Enerjini bilinçle taşı.', en: "The room you warm is your team’s performance—carry your energy on purpose." },
  { tr: 'Korku baskıdan değil, birlikte denemekten erir.', en: "Fear dissolves not under pressure, but when people try—together." },
  { tr: 'Birine ‘yanındayım’ demek, mesafeleri siler.', en: "‘I’m with you’ erases more distance than any strategy." },
  { tr: 'Bugün bir kişide gördüğün bir erdemi, ona söylemeden geçme.', en: "Don’t let the virtue you see in one person today go unspoken." },
  { tr: 'İlk adımı çoğu zaman cesaret değil, senin verdiğin inanç verir.', en: "Often it isn’t courage that makes the first step—it’s the belief you hand someone." },
  { tr: 'Takımda susanları duy: en çok onlar bir kelimeyle ayağa kalkar.', en: "Hear the quiet ones on your team—often one word is enough to bring them up." },
]

