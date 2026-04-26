import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useI18n, formatDate, formatMoney } from "../i18n";
import { Header, Footer } from "../Layout";

const HERO_IMG =
  "https://images.unsplash.com/photo-1774021802030-d4b48399232d?crop=entropy&cs=srgb&fm=jpg&w=2000&q=80";
const ABOUT_IMG =
  "https://images.unsplash.com/photo-1761683369185-20ab99d43889?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";

export default function Home() {
  const { t, lang } = useI18n();
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [artists, setArtists] = useState([]);
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState("");

  useEffect(() => {
    api.get("/auctions?status_filter=upcoming").then((r) => setUpcoming(r.data));
    api.get("/auctions?status_filter=past").then((r) => setPast(r.data));
    api.get("/artists").then((r) => setArtists(r.data.slice(0, 6)));
  }, []);

  const next = upcoming[0];

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/newsletter", { email, language: lang });
      setSubStatus("ok");
      setEmail("");
    } catch {
      setSubStatus("err");
    }
  };

  return (
    <div className="App">
      <Header />

      {/* Marquee strip */}
      <div className="border-b border-black bg-black text-[#f4f4f4] overflow-hidden py-2">
        <div className="kik-marquee-track text-xs font-mono uppercase tracking-[0.3em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="px-6">
              {t.hero.live_label} —— kik. — pop-up #{(next?.edition_number ?? "??").toString().padStart(2, "0")} —— {t.footer.pop} —— contemporary art —— {t.hero.live_label} ——
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section data-testid="hero" className="relative border-b border-black">
        <div className="grid grid-cols-12 min-h-[78vh]">
          <div className="col-span-12 lg:col-span-7 px-4 md:px-8 py-12 md:py-20 flex flex-col justify-between border-r-0 lg:border-r border-black">
            <div>
              <div className="kik-label mb-6">kik / {next ? `${t.hero.ed} ${next.edition_number}` : "monthly pop-up"}</div>
              <h1 className="font-display text-[18vw] md:text-[12vw] lg:text-[9.5vw] lowercase leading-[0.85] tracking-[-0.05em]">
                kik<span className="text-[var(--kik-accent)]">.</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm md:text-base font-mono leading-relaxed">
                {t.hero.tagline}.
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                data-testid="hero-cta-next"
                to={next ? `/auctions/${next.id}` : "/auctions"}
                className="kik-btn kik-btn-primary"
              >
                {t.hero.cta_next} →
              </Link>
              <Link to="/auctions" data-testid="hero-cta-archive" className="kik-btn">
                {t.hero.cta_archive}
              </Link>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 relative min-h-[40vh] lg:min-h-full bg-black overflow-hidden">
            <img
              src={next?.cover_image || HERO_IMG}
              alt="kik venue"
              className="absolute inset-0 w-full h-full object-cover opacity-90 kik-img"
              style={{ filter: "grayscale(100%) contrast(1.1)" }}
            />
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-8 text-[#f4f4f4]">
              <div className="flex justify-between items-start text-[10px] font-mono uppercase tracking-[0.25em]">
                <span>{next ? formatDate(next.date, lang) : "TBA"}</span>
                <span className="kik-tag-accent kik-tag">{t.hero.live_label}</span>
              </div>
              {next && (
                <div className="font-mono">
                  <div className="text-[10px] uppercase tracking-[0.25em] opacity-70">{t.auctions.venue}</div>
                  <div className="font-display text-3xl md:text-4xl lowercase leading-none mt-2">
                    {lang === "ru" ? next.venue_ru || next.venue_en : next.venue_en}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] mt-2">{next.city}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming list */}
      <Section title={t.sections.upcoming} testid="section-upcoming">
        {upcoming.length === 0 ? (
          <EmptyRow text={t.auctions.none_upcoming} />
        ) : (
          upcoming.map((a) => <AuctionRow key={a.id} a={a} />)
        )}
      </Section>

      {/* Past auctions grid */}
      <Section title={t.sections.past} testid="section-past">
        {past.length === 0 ? (
          <EmptyRow text={t.auctions.none_past} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {past.slice(0, 6).map((a) => (
              <PastCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </Section>

      {/* Artists */}
      <Section title={t.sections.featured_artists} testid="section-artists">
        {artists.length === 0 ? (
          <EmptyRow text={t.artists.none} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {artists.map((ar) => (
              <Link
                to={`/artists/${ar.id}`}
                key={ar.id}
                data-testid={`artist-card-${ar.id}`}
                className="kik-img-wrap border-b border-r border-black aspect-[3/4] relative overflow-hidden"
              >
                {ar.image_url ? (
                  <img src={ar.image_url} alt={ar.name} className="absolute inset-0 w-full h-full object-cover kik-img" />
                ) : (
                  <div className="absolute inset-0 bg-[#dcdcdc]" />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-[#EBEBEB] border-t border-black p-3">
                  <div className="font-display text-base lowercase leading-none truncate">{ar.name}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Manifesto */}
      <section className="border-t border-black bg-black text-[#f4f4f4]">
        <div className="grid grid-cols-12">
          <div className="col-span-12 lg:col-span-5 relative min-h-[42vh] lg:min-h-[60vh]">
            <img src={ABOUT_IMG} alt="brutalist venue" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          </div>
          <div className="col-span-12 lg:col-span-7 p-6 md:p-12 lg:p-16 border-l-0 lg:border-l border-white/30">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-70 mb-6">{t.sections.manifesto}</div>
            <h2 className="font-display text-5xl md:text-7xl lowercase leading-[0.9]">
              one&nbsp;night.<br />
              one&nbsp;<span className="text-[var(--kik-accent)]">room</span>.<br />
              twelve&nbsp;a&nbsp;year.
            </h2>
            <p className="mt-8 max-w-xl text-sm md:text-base font-mono leading-relaxed opacity-90">
              {t.about.body[0]}
            </p>
            <Link to="/about" className="mt-8 kik-btn kik-btn-inverse" data-testid="manifesto-more">
              {t.nav.about} →
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section data-testid="section-newsletter" className="border-t border-black">
        <div className="grid grid-cols-12 px-4 md:px-8 py-16 md:py-24 gap-8">
          <div className="col-span-12 md:col-span-5">
            <div className="kik-label mb-3">{t.sections.newsletter}</div>
            <h2 className="font-display text-5xl md:text-6xl lowercase leading-[0.9]">
              get the <span className="text-[var(--kik-accent)]">drop</span>.
            </h2>
            <p className="mt-4 text-sm font-mono">{t.sections.newsletter_sub}</p>
          </div>
          <form onSubmit={subscribe} className="col-span-12 md:col-span-7 flex flex-col md:flex-row items-stretch gap-0 self-end" data-testid="newsletter-form">
            <input
              data-testid="newsletter-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.sections.newsletter_placeholder}
              className="kik-input flex-1 md:border-r-0"
            />
            <button data-testid="newsletter-submit" type="submit" className="kik-btn kik-btn-primary px-10">
              {t.sections.newsletter_cta} →
            </button>
            {subStatus === "ok" && (
              <div data-testid="newsletter-status" className="md:ml-4 self-center text-xs font-mono uppercase tracking-[0.2em] text-[var(--kik-accent)]">
                {t.sections.newsletter_done}
              </div>
            )}
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({ title, children, testid }) {
  return (
    <section data-testid={testid} className="border-t border-black">
      <div className="px-4 md:px-8 py-12 md:py-16 flex items-end justify-between border-b border-black">
        <h2 className="font-display text-4xl md:text-6xl lowercase leading-none">{title}.</h2>
        <span className="kik-label hidden md:block">/ kik</span>
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="px-4 md:px-8 py-16 text-center text-sm font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">
      {text}
    </div>
  );
}

function AuctionRow({ a }) {
  const { lang, t } = useI18n();
  return (
    <Link
      to={`/auctions/${a.id}`}
      data-testid={`auction-row-${a.id}`}
      className="grid grid-cols-12 border-b border-black hover:bg-black hover:text-[#f4f4f4] transition-colors"
    >
      <div className="col-span-2 md:col-span-1 border-r border-black p-4 font-mono text-[10px] uppercase tracking-[0.2em] flex items-center">
        #{a.edition_number?.toString().padStart(2, "0")}
      </div>
      <div className="col-span-10 md:col-span-5 border-r border-black p-4 md:p-6 font-display text-2xl md:text-4xl lowercase leading-none">
        {lang === "ru" ? a.title_ru || a.title_en : a.title_en}
      </div>
      <div className="col-span-6 md:col-span-3 border-r border-black p-4 md:p-6 font-mono text-xs uppercase tracking-[0.18em] flex items-center">
        {formatDate(a.date, lang)}
      </div>
      <div className="col-span-6 md:col-span-3 p-4 md:p-6 font-mono text-xs uppercase tracking-[0.18em] flex items-center justify-between">
        <span>{a.city || (lang === "ru" ? a.venue_ru : a.venue_en)}</span>
        <span>→</span>
      </div>
    </Link>
  );
}

function PastCard({ a }) {
  const { lang } = useI18n();
  return (
    <Link
      to={`/auctions/${a.id}`}
      data-testid={`past-card-${a.id}`}
      className="kik-img-wrap relative aspect-[4/5] border-r border-b border-black overflow-hidden bg-black text-[#f4f4f4]"
    >
      {a.cover_image && (
        <img src={a.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover kik-img opacity-80" />
      )}
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="text-[10px] font-mono uppercase tracking-[0.25em]">#{a.edition_number?.toString().padStart(2, "0")} · {formatDate(a.date, lang)}</div>
        <div>
          <div className="font-display text-3xl lowercase leading-none">{lang === "ru" ? a.title_ru || a.title_en : a.title_en}</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] mt-2 opacity-80">{a.city}</div>
        </div>
      </div>
    </Link>
  );
}
