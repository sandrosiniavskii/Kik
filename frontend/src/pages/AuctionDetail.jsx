import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { useI18n, formatDate, formatMoney } from "../i18n";
import { Header, Footer } from "../Layout";

export default function AuctionDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [auction, setAuction] = useState(null);
  const [lots, setLots] = useState([]);

  useEffect(() => {
    api.get(`/auctions/${id}`).then((r) => setAuction(r.data));
    api.get(`/auctions/${id}/lots`).then((r) => setLots(r.data));
  }, [id]);
  if (!auction) {
    return (
      <div className="App">
        <Header />
        <div className="px-4 md:px-8 py-32 text-center font-mono text-sm uppercase tracking-[0.25em]">
          loading...
        </div>
      </div>
    );
  }

  const title = lang === "ru" ? auction.title_ru || auction.title_en : auction.title_en;
  const venue = lang === "ru" ? auction.venue_ru || auction.venue_en : auction.venue_en;
  const desc = lang === "ru" ? auction.description_ru || auction.description_en : auction.description_en;

  return (
    <div className="App">
      <Header />

      <section className="grid grid-cols-12 border-b border-black">
        <div className="col-span-12 lg:col-span-7 px-4 md:px-8 py-12 md:py-16 lg:border-r border-black">
          <Link to="/auctions" data-testid="back-link" className="kik-label hover:text-[var(--kik-accent)]">← {t.auctions.title}</Link>
          <div className="kik-label mt-4">#{auction.edition_number?.toString().padStart(2, "0")} · {auction.status === "upcoming" ? t.sections.upcoming : t.sections.past}</div>
          <h1 className="font-display text-5xl md:text-7xl lowercase leading-[0.85] mt-4">
            {title}<span className="text-[var(--kik-accent)]">.</span>
          </h1>
          {desc && <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed">{desc}</p>}

          <div className="mt-10 grid grid-cols-2 border border-black">
            <div className="border-r border-b border-black p-4">
              <div className="kik-label">{t.auctions.date}</div>
              <div className="font-mono text-sm mt-1">{formatDate(auction.date, lang)}</div>
            </div>
            <div className="border-b border-black p-4">
              <div className="kik-label">{t.auctions.venue}</div>
              <div className="font-mono text-sm mt-1">{venue}</div>
            </div>
            <div className="border-r border-black p-4">
              <div className="kik-label">city</div>
              <div className="font-mono text-sm mt-1">{auction.city || "—"}</div>
            </div>
            <div className="p-4">
              <div className="kik-label">{t.auctions.lots}</div>
              <div className="font-mono text-sm mt-1">{lots.length}</div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 relative min-h-[40vh] lg:min-h-full bg-black">
          {auction.cover_image && (
            <img src={auction.cover_image} alt={title} className="absolute inset-0 w-full h-full object-cover kik-img" style={{ filter: "grayscale(100%) contrast(1.1)" }} />
          )}
        </div>
      </section>

      <section className="border-b border-black">
        <div className="px-4 md:px-8 py-10 flex items-end justify-between border-b border-black">
          <h2 className="font-display text-4xl md:text-5xl lowercase leading-none">{t.auctions.lots.toLowerCase()}.</h2>
          <span className="kik-label hidden md:block">/ {lots.length}</span>
        </div>

        {lots.length === 0 ? (
          <div className="px-4 md:px-8 py-16 text-center text-sm font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">
            {t.auctions.no_lots}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>
        )}
      </section>

      {auction.status === "upcoming" && <RsvpBlock auctionId={auction.id} />}

      <Footer />
    </div>
  );
}

function RsvpBlock({ auctionId }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", favorite_color: "" });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api.post(`/auctions/${auctionId}/rsvp`, form);
      setDone(true);
      setForm({ name: "", email: "", favorite_color: "" });
    } catch {
      setErr(t.rsvp.err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section data-testid="rsvp-block" className="border-b border-black bg-black text-[#f4f4f4]">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-5 p-6 md:p-12 lg:p-16 lg:border-r border-white/30">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-70">/ rsvp</div>
          <h2 className="font-display text-5xl md:text-6xl lowercase leading-[0.9] mt-4">
            {t.rsvp.title.split(" ").slice(0, -1).join(" ")} <span className="text-[var(--kik-accent)]">{t.rsvp.title.split(" ").slice(-1)[0]}</span>.
          </h2>
          <p className="mt-6 max-w-md font-mono text-sm leading-relaxed opacity-90">{t.rsvp.sub}</p>
        </div>
        <form onSubmit={submit} data-testid="rsvp-form" className="col-span-12 lg:col-span-7 p-6 md:p-12 lg:p-16 space-y-5">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-80">{t.rsvp.name}</label>
            <input
              data-testid="rsvp-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-2 bg-transparent border border-white/40 px-3 py-2.5 font-mono text-sm text-[#f4f4f4] outline-none focus:border-[var(--kik-accent)]"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-80">{t.rsvp.email}</label>
            <input
              data-testid="rsvp-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-2 bg-transparent border border-white/40 px-3 py-2.5 font-mono text-sm text-[#f4f4f4] outline-none focus:border-[var(--kik-accent)]"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-[0.22em] opacity-80">{t.rsvp.color}</label>
            <input
              data-testid="rsvp-color"
              required
              value={form.favorite_color}
              onChange={(e) => setForm({ ...form, favorite_color: e.target.value })}
              placeholder={t.rsvp.color_placeholder}
              className="w-full mt-2 bg-transparent border border-white/40 px-3 py-2.5 font-mono text-sm text-[#f4f4f4] outline-none focus:border-[var(--kik-accent)] placeholder:text-white/40 placeholder:uppercase placeholder:tracking-[0.12em] placeholder:text-xs"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button data-testid="rsvp-submit" disabled={busy || done} className="kik-btn kik-btn-primary">
              {busy ? "..." : `${t.rsvp.submit} →`}
            </button>
            {done && (
              <span data-testid="rsvp-done" className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--kik-accent)]">
                {t.rsvp.done}
              </span>
            )}
            {err && (
              <span data-testid="rsvp-err" role="alert" className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--kik-accent)]">
                {err}
              </span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

function LotCard({ lot }) {
  const { t, lang } = useI18n();
  const title = lang === "ru" ? lot.title_ru || lot.title_en : lot.title_en;
  const medium = lang === "ru" ? lot.medium_ru || lot.medium_en : lot.medium_en;
  return (
    <article data-testid={`lot-card-${lot.id}`} className="border-r border-b border-black kik-img-wrap">
      <div className="relative aspect-[4/5] bg-[#dcdcdc] overflow-hidden border-b border-black">
        {lot.image_url ? (
          <img src={lot.image_url} alt={title} className="absolute inset-0 w-full h-full object-cover kik-img" />
        ) : null}
        <div className="absolute top-3 left-3 kik-tag bg-[#EBEBEB]">
          {t.auctions.lot} {String(lot.lot_number).padStart(3, "0")}
        </div>
        {lot.sold && (
          <div className="absolute top-3 right-3 kik-tag-accent kik-tag">{t.auctions.sold}</div>
        )}
      </div>
      <div className="p-4 grid grid-cols-2 gap-y-3 font-mono text-xs">
        <div className="col-span-2">
          <div className="kik-label">artist</div>
          <div className="text-sm mt-1">{lot.artist_name || "—"}</div>
        </div>
        <div className="col-span-2 border-t border-black pt-3">
          <div className="kik-label">title</div>
          <div className="text-sm mt-1 font-display lowercase text-xl leading-none">{title}</div>
        </div>
        <div className="border-t border-r border-black pt-3 pr-2">
          <div className="kik-label">medium</div>
          <div className="text-xs mt-1">{medium || "—"}</div>
        </div>
        <div className="border-t border-black pt-3 pl-2">
          <div className="kik-label">year</div>
          <div className="text-xs mt-1">{lot.year || "—"}</div>
        </div>
        <div className="border-t border-r border-black pt-3 pr-2">
          <div className="kik-label">dim</div>
          <div className="text-xs mt-1">{lot.dimensions || "—"}</div>
        </div>
        <div className="border-t border-black pt-3 pl-2">
          <div className="kik-label">{lot.sold ? t.auctions.sold : t.auctions.estimate}</div>
          <div className="text-xs mt-1">
            {lot.sold
              ? formatMoney(lot.sold_price, lot.currency)
              : lot.estimate_low && lot.estimate_high
              ? `${formatMoney(lot.estimate_low, lot.currency)} – ${formatMoney(lot.estimate_high, lot.currency)}`
              : "—"}
          </div>
        </div>
      </div>
    </article>
  );
}
