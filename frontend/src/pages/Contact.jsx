import React, { useState } from "react";
import api from "../api";
import { useI18n } from "../i18n";
import { Header, Footer } from "../Layout";

export default function Contact() {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/contact", form);
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="App">
      <Header />
      <section className="border-b border-black px-4 md:px-8 py-12 md:py-20">
        <div className="kik-label">/ {t.contact.title.toLowerCase()}</div>
        <h1 className="font-display text-6xl md:text-8xl lowercase leading-[0.85] mt-4">
          {t.contact.title.toLowerCase()}<span className="text-[var(--kik-accent)]">.</span>
        </h1>
      </section>

      <section className="grid grid-cols-12 border-b border-black">
        <div className="col-span-12 lg:col-span-5 p-6 md:p-12 lg:p-16 lg:border-r border-black space-y-6 font-mono text-sm">
          <div>
            <div className="kik-label">email</div>
            <div className="text-base mt-1">info@kik.art</div>
          </div>
          <div>
            <div className="kik-label">consignments</div>
            <div className="text-base mt-1">consign@kik.art</div>
          </div>
          <div>
            <div className="kik-label">press</div>
            <div className="text-base mt-1">press@kik.art</div>
          </div>
          <div>
            <div className="kik-label">instagram</div>
            <div className="text-base mt-1">@kik.auctions</div>
          </div>
        </div>

        <form onSubmit={submit} data-testid="contact-form" className="col-span-12 lg:col-span-7 p-6 md:p-12 lg:p-16 space-y-5">
          <div>
            <label className="kik-label">{t.contact.name}</label>
            <input
              data-testid="contact-name"
              required
              className="kik-input mt-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="kik-label">{t.contact.email}</label>
            <input
              data-testid="contact-email"
              required
              type="email"
              className="kik-input mt-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="kik-label">{t.contact.message}</label>
            <textarea
              data-testid="contact-message"
              required
              rows={6}
              className="kik-input mt-2 resize-none"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <button data-testid="contact-submit" disabled={busy} className="kik-btn kik-btn-primary">
            {t.contact.send} →
          </button>
          {sent && (
            <div data-testid="contact-status" className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--kik-accent)]">
              {t.contact.sent}
            </div>
          )}
        </form>
      </section>
      <Footer />
    </div>
  );
}
