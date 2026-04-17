export type AcademyLibraryLocale = 'tr' | 'en'

type LocalizedText = {
  tr: string
  en: string
}

export type AcademyLibraryCategory =
  | 'mindset'
  | 'prospecting'
  | 'inviting'
  | 'presenting'
  | 'follow_up'
  | 'team_building'
  | 'social_media'
  | 'product_knowledge'

export type AcademyLibraryItemType =
  | 'lesson'
  | 'article'
  | 'script'
  | 'cheat_sheet'
  | 'role_play'

export type AcademyLibraryLevel = 'beginner' | 'intermediate' | 'advanced'

export interface AcademyLibraryItem {
  id: string
  category: AcademyLibraryCategory
  type: AcademyLibraryItemType
  level: AcademyLibraryLevel
  readingMinutes: number
  tags: string[]
  title: LocalizedText
  summary: LocalizedText
  content: LocalizedText
  coachPrompt: LocalizedText
}

export type AcademyObjectionCategory =
  | 'money'
  | 'time'
  | 'trust'
  | 'family'
  | 'fear'
  | 'experience'
  | 'pyramid'
  | 'wait'

export interface AcademyObjectionGuide {
  id: string
  category: AcademyObjectionCategory
  tags: string[]
  objection: LocalizedText
  shortResponse: LocalizedText
  fullResponse: LocalizedText
  approach: LocalizedText
  exampleDialog: LocalizedText
  coachPrompt: LocalizedText
}

export const academyLibraryItems: AcademyLibraryItem[] = [
  {
    id: 'lib-mindset-rejection',
    category: 'mindset',
    type: 'lesson',
    level: 'beginner',
    readingMinutes: 6,
    tags: ['mindset', 'reddedilme', 'baslangic'],
    title: {
      tr: 'Reddedilmeyi Doğru Okumak',
      en: 'How to Read Rejection Correctly',
    },
    summary: {
      tr: 'Hayır cevabını kişisel almak yerine zamanlama ve bağlam sinyali olarak okumayı öğretir.',
      en: 'Teaches you to read “no” as timing and context instead of personal rejection.',
    },
    content: {
      tr: `## Ana fikir
Network marketingde çoğu "hayır", sana değil kişinin o anki şartlarına söylenir.

## Sahada ne yap
- "Şimdi uygun değil" ile "asla istemem"i ayır.
- İlişkiyi bozacak savunma moduna girme.
- Konuşmayı kapatırken kapıyı tamamen kapatma: "Bunu daha uygun zamanda tekrar açabilir miyiz?"

## Koç notu
Amaç her konuşmadan evet almak değil, güveni kaybetmeden sonraki adımı canlı bırakmaktır.`,
      en: `## Core idea
In network marketing, most “no” answers are not about you. They reflect timing, context, or emotional readiness.

## What to do in the field
- Separate “not now” from “never”.
- Do not become defensive.
- Close the conversation without closing the relationship.

## Coach note
The goal is not to force a yes. The goal is to keep trust intact and the next step available.`,
    },
    coachPrompt: {
      tr: 'Bu reddedilme içeriğine göre bana 3 cümlelik sakin bir takip mesajı yaz.',
      en: 'Using this rejection lesson, write me a calm 3-sentence follow-up message.',
    },
  },
  {
    id: 'lib-prospecting-list',
    category: 'prospecting',
    type: 'cheat_sheet',
    level: 'beginner',
    readingMinutes: 5,
    tags: ['liste', 'aday', 'prospecting'],
    title: {
      tr: '100 Kişilik Listeyi Hızlı Kur',
      en: 'Build Your First 100-Name List Fast',
    },
    summary: {
      tr: 'Ilık pazar, sosyal çevre ve dijital temasları tek akışta listelemeye yarayan pratik çerçeve.',
      en: 'A simple framework to build a list from warm market, social circles, and digital touchpoints.',
    },
    content: {
      tr: `## Üç havuz yöntemi
- Yakın çevre: aile, arkadaş, eski iş arkadaşları
- Güncel çevre: müşteri, komşu, spor salonu, okul grupları
- Dijital çevre: Instagram, WhatsApp, LinkedIn, etkinlik tanışıklıkları

## Kural
Listeyi yazarken zihinsel eleme yapma. Uygun olup olmadığına sen değil süreç karar verir.

## Mini görev
Bugün 25 isim, yarın 25 isim, bu hafta 100 isim.`,
      en: `## The three-pool method
- Close circle: family, friends, former coworkers
- Current circle: clients, neighbors, hobby groups
- Digital circle: Instagram, WhatsApp, LinkedIn, event contacts

## Rule
Do not pre-reject people in your head while building the list.

## Mini task
Add 25 names today, 25 tomorrow, and get to 100 this week.`,
    },
    coachPrompt: {
      tr: 'Bu liste kurma çerçevesine göre bana 20 isimlik hedefli bir aday çıkarma planı ver.',
      en: 'Using this list-building framework, give me a focused plan to identify 20 target prospects.',
    },
  },
  {
    id: 'lib-inviting-whatsapp',
    category: 'inviting',
    type: 'script',
    level: 'beginner',
    readingMinutes: 7,
    tags: ['whatsapp', 'davet', 'ilk mesaj'],
    title: {
      tr: 'WhatsApp İlk Mesaj İskeleti',
      en: 'WhatsApp First Message Framework',
    },
    summary: {
      tr: 'Baskı kurmadan merak oluşturan ilk temas yapısı.',
      en: 'A first-touch structure that creates curiosity without pressure.',
    },
    content: {
      tr: `## Akış
1. Bağ kur: "Aklıma düştün, nasılsın?"
2. Konuyu büyütme: "Sana fikrini merak ettiğim küçük bir şey göstermek istiyorum."
3. Baskıyı düşür: "Uygun değilse hiç sorun değil."

## Yapma
- Fırsat kelimesiyle açma
- Uzun paragraf yazma
- İlk mesajda karar isteme`,
      en: `## Flow
1. Reconnect: “You came to mind, how are you?”
2. Keep it light: “I wanted to show you something small and get your take.”
3. Lower pressure: “If the timing is off, no problem.”

## Avoid
- Opening with hype
- Long first messages
- Asking for a decision too early`,
    },
    coachPrompt: {
      tr: 'Bu WhatsApp davet iskeletine göre bana 3 farklı tonla mesaj yaz: samimi, profesyonel, merak uyandıran.',
      en: 'Using this WhatsApp framework, write 3 message versions: warm, professional, and curiosity-driven.',
    },
  },
  {
    id: 'lib-presenting-20min',
    category: 'presenting',
    type: 'article',
    level: 'intermediate',
    readingMinutes: 8,
    tags: ['sunum', 'yapi', '20 dakika'],
    title: {
      tr: '20 Dakikalık Etkili Sunum Yapısı',
      en: 'The 20-Minute Presentation Structure',
    },
    summary: {
      tr: 'Dikkat, merak ve net sonraki adım üreten kısa sunum akışını verir.',
      en: 'Gives you a short presentation flow that creates attention, curiosity, and a clear next step.',
    },
    content: {
      tr: `## Bölüm 1: Bağ kur
Önce kişinin mevcut ihtiyacını konuştur.

## Bölüm 2: Çerçeve ver
Ürün, sistem veya fırsatı karmaşıklaştırmadan sade göster.

## Bölüm 3: Sonraki adım
Sunumu "ne düşünüyorsun?" boşluğunda bırakma.
Şunu sor: "İstersen bunu ürün tarafı mı, gelir tarafı mı olarak netleştirelim?"`,
      en: `## Part 1: Build connection
Let the other person talk about their current need.

## Part 2: Give a frame
Explain the product, system, or opportunity without making it heavy.

## Part 3: Define the next step
Do not end with vague space. End with a guided next step.`,
    },
    coachPrompt: {
      tr: 'Bu 20 dakikalık yapıya göre bana ürün odaklı kısa bir sunum akışı hazırla.',
      en: 'Using this 20-minute structure, build me a short product-focused presentation flow.',
    },
  },
  {
    id: 'lib-followup-thinkaboutit',
    category: 'follow_up',
    type: 'role_play',
    level: 'intermediate',
    readingMinutes: 6,
    tags: ['takip', 'dusunecegim', 'itiraz'],
    title: {
      tr: '"Düşüneceğim" Sonrası Takip',
      en: 'Follow-up After “I Need to Think About It”',
    },
    summary: {
      tr: 'Belirsiz erteleme cümlesini gerçek çekinceye dönüştürmek için kullanılacak saha soruları.',
      en: 'Field questions that help turn vague delay into a real concern you can address.',
    },
    content: {
      tr: `## Hedef
"Düşüneceğim" cümlesinin arkasındaki gerçek nedeni görmek.

## Kullanılacak soru
"En çok hangi kısmı netleştirmem faydalı olur?"

## Alternatif
"Kararı zorlaştıran taraf ürün mü, zaman mı, güven mi?"

## Kural
Takipte ikna değil netlik ararsan konuşma açılır.`,
      en: `## Goal
Discover the real issue behind “I need to think about it.”

## Main question
“Which part would be most helpful for me to clarify?”

## Rule
If you seek clarity instead of pressure, the conversation opens up.`,
    },
    coachPrompt: {
      tr: 'Bu takip çerçevesine göre "düşüneceğim" diyen birine iki aşamalı takip mesajı yaz.',
      en: 'Using this follow-up structure, write a two-step follow-up for someone who said “I need to think about it.”',
    },
  },
  {
    id: 'lib-team-first48h',
    category: 'team_building',
    type: 'cheat_sheet',
    level: 'advanced',
    readingMinutes: 5,
    tags: ['ekip', 'oryantasyon', 'ilk 48 saat'],
    title: {
      tr: 'Yeni Üye İlk 48 Saat Planı',
      en: 'New Member First 48 Hours Plan',
    },
    summary: {
      tr: 'Yeni ekip üyesinin motivasyonunu sisteme çevirmek için sade açılış planı.',
      en: 'A simple launch plan that turns new member excitement into system-driven action.',
    },
    content: {
      tr: `## İlk gün
- Hesap kur
- Neden listesini yazdır
- 20 kişilik sıcak liste çıkar

## İkinci gün
- İlk davet mesajını birlikte düzenle
- İlk 3 teması at
- Takip tarihlerini görünür hale getir

## Kural
Yeni üyeyi bilgiyle boğma, davranışa geçir.`,
      en: `## Day one
- Set up the account
- Write the why list
- Build a first warm list

## Day two
- Shape the first invitation
- Send the first 3 contacts
- Make follow-up dates visible

## Rule
Do not overwhelm with information. Move them into behavior.`,
    },
    coachPrompt: {
      tr: 'Bu ilk 48 saat planına göre yeni ekip üyem için uygulanabilir mini onboarding akışı yaz.',
      en: 'Using this first-48-hours plan, write me a practical mini onboarding flow for a new member.',
    },
  },
]

export const academyObjectionGuides: AcademyObjectionGuide[] = [
  {
    id: 'obj-money',
    category: 'money',
    tags: ['para', 'yatirim', 'risk'],
    objection: {
      tr: 'Şu an bunun için param yok.',
      en: 'I do not have the money for this right now.',
    },
    shortResponse: {
      tr: 'Haklısın, mesele çoğu zaman para değil yanlış karar verme korkusu oluyor. İstersen önce maliyeti değil geri dönüş yolunu netleştirelim.',
      en: 'That makes sense. Often it is not just money, but fear of making the wrong decision. We can clarify the path to return first.',
    },
    fullResponse: {
      tr: `Seni anlıyorum. Birçok kişi ilk anda miktara bakıp geri çekiliyor. Benim merak ettiğim şu: Eğer bu başlangıç, kısa vadede kendini çıkarabilecek kadar kontrollü ilerlese bakışın değişir miydi? Çünkü burada önemli olan büyük risk almak değil, yönetilebilir küçük bir başlangıç yapmak.`,
      en: `I understand. Many people pull back when they first see the number. My real question is this: if the start was controlled enough to pay for itself in a reasonable window, would your view change? The point is not to take a big risk, but to make a manageable start.`,
    },
    approach: {
      tr: 'Fiyatı savunma. Önce riski küçült, sonra geri dönüş mantığını göster.',
      en: 'Do not defend the price. First reduce the perceived risk, then show the return logic.',
    },
    exampleDialog: {
      tr: `Kişi: Şu an buna bütçem yok.
Sen: Anlıyorum. Peki mesele sadece rakam mı, yoksa yanlış karar verme ihtimali mi?
Kişi: İkisi de biraz.
Sen: O zaman önce maliyeti değil, bunu nasıl güvenli test edeceğini netleştirelim.`,
      en: `Prospect: I do not have the budget.
You: I get that. Is it only the amount, or also the fear of making the wrong move?
Prospect: A bit of both.
You: Then let’s clarify the safest way to test it before talking about the number again.`,
    },
    coachPrompt: {
      tr: 'Bu para itirazına daha doğal ve kısa bir WhatsApp cevabı yaz.',
      en: 'Write a shorter and more natural WhatsApp response for this money objection.',
    },
  },
  {
    id: 'obj-time',
    category: 'time',
    tags: ['zaman', 'yogunluk', 'ek yuk'],
    objection: {
      tr: 'Bunun için zamanım yok.',
      en: 'I do not have time for this.',
    },
    shortResponse: {
      tr: 'Zaman itirazı çoğu zaman ekstra yük korkusudur. Bu sistemi ağır değil hafif bir akış gibi kursak daha mümkün görünür mü?',
      en: 'Time objections are often fear of extra load. Would it feel more possible if this looked like a light flow instead of a heavy system?',
    },
    fullResponse: {
      tr: `Bu çok gerçek bir kaygı. Zaten doğru başlangıç da hayatı tamamen değiştirmek değil, mevcut hayatın içine küçük ve sürdürülebilir bir akış yerleştirmektir. Günde 20-30 dakikalık net bir yapı kurabildiğimizde insanlar en çok burada şaşırıyor.`,
      en: `That is a real concern. The right start is not to rebuild your entire life, but to place a small sustainable flow into the life you already have. Most people are surprised when they see what a clear 20-30 minute structure can do.`,
    },
    approach: {
      tr: 'Yoğunlukla yarışma. Akışı küçült ve sürdürülebilir göster.',
      en: 'Do not compete with their schedule. Make the flow smaller and more sustainable.',
    },
    exampleDialog: {
      tr: `Kişi: Çok yoğunum.
Sen: Buna inanırım. Zaten ben de yük bindirecek bir yapıdan bahsetmiyorum.
Kişi: Nasıl yani?
Sen: Günde tek küçük aksiyonla başlayan hafif bir ritimden bahsediyorum.`,
      en: `Prospect: I am too busy.
You: I believe that. I am not talking about something that adds a heavy load.
Prospect: What do you mean?
You: I mean a light rhythm that starts with one small action a day.`,
    },
    coachPrompt: {
      tr: 'Bu zaman itirazını kırmadan, yumuşak bir cevapla yeniden yaz.',
      en: 'Rewrite this time objection answer in a softer tone without creating pressure.',
    },
  },
  {
    id: 'obj-trust',
    category: 'trust',
    tags: ['guven', 'temkin', 'ispat'],
    objection: {
      tr: 'Önce biraz daha görmek istiyorum.',
      en: 'I want to see a little more first.',
    },
    shortResponse: {
      tr: 'Bu çok normal. O zaman seni ikna etmeye çalışmayayım; en faydalı olacak bir sonraki net şeyi göstereyim.',
      en: 'That is completely fair. Let me not try to convince you, and instead show you the next clearest thing.',
    },
    fullResponse: {
      tr: `Güven oluşmadan karar istemek zaten doğru olmaz. O yüzden burada en iyi yaklaşım baskı değil görünürlük. İstersen sana önce ürün tarafını, istersen sistem tarafını ya da gerçek bir kullanıcı deneyimini gösterebilirim. Hangisi daha çok netlik sağlar?`,
      en: `It would not be right to ask for a decision before trust is built. The best move here is visibility, not pressure. I can show you the product side, the system side, or a real user experience. Which would create the most clarity for you?`,
    },
    approach: {
      tr: 'Güven itirazında hız değil görünürlük kazanır.',
      en: 'With trust objections, visibility wins over speed.',
    },
    exampleDialog: {
      tr: `Kişi: Biraz daha görmek istiyorum.
Sen: Çok mantıklı. En çok hangi tarafı görmek sana iyi gelir?
Kişi: Gerçek deneyim.
Sen: O zaman önce sana gerçek kullanım hikayeleri göstereyim.`,
      en: `Prospect: I want to see a bit more.
You: Very fair. Which side would help most?
Prospect: Real experience.
You: Then let me show you a few real usage stories first.`,
    },
    coachPrompt: {
      tr: 'Bu güven itirazına daha yüksek güven veren ama baskısız bir cevap yaz.',
      en: 'Write a trust-building but pressure-free response for this objection.',
    },
  },
  {
    id: 'obj-family',
    category: 'family',
    tags: ['aile', 'cevre', 'destek'],
    objection: {
      tr: 'Çevrem buna sıcak bakmaz.',
      en: 'People around me would not respond well to this.',
    },
    shortResponse: {
      tr: 'Bu çoğu zaman iş modelinden çok ilişkiyi bozma korkusudur. O zaman ilişkiyi koruyan dil ile ilerlemek gerekir.',
      en: 'This is often more about fear of harming relationships than the model itself. Then we should move with relationship-safe language.',
    },
    fullResponse: {
      tr: `Bunu duymak önemli çünkü burada kimse ilişki kaybetsin istemeyiz. Doğru yaklaşım, çevreye yüklenmek değil; doğru kişiyi, doğru zamanda, doğru dille bulmaktır. Herkesle konuşmak zorunda değilsin, sadece uygun birkaç kişiyle doğal temas kurman yeterli.`,
      en: `That matters, because nobody wants to lose relationships here. The right approach is not to push everyone, but to find the right people, at the right time, with the right language. You do not need to talk to everyone.`,
    },
    approach: {
      tr: 'İlişkiyi korumak merkezde tutulursa aile itirazı yumuşar.',
      en: 'When relationship safety stays at the center, family objections soften.',
    },
    exampleDialog: {
      tr: `Kişi: Çevrem yanlış anlar.
Sen: O zaman çevreye yüklenilecek bir model kurmayız.
Kişi: Nasıl?
Sen: Sadece doğal ve uygun temaslar üzerinden ilerleriz.`,
      en: `Prospect: People around me would misunderstand it.
You: Then we do not build a model that pressures your circle.
Prospect: How?
You: We move only through natural, appropriate conversations.`,
    },
    coachPrompt: {
      tr: 'Bu aile/çevre itirazına ilişkiyi koruyan bir cevap yaz.',
      en: 'Write a relationship-safe response to this family/social-circle objection.',
    },
  },
  {
    id: 'obj-pyramid',
    category: 'pyramid',
    tags: ['mlm', 'piramit', 'suphe'],
    objection: {
      tr: 'Bu piramit gibi gelmiyor mu?',
      en: 'Doesn’t this feel like a pyramid?',
    },
    shortResponse: {
      tr: 'Bunu sorman çok iyi. En sağlıklı cevap savunma değil, modelin gelir kaynağını sakin biçimde netleştirmektir.',
      en: 'That is a good question. The healthiest answer is not defensiveness, but calmly clarifying where the value and revenue come from.',
    },
    fullResponse: {
      tr: `Bu soru meşru. Burada ana ayrım şu: Gelir sadece insan eklemekten değil, gerçek ürün kullanımı ve müşteri hareketinden doğar. Yani konuşmamız gereken şey etiket değil, sistemin değer üretip üretmediğidir.`,
      en: `That is a legitimate question. The core distinction is this: income is not built from adding people alone, but from real product usage and customer movement. The key is not the label, but whether the system creates real value.`,
    },
    approach: {
      tr: 'Modeli etiket savaşına sokma; değeri ve müşteri akışını merkezde tut.',
      en: 'Do not turn it into a label war. Keep value and customer flow at the center.',
    },
    exampleDialog: {
      tr: `Kişi: Bu piramit gibi.
Sen: Bu soruyu sorman değerli. Ben de ilk başta aynı noktaya bakmıştım.
Kişi: Sonra?
Sen: Farkı müşteri hareketi ve ürün kullanımında gördüm.`,
      en: `Prospect: This sounds like a pyramid.
You: That question matters. I looked at the same point at first.
Prospect: And then?
You: I saw the difference in real customer movement and product use.`,
    },
    coachPrompt: {
      tr: 'Bu piramit itirazına savunmaya düşmeden net cevap ver.',
      en: 'Answer this pyramid objection clearly without sounding defensive.',
    },
  },
  {
    id: 'obj-wait',
    category: 'wait',
    tags: ['bekleme', 'erteleme', 'kararsizlik'],
    objection: {
      tr: 'Biraz bekleyeyim, sonra bakarım.',
      en: 'Let me wait a bit and maybe look later.',
    },
    shortResponse: {
      tr: 'Bekleme çoğu zaman net bir hayır değil, dağınık bir tereddüttür. Ne için beklediğini anlamak gerekir.',
      en: 'Waiting is often not a clear no, but a vague hesitation. You need to understand what they are waiting for.',
    },
    fullResponse: {
      tr: `Olur, buna saygı duyarım. Sadece şunu daha iyi anlamak isterim: Beklediğin şey zaman mı, daha fazla bilgi mi, yoksa doğru an hissi mi? Çünkü neyi beklediğini bilirsek konuşmayı daha sağlıklı bir yere taşırız.`,
      en: `That is okay, and I respect it. I just want to understand this better: are you waiting for time, more information, or the feeling of the right moment? Once we know that, the conversation becomes much healthier.`,
    },
    approach: {
      tr: 'Ertelemeyi kabul et ama sisli bırakma; beklenen şeyi görünür kıl.',
      en: 'Accept the delay, but do not leave it vague; make the waiting reason visible.',
    },
    exampleDialog: {
      tr: `Kişi: Şimdilik bekleyeyim.
Sen: Olur. En çok neyin netleşmesini bekliyorsun?
Kişi: Zamanlama.
Sen: O zaman baskı yapmayalım, doğru zamanı görünür hale getirelim.`,
      en: `Prospect: I will wait for now.
You: Sure. What are you most waiting to become clear?
Prospect: Timing.
You: Then let’s not force it. Let’s make the right timing more visible.`,
    },
    coachPrompt: {
      tr: 'Bu bekleme itirazına takip kapısını açık bırakan kısa bir cevap yaz.',
      en: 'Write a short response that keeps the follow-up door open for this waiting objection.',
    },
  },
]
