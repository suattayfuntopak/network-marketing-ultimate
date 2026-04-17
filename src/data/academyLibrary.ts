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
  | 'closing'
  | 'follow_up'
  | 'team_building'
  | 'leadership'
  | 'social_media'
  | 'product_knowledge'
  | 'company_info'
  | 'compliance'

export type AcademyLibraryItemType =
  | 'lesson'
  | 'article'
  | 'script'
  | 'cheat_sheet'
  | 'role_play'
  | 'success_story'

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
  | 'product'
  | 'company'
  | 'pyramid'
  | 'no_network'
  | 'introvert'
  | 'employed'
  | 'wait'
  | 'other'

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

export const academyLibraryCategories: AcademyLibraryCategory[] = [
  'mindset',
  'prospecting',
  'inviting',
  'presenting',
  'closing',
  'follow_up',
  'team_building',
  'leadership',
  'social_media',
  'product_knowledge',
  'company_info',
  'compliance',
]

export const academyLibraryItemTypes: AcademyLibraryItemType[] = [
  'lesson',
  'article',
  'script',
  'cheat_sheet',
  'role_play',
  'success_story',
]

export const academyLibraryLevels: AcademyLibraryLevel[] = ['beginner', 'intermediate', 'advanced']

export const academyObjectionCategories: AcademyObjectionCategory[] = [
  'money',
  'time',
  'trust',
  'family',
  'fear',
  'experience',
  'product',
  'company',
  'pyramid',
  'no_network',
  'introvert',
  'employed',
  'wait',
  'other',
]

function localized(text: string): LocalizedText {
  return { tr: text, en: text }
}

interface LessonBlueprint {
  slug: string
  type: AcademyLibraryItemType
  level: AcademyLibraryLevel
  readingTime: number
  buildTitle: (label: string) => string
  buildSummary: (subject: CategorySubject) => string
  buildContent: (subject: CategorySubject) => string
  tags: (subject: CategorySubject) => string[]
}

interface CategorySubject {
  category: AcademyLibraryCategory
  label: string
  target: string
  friction: string
  nextStep: string
  teamAngle: string
  scriptHook: string
  metric: string
  emotion: string
}

interface ObjectionPack {
  category: AcademyObjectionCategory
  shortLabel: string
  rootFear: string
  reframe: string
  nextMove: string
  softQuestion: string
  proof: string
}

const LESSON_BLUEPRINTS: LessonBlueprint[] = [
  {
    slug: 'foundation',
    type: 'lesson',
    level: 'beginner',
    readingTime: 8,
    buildTitle: (label) => `${label}: Temeli Doğru Kur`,
    buildSummary: (subject) =>
      `${subject.label} alanında en sık yapılan dağılmayı toparla ve ${subject.target.toLowerCase()} için temiz bir çalışma zemini oluştur.`,
    buildContent: (subject) => `## Bu dersin amacı
${subject.label} tarafında başarı genelde daha fazla konuşmaktan değil, doğru ritmi kurmaktan gelir. Bu içerik sana ${subject.target.toLowerCase()} için sade ama güçlü bir temel verir.

## Neden kritik?
- ${subject.friction}
- ${subject.emotion}
- ${subject.nextStep}

## Çalışan çerçeve
- Önce **niyetini netleştir**: Bu aşamada amacın satış baskısı değil, ${subject.target.toLowerCase()}.
- Sonra **tek odak seç**: Aynı anda her şeyi düzeltmeye çalışma. Bugün sadece ${subject.metric.toLowerCase()} görünür olsun.
- En sonda **ritmi sabitle**: Her temasın sonunda küçük ama belirli bir ${subject.nextStep.toLowerCase()} bırak.

## Saha uygulaması
- Bugün bu kategoriyle ilgili 3 kişiyi seç.
- Her biri için sadece tek bir sonraki adımı yaz.
- Akşam bakarken şunu sor: ${subject.metric} daha görünür hale geldi mi?

## Koç notu
Güç çoğu zaman daha çok şey eklemekte değil, daha az ama daha net ilerlemektedir.`,
    tags: (subject) => [subject.category, 'temel', 'ritim', 'uygulama'],
  },
  {
    slug: 'mistakes',
    type: 'article',
    level: 'intermediate',
    readingTime: 6,
    buildTitle: (label) => `${label}: En Sık 5 Hata`,
    buildSummary: (subject) =>
      `${subject.label} sırasında akışı bozan davranışları gör ve ${subject.target.toLowerCase()} öncesi gereksiz sürtünmeyi azalt.`,
    buildContent: (subject) => `## En sık görülen hata
${subject.label} tarafında insanlar çoğu zaman kötü niyetli değil, sadece fazla açıklayıcı ve dağınık oluyor.

## 5 hata
- Uzun anlatım
- Erken baskı
- Takipsiz bırakmak
- Savunmaya cevap yetiştirmek
- Ekibi görünmez bırakmak: ${subject.teamAngle}

## Ne yapmalı?
- Kısa konuş.
- Bir seferde tek hedef taşı.
- Konuşmayı bir sonraki küçük adıma bağla.

## Düzeltme cümlesi
"Sana uzun uzun yüklenmek istemem. En mantıklı küçük sonraki adım şu olabilir..."`,
    tags: (subject) => [subject.category, 'hatalar', 'sade satış', 'akış'],
  },
  {
    slug: 'script',
    type: 'script',
    level: 'intermediate',
    readingTime: 5,
    buildTitle: (label) => `${label}: Konuşma Çerçevesi`,
    buildSummary: (subject) =>
      `${subject.label} için doğrudan kopyalanabilir bir iskelet kullan; baskıyı değil açıklığı artır.`,
    buildContent: (subject) => `## Ne zaman kullanılır?
${subject.friction}

## Kısa çerçeve
1. Bağ kur
${subject.scriptHook}

2. Bağlamı sadeleştir
"Seni gereksiz detaya boğmak istemem. Burada asıl mesele ${subject.target.toLowerCase()}."

3. Tek sonraki adımı öner
"İstersen şimdi sadece ${subject.nextStep.toLowerCase()} tarafını netleştirelim."

4. Baskısız kapat
"Uygun değilse sorun değil, ama istersen bunu sana en kolay haliyle gösterebilirim."`,
    tags: (subject) => [subject.category, 'script', 'mesaj', 'konuşma'],
  },
  {
    slug: 'checklist',
    type: 'cheat_sheet',
    level: 'beginner',
    readingTime: 4,
    buildTitle: (label) => `${label}: Hızlı Kontrol Listesi`,
    buildSummary: (subject) =>
      `${subject.label} çalışırken ekrana dönüp hızla bakabileceğin kısa bir saha listesi.`,
    buildContent: (subject) => `## Bugün kontrol et
- Hedefim net mi?
- ${subject.metric} görünür mü?
- Sonraki adım tek cümleyle yazılı mı?
- Kişi baskı değil netlik hissediyor mu?
- ${subject.teamAngle}

## Zayıf görünüm
- Her konuşma ayrı tonda ilerliyor.
- Konu dağılıyor.
- ${subject.nextStep} net bırakılmıyor.`,
    tags: (subject) => [subject.category, 'checklist', 'hızlı bakış', 'saha'],
  },
  {
    slug: 'roleplay',
    type: 'role_play',
    level: 'advanced',
    readingTime: 9,
    buildTitle: (label) => `${label}: Rol Oyunu`,
    buildSummary: (subject) =>
      `${subject.label} anında sahada yaşayacağın gerçek bir senaryoyu kısa bir rol oyunuyla çalış.`,
    buildContent: (subject) => `## Senaryo
Bir kişi ilgi gösteriyor ama ${subject.friction.toLowerCase()}.

## Amaç
${subject.target} ve konuşmanın sonunda ${subject.nextStep.toLowerCase()}.

## Deneme akışı
Sen: "Seni uzun anlatımla yormak istemem. Burada en önemli nokta ${subject.target.toLowerCase()}."

Karşı taraf: "Tamam ama emin değilim."

Sen: "Bu çok normal. İstersen bugün sadece ${subject.nextStep.toLowerCase()} tarafını netleştirelim."`,
    tags: (subject) => [subject.category, 'rol oyunu', 'uygulama', 'diyalog'],
  },
  {
    slug: 'review',
    type: 'success_story',
    level: 'advanced',
    readingTime: 7,
    buildTitle: (label) => `${label}: Haftalık Gözden Geçirme`,
    buildSummary: (subject) =>
      `${subject.label} tarafında neyin gerçekten çalıştığını görmek için haftalık bir lider gözden geçirme ritmi kur.`,
    buildContent: (subject) => `## Neyi gözden geçiriyoruz?
${subject.label} iyi gidiyor gibi görünse bile esas kalite ${subject.metric.toLowerCase()} içinde anlaşılır.

## Haftalık lider soruları
- Bu hafta hangi dil daha çok işe yaradı?
- Hangi noktada gereksiz açıklama arttı?
- ${subject.teamAngle}
- İnsanlar nerede rahatladı, nerede savunmaya geçti?

## Takıma koçluk cümlesi
"Bu hafta daha fazla konuşmaya değil, daha net ve tekrar edilebilir bir akışa ihtiyacımız var."`,
    tags: (subject) => [subject.category, 'liderlik', 'haftalık gözden geçirme', 'koçluk'],
  },
]

const CATEGORY_SUBJECTS: CategorySubject[] = [
  {
    category: 'mindset',
    label: 'Zihniyet',
    target: 'özgüvenli ama yardım odaklı bir duruş kurmak',
    friction: 'İnsanlar ya fazla çekingen kalıyor ya da fazla satış baskısı kuruyor.',
    nextStep: 'bir sonraki küçük adımı görünür bırakmak',
    teamAngle: 'Takım dilinin güven veren ama sade bir hatta kalması gerekir.',
    scriptHook: '"Bugün seni zorlamak için değil, daha net bir resim çizmek için yazıyorum."',
    metric: 'günlük aksiyon ritmi',
    emotion: 'Karşı tarafın da senin de üzerindeki baskıyı düşürür.',
  },
  {
    category: 'prospecting',
    label: 'Aday Bulma',
    target: 'sağlam bir aday akışı üretmek',
    friction: 'Liste kurma ertelendikçe bütün iş sadece sıcak birkaç kişiye sıkışıyor.',
    nextStep: 'ilk temas sırasını belirlemek',
    teamAngle: 'Ekip, aday havuzunu kişisel çevreyle sınırlamadan büyütmeyi öğrenir.',
    scriptHook: '"Aklıma geldin çünkü şu an doğru kişileri sakin ve seçici biçimde toparlıyorum."',
    metric: 'yeni aday görünürlüğü',
    emotion: 'Dağınık arama hissi yerine kontrollü bir büyüme hissi verir.',
  },
  {
    category: 'inviting',
    label: 'Davet',
    target: 'ilk konuşmayı meraka çevirmek',
    friction: 'Davetler ya fazla belirsiz ya da erken detay yüklü kaldığında geri dönüş düşer.',
    nextStep: 'kısa bir görüşme veya sunum daveti bırakmak',
    teamAngle: 'Takımın davet tonu ne kadar ortaksa sonuçlar o kadar öngörülebilir olur.',
    scriptHook: '"Sana uzun uzun anlatmak için değil, fikrini merak ettiğim küçük bir konu için yazıyorum."',
    metric: 'davet kabul oranı',
    emotion: 'Karşı tarafın savunmaya geçmesini azaltır.',
  },
  {
    category: 'presenting',
    label: 'Sunum',
    target: 'sunumu karşı tarafın ihtiyacına bağlamak',
    friction: 'Sunumlar ürün veya fırsat anlatısına boğulunca ilgi var gibi görünse de enerji düşer.',
    nextStep: 'sunum sonrası tek net karar kapısı bırakmak',
    teamAngle: 'Takım aynı sunumu farklı değil, tutarlı bir omurgayla vermeli.',
    scriptHook: '"Bugün her şeyi anlatmak yerine sana en relevant kısmı göstermek isterim."',
    metric: 'sunum sonrası hareket',
    emotion: 'Kişinin kendini dinlenmiş hissetmesini sağlar.',
  },
  {
    category: 'closing',
    label: 'Karar Aşaması',
    target: 'karar sürtünmesini azaltmak',
    friction: 'İlgi olduğu halde son adım netleşmediğinde süreç gereksiz yere uzar.',
    nextStep: 'kararı kolaylaştıran tek bir öneri sunmak',
    teamAngle: 'Takım baskı yerine netlik ve güven dili kullanmalıdır.',
    scriptHook: '"Burada seni sıkıştırmak değil, kararını kolaylaştırmak istiyorum."',
    metric: 'karar ilerleme oranı',
    emotion: 'Karar yükünü azaltır ve karşı tarafın kontrol hissini korur.',
  },
  {
    category: 'follow_up',
    label: 'Takip',
    target: 'ritmi kaybetmeden geri dönmek',
    friction: 'İyi konuşmalar bile takip görünmez olduğunda sessizliğe düşer.',
    nextStep: 'takip tarihini ve mesaj tonunu netleştirmek',
    teamAngle: 'Takım için ortak takip standardı güven verir.',
    scriptHook: '"Sadece kısaca yoklayıp doğru zamanda dönmek istedim."',
    metric: 'takip görünürlüğü',
    emotion: 'İlgiyi baskı yaratmadan canlı tutar.',
  },
  {
    category: 'team_building',
    label: 'Ekip Kurma',
    target: 'yeni üyeyi aktif ritme almak',
    friction: 'Yeni katılan kişi neyi ne sırayla yapacağını bilmeyince hızlıca soğuyabiliyor.',
    nextStep: 'ilk basit çalışma haftasını netleştirmek',
    teamAngle: 'Takımın kopyalanabilir başlangıç ritmi olması gerekir.',
    scriptHook: '"Sana zor bir sistem değil, çalıştırması kolay bir başlangıç akışı göstereceğim."',
    metric: 'aktif ekip oranı',
    emotion: 'Yeni kişinin yük altında değil destek altında hissetmesini sağlar.',
  },
  {
    category: 'leadership',
    label: 'Liderlik',
    target: 'ekibi görünür veri ve sade koçlukla yönetmek',
    friction: 'Liderler her şeye yetişmeye çalışınca ekipte yön netliği kaybolur.',
    nextStep: 'tek davranış odaklı haftalık koçluk vermek',
    teamAngle: 'Takımın en çok ihtiyacı uzun motivasyon değil, net lider sinyalidir.',
    scriptHook: '"Bu hafta hepimizin aynı davranışı güçlendirmesini istiyorum."',
    metric: 'ekip ritim skoru',
    emotion: 'Takımda panik yerine yön duygusu oluşturur.',
  },
  {
    category: 'social_media',
    label: 'Sosyal Medya',
    target: 'görünürlüğü satış baskısına çevirmeden artırmak',
    friction: 'Paylaşımlar ya çok genel kalıyor ya da fazlaca fırsat kokuyor.',
    nextStep: 'konuşma başlatan içerik çizgisini korumak',
    teamAngle: 'Takımın dijital dili kişisel ama tutarlı olmalı.',
    scriptHook: '"İnsanların önce kendini güvende hissettiği bir içerik hattı kuruyoruz."',
    metric: 'gelen mesaj kalitesi',
    emotion: 'Marka hissini yormadan merak üretir.',
  },
  {
    category: 'product_knowledge',
    label: 'Ürün Bilgisi',
    target: 'ürünü ezber gibi değil ihtiyaç bağlamında anlatmak',
    friction: 'Ürün avantajları listeye dönünce karşı taraf kendini anlatının dışında hisseder.',
    nextStep: 'kişinin ihtiyacına bağlı tek faydayı netleştirmek',
    teamAngle: 'Takım ürün dilini özellik değil fayda üzerinden ortaklaştırmalı.',
    scriptHook: '"Ürünü anlatmadan önce senin tarafında neyin önemli olduğunu anlamak isterim."',
    metric: 'ürün ilgisi dönüşü',
    emotion: 'Karşı tarafın ürünle kendi hayatı arasında bağ kurmasını sağlar.',
  },
  {
    category: 'company_info',
    label: 'Şirket Bilgisi',
    target: 'güveni gereksiz kurumsal yük olmadan kurmak',
    friction: 'Şirket anlatımı çok erken veya çok ağır olunca güven yerine mesafe oluşabilir.',
    nextStep: 'güven için yeterli ama hafif bir çerçeve sunmak',
    teamAngle: 'Takım şirket bilgisini savunmacı değil sakin bir dille taşımalı.',
    scriptHook: '"Önce büyük iddia değil, sağlam ve sade bir çerçeve vermek isterim."',
    metric: 'güven eşiği',
    emotion: 'Kurumsal güç gösterisi yerine sakin güven üretir.',
  },
  {
    category: 'compliance',
    label: 'Etik ve Uyum',
    target: 'güven kaybetmeden etik çizgide büyümek',
    friction: 'Abartılı vaatler kısa vadede ilgi çekse de uzun vadede tüm yapıyı zedeler.',
    nextStep: 'doğru ifade standardını görünür kılmak',
    teamAngle: 'Takımın ortak dili hem güveni hem sürdürülebilirliği korur.',
    scriptHook: '"Burada doğruyu sade söylemek, güçlü görünmeye çalışmaktan daha değerli."',
    metric: 'güvenilir iletişim oranı',
    emotion: 'Hem ekipte hem adayda daha güvenli bir zemin kurar.',
  },
]

const OBJECTION_PACKS: ObjectionPack[] = [
  {
    category: 'money',
    shortLabel: 'Para çekincesi',
    rootFear: 'Bütçemi zorlar diye çekiniyorum.',
    reframe: 'Bu çoğu zaman gerçekten para itirazından çok, yanlış karar verme korkusudur.',
    nextMove: 'küçük bir başlangıç opsiyonunu görmek',
    softQuestion: 'En risksiz başlangıç şeklini birlikte görsek rahatlatır mı?',
    proof: 'Birçok kişi önce küçük ve kontrollü bir denemeyle rahatlıyor; netlik geldikçe karar vermek kolaylaşıyor.',
  },
  {
    category: 'time',
    shortLabel: 'Zaman çekincesi',
    rootFear: 'Zaten yeterince yoğunum, buna zaman ayıramam.',
    reframe: 'Zaman itirazı çoğu zaman ek yük korkusudur.',
    nextMove: 'haftalık hafif çalışma planını görmek',
    softQuestion: 'Bunu yoğun hayatına göre hafifletilmiş haliyle görsek daha gerçekçi olur mu?',
    proof: 'İnsanlar genelde tüm sistemi hayal edip yoruluyor; ama küçük bir haftalık ritim görünce tablo yumuşuyor.',
  },
  {
    category: 'trust',
    shortLabel: 'Güven çekincesi',
    rootFear: 'Tam güvenmeden adım atmak istemiyorum.',
    reframe: 'Bu kötü bir işaret değil; sadece daha sakin ve şeffaf bir çerçeve ihtiyacı var.',
    nextMove: 'sade bir güven çerçevesi kurmak',
    softQuestion: 'Sende güveni artıracak en kritik iki başlığı önce açsak iyi gelir mi?',
    proof: 'Güven çoğu zaman büyük iddialarla değil, sakin ve tutarlı açıklıkla oluşuyor.',
  },
  {
    category: 'family',
    shortLabel: 'Aile onayı',
    rootFear: 'Ailem ne der bilmiyorum, önce onu düşünmem lazım.',
    reframe: 'Bu, çoğu zaman tek başına karar almak istememek anlamına gelir.',
    nextMove: 'konuyu aileye sade anlatacak çerçeveyi görmek',
    softQuestion: 'Ailene bunu nasıl sade anlatabileceğini birlikte netleştirelim mi?',
    proof: 'Karşı taraf aileye nasıl anlatacağını gördüğünde baskı hissi ciddi biçimde azalır.',
  },
  {
    category: 'fear',
    shortLabel: 'Başarısızlık korkusu',
    rootFear: 'Ya yapamazsam ya da rezil olursam diye korkuyorum.',
    reframe: 'Burada korku genelde kapasite değil, görünür başarısızlık endişesidir.',
    nextMove: 'güvenli ilk adımı tanımlamak',
    softQuestion: 'İlk adımı neredeyse sıfır riskli hale getirsek rahatlar mısın?',
    proof: 'İnsanlar genelde büyük resmi görünce çekinir; güvenli ilk adım görünür olunca cesaret artar.',
  },
  {
    category: 'experience',
    shortLabel: 'Deneyim eksikliği',
    rootFear: 'Ben bu konularda deneyimli değilim.',
    reframe: 'Deneyim eksikliği çoğu zaman öğrenme eşiğinin gözde büyümesidir.',
    nextMove: 'öğrenmesi kolay ilk çalışma akışını görmek',
    softQuestion: 'Bunu sıfır deneyimle başlayacak biri gibi sadeleştirsek bakmak ister misin?',
    proof: 'İnsanlar ustalık değil, yönetilebilir bir başlangıç gördüğünde çok daha rahat ilerler.',
  },
  {
    category: 'product',
    shortLabel: 'Ürün şüphesi',
    rootFear: 'Ürünün bana ya da çevreme uygun olup olmadığından emin değilim.',
    reframe: 'Bu genelde ürün karşıtlığı değil, kişisel faydanın netleşmemesidir.',
    nextMove: 'tek somut faydayı bağlamak',
    softQuestion: 'Sence en önemli ihtiyaç hangi başlık; oradan baksak daha anlamlı olur mu?',
    proof: 'Kişi kendi ihtiyacına bağlı bir fayda gördüğünde ürün daha gerçek görünmeye başlar.',
  },
  {
    category: 'company',
    shortLabel: 'Şirket şüphesi',
    rootFear: 'Şirket tarafı bana çok net gelmiyor.',
    reframe: 'Bu çekince savunulacak değil, sakinleştirilecek bir güven ihtiyacıdır.',
    nextMove: 'şirketi sade ve şeffaf anlatmak',
    softQuestion: 'Şirketle ilgili en çok hangi nokta sende soru işareti bırakıyor?',
    proof: 'Kurumsal detay yığını yerine iki üç sağlam netlik başlığı daha çok güven üretir.',
  },
  {
    category: 'pyramid',
    shortLabel: 'Piramit algısı',
    rootFear: 'Bu bana piramit sistem gibi geliyor.',
    reframe: 'Bu itiraz genelde kötü deneyim hikayelerinin bıraktığı savunmadan gelir.',
    nextMove: 'farkı yalın şekilde göstermek',
    softQuestion: 'İstersen önce bunu neden öyle düşündürdüğünü konuşalım mı?',
    proof: 'İnsanlar karşılaştırmalı ve sakin bir açıklama duyduğunda önyargı hızla yumuşayabiliyor.',
  },
  {
    category: 'no_network',
    shortLabel: 'Çevrem yok',
    rootFear: 'Benim çevrem geniş değil, o yüzden yürümez.',
    reframe: 'Bu itiraz çoğu zaman ilişki kaynağını yanlış tanımlamaktan gelir.',
    nextMove: 'ilk aday havuzunu sade kurmak',
    softQuestion: 'Çevreyi sadece yakın arkadaş olarak düşünmesek, liste daha gerçek görünür mü?',
    proof: 'İnsanlar çevre tanımını genişlettiğinde başlangıçta düşündüğünden çok daha fazla seçeneği olduğunu fark ediyor.',
  },
  {
    category: 'introvert',
    shortLabel: 'İçe dönüklük',
    rootFear: 'Ben çok sosyal ya da girişken biri değilim.',
    reframe: 'Bu iş sadece dışa dönük insanlara göreymiş gibi görünse de asıl ihtiyaç bağ kuran tutarlılıktır.',
    nextMove: 'kişiliğe uygun temas şeklini bulmak',
    softQuestion: 'Daha sakin ve bire bir ilerleyen bir model sana daha uygun olur mu?',
    proof: 'Birçok içe dönük kişi, doğal ve bire bir iletişimle çok daha sürdürülebilir sonuç alıyor.',
  },
  {
    category: 'employed',
    shortLabel: 'Çalışıyorum',
    rootFear: 'Tam zamanlı çalıştığım için bunu yürütemem.',
    reframe: 'Bu çoğu zaman ikinci bir tam zamanlı iş korkusudur.',
    nextMove: 'yan akış gibi ilerleyen düzeni görmek',
    softQuestion: 'Bunu işinin yanına eklenen hafif bir akış gibi kursak daha mümkün görünür mü?',
    proof: 'İnsanlar baştan tam performans beklenmediğini görünce çok daha gerçekçi yaklaşabiliyor.',
  },
  {
    category: 'wait',
    shortLabel: 'Bir düşüneyim',
    rootFear: 'Biraz düşüneyim, şu an net değilim.',
    reframe: 'Bu cümle çoğu zaman hayır değil; kararın henüz yeterince hafif hissettirmemesi demektir.',
    nextMove: 'düşünmeyi kolaylaştıran tek soruyu netleştirmek',
    softQuestion: 'Kararı netleştirmek için şu an en büyük soru işaretin ne?',
    proof: 'İnsanlar neyi düşündüğünü adlandırabildiğinde süreç yeniden akmaya başlıyor.',
  },
  {
    category: 'other',
    shortLabel: 'Genel çekince',
    rootFear: 'İçimde tam oturmayan bir şey var ama net söyleyemiyorum.',
    reframe: 'Bazen net bir itiraz değil, dağınık bir tereddüt olur.',
    nextMove: 'çekincenin adını koymak',
    softQuestion: 'Sence bu daha çok güven, zaman, para yoksa başka bir şey mi?',
    proof: 'İtiraz adını bulduğunda konuşma muğlaklıktan çıkıp çözülebilir hale gelir.',
  },
]

const MASTER_SEED_ACADEMY_TR_ROWS: Array<
  [string, AcademyLibraryCategory, AcademyLibraryItemType, AcademyLibraryLevel, number, string[], string, string, string]
> = [
  ['seed-academy-tr-1','mindset','lesson','beginner',5,["mindset","reddetme","korku","başlangıç"],`Reddedilmenin Sırrı: "Hayır" Ne Demek?`,`Network marketingde en büyük engel reddedilme korkusudur. Bu eğitimde "hayır"ı nasıl yeniden çerçeveleyeceğini öğreneceksin.`,`## Reddedilmenin Sırrı: "Hayır" Ne Demek?

### Gerçek şu: "Hayır" sana değil, duruma söyleniyor

Birisi teklifini reddettiğinde, seni reddetmiyor. O anki hayatını, koşullarını, zamanını reddediyor. Bu ayrımı anlamak her şeyi değiştirir.

### İstatistik gerçeği

Başarılı distribütörler her 10 "hayır" için 1-2 "evet" alır. Bu demektir ki, 10 reddetme yaşadıysan, evet'e bu kadar yakınsın.

### "Hayır"ı nasıl oku?

- **"Şimdi değil"** → 6 ay sonra tekrar bağlan
- **"Bu şekilde değil"** → Yaklaşımını değiştir
- **"Sen değil"** → Nadiren gerçekleşir, genellikle zamanlama veya konu
- **"Asla"** → Saygıyla kabul et, ilişkiyi koru

### Pratik egzersiz

Bu hafta 5 kişiyle konuş. "Hayır" alsan bile ilişkiyi kesmeden çık. Her "hayır"dan sonra şunu sor: "Peki sana ne zaman tekrar yazabilirim?" — Kapıyı açık bırak.

### Altın kural

Reddedilme korkusu, insanlarla hiç konuşmamaktan daha az zarar verir. Hareketsizlik en büyük başarısızlıktır.`],
  ['seed-academy-tr-2','prospecting','lesson','beginner',7,["prospecting","liste","aday bulma","başlangıç"],`Soğuk Listeyi Nasıl Oluşturursun?`,`Kimi tanıdığını düşündüğünden çok daha fazla kişi var. Bu eğitimde aday listeni sistematik olarak oluşturmayı öğreneceksin.`,`## Soğuk Listeyi Nasıl Oluşturursun?

### "Kimseyi tanımıyorum" en büyük yanılgı

Bir kağıt al ve şu soruları cevapla:

**İş çevren:**
- Eski iş arkadaşların kimler?
- Müşterilerin, tedarikçilerin?
- Sektördeki tanıdıkların?

**Sosyal çevren:**
- Okul arkadaşların?
- Komşuların, mahalleli?
- Spor/hobi arkadaşların?

**Aile çevren:**
- Uzak akrabalar?
- Eşinin/partnerin ailesi?

**Dijital çevren:**
- Instagram takipçilerin?
- Facebook arkadaşların?
- WhatsApp gruplarındaki isimler?

### Minimum 100 kişilik liste hedefle

Çoğu insan 20-30 isim yazar ve durur. Ama zorlasan 100 kolayca çıkar.

### Önceliklendirme matrisi

Her ismin yanına yaz:
- 🔥 Sıcak: Sana güvenir, açık fikirli
- 🌡️ Ilık: Ara sıra görüşürsünüz
- ❄️ Soğuk: Uzun süre görüşmediniz

Sıcaktan başla, soğuğa doğru ilerle.

### Kritik hata

Listeyi yazmadan önce "bu kişi hayır der" diye zihinsel eleme yapma. Bu senin kararın değil, onların kararı.`],
  ['seed-academy-tr-3','inviting','lesson','beginner',6,["davet","inviting","merak","script"],`Davet Sanatı: Tekliften Önce Merak`,`Çoğu distribütör davet ederken direkt teklif yapar ve reddedilir. Merak yaratarak davet etmenin formülünü öğren.`,`## Davet Sanatı: Tekliften Önce Merak

### Neden çoğu davet başarısız olur?

Çünkü davet değil, satış yapılıyor. "Harika bir fırsat var, bak" ile başlamak, karşı tarafı savunmaya geçirir.

### Merak yaratmanın 3 adımı

**Adım 1: Bağlan**
"Nasılsın?" deyip geçme. Gerçekten ilgilen. Son ne yaptıklarını sor.

**Adım 2: Merak ettir**
"Sana bir şey göstermek istiyorum, ilgin olur mu?" — Bu kadar.

**Adım 3: Düşük baskı**
"Olmayabilir de, sadece bir göz at."

### Asla söyleme

- "Sana harika bir fırsat var"
- "Para kazanmak ister misin?"
- "Hayatın değişecek"

### Altın prensip

İnsanlar satın almayı sever, ama satılmayı sevmez. Merak yarat, bırak kendileri istesin.`],
  ['seed-academy-tr-4','inviting','script','beginner',8,["script","whatsapp","ilk mesaj","davet"],`WhatsApp İlk Mesaj Scriptleri (5 Farklı Senaryo)`,`Farklı durumlar için hazır WhatsApp ilk mesaj scriptleri. Kopyala, kişiselleştir, gönder.`,`## WhatsApp İlk Mesaj Scriptleri

### Senaryo 1: Uzun süredir görüşmediğin biri

"Merhaba [Ad]! Geçen gün aklıma düştün, nasılsın? Neler yapıyorsun?"

Güzel, sevindim. Seni aklıma getiren bir şey var aslında — ilgin olur mu göstermek istiyorum?

### Senaryo 2: Eski iş arkadaşı

"Merhaba [Ad]! [Eski işyeri adı]'dan aklıma geldin. Nasıl gidiyor her şey?"

Güzel. Aslında bir şey üzerinde çalışıyorum, sektörden biri olarak fikrin değerli olurdu. Bir bakabilir misin?

### Senaryo 3: Ek gelir arayan tanıdık

"Merhaba [Ad]! Geçen [zaman] ek gelir aradığından bahsetmiştin. O konu hâlâ gündeminde mi?"

### Altın kural

Her mesaj kişiye özel hissettirmeli. İsim yaz, ortak bir noktaya değin.`],
  ['seed-academy-tr-5','presenting','lesson','intermediate',8,["sunum","presenting","yapı","script"],`20 Dakikada Etkili Sunum Yapısı`,`Saatlerce konuşmak yerine 20 dakikada etki bırakmanın yapısını öğren. Dikkat, merak, karar — üç perdeli sunum.`,`## 20 Dakikada Etkili Sunum Yapısı

### 20 dakika yapısı

0-3 dakika: Bağlantı kur
3-8 dakika: Sorun / fırsat
8-15 dakika: Çözüm
15-18 dakika: Soru-cevap
18-20 dakika: Yönlendir

### Yapma listesi

❌ PowerPoint'e bağımlı olma
❌ Rakamları saydırma
❌ Kaçırma baskısı yapma`],
  ['seed-academy-tr-6','closing','lesson','intermediate',6,["kapanış","closing","karar","teknik"],`Kapanışın 3 Altın Kuralı`,`Kapanış satış baskısı değil, kararı kolaylaştırmaktır. Doğal kapanış teknikleri ve ne söyleyip ne söylemeyeceğin.`,`## Kapanışın 3 Altın Kuralı

### Kural 1
Karar sormak, baskı değil kolaylaştırmaktır.

### Kural 2
Sessizliği boşa harcama.

### Kural 3
"Hayır" kapanış değil, bilgidir.

### Kapanış cümleleri

✅ Bundan sonra nasıl devam etmek istersin?
✅ Denemeye ne dersin, herhangi bir riski yok.`],
  ['seed-academy-tr-7','follow_up','lesson','beginner',5,["takip","follow-up","48 saat","timing"],`48 Saat Kuralı: Sunum Sonrası Takip`,`Sunumdan sonra ilk 48 saat kritiktir. Ne zaman, nasıl ve ne söyleyerek takip edeceğini öğren.`,`## 48 Saat Kuralı: Sunum Sonrası Takip

### Neden 48 saat?

Sunum sonrası ilk 48 saat, kişi hâlâ sıcakken geçer.

### Takip zamanlaması

- 2-4 saat sonra: kısa mesaj
- 24 saat sonra: hafif dokunuş
- 48 saat sonra: net bir adım

### Devam eden takip ritmi

- 1. hafta: 1-2 mesaj
- 2. hafta: 1 mesaj`],
  ['seed-academy-tr-8','follow_up','script','beginner',5,["takip","düşüneceğim","script","itiraz"],`"Düşüneceğim" Diyene Ne Yazacaksın?`,`"Düşüneceğim" genellikle bir soru işaretinin arkasına saklanır. Bu scriptlerle gerçek endişeyi ortaya çıkar.`,`## "Düşüneceğim" Diyene Ne Yazacaksın?

### Ortaya çıkarma mesajı

"Düşünürken en çok ne takılıyor aklına? Para mı, zaman mı, yoksa başka bir şey mi?"

### Kapanış mesajı

"Sadece sormak istedim — bir fikrin oluştu mu? Eğer hâlâ zamanın varsa 10 dakika konuşabiliriz."`],
  ['seed-academy-tr-9','team_building','lesson','intermediate',7,["ekip","team building","liderlik","seçim"],`İlk 5 Ekip Üyeni Nasıl Seçersin`,`Ekip kalitesi nicelikten önce gelir. Doğru 5 kişiyi bulmak yanlış 50 kişiden daha değerlidir.`,`## İlk 5 Ekip Üyeni Nasıl Seçersin

### İdeal ekip üyesi profili

- Öğrenmeye açık mı?
- Tutarlı mı?
- Sosyal mi?
- Motivasyonu içeriden mi geliyor?

### Düşünce tuzağı

5 bağlı kişi, 50 ilgisiz kişiden güçlüdür.`],
  ['seed-academy-tr-10','leadership','lesson','advanced',8,["duplikasyon","liderlik","sistem","ekip büyütme"],`Duplikasyon Sistemi Nedir?`,`Network marketingin büyüsü: Öğrettiğini öğretenler yaratmak. Duplikasyon olmadan büyüme durur.`,`## Duplikasyon Sistemi Nedir?

### Duplikasyon formülü

Öğren → Uygula → Öğret → İzle

### Altın soru

Ekibim benim olmadan da devam edebilir mi?`],
  ['seed-academy-tr-11','social_media','lesson','intermediate',7,["instagram","sosyal medya","marka","içerik"],`Instagram'da Kişisel Marka Kurmak`,`Instagram'ı doğru kullanmak, sana gelen sıcak adaylar yaratır. Spam değil, çekim merkezi ol.`,`## Instagram'da Kişisel Marka Kurmak

### İçerik karması

- 3 eğitici paylaşım
- 2 kişisel paylaşım
- 1 iş veya ürün paylaşımı

### DM stratejisi

Takipçilerle organik konuşmalar başlat. Asla direkt link gönderme.`],
  ['seed-academy-tr-12','social_media','cheat_sheet','beginner',4,["sosyal medya","hatalar","cheat sheet","başlangıç"],`Sosyal Medyada YAPILMAYACAKLAR`,`Hızlı referans: Sosyal medyada seni yakacak 10 hata ve alternatifi.`,`## Sosyal Medyada YAPILMAYACAKLAR

❌ Spam DM atmak
❌ Sadece ürün postalamak
❌ Abartılı kazanç paylaşımları
❌ Başkalarının içeriğini kopyalamak
❌ Olumsuz yorumlarla tartışmak

✅ Organik büyü, yavaş ama kalıcı.`],
  ['seed-academy-tr-13','compliance','lesson','beginner',8,["yasal","compliance","TİTCK","Türkiye"],`Türkiye'de NM Yasal Çerçevesi (TİTCK)`,`Yasal sınırları bilmek seni hem korur hem güvenilir yapar. TİTCK, MLM yasası ve satış sözleşmesi hakkında temel bilgiler.`,`## Türkiye'de NM Yasal Çerçevesi

### Meşru NM
- Gerçek ürün satışı var
- Gelir, ürün satışından geliyor
- Cayma hakkı var

### Yasadışı piramit
- Ürün yok veya sembolik
- Gelir, yeni üye getirmekten geliyor

### Pratik kural

Sağlık iddiası ve garanti edilen kazanç söylemleri kullanma.`],
  ['seed-academy-tr-14','compliance','cheat_sheet','beginner',4,["sağlık","yasal","söylem","compliance"],`Sağlık Ürünleri İçin Söylenebilen/Söylenemeyen Şeyler`,`Yasal açıdan güvende kalmak için hızlı referans. Hangi cümleleri kullanabilirsin, hangileri risk yaratır?`,`## Sağlık Ürünleri İçin Söylenebilenler

✅ Bende şu etkiyi yaptı
✅ Deneyimimi paylaşabilirim
✅ Sertifika ve içerik bilgisini verebilirim

## Söylenemeyenler

❌ Hastalığı iyileştirir
❌ Kesinlikle işe yarar
❌ Doktor onaylıdır (belgesiz)`],
  ['seed-academy-tr-15','mindset','lesson','beginner',5,["mindset","motivasyon","düşük enerji","başlangıç"],`Motivasyon Düştüğünde Ne Yaparsın?`,`Motivasyon dalgalanır — bu normaldir. Düşük enerji dönemlerinde seni ayakta tutacak pratik araçlar.`,`## Motivasyon Düştüğünde Ne Yaparsın?

### 5 pratik araç

1. Neden listenizi yenile
2. Küçük bir başarı yarat
3. Mentoruna ulaş
4. Başarı hikayelerini oku
5. Fiziksel hareket

### 24 saat kuralı

Çok kötü hissediyorsan bugün büyük karar alma.`],
]

const MASTER_SEED_OBJECTION_TR_ROWS: Array<
  [string, AcademyObjectionCategory, string, string, string, string, string, string]
> = [
  ['seed-objection-tr-1','money',`Şu an param yok, başlayamam.`,`Param yok`,`Para gerektiren başlangıç değil, küçük ürün denemesi. Kararın senin.`,`Anlıyorum, bu çok yaygın bir endişe. Aslında ben de aynı durumda başladım. Önemli olan büyük yatırım değil, küçük adımlar. Bu işin güzel yanı, başlangıçta ürünleri kendin kullanarak başlayabilmen — yani harcadığın para zaten ihtiyacın olan şeylere gidiyor. İstersen, yatırım gerektirmeden başlayabileceğin yolları sana göstereyim, sonra karar verirsin. Sadece bilgi, baskı yok.`,`Empati + ortak deneyim + alternatif yol + baskısız çıkış`,`A: Param yok şu an.
B: Anlıyorum, ben de aynı yerden başladım. Aslında başlangıçta zaten kullandığın ürünleri seçerek girebiliyorsun. Yani harcamak değil, yönlendirmek oluyor. İstersen 5 dakika anlatayım, sonra "bu bana göre değil" dersen tamamen normal.`],
  ['seed-objection-tr-2','pyramid',`Bu Ponzi şeması mı? Saadet zinciri mi?`,`Ponzi/Piramit`,`Ponzi ürünsüzdür, NM gerçek ürünle yapılır. Şirket yasaldır, denetlenir.`,`Bu çok yerinde bir soru, sormaya hakkın var. Aslında network marketing ile piramit/Ponzi arasında çok net farklar var. Ponzi şemasında ürün yok, sadece para dolaşımı var. Network marketingde ise gerçek bir ürün var, müşteriye satılıyor, gelir oradan geliyor. Şirket yıllardır Türkiye'de yasal olarak faaliyette ve TİTCK denetiminden geçiyor. İstersen ürünleri sana göstereyim, kendin değerlendirirsin.`,`Soruya saygı + net bilgi + somut kanıt + ürün önerisi`,`A: Bu Ponzi mi yani?
B: Çok haklısın sormaya hakkın var. Ponzi'de ürün yok, sadece para dolaşır. Bizde gerçek ürünler var, ben bile aile için kullanıyorum. Şirket de Türkiye'de TİTCK denetimli. İstersen göstereyim, sen karar ver.`],
  ['seed-objection-tr-3','time',`Çok meşgulüm, zamanım yok bu işlere.`,`Zamanım yok`,`Tam zamanlı değil, günde 1-2 saat. 15 dk dinle, sonra karar ver.`,`Tamamen anlıyorum, çoğu insan ilk başta aynı şeyi söylüyor. Ben de aynı durumdaydım. İşin güzel yanı, bu tam zamanlı bir iş değil — günde 1-2 saat ayırarak başlayabiliyorsun, kendi temponda.`,`Empati + zaman beklentisini düşür + küçük commitment iste`,`A: Boş zamanım yok ki.
B: Anlıyorum, ben de öyle başladım. Aslında bu işin güzelliği günde 1 saat de yapılabilmesi.`],
  ['seed-objection-tr-4','family',`Eşim/ailem izin vermiyor.`,`Aile izin vermiyor`,`Ailenin şüphesi normaldir; onu da bilgilendirmeye davet et.`,`Bu gerçekten önemli bir endişe, ailenin desteği bu işte çok değerli. Genellikle ailelerin itirazı, bu konuyu tam anlamamaktan geliyor.`,`Empati + ailenin korkusunu normalize et + birlikte karar`,`A: Eşim istemez bu işleri.
B: Anlıyorum, çoğu aile ilk başta aynı şeyi söylüyor. İstersen eşini de dahil edelim.`],
  ['seed-objection-tr-5','fear',`Ben satışçı değilim, satış yapamam.`,`Satışçı değilim`,`NM satış değil, tavsiyle. Zaten yapıyor olduğun şeyi para kazanarak yapıyorsun.`,`Bu işin en güzel yanı: satışçı olmak zorunda değilsin. En iyi network marketingciler, satış yapmayan ama paylaşan insanlardır.`,`Yeniden çerçeveleme + günlük hayattan örnek + baskısız`,`A: Satış yapamam, satışçı değilim.
B: Ben de satışçı değilim. Bu işi tavsiye gibi görüyorum.`],
  ['seed-objection-tr-6','experience',`Daha önce denedim, para kaybettim.`,`Daha önce olmadı`,`Önceki deneyim değerli; bu sefer destek ve sistem var. Neyi farklı yapabiliriz?`,`Bu gerçekten üzücü ve seni duyuyorum. Maalesef sektörde iyi çalışılmayan veya desteksiz bırakılan örnekler var.`,`Empati + fark yaratacak unsuru göster + soru ile devam`,`A: Bir kez denedim, para kaybettim.
B: Seni duyuyorum. O zaman seni destekleyen biri var mıydı?`],
  ['seed-objection-tr-7','product',`Bu ürünler gerçekten işe yarıyor mu?`,`Ürüne inanmıyorum`,`Şüpheyle başlamak normal. Dene, fark hissetmezsen zaten devam etme.`,`Bu soruyu sorman harika, çünkü ben de başlamadan önce aynı şeyi sordum. En dürüst cevabım: Ben ve ailem kullanıyoruz.`,`Dürüstlük + kişisel deneyim + deneme önerisi`,`A: Ürünler gerçekten işe yarıyor mu?
B: Ben aynı soruyla başladım. En iyisi kendin denemen.`],
  ['seed-objection-tr-8','company',`Bu şirkete güvenmiyorum, duyduklarım iyi değildi.`,`Şirkete güvenmiyorum`,`Kaynağı sorgula; şirket belgelerini birlikte inceleyelim.`,`Bu endişeyi duyduğuna sevindim, doğruyu araştırmak önemli. Şirket hakkında duyduklarını paylaşırsan, birlikte değerlendirebiliriz.`,`Soruya saygı + bilgi paylaşımı + belge/kanıt göster`,`A: Şirketten iyi şeyler duymadım.
B: Ne duydun, birlikte değerlendirelim.`],
  ['seed-objection-tr-9','trust',`Sana güveniyorum ama bu işe pek inanmıyorum.`,`İşe inanmıyorum`,`Şüphe normal; sadece bilgilenme, karar sana ait.`,`Dürüstlüğün için teşekkürler, bu benim için çok değerli. Şüphe duymak tamamen normal.`,`Empati + şüpheyi normalize et + düşük riskli adım öner`,`A: Bu işlere inanmıyorum.
B: Çok normal, karar vermeni değil sadece bilgilenmeni istiyorum.`],
  ['seed-objection-tr-10','no_network',`Çevrem çok dar, tanıdığım yok ki.`,`Çevrem yok`,`Çevre büyüklüğü değil ilişki kalitesi önemli. 10 kişilik listeyle başla.`,`Bu çok yaygın bir düşünce ama büyük çevreler büyük ağlar garantilemez. Önemli olan ilişki kalitesi.`,`Yeniden çerçeveleme + pratik adım + güven ver`,`A: Hiç çevrem yok ki.
B: Bir kağıda 10 isim yaz bakalım, şaşıracaksın.`],
  ['seed-objection-tr-11','introvert',`Ben çok içe dönüğüm, bu iş benim için değil.`,`İçe dönüğüm`,`İçe dönük olmak engel değil; derin ilişki kurma becerin avantaj.`,`Tanıdığım en başarılı network marketingcilerin bir kısmı tam da senin gibi içe dönük insanlar.`,`Yeniden çerçeveleme + içe dönüklüğü güce dönüştür`,`A: Çok içe dönüğüm.
B: Bu iş büyük sahne değil, bire bir konuşmalar.`],
  ['seed-objection-tr-12','employed',`İşim var, maaşım yeterli.`,`İşim var yeterli`,`B planı olarak düşün; işini bırakmak zorunda değilsin.`,`Harika, bu gerçekten iyi bir pozisyon. Sana sormak istiyorum: Maaşın 10 yıl sonra da aynı hayatı karşılayacak mı?`,`Gelecek odaklı soru + risk-fayda dengesi`,`A: İşim var, neden uğraşayım?
B: Bu işi yapmak için işten çıkman gerekmiyor.`],
  ['seed-objection-tr-13','wait',`Düşüneceğim, daha sonra bakarım.`,`Düşüneceğim`,`"Düşüneyim"in arkasındaki gerçek soruyu bul.`,`Çoğu zaman "düşüneyim" bir soru işaretinin arkasında saklıdır.`,`Soru ile derine in + belirsizliği somutlaştır + tarih belirle`,`A: Düşüneyim, sonra bakarım.
B: Düşünürken en çok ne takıldı aklına?`],
  ['seed-objection-tr-14','experience',`Bu markayı hiç duymadım, tanınmıyor.`,`Markayı tanımıyorum`,`Yenilik fırsat olabilir; ürün kalitesini kendin değerlendir.`,`Her yeni marka başlangıçta bilinmiyor. Önemli olan markanın şu anki büyüklüğü değil, ürün kalitesi.`,`Yeniden çerçeveleme + kanıt göster + deneme öner`,`A: Bu markayı tanımıyorum.
B: Sana sertifikalarını göstereyim, sonra ürünü dene.`],
  ['seed-objection-tr-15','trust',`Sen de para kazanmıyorsundur zaten.`,`Sen de kazanmıyorsun`,`Dürüst ol; belgeleri göster, baskısız anlat.`,`Bu soruyu sormaya hakkın var ve dürüst olmak istiyorum. Bu işte herkes aynı anda aynı miktarı kazanmıyor.`,`Dürüstlük + kanıt gösterme + şeffaflık`,`A: Sen de para kazanmıyorsun.
B: Rakamlarımı ve sürecimi gösterebilirim.`],
  ['seed-objection-tr-16','family',`Çocuklar küçük, hiç vaktim yok.`,`Çocuklar küçük`,`Esnek çalışma saatleri tam da çocuk sahibi ebeveynler için uygun.`,`Ev hanımlığı veya çocuk bakımıyla yürütülebilen nadir işlerden biri.`,`Durumu yeniden çerçevele + pratik zaman dilimleri göster`,`A: Çocuklarım var, vaktim olmuyor.
B: Uyku saatlerinde, günde 1 saat bile yeter başlangıç için.`],
  ['seed-objection-tr-17','trust',`Pasif gelir masallarına inanmıyorum.`,`Pasif gelire inanmıyorum`,`Pasif gelir anında gelmez; emek + sistem + zaman ile oluşur.`,`Haklısın, pasif gelir kelimesi çok suistimal edildi. Başlangıçta emek gerekir.`,`Beklentiyi düzelt + gerçekçi süreç anlat`,`A: Pasif gelir yalan.
B: Hemen değil; sistematik çalışma ile oluşan bir süreç.`],
  ['seed-objection-tr-18','fear',`Yeterince eğitimim yok, başaramam.`,`Eğitimim yok`,`NM okul değil iletişim ister. Eğitim sistemimiz var, bırakmıyoruz.`,`Bu işte okul diploması değil, insanlarla iletişim kurmak önemli.`,`Empati + yeniden çerçevele + destek sistemi vurgula`,`A: Eğitimim yok.
B: Diploma değil, insan sevgisi ve iletişim önemli.`],
  ['seed-objection-tr-19','other',`Bu tür işlere artık motive olamıyorum.`,`Motivasyonum yok`,`Motivasyon hedeften gelir; somut bir 3 aylık hedef koy.`,`Motivasyon kayması herkesin yaşadığı bir şey. Bu iş bir araçtır.`,`Empati + hedef bulma + küçük adım`,`A: Motivasyonum yok.
B: 3 ay içinde ne yapmak istersin? Somut hedef bulalım.`],
  ['seed-objection-tr-20','other',`Konuştuğum herkes hayır dedi, bu iş olmaz.`,`Herkes reddediyor`,`"Hayır" normaldir. Yaklaşımını birlikte gözden geçirelim.`,`Redler bu işin bir parçası. Başarılı distribütörler hayır almayı öğrenen insanlardır.`,`Normalize et + sistem hatası ara + destek sun`,`A: Herkes hayır dedi.
B: Nasıl konuştun, birlikte bakalım; yaklaşım her şeyi değiştirir.`],
]

function buildGeneratedAcademyItems(): AcademyLibraryItem[] {
  return CATEGORY_SUBJECTS.flatMap((subject) =>
    LESSON_BLUEPRINTS.map((blueprint) => ({
      id: `sys-academy-tr-${subject.category}-${blueprint.slug}`,
      category: subject.category,
      type: blueprint.type,
      level: blueprint.level,
      readingMinutes: blueprint.readingTime,
      tags: blueprint.tags(subject),
      title: localized(blueprint.buildTitle(subject.label)),
      summary: localized(blueprint.buildSummary(subject)),
      content: localized(blueprint.buildContent(subject)),
      coachPrompt: localized(`${blueprint.buildTitle(subject.label)} içeriğine göre bana uygulanabilir bir saha planı çıkar.`),
    })),
  )
}

function buildDeepObjectionGuides(): AcademyObjectionGuide[] {
  return OBJECTION_PACKS.map((pack) => ({
    id: `sys-objection-tr-${pack.category}`,
    category: pack.category,
    tags: [pack.category, 'itiraz', 'sakin cevap', 'netlik'],
    objection: localized(pack.rootFear),
    shortResponse: localized(`${pack.reframe} Önce sadece ${pack.nextMove.toLowerCase()} tarafını netleştirelim.`),
    fullResponse: localized(`${pack.reframe}

Burada hemen büyük bir karar vermeni beklemiyorum. Daha sağlıklı olan şey, önce ${pack.nextMove.toLowerCase()} kısmını sakin biçimde görmek. Sonra sana uyuyorsa ilerlersin, uymuyorsa da boş yere yük almamış olursun.

${pack.proof}`),
    approach: localized(`Önce kaygıyı kabul et, sonra baskıyı düşür ve konuşmayı ${pack.nextMove.toLowerCase()} tarafına indir.`),
    exampleDialog: localized(`Aday: ${pack.rootFear}

Sen: Çok normal. Bir anda karar vermeni istemem.

Sen: İstersen önce sadece ${pack.nextMove.toLowerCase()} tarafına bakalım.

Sen: ${pack.softQuestion}`),
    coachPrompt: localized(`${pack.rootFear} itirazına daha doğal ama güçlü bir cevap yaz.`),
  }))
}

const generatedAcademyItems = buildGeneratedAcademyItems()

const seedAcademyItems: AcademyLibraryItem[] = MASTER_SEED_ACADEMY_TR_ROWS.map(
  ([id, category, type, level, readingMinutes, tags, title, summary, content]) => ({
    id,
    category,
    type,
    level,
    readingMinutes,
    tags,
    title: localized(title),
    summary: localized(summary),
    content: localized(content),
    coachPrompt: localized(`${title} içeriğini sahada kullanabileceğim pratik bir plana dönüştür.`),
  }),
)

const deepObjectionGuides = buildDeepObjectionGuides()

const seedObjectionGuides: AcademyObjectionGuide[] = MASTER_SEED_OBJECTION_TR_ROWS.map(
  ([id, category, objection, shortLabel, shortResponse, fullResponse, approach, exampleDialog]) => ({
    id,
    category,
    tags: [category, shortLabel],
    objection: localized(objection),
    shortResponse: localized(shortResponse),
    fullResponse: localized(fullResponse),
    approach: localized(approach),
    exampleDialog: localized(exampleDialog),
    coachPrompt: localized(`${objection} itirazına daha modern ve güçlü bir cevap yaz.`),
  }),
)

export const academyLibraryItems: AcademyLibraryItem[] = [...generatedAcademyItems, ...seedAcademyItems]

export const academyObjectionGuides: AcademyObjectionGuide[] = [...deepObjectionGuides, ...seedObjectionGuides]
