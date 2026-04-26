import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useI18n, formatDate } from "../i18n";
import { Header, Footer } from "../Layout";

export default function Auctions() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState("upcoming");
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get(`/auctions?status_filter=${tab}`).then((r) => setItems(r.data));
  }, [tab]);

  return (
    <div className="App">
      <Header />
      <section className="border-b border-black px-4 md:px-8 py-12 md:py-20">
        <div className="kik-label">/ {t.auctions.title.toLowerCase()}</div>
        <h1 className="font-display text-6xl md:text-8xl lowercase leading-[0.85] mt-4">
          {t.auctions.title.toLowerCase()}<span className="text-[var(--kik-accent)]">.</span>
        </h1>
      </section>

      <div className="border-b border-black flex">
        <TabBtn active={tab === "upcoming"} onClick={() => setTab("upcoming")} testid="tab-upcoming" label={t.sections.upcoming} />
        <TabBtn active={tab === "past"} onClick={() => setTab("past")} testid="tab-past" label={t.sections.past} />
      </div>

      <div>
        {items.length === 0 ? (
          <div className="px-4 md:px-8 py-16 text-center text-sm font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">
            {tab === "upcoming" ? t.auctions.none_upcoming : t.auctions.none_past}
          </div>
        ) : (
          items.map((a) => (
            <Link
              to={`/auctions/${a.id}`}
              key={a.id}
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
          ))
        )}
      </div>
      <Footer />
    </div>
  );
}

function TabBtn({ active, onClick, label, testid }) {
  return (
    <button
      data-testid={testid}
      onClick={onClick}
      className={`flex-1 py-5 text-xs font-mono uppercase tracking-[0.25em] border-r border-black last:border-r-0 transition-colors ${
        active ? "bg-black text-[#f4f4f4]" : "hover:bg-black hover:text-[#f4f4f4]"
      }`}
    >
      {label}
    </button>
  );
}
