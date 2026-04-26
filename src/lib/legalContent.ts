// ============================================================
// Network Marketing Ultimate (NMU) — Legal İçerik
// ------------------------------------------------------------
// Bu metinler iyi niyetle hazırlanmış taslaklardır. Yayına almadan
// önce kendi avukatın/uyum danışmanın ile teyit etmen tavsiye edilir.
// Şirket adı, iletişim bilgisi ve VERBİS kayıt numarası alanları
// gerçek değerleriyle güncellenmelidir.
// ============================================================

import type { Locale } from '@/lib/i18n'

export type LegalSlug = 'privacy' | 'terms' | 'kvkk'

export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalDocument {
  title: string
  intro: string
  lastUpdatedLabel: string
  lastUpdated: string
  sections: LegalSection[]
}

const LAST_UPDATED = '2026-04-26'

const COMPANY_NAME = 'Network Marketing Ultimate'
const CONTACT_EMAIL = 'hello@suattayfuntopak.com'

export const legalContent: Record<Locale, Record<LegalSlug, LegalDocument>> = {
  tr: {
    privacy: {
      title: 'Gizlilik Politikası',
      intro:
        `${COMPANY_NAME} ("NMU", "biz") olarak gizliliğine önem veriyoruz. Bu politika; ürünümüzü, ` +
        'web sitemizi ve ilgili hizmetlerimizi kullandığında hangi verileri topladığımızı, neden ' +
        'topladığımızı ve nasıl koruduğumuzu açıklar.',
      lastUpdatedLabel: 'Son güncelleme',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. Topladığımız veriler',
          body: [
            'Hesap bilgileri: ad, e-posta adresi, oturum açma anahtarı (Supabase tarafından yönetilir).',
            'Çalışma alanı içeriği: kontaklar, müşteriler, ürünler, görevler, mesaj taslakları, akademi notları, motivasyon favorileri gibi senin oluşturduğun veriler. Bu veriler yalnızca senin çalışma alanına aittir; başka bir kullanıcı erişemez.',
            'Kullanım verileri: temel kullanıcı arayüzü etkileşimleri, hata günlükleri, tarayıcı tipi, IP adresi.',
            'Erken erişim için bekleme listesi: e-posta adresin, kayıt kaynağı ve dil tercihi.',
          ],
        },
        {
          heading: '2. Verileri neden işleriz',
          body: [
            'Hizmetin kullanılabilmesi: ürün özelliklerini sağlamak (CRM, görev takibi, akademi vb.).',
            'Hesap güvenliği: oturum yönetimi, hesabını koruma, kötüye kullanımı engelleme.',
            'Ürün geliştirme: anonim/birikimli kullanım metrikleri ile sistem performansını ve özelliklerini iyileştirmek.',
            'İletişim: önemli ürün duyuruları, beta dönemi bilgilendirmeleri ve yalnızca açıkça onayladığın pazarlama içerikleri.',
          ],
        },
        {
          heading: '3. Üçüncü taraf hizmetler',
          body: [
            'Veri tabanı ve kimlik doğrulama: Supabase (AB/ABD altyapısı). Verilerin satır seviyesi (RLS) izole şekilde tutulur.',
            'YZ üretim hizmetleri: yalnızca senin tetiklediğin AI mesaj üretimi sırasında, gönderdiğin metnin işlenmesi için seçili sağlayıcıya iletilir. Çıktı geri döndüğünde hizmet sağlayıcının üretim sürecinde tutulan logları kendi politikalarına tabidir.',
            'Hosting / CDN: ürünün barındırıldığı altyapı sağlayıcısı.',
            'Üçüncü taraflarla yalnızca hizmetin işlemesi için zorunlu olan asgari veriyi paylaşırız.',
          ],
        },
        {
          heading: '4. Çerezler',
          body: [
            'Tema ve dil tercihini hatırlamak için zorunlu çerezler kullanırız.',
            'Oturum yönetimi için Supabase tarafından yönetilen çerezler / yerel depolama anahtarları kullanılır.',
            'Üçüncü taraf izleme/reklam çerezi kullanmayız. İleride eklenirse politika güncellenir ve onayın talep edilir.',
          ],
        },
        {
          heading: '5. Veri saklama ve silme',
          body: [
            'Çalışma alanın aktif olduğu sürece verilerini saklarız.',
            'Hesabını silmek istediğinde tüm kişisel verilerin makul bir süre içinde kalıcı olarak silinir veya anonimleştirilir. Yedeklerden tamamen silinmesi 30 güne kadar sürebilir.',
            'Yasal yükümlülükler nedeniyle saklamamız gereken muhasebe / vergi / hukuki kayıtlar bu süreden bağımsız olarak ilgili mevzuat süresince tutulur.',
          ],
        },
        {
          heading: '6. Hakların',
          body: [
            'Sahip olduğun verilere erişme, düzeltme ve silme hakkın vardır.',
            'CSV dışa aktarımı ile çalışma alanından kontak, müşteri, sipariş ve görev verilerini istediğin zaman indirebilirsin.',
            'Talepler için aşağıdaki iletişim adresine ulaşabilirsin.',
          ],
        },
        {
          heading: '7. Güvenlik',
          body: [
            'Aktarım sırasında TLS, dinlenmede ise sağlayıcının (Supabase / hosting) standart şifreleme yöntemleri kullanılır.',
            'Çalışma alanları arasında satır seviyesi izolasyon (RLS) ile sıkı erişim sınırlaması uygulanır.',
            'Hiçbir sistem %100 güvenli değildir; gerçekleşen bir güvenlik ihlalinde mevzuatın gerektirdiği şekilde bilgilendirme yapılır.',
          ],
        },
        {
          heading: '8. Çocukların gizliliği',
          body: [
            'NMU 18 yaş altı kişilere yönelik bir ürün değildir ve bilinçli olarak çocuklardan kişisel veri toplamayız.',
          ],
        },
        {
          heading: '9. Politikadaki değişiklikler',
          body: [
            'Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler ürün içinde ve/veya e-posta ile duyurulur. "Son güncelleme" tarihi her zaman en güncel sürümü gösterir.',
          ],
        },
        {
          heading: '10. İletişim',
          body: [
            `Gizlilikle ilgili tüm soru ve talepler için bize ${CONTACT_EMAIL} adresinden ulaşabilirsin.`,
          ],
        },
      ],
    },

    terms: {
      title: 'Kullanım Koşulları',
      intro:
        `${COMPANY_NAME} hizmetlerini kullanırken aşağıdaki koşulları kabul etmiş sayılırsın. ` +
        'Lütfen kayıt olmadan veya hizmeti kullanmaya başlamadan önce bu koşulları dikkatlice oku.',
      lastUpdatedLabel: 'Son güncelleme',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. Hizmetin tanımı',
          body: [
            'NMU; network marketing distribütörlerinin kontak yönetimi, süreç takibi, müşteri / ürün kayıtları, mesaj üretimi, akademi içerikleri ve analitik gibi araçlara tek panelden erişmesini sağlayan bir SaaS platformudur.',
            'Erken erişim sürecinde bazı özellikler değişebilir, eklenebilir veya kaldırılabilir.',
          ],
        },
        {
          heading: '2. Hesap',
          body: [
            'NMU hesabını yalnızca 18 yaşını doldurmuş ve hukuken sözleşme yapma ehliyetine sahip kişiler oluşturabilir.',
            'Hesabını ve hesabınla yapılan tüm işlemleri korumakla yükümlüsün; oturum açma bilgilerini başkalarıyla paylaşamazsın.',
            'Sağladığın bilgilerin doğru ve güncel olması gerekir.',
          ],
        },
        {
          heading: '3. Kabul edilebilir kullanım',
          body: [
            'NMU\'yu yalnızca yasalara uygun amaçlarla kullanırsın.',
            'Spam, dolandırıcılık, başka kişilerin verilerini izinsiz işleme, kişisel veri toplama / satma, fikri mülkiyet ihlali, kötü amaçlı yazılım dağıtma gibi davranışlar yasaktır.',
            'YZ mesaj stüdyosunu kullanırken; ürettiğin mesajların alıcının açık rızası olmadan toplu / istenmeyen şekilde gönderilmesi senin sorumluluğundadır.',
          ],
        },
        {
          heading: '4. Kullanıcı içeriği',
          body: [
            'NMU\'ya yüklediğin / oluşturduğun veriler (kontaklar, mesajlar, notlar vb.) sana aittir.',
            'Hizmeti çalıştırmak, yedeklemek ve sana sunmak için bu içeriği işlememiz, görüntülememiz ve ilgili sağlayıcılara aktarmamız zorunludur; bu sınırlı amaçlar için bize gerekli izni vermiş sayılırsın.',
            'Ürettiğin içeriklerin ilgili mevzuata (KVKK / GDPR / spam yasaları dahil) uygun olduğundan emin olmak senin sorumluluğundadır.',
          ],
        },
        {
          heading: '5. Fikri mülkiyet',
          body: [
            'NMU markası, logosu, kaynak kodu ve içerikleri NMU\'nun veya lisans verenlerinin mülkiyetindedir.',
            'Hizmeti kullanmak için sana sınırlı, devredilemez, münhasır olmayan bir kullanım hakkı verilir.',
            'Kaynak kodun veya tasarımın izinsiz çoğaltılması, dağıtılması veya türev çalışmalar oluşturulması yasaktır.',
          ],
        },
        {
          heading: '6. Ücretlendirme',
          body: [
            'Erken erişim sürecinde ürünü ücretsiz kullanırsın.',
            'Pro / Ekip planları yayına alındığında fiyatlandırma şeffaf şekilde duyurulur. Mevcut ücretsiz planı kullanmaya devam etmek seçeneği her zaman korunur.',
            'Yeni ücretli özellikler için açık onayın olmadan otomatik ücretlendirme yapılmaz.',
          ],
        },
        {
          heading: '7. Sorumluluk reddi',
          body: [
            'NMU "olduğu gibi" sunulur; özellikler ve performans erken erişim sürecinde değişebilir.',
            'Network marketing iş modeli, gelir potansiyeli, ürün satışı veya ekip büyümesi konularında garanti vermeyiz; bu sonuçlar tamamen senin çabana ve içinde bulunduğun şirketin koşullarına bağlıdır.',
            'NMU bağımsız bir araçtır; herhangi bir MLM şirketi ile resmi iş ortaklığımız bulunmamaktadır.',
          ],
        },
        {
          heading: '8. Sorumluluğun sınırlandırılması',
          body: [
            'Yürürlükteki hukukun izin verdiği azami ölçüde, NMU dolaylı, arızi, özel veya cezai zararlardan (kar kaybı, veri kaybı, iş kesintisi vb.) sorumlu tutulamaz.',
            'Toplam sorumluluğumuz, talebin doğduğu tarihten önceki 12 ay içinde NMU\'ya ödediğin ücretle sınırlıdır (ücretsiz kullanımda bu tutar 100 TL ile sınırlıdır).',
          ],
        },
        {
          heading: '9. Hesap kapatma',
          body: [
            'Hesabını dilediğin zaman kapatabilirsin.',
            'Bu koşullara veya yasalara aykırı kullanım tespit edilirse hesabını uyarıyla veya uyarısız askıya alabilir ya da kapatabiliriz.',
          ],
        },
        {
          heading: '10. Değişiklikler ve geçerli hukuk',
          body: [
            'Bu koşulları gerektiğinde güncelleyebiliriz; önemli değişiklikler önceden duyurulur. Güncellemeden sonra hizmeti kullanmaya devam etmen, yeni koşulları kabul ettiğin anlamına gelir.',
            'Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Doğabilecek uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.',
          ],
        },
        {
          heading: '11. İletişim',
          body: [
            `Hukuki sorular için ${CONTACT_EMAIL} adresine yazabilirsin.`,
          ],
        },
      ],
    },

    kvkk: {
      title: 'KVKK Aydınlatma Metni',
      intro:
        '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, ' +
        `${COMPANY_NAME} olarak veri sorumlusu sıfatıyla kişisel verilerini hangi amaçla, hangi hukuki sebeple işlediğimizi, ` +
        'kimlere aktardığımızı ve KVKK\'dan doğan haklarını bu metinle açıklarız.',
      lastUpdatedLabel: 'Son güncelleme',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. Veri sorumlusu',
          body: [
            `Veri sorumlusu: ${COMPANY_NAME}`,
            `İletişim: ${CONTACT_EMAIL}`,
            'VERBİS kayıt yükümlülüğü doğduğunda kayıt numarası bu bölüme eklenecektir.',
          ],
        },
        {
          heading: '2. İşlenen kişisel veri kategorileri',
          body: [
            'Kimlik / iletişim verileri: ad-soyad, e-posta.',
            'Müşteri işlem verileri: çalışma alanında oluşturduğun kontak, görev, sipariş, ürün ve mesaj kayıtları.',
            'Pazarlama: bekleme listesi e-postası, dil tercihi.',
            'İşlem güvenliği verileri: IP adresi, oturum bilgisi, log kayıtları.',
          ],
        },
        {
          heading: '3. Kişisel veri işleme amaçları',
          body: [
            'Hizmetin yürütülmesi ve sözleşmenin ifası (KVKK m.5/2-c).',
            'Bilgi güvenliğinin sağlanması ve hukuki yükümlülüklerin yerine getirilmesi (KVKK m.5/2-ç, f).',
            'Ürün geliştirme ve performans takibi (meşru menfaat, KVKK m.5/2-f).',
            'Açık rızana bağlı pazarlama / ürün duyuru iletişimi (KVKK m.5/1).',
          ],
        },
        {
          heading: '4. Aktarım',
          body: [
            'Verilerin yalnızca hizmetin sağlanması için zorunlu olan altyapı sağlayıcılarına aktarılır:',
            'Veri tabanı ve kimlik doğrulama: Supabase (yurt dışı sunucu).',
            'YZ mesaj üretim sağlayıcı: yalnızca senin tetiklediğin üretim isteği sırasında.',
            'Hosting / CDN sağlayıcısı.',
            'Yurt dışına aktarımlar KVKK m.9 çerçevesinde, sözleşmesel güvencelerle ve mümkün olan en az veriyle yapılır.',
            'Resmi makamların yasaya dayalı talepleri saklı kalmak üzere üçüncü taraflarla başka bir aktarım yapılmaz.',
          ],
        },
        {
          heading: '5. Toplama yöntemi ve hukuki sebebi',
          body: [
            'Kişisel veriler; web sitemiz üzerinden doldurduğun formlar, hesap oluşturma akışı, ürün içi etkileşimler ve oturum verileri aracılığıyla otomatik veya kısmen otomatik yöntemlerle toplanır.',
            'Hukuki sebepler: KVKK m.5/2-c (sözleşmenin ifası), m.5/2-ç (hukuki yükümlülük), m.5/2-f (meşru menfaat) ve gerekli olduğu durumlarda m.5/1 (açık rıza).',
          ],
        },
        {
          heading: '6. Saklama süresi',
          body: [
            'Hesabın aktif olduğu sürece veriler saklanır.',
            'Hesap silindiğinde verilerin makul süre içinde silinir veya anonim hale getirilir; yedeklerden tam silinme 30 günü bulabilir.',
            'Mevzuat (örn. Vergi Usul Kanunu, Türk Ticaret Kanunu) gereği saklanması zorunlu olan kayıtlar ilgili süreler boyunca tutulur.',
          ],
        },
        {
          heading: '7. KVKK m.11 kapsamındaki hakların',
          body: [
            'Kişisel verinin işlenip işlenmediğini öğrenme.',
            'İşlenmişse buna ilişkin bilgi talep etme.',
            'İşlenme amacı ve amacına uygun kullanılıp kullanılmadığını öğrenme.',
            'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.',
            'Eksik veya yanlış işlenmiş ise düzeltilmesini isteme.',
            'Şartların oluşması halinde silinmesini veya yok edilmesini isteme.',
            'Düzeltme, silme ve yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme.',
            'Otomatik sistemlerle analiz edilmesi sonucu aleyhine bir sonuç doğmasına itiraz etme.',
            'Kanuna aykırı işleme sebebiyle zarara uğraman halinde zararın giderilmesini talep etme.',
          ],
        },
        {
          heading: '8. Başvuru',
          body: [
            'KVKK m.13 kapsamındaki haklarını kullanmak için talebini Türkçe olarak ve kimlik bilgilerini içerecek şekilde aşağıdaki yollarla iletebilirsin:',
            `E-posta: ${CONTACT_EMAIL}`,
            'Talebin en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. İşlemin ayrı bir maliyet gerektirmesi halinde Kurul\'un belirleyeceği tarifeye göre ücret talep edilebilir.',
          ],
        },
      ],
    },
  },

  en: {
    privacy: {
      title: 'Privacy Policy',
      intro:
        `${COMPANY_NAME} ("NMU", "we", "us") respects your privacy. This policy explains what data we ` +
        'collect when you use our product, website, and related services, why we collect it, and how we ' +
        'protect it.',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. Data we collect',
          body: [
            'Account data: name, email address, sign-in credentials (managed by Supabase).',
            'Workspace content: contacts, customers, products, tasks, message drafts, academy notes, motivation favorites — anything you create. This data belongs to your workspace only and is not visible to other users.',
            'Usage data: basic UI interactions, error logs, browser type, IP address.',
            'Early-access waitlist: your email address, the source of the sign-up, and your locale preference.',
          ],
        },
        {
          heading: '2. Why we process this data',
          body: [
            'To run the service: provide product features (CRM, task tracking, academy, etc.).',
            'Account security: session management, account protection, abuse prevention.',
            'Product improvement: anonymized / aggregated usage metrics to improve performance and features.',
            'Communication: important product updates, beta notices, and marketing only when you opt in.',
          ],
        },
        {
          heading: '3. Third-party services',
          body: [
            'Database & authentication: Supabase (EU/US infrastructure). Your data is row-level isolated (RLS).',
            'AI generation services: when you trigger AI message generation, the prompt content is sent to the selected provider for the duration of that request. Provider-side logs are governed by their respective policies.',
            'Hosting / CDN: the infrastructure provider that hosts the product.',
            'We share only the minimum data required to run the service.',
          ],
        },
        {
          heading: '4. Cookies',
          body: [
            'We use strictly necessary cookies to remember your theme and language preferences.',
            'Session cookies / local storage keys are managed by Supabase for authentication.',
            'We do not use third-party tracking or advertising cookies. If we add any, we will update this policy and request consent.',
          ],
        },
        {
          heading: '5. Retention & deletion',
          body: [
            'We retain your data while your workspace is active.',
            'When you delete your account, your personal data is permanently removed or anonymized within a reasonable period; full removal from backups can take up to 30 days.',
            'Records that we are legally required to keep (accounting, tax, legal) are retained for the periods required by applicable law.',
          ],
        },
        {
          heading: '6. Your rights',
          body: [
            'You have the right to access, correct, and delete your data.',
            'You can export your contacts, customers, orders, and tasks as CSV at any time.',
            'For requests, contact us at the address below.',
          ],
        },
        {
          heading: '7. Security',
          body: [
            'TLS in transit and provider-standard encryption at rest (Supabase / hosting).',
            'Strict per-workspace isolation enforced at the row level (RLS).',
            'No system is 100% secure; in case of a breach, we will notify affected users as required by law.',
          ],
        },
        {
          heading: '8. Children\'s privacy',
          body: [
            'NMU is not intended for users under 18, and we do not knowingly collect data from children.',
          ],
        },
        {
          heading: '9. Changes to this policy',
          body: [
            'We may update this policy from time to time. Material changes will be announced in-product and/or by email. The "last updated" date always reflects the latest version.',
          ],
        },
        {
          heading: '10. Contact',
          body: [
            `For all privacy questions and requests, reach us at ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },

    terms: {
      title: 'Terms of Service',
      intro:
        `By using ${COMPANY_NAME} services you agree to the following terms. Please read them carefully ` +
        'before signing up or starting to use the service.',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. The service',
          body: [
            'NMU is a SaaS platform that helps network marketing distributors manage contacts, pipelines, customers / products, message generation, academy content, and analytics from a single panel.',
            'Features may change, be added, or be removed during early access.',
          ],
        },
        {
          heading: '2. Your account',
          body: [
            'You must be at least 18 and able to enter into a binding contract to use NMU.',
            'You are responsible for safeguarding your account and for any activity under it; do not share your credentials.',
            'Information you provide must be accurate and up to date.',
          ],
        },
        {
          heading: '3. Acceptable use',
          body: [
            'You may use NMU only for lawful purposes.',
            'No spam, fraud, processing other people\'s data without consent, harvesting / selling personal data, IP infringement, or distribution of malicious code.',
            'When using the AI message studio, you are responsible for ensuring recipients have consented to receive your messages.',
          ],
        },
        {
          heading: '4. User content',
          body: [
            'Data and content you upload to NMU (contacts, messages, notes, etc.) belong to you.',
            'To run, back up, and deliver the service we need to process, display, and forward this content to relevant providers; you grant us the necessary permissions for these limited purposes.',
            'You are responsible for making sure your content complies with applicable law (KVKK / GDPR / anti-spam, etc.).',
          ],
        },
        {
          heading: '5. Intellectual property',
          body: [
            'The NMU brand, logo, source code, and content belong to NMU or its licensors.',
            'You receive a limited, non-transferable, non-exclusive license to use the service.',
            'Reproducing, distributing, or creating derivative works of the source code or design without permission is prohibited.',
          ],
        },
        {
          heading: '6. Pricing',
          body: [
            'Early access is free.',
            'When Pro / Team plans launch, pricing will be announced transparently. A free Starter tier will always remain.',
            'No automatic charges will be applied for new paid features without your explicit consent.',
          ],
        },
        {
          heading: '7. Disclaimer',
          body: [
            'NMU is provided "as is"; features and performance may change during early access.',
            'We make no guarantees about the income potential, product sales, or team growth that the network marketing model can produce; results depend entirely on your effort and your company\'s conditions.',
            'NMU is an independent tool and is not officially affiliated with any MLM company.',
          ],
        },
        {
          heading: '8. Limitation of liability',
          body: [
            'To the maximum extent permitted by law, NMU is not liable for indirect, incidental, special, or punitive damages (lost profits, data loss, business interruption, etc.).',
            'Our total liability is limited to the fees you paid to NMU in the 12 months prior to the event that gave rise to the claim (in case of free usage, this amount is capped at TRY 100).',
          ],
        },
        {
          heading: '9. Termination',
          body: [
            'You can close your account at any time.',
            'If we detect violations of these terms or applicable law, we may suspend or close your account, with or without notice.',
          ],
        },
        {
          heading: '10. Changes & governing law',
          body: [
            'We may update these terms when needed; material changes will be announced in advance. Continuing to use the service after an update means you accept the new terms.',
            'These terms are governed by the laws of the Republic of Türkiye. The Istanbul Courts and Enforcement Offices have jurisdiction over any disputes.',
          ],
        },
        {
          heading: '11. Contact',
          body: [
            `For legal questions, write to ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },

    kvkk: {
      title: 'KVKK Disclosure (Turkish Personal Data Protection Law)',
      intro:
        'Under Turkish Personal Data Protection Law No. 6698 ("KVKK"), ' +
        `${COMPANY_NAME} acts as the data controller. This disclosure explains why we process ` +
        'your personal data, on what legal basis, with whom we share it, and the rights you have under KVKK.',
      lastUpdatedLabel: 'Last updated',
      lastUpdated: LAST_UPDATED,
      sections: [
        {
          heading: '1. Data controller',
          body: [
            `Data controller: ${COMPANY_NAME}`,
            `Contact: ${CONTACT_EMAIL}`,
            'VERBİS registration number will be added here once the registration obligation arises.',
          ],
        },
        {
          heading: '2. Personal data categories processed',
          body: [
            'Identity / contact data: name, email.',
            'Customer transaction data: the contacts, tasks, orders, products, and messages you create in your workspace.',
            'Marketing data: waitlist email address, locale preference.',
            'Transaction security data: IP address, session info, log records.',
          ],
        },
        {
          heading: '3. Purposes of processing',
          body: [
            'Operating the service and performing the contract (KVKK Art. 5/2-c).',
            'Information security and fulfilling legal obligations (KVKK Art. 5/2-ç, f).',
            'Product improvement and performance tracking (legitimate interest, KVKK Art. 5/2-f).',
            'Marketing / product announcements based on your explicit consent (KVKK Art. 5/1).',
          ],
        },
        {
          heading: '4. Transfers',
          body: [
            'Your data is transferred only to infrastructure providers necessary to deliver the service:',
            'Database & authentication: Supabase (data may be stored outside Türkiye).',
            'AI message provider: only during your AI generation requests.',
            'Hosting / CDN provider.',
            'Cross-border transfers are made under KVKK Art. 9 with contractual safeguards and the minimum data required.',
            'Apart from lawful requests by authorities, we make no other third-party transfers.',
          ],
        },
        {
          heading: '5. Collection method and legal basis',
          body: [
            'Personal data is collected through forms on our website, the sign-up flow, in-product interactions, and session data via automated or partially automated means.',
            'Legal bases: KVKK Art. 5/2-c (performance of contract), Art. 5/2-ç (legal obligation), Art. 5/2-f (legitimate interest), and Art. 5/1 (explicit consent) where required.',
          ],
        },
        {
          heading: '6. Retention',
          body: [
            'We retain your data while your account is active.',
            'On deletion, data is removed or anonymized within a reasonable period; full removal from backups can take up to 30 days.',
            'Records that we are legally required to keep (e.g., under the Tax Procedure Law and the Turkish Commercial Code) are retained for the relevant statutory periods.',
          ],
        },
        {
          heading: '7. Your rights under KVKK Art. 11',
          body: [
            'Learn whether your personal data is being processed.',
            'Request information about the processing.',
            'Learn the purpose of processing and whether the data is used in line with that purpose.',
            'Know the third parties to whom your data is transferred (within Türkiye or abroad).',
            'Request correction if data is incomplete or inaccurate.',
            'Request deletion or destruction within the conditions of the law.',
            'Request that corrections, deletions, and destructions be communicated to third parties to whom data has been transferred.',
            'Object to a result that arises against you due to automated analysis.',
            'Claim damages if you suffer harm due to unlawful processing.',
          ],
        },
        {
          heading: '8. How to apply',
          body: [
            'To exercise your rights under KVKK Art. 13, send a written request in Turkish (or English) along with your identification details:',
            `Email: ${CONTACT_EMAIL}`,
            'We respond to your request free of charge within 30 days at the latest. A fee may be charged in line with the Board\'s tariff if the request requires a separate cost.',
          ],
        },
      ],
    },
  },
}
