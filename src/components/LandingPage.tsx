import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Lang = "tr" | "en";
type Theme = "dark" | "light";

// ─── Translations ─────────────────────────────────────────────────────────────
const t = {
  tr: {
    nav: {
      features: "Özellikler",
      howItWorks: "Nasıl Çalışır",
      pricing: "Fiyatlar",
      login: "Giriş Yap",
      start: "Ücretsiz Başla",
    },
    hero: {
      badge: "YZ Destekli Network Marketing Sistemi",
      title1: "Network Marketing'i",
      title2: "Profesyonelce",
      title3: "Yönet",
      sub: "Ekibini büyüt, potansiyellerini takip et, YZ koçunla karar al. Tüm işini tek akıllı sistemden yönet.",
      cta: "Hemen Başla — Ücretsiz",
      stat1: "Aktif Distribütör",
      stat2: "Ortalama Ekip Büyümesi",
      stat3: "Zaman Tasarrufu",
    },
    features: {
      title: "Başarı İçin Gereken Her Şey",
      sub: "Kontaktan dönüşüme, ekip yönetiminden analitiğe — her adım sistemde.",
      items: [
        {
          icon: "👥",
          title: "Akıllı Kontak Yönetimi",
          desc: "Potansiyelleri sıcaklık skoruyla takip et. Kim nerede, ne zaman iletişime geçilmeli — hepsini bil.",
        },
        {
          icon: "📊",
          title: "Süreç Takibi & Kanban",
          desc: "Potansiyelden müşteriye, müşteriden ekip üyesine — süreci görsel olarak yönet.",
        },
        {
          icon: "🤖",
          title: "YZ Koç & Mesaj Üreteci",
          desc: "Yapay zeka koçun sana günlük öneriler sunar. Kişiselleştirilmiş mesajları saniyeler içinde üret.",
        },
        {
          icon: "📚",
          title: "İtiraz Bankası & Akademi",
          desc: "Sık karşılaşılan itirazlara hazır yanıtlar. Ekibini eğit, kendini geliştir.",
        },
        {
          icon: "📅",
          title: "Takvim & Hatırlatıcılar",
          desc: "Takip zamanlarını kaçırma. Otomatik hatırlatıcılarla her zaman doğru anda ol.",
        },
        {
          icon: "📈",
          title: "Gelişmiş Analitik",
          desc: "Ekip performansını, dönüşüm oranlarını ve büyüme trendlerini gerçek zamanlı izle.",
        },
      ],
    },
    how: {
      title: "3 Adımda Başla",
      steps: [
        {
          n: "01",
          title: "Hesap Oluştur",
          desc: "E-posta adresinle ücretsiz kayıt ol. Kurulum yok, kredi kartı yok.",
        },
        {
          n: "02",
          title: "Ekibini & Kontaklarını Ekle",
          desc: "Mevcut kontaklarını içe aktar veya sıfırdan başla. Sistem sana yol gösterir.",
        },
        {
          n: "03",
          title: "YZ ile Büyü",
          desc: "YZ koçun her gün sana öneriler sunar. Daha az zaman harca, daha fazla kazan.",
        },
      ],
    },
    pricing: {
      title: "Şeffaf Fiyatlandırma",
      sub: "Gizli ücret yok. İstediğin zaman iptal et.",
      badge: "Yakında",
      free: {
        name: "Başlangıç",
        price: "Ücretsiz",
        desc: "Yeni başlayanlar için",
        features: ["50 kontak", "Temel takip", "YZ mesaj üreteci (5/gün)", "Mobil erişim"],
        cta: "Ücretsiz Başla",
      },
      pro: {
        name: "Profesyonel",
        price: "₺299",
        period: "/ay",
        desc: "Büyüyen distribütörler için",
        features: [
          "Sınırsız kontak",
          "Gelişmiş analitik",
          "Sınırsız YZ mesajı",
          "İtiraz bankası",
          "Öncelikli destek",
        ],
        cta: "14 Gün Ücretsiz Dene",
        popular: "En Popüler",
      },
      team: {
        name: "Ekip",
        price: "₺799",
        period: "/ay",
        desc: "Büyük ekipler için",
        features: ["Her şey dahil", "5 ekip üyesi", "Ekip analitiği", "Özel entegrasyonlar", "Özel destek"],
        cta: "Ekibinle Başla",
      },
    },
    cta: {
      title: "Network Marketing'de Fark Yarat",
      sub: "Binlerce distribütör işlerini NMU ile büyütüyor. Sen de başla.",
      btn: "Ücretsiz Hesap Oluştur",
      login: "Zaten hesabın var mı?",
      loginLink: "Giriş yap →",
    },
    footer: {
      copy: "© 2026 Network Marketing Ultimate. Tüm hakları saklıdır.",
    },
  },
  en: {
    nav: {
      features: "Features",
      howItWorks: "How It Works",
      pricing: "Pricing",
      login: "Login",
      start: "Start Free",
    },
    hero: {
      badge: "AI-Powered Network Marketing System",
      title1: "Manage Network",
      title2: "Marketing",
      title3: "Professionally",
      sub: "Grow your team, track prospects, make decisions with your AI coach. Manage your entire business from one intelligent system.",
      cta: "Get Started — Free",
      stat1: "Active Distributors",
      stat2: "Avg. Team Growth",
      stat3: "Time Saved",
    },
    features: {
      title: "Everything You Need to Succeed",
      sub: "From contact to conversion, team management to analytics — every step is in the system.",
      items: [
        {
          icon: "👥",
          title: "Smart Contact Management",
          desc: "Track prospects with warmth scores. Know who's where and when to reach out — always.",
        },
        {
          icon: "📊",
          title: "Pipeline & Kanban Tracking",
          desc: "From prospect to customer, customer to team member — manage visually.",
        },
        {
          icon: "🤖",
          title: "AI Coach & Message Generator",
          desc: "Your AI coach gives daily recommendations. Generate personalized messages in seconds.",
        },
        {
          icon: "📚",
          title: "Objection Bank & Academy",
          desc: "Ready answers for common objections. Train your team, develop yourself.",
        },
        {
          icon: "📅",
          title: "Calendar & Reminders",
          desc: "Never miss a follow-up. Automated reminders keep you at the right moment.",
        },
        {
          icon: "📈",
          title: "Advanced Analytics",
          desc: "Monitor team performance, conversion rates, and growth trends in real time.",
        },
      ],
    },
    how: {
      title: "Start in 3 Steps",
      steps: [
        {
          n: "01",
          title: "Create Account",
          desc: "Sign up free with your email. No setup, no credit card.",
        },
        {
          n: "02",
          title: "Add Your Team & Contacts",
          desc: "Import existing contacts or start fresh. The system guides you.",
        },
        {
          n: "03",
          title: "Grow with AI",
          desc: "Your AI coach gives you daily suggestions. Work less, earn more.",
        },
      ],
    },
    pricing: {
      title: "Transparent Pricing",
      sub: "No hidden fees. Cancel anytime.",
      badge: "Coming Soon",
      free: {
        name: "Starter",
        price: "Free",
        desc: "For those just getting started",
        features: ["50 contacts", "Basic tracking", "AI message generator (5/day)", "Mobile access"],
        cta: "Start Free",
      },
      pro: {
        name: "Professional",
        price: "$9",
        period: "/mo",
        desc: "For growing distributors",
        features: [
          "Unlimited contacts",
          "Advanced analytics",
          "Unlimited AI messages",
          "Objection bank",
          "Priority support",
        ],
        cta: "Try 14 Days Free",
        popular: "Most Popular",
      },
      team: {
        name: "Team",
        price: "$24",
        period: "/mo",
        desc: "For large teams",
        features: ["Everything included", "5 team members", "Team analytics", "Custom integrations", "Dedicated support"],
        cta: "Start with Your Team",
      },
    },
    cta: {
      title: "Make a Difference in Network Marketing",
      sub: "Thousands of distributors are growing their businesses with NMU. Join them.",
      btn: "Create Free Account",
      login: "Already have an account?",
      loginLink: "Log in →",
    },
    footer: {
      copy: "© 2026 Network Marketing Ultimate. All rights reserved.",
    },
  },
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage({
  onNavigateToRegister,
  onNavigateToLogin,
}: {
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
}) {
  const [lang, setLang] = useState<Lang>("tr");
  const [theme, setTheme] = useState<Theme>("dark");
  const [scrolled, setScrolled] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const text = t[lang];

  const stat1 = useCounter(1240, 2000, statsVisible);
  const stat2 = useCounter(47, 2000, statsVisible);
  const stat3 = useCounter(68, 2000, statsVisible);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const isDark = theme === "dark";

  // ── CSS variables injected via style tag ──
  const cssVars = isDark
    ? {
        "--bg": "#0a0b0f",
        "--bg2": "#111218",
        "--bg3": "#1a1b24",
        "--border": "rgba(255,255,255,0.07)",
        "--text": "#f0f0f5",
        "--text2": "#9da5b4",
        "--accent": "#7c6af7",
        "--accent2": "#22d3ee",
        "--card": "rgba(255,255,255,0.03)",
      }
    : {
        "--bg": "#f4f5fa",
        "--bg2": "#ffffff",
        "--bg3": "#edf0f7",
        "--border": "rgba(0,0,0,0.08)",
        "--text": "#0f1117",
        "--text2": "#5a6478",
        "--accent": "#6c5ce7",
        "--accent2": "#0891b2",
        "--card": "rgba(0,0,0,0.02)",
      };

  return (
    <div
      style={{ ...(cssVars as React.CSSProperties), background: "var(--bg)", color: "var(--text)", minHeight: "100vh", fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif", overflowX: "hidden" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .grad-text {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          font-family: inherit;
          white-space: nowrap;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,106,247,0.35); }
        .btn-ghost {
          background: transparent;
          color: var(--text2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }
        .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
        .feature-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px;
          transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent);
          box-shadow: 0 20px 60px rgba(124,106,247,0.12);
        }
        .pricing-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 36px;
          transition: transform 0.25s;
          position: relative;
        }
        .pricing-card:hover { transform: translateY(-4px); }
        .pricing-card.popular {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), 0 24px 64px rgba(124,106,247,0.18);
        }
        .step-num {
          font-size: 72px;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent2) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0.3;
        }
        .mesh-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .mesh-bg::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%);
          top: -200px;
          right: -100px;
          border-radius: 50%;
        }
        .mesh-bg::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%);
          bottom: -100px;
          left: -50px;
          border-radius: 50%;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .float { animation: float 5s ease-in-out infinite; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.2s; }
        .fade-up-3 { animation-delay: 0.3s; }
        .fade-up-4 { animation-delay: 0.4s; }
        .dash-preview {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
        }
        .dash-bar {
          height: 32px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 6px;
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? (isDark ? "rgba(10,11,15,0.92)" : "rgba(244,245,250,0.92)") : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid var(--border)` : "1px solid transparent",
        transition: "all 0.3s",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.3px" }}>
              Network Marketing <span className="grad-text">Ultimate</span>
            </span>
          </div>

          {/* Nav links — desktop */}
          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="nav-links">
            {[
              ["#features", text.nav.features],
              ["#how", text.nav.howItWorks],
              ["#pricing", text.nav.pricing],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ color: "var(--text2)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}>
                {label}
              </a>
            ))}
          </div>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Lang flags */}
            <button onClick={() => setLang("tr")} style={{ background: "none", border: `2px solid ${lang === "tr" ? "var(--accent)" : "transparent"}`, borderRadius: 8, padding: "3px 7px", cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "border-color 0.2s" }}>🇹🇷</button>
            <button onClick={() => setLang("en")} style={{ background: "none", border: `2px solid ${lang === "en" ? "var(--accent)" : "transparent"}`, borderRadius: 8, padding: "3px 7px", cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "border-color 0.2s" }}>🇬🇧</button>

            {/* Theme toggle */}
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, width: 38, height: 38, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
              {isDark ? "☀️" : "🌙"}
            </button>

            <button className="btn-ghost" style={{ padding: "8px 18px", fontSize: 14 }} onClick={onNavigateToLogin}>{text.nav.login}</button>
            <button className="btn-primary" style={{ padding: "8px 18px", fontSize: 14 }} onClick={onNavigateToRegister}>{text.nav.start}</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", paddingTop: 80 }}>
        <div className="mesh-bg" />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1 }}>
          {/* Left */}
          <div>
            <div className="fade-up fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 500 }}>{text.hero.badge}</span>
            </div>

            <h1 className="fade-up fade-up-2" style={{ fontSize: "clamp(40px, 5vw, 62px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: 24 }}>
              {text.hero.title1}{" "}
              <span className="grad-text">{text.hero.title2}</span>
              <br />{text.hero.title3}
            </h1>

            <p className="fade-up fade-up-3" style={{ fontSize: 18, color: "var(--text2)", lineHeight: 1.7, marginBottom: 40, maxWidth: 500 }}>
              {text.hero.sub}
            </p>

            <div className="fade-up fade-up-4" style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
              <button className="btn-primary" style={{ fontSize: 16, padding: "16px 32px" }} onClick={onNavigateToRegister}>
                {text.hero.cta}
              </button>
            </div>
          </div>

          {/* Right — Dashboard preview */}
          <div className="float" style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -20, background: "radial-gradient(circle, rgba(124,106,247,0.15) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            <div className="dash-preview" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.4)" }}>
              <div className="dash-bar">
                <div className="dot" style={{ background: "#ff5f57" }} />
                <div className="dot" style={{ background: "#febc2e" }} />
                <div className="dot" style={{ background: "#28c840" }} />
                <div style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text2)" }}>networkmarketing.suattayfuntopak.com</div>
              </div>
              <div style={{ padding: 20 }}>
                {/* Mini dashboard mockup */}
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text2)" }}>Pano</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[
                    { label: "Yeni Potansiyel", val: "24", color: "var(--accent)" },
                    { label: "Takipler", val: "12", color: "var(--accent2)" },
                    { label: "Dönüşümler", val: "8", color: "#22c55e" },
                    { label: "Ekip", val: "5", color: "#f59e0b" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                {/* Progress bars */}
                {[
                  { label: "Haftalık Hedef", pct: 72, color: "var(--accent)" },
                  { label: "Ekip Aktivitesi", pct: 55, color: "var(--accent2)" },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text2)", marginBottom: 5 }}>
                      <span>{label}</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s" }} />
                    </div>
                  </div>
                ))}
                {/* AI suggestion chip */}
                <div style={{ marginTop: 14, background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 16 }}>🤖</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>YZ Koç Önerisi</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>Ahmet ile bugün iletişime geç — sıcak potansiyel!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, textAlign: "center" }}>
          {[
            { val: stat1, suffix: "+", label: text.hero.stat1 },
            { val: stat2, suffix: "%", label: text.hero.stat2 },
            { val: stat3, suffix: "%", label: text.hero.stat3 },
          ].map(({ val, suffix, label }) => (
            <div key={label}>
              <div style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-1px" }}>
                <span className="grad-text">{val}{suffix}</span>
              </div>
              <div style={{ fontSize: 15, color: "var(--text2)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
              {text.features.title}
            </h2>
            <p style={{ fontSize: 18, color: "var(--text2)", maxWidth: 520, margin: "0 auto" }}>{text.features.sub}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {text.features.items.map((f) => (
              <div key={f.title} className="feature-card">
                <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" style={{ background: "var(--bg2)", padding: "100px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1px", textAlign: "center", marginBottom: 72 }}>
            {text.how.title}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {text.how.steps.map((s) => (
              <div key={s.n} style={{ position: "relative" }}>
                <div className="step-num">{s.n}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, marginTop: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: "var(--text2)", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "100px 24px", position: "relative" }}>
        <div className="mesh-bg" />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.25)", borderRadius: 100, padding: "4px 14px", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>{text.pricing.badge}</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 14 }}>
              {text.pricing.title}
            </h2>
            <p style={{ fontSize: 17, color: "var(--text2)" }}>{text.pricing.sub}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "start" }}>
            {/* Free */}
            <div className="pricing-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>{text.pricing.free.name}</div>
              <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>{text.pricing.free.price}</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 28 }}>{text.pricing.free.desc}</div>
              <button className="btn-ghost" style={{ width: "100%", marginBottom: 28 }} onClick={onNavigateToRegister}>{text.pricing.free.cta}</button>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {text.pricing.free.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text2)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="pricing-card popular" style={{ marginTop: -12 }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, var(--accent), var(--accent2))", color: "#fff", borderRadius: 100, padding: "4px 16px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                {text.pricing.pro.popular}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>{text.pricing.pro.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{text.pricing.pro.price}</span>
                <span style={{ fontSize: 16, color: "var(--text2)" }}>{text.pricing.pro.period}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 28 }}>{text.pricing.pro.desc}</div>
              <button className="btn-primary" style={{ width: "100%", marginBottom: 28 }} onClick={onNavigateToRegister}>{text.pricing.pro.cta}</button>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {text.pricing.pro.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text2)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Team */}
            <div className="pricing-card">
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text2)", marginBottom: 8 }}>{text.pricing.team.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{text.pricing.team.price}</span>
                <span style={{ fontSize: 16, color: "var(--text2)" }}>{text.pricing.team.period}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 28 }}>{text.pricing.team.desc}</div>
              <button className="btn-ghost" style={{ width: "100%", marginBottom: 28 }} onClick={onNavigateToRegister}>{text.pricing.team.cta}</button>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {text.pricing.team.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, color: "var(--text2)", display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "#22c55e", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", padding: "100px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-1px", marginBottom: 16 }}>
            {text.cta.title}
          </h2>
          <p style={{ fontSize: 18, color: "var(--text2)", marginBottom: 40, lineHeight: 1.65 }}>{text.cta.sub}</p>
          <button className="btn-primary" style={{ fontSize: 17, padding: "18px 40px" }} onClick={onNavigateToRegister}>
            {text.cta.btn}
          </button>
          <div style={{ marginTop: 20, fontSize: 14, color: "var(--text2)" }}>
            {text.cta.login}{" "}
            <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }} onClick={onNavigateToLogin}>
              {text.cta.loginLink}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>{text.footer.copy}</span>
        </div>
      </footer>
    </div>
  );
}
