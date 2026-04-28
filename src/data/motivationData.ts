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

/** "Bugünün önerisi" — kısa, net, ekip/kişisel motive; sayfa açılışında rastgele */
export const DAILY_SUGGESTION_LINES: { tr: string; en: string }[] = [
  { tr: 'Bugün toplantı bitince, tek bir ekip üyesine yüzüne karşı kısaca neyi iyi yaptığını söylemeyi dene.', en: 'After your meeting, try telling one teammate face to face one thing they did well.' },
  { tr: '“Nasıl yardımcı olabilirim?” sorusu, “acele et” cümlesinden çoğu zaman daha iyi hızlandırır.', en: '“How can I help?” often speeds people up more than “hurry up.”' },
  { tr: 'Kendi zirveni anlatmadan önce, birinin küçük bir ilerlemesini duyur; ikisi birlikte daha çok hafıza bırakır.', en: 'Before sharing your win, mention someone’s small step—people remember the pair.' },
  { tr: 'İki cümlelik samimi teşekkür, yarım saatlik genel sohbetten çoğu zaman daha çok değer görür.', en: 'A two-sentence thank-you often lands better than a long generic talk.' },
  { tr: 'Bir gün sadece dinle: çözüm önerme, sadece özetle; “anladım” dene.', en: 'For one day, just listen, reflect back, and say you understood before you advise.' },
  { tr: 'Dün aksayan işi, bugün kişi yerine sorun üzerinden konuş: “Neyi zorlaştırdı?” de, “Neden beceremedin?” deme.', en: 'When something went wrong, ask what made it hard—not who failed.' },
  { tr: 'Ekip toplantısında söz hakkı vermediğin biri varsa, bir sonraki mesaj ona özel olsun.', en: 'If someone stayed quiet in the group chat, your next nudge to them is personal.' },
  { tr: 'Aynı hatayı ikinci kez eleştirmeden önce, bir kez “birlikte nasıl kapatırız?” diye sor.', en: 'Before a second round of critique on the same mistake, ask how you close it together.' },
  { tr: 'Cezalandırmadan hemen önce bir nefes; çoğu yanlış cümle o arada söylenmiyor.', en: 'Before you call someone out, pause—most regretful lines never get that pause.' },
  { tr: 'Hedefi net söyle, şüpheyi açık bırakma; “büyüyoruz” yerine bu ay için tek rakam dene.', en: 'Name one number for this month instead of only “we’re growing.”' },
  { tr: 'Kendi payına düşen işi söyle; “herkes yapsın” cümlesi çoğu zaman kimsenin yapmaması demek.', en: 'Say your part; “everyone should” often means no one in practice.' },
  { tr: 'Gün bitmeden, birine “bugün buna odaklandım” de; görünürlük, ekipte güven tohumudur.', en: 'End the day by telling someone what you actually focused on—visibility builds trust.' },
  { tr: 'Bir ekip lideri olarak her gün aynı enerjide olman gerekmez; dürüst olman yeterli günler de olur.', en: "You don’t have to be high energy every day—honest and steady is enough some days." },
  { tr: 'Biri çekinerek yazdıysa, kamuya giden yanıtında onu açıkça takdir et; sessizce okuyanlara sinyal verirsin.', en: "If someone wrote timidly, praise them in the public reply—others are watching too." },
  { tr: 'Hızlı karar: bugün sadece bir kişiye geri dönüş süreni yarı yarıya kısalt; “yarın” deme.', en: 'Today, cut your reply time in half for at least one person—no “I’ll get back later.”' },
  { tr: 'Son bir ayda hiç vakit ayırmadığın bir ekip üyesine beş dakikalık özel not yazmayı aklında tut.', en: 'Block five minutes to message someone you’ve ignored for a month—short and specific.' },
]

