import React from "react";
import { useI18n } from "../i18n";
import { Header, Footer } from "../Layout";

export default function About() {
  const { t } = useI18n();
  return (
    <div className="App">
      <Header />
      <section className="border-b border-black px-4 md:px-8 py-16 md:py-24">
        <div className="kik-label">/ {t.about.title.toLowerCase()}</div>
        <h1 className="font-display text-6xl md:text-8xl lowercase leading-[0.85] mt-4 max-w-4xl">
          we sell <span className="text-[var(--kik-accent)]">contemporary</span> art<br />
          for <em className="not-italic">one&nbsp;night</em>.
        </h1>
      </section>

      <section className="border-b border-black px-4 md:px-8 py-16 max-w-4xl space-y-6 font-mono text-base leading-relaxed">
        {t.about.body.map((p, i) => (
          <p key={i} data-testid={`about-p-${i}`}>{p}</p>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-black">
        {t.about.pillars.map((p, i) => (
          <div key={i} className="p-6 md:p-10 border-r border-black last:border-r-0 border-b md:border-b-0 last:border-b-0">
            <div className="kik-label">{String(i + 1).padStart(2, "0")}</div>
            <div className="font-display text-3xl md:text-4xl lowercase leading-none mt-3">{p.t.toLowerCase()}.</div>
            <p className="mt-4 font-mono text-sm">{p.d}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
