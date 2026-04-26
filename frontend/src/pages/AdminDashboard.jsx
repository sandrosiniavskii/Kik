import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";
import { useI18n, formatDate } from "../i18n";
import FileUpload from "../FileUpload";

const TABS = ["auctions", "lots", "artists", "rsvps", "newsletter", "contact"];

export default function AdminDashboard() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [tab, setTab] = useState("auctions");

  if (loading) {
    return <div className="p-12 font-mono text-xs uppercase tracking-[0.25em]">loading...</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-[var(--kik-bg)]">
      <header className="border-b border-black px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40 bg-[#EBEBEB]/90 backdrop-blur">
        <div className="flex items-center gap-6">
          <a href="/" className="font-display text-2xl lowercase leading-none">kik<span className="text-[var(--kik-accent)]">.</span></a>
          <span className="kik-tag-dark kik-tag">admin</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em]">
          <span className="hidden md:inline text-[var(--kik-ink-soft)]">{user.email}</span>
          <button
            data-testid="admin-logout"
            onClick={() => { logout(); nav("/admin/login"); }}
            className="kik-btn"
          >
            {t.admin.logout}
          </button>
        </div>
      </header>

      <nav className="flex border-b border-black overflow-x-auto">
        {TABS.map((k) => (
          <button
            key={k}
            data-testid={`admin-tab-${k}`}
            onClick={() => setTab(k)}
            className={`flex-1 min-w-[120px] py-4 text-xs font-mono uppercase tracking-[0.25em] border-r border-black last:border-r-0 transition-colors ${
              tab === k ? "bg-black text-[#f4f4f4]" : "hover:bg-black hover:text-[#f4f4f4]"
            }`}
          >
            {t.admin.tabs[k]}
          </button>
        ))}
      </nav>

      <main className="p-4 md:p-8">
        {tab === "auctions" && <AuctionsAdmin />}
        {tab === "lots" && <LotsAdmin />}
        {tab === "artists" && <ArtistsAdmin />}
        {tab === "rsvps" && <RsvpsAdmin />}
        {tab === "newsletter" && <NewsletterAdmin />}
        {tab === "contact" && <ContactAdmin />}
      </main>
    </div>
  );
}

/* ---------- AUCTIONS ---------- */
function AuctionsAdmin() {
  const empty = {
    title_en: "", title_ru: "", edition_number: 1, date: "",
    venue_en: "", venue_ru: "", city: "",
    description_en: "", description_ru: "", cover_image: "", status: "upcoming",
  };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get("/auctions").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, edition_number: Number(form.edition_number), date: new Date(form.date).toISOString() };
    if (editingId) await api.put(`/admin/auctions/${editingId}`, payload);
    else await api.post("/admin/auctions", payload);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const onEdit = (a) => {
    setEditingId(a.id);
    setForm({
      ...a,
      date: a.date ? new Date(a.date).toISOString().slice(0, 16) : "",
    });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete auction and its lots?")) return;
    await api.delete(`/admin/auctions/${id}`);
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-0">
      <form onSubmit={onSubmit} data-testid="admin-auction-form" className="lg:col-span-1 border border-black p-5 space-y-3 bg-white lg:mr-6 mb-6 lg:mb-0 self-start">
        <div className="kik-label">{editingId ? "edit auction" : "new auction"}</div>
        <Field label="title (EN) *" required value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} testid="auction-title-en" />
        <Field label="title (RU)" value={form.title_ru} onChange={(v) => setForm({ ...form, title_ru: v })} testid="auction-title-ru" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="edition #" type="number" value={form.edition_number} onChange={(v) => setForm({ ...form, edition_number: v })} testid="auction-edition" />
          <SelectField label="status" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ v: "upcoming", l: "upcoming" }, { v: "past", l: "past" }]} testid="auction-status" />
        </div>
        <Field label="date *" type="datetime-local" required value={form.date} onChange={(v) => setForm({ ...form, date: v })} testid="auction-date" />
        <Field label="venue (EN)" value={form.venue_en} onChange={(v) => setForm({ ...form, venue_en: v })} testid="auction-venue-en" />
        <Field label="venue (RU)" value={form.venue_ru} onChange={(v) => setForm({ ...form, venue_ru: v })} testid="auction-venue-ru" />
        <Field label="city" value={form.city} onChange={(v) => setForm({ ...form, city: v })} testid="auction-city" />
        <FileUpload
          folder="auctions"
          label="cover image"
          value={form.cover_image}
          onChange={(url) => setForm({ ...form, cover_image: url })}
        />
        <TextField label="description (EN)" value={form.description_en} onChange={(v) => setForm({ ...form, description_en: v })} testid="auction-desc-en" />
        <TextField label="description (RU)" value={form.description_ru} onChange={(v) => setForm({ ...form, description_ru: v })} testid="auction-desc-ru" />
        <div className="flex gap-2 pt-2">
          <button type="submit" data-testid="auction-submit" className="kik-btn kik-btn-primary flex-1">{editingId ? "update" : "create"}</button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="kik-btn">cancel</button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2 border border-black bg-white">
        <table className="w-full font-mono text-xs">
          <thead className="bg-black text-[#f4f4f4]">
            <tr>
              <Th>#</Th><Th>title</Th><Th>date</Th><Th>status</Th><Th>—</Th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no auctions</td></tr>
            )}
            {items.map((a) => (
              <tr key={a.id} className="border-t border-black">
                <Td>{a.edition_number}</Td>
                <Td className="font-medium">{a.title_en}</Td>
                <Td>{formatDate(a.date, "en")}</Td>
                <Td>{a.status}</Td>
                <Td>
                  <button data-testid={`edit-auction-${a.id}`} onClick={() => onEdit(a)} className="underline hover:text-[var(--kik-accent)]">edit</button>
                  <span className="mx-2">·</span>
                  <button data-testid={`delete-auction-${a.id}`} onClick={() => onDelete(a.id)} className="underline hover:text-[var(--kik-accent)]">delete</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- LOTS ---------- */
function LotsAdmin() {
  const empty = {
    auction_id: "", artist_id: "", artist_name: "", lot_number: 1,
    title_en: "", title_ru: "", medium_en: "", medium_ru: "",
    year: "", dimensions: "", estimate_low: "", estimate_high: "", currency: "EUR",
    image_url: "", sold: false, sold_price: "", description_en: "", description_ru: "",
  };
  const [items, setItems] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [artists, setArtists] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get("/admin/lots").then((r) => setItems(r.data));
  useEffect(() => {
    load();
    api.get("/auctions").then((r) => setAuctions(r.data));
    api.get("/artists").then((r) => setArtists(r.data));
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      lot_number: Number(form.lot_number) || 1,
      year: form.year ? Number(form.year) : null,
      estimate_low: form.estimate_low !== "" ? Number(form.estimate_low) : null,
      estimate_high: form.estimate_high !== "" ? Number(form.estimate_high) : null,
      sold_price: form.sold_price !== "" ? Number(form.sold_price) : null,
      artist_id: form.artist_id || null,
    };
    if (editingId) await api.put(`/admin/lots/${editingId}`, payload);
    else await api.post("/admin/lots", payload);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const onEdit = (l) => {
    setEditingId(l.id);
    setForm({
      ...l,
      year: l.year ?? "",
      estimate_low: l.estimate_low ?? "",
      estimate_high: l.estimate_high ?? "",
      sold_price: l.sold_price ?? "",
      artist_id: l.artist_id ?? "",
    });
  };
  const onDelete = async (id) => {
    if (!window.confirm("Delete lot?")) return;
    await api.delete(`/admin/lots/${id}`);
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
      <form onSubmit={onSubmit} data-testid="admin-lot-form" className="lg:col-span-1 border border-black p-5 space-y-3 bg-white lg:mr-6 mb-6 lg:mb-0 self-start">
        <div className="kik-label">{editingId ? "edit lot" : "new lot"}</div>
        <SelectField label="auction *" required value={form.auction_id} onChange={(v) => setForm({ ...form, auction_id: v })} testid="lot-auction" options={[{ v: "", l: "—" }, ...auctions.map((a) => ({ v: a.id, l: `#${a.edition_number} ${a.title_en}` }))]} />
        <SelectField label="artist" value={form.artist_id} onChange={(v) => {
          const ar = artists.find((x) => x.id === v);
          setForm({ ...form, artist_id: v, artist_name: ar ? ar.name : form.artist_name });
        }} testid="lot-artist" options={[{ v: "", l: "— manual —" }, ...artists.map((a) => ({ v: a.id, l: a.name }))]} />
        <Field label="artist name (override)" value={form.artist_name} onChange={(v) => setForm({ ...form, artist_name: v })} testid="lot-artist-name" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="lot #" type="number" value={form.lot_number} onChange={(v) => setForm({ ...form, lot_number: v })} testid="lot-number" />
          <Field label="year" type="number" value={form.year} onChange={(v) => setForm({ ...form, year: v })} testid="lot-year" />
        </div>
        <Field label="title (EN) *" required value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} testid="lot-title-en" />
        <Field label="title (RU)" value={form.title_ru} onChange={(v) => setForm({ ...form, title_ru: v })} testid="lot-title-ru" />
        <Field label="medium (EN)" value={form.medium_en} onChange={(v) => setForm({ ...form, medium_en: v })} testid="lot-medium-en" />
        <Field label="medium (RU)" value={form.medium_ru} onChange={(v) => setForm({ ...form, medium_ru: v })} testid="lot-medium-ru" />
        <Field label="dimensions" value={form.dimensions} onChange={(v) => setForm({ ...form, dimensions: v })} testid="lot-dimensions" />
        <div className="grid grid-cols-3 gap-3">
          <Field label="est. low" type="number" value={form.estimate_low} onChange={(v) => setForm({ ...form, estimate_low: v })} testid="lot-est-low" />
          <Field label="est. high" type="number" value={form.estimate_high} onChange={(v) => setForm({ ...form, estimate_high: v })} testid="lot-est-high" />
          <Field label="currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v })} testid="lot-currency" />
        </div>
        <Field label="image url" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} testid="lot-image-url-fallback" />
        <FileUpload
          folder="lots"
          label="image"
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
        />
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] pt-2">
          <input data-testid="lot-sold" type="checkbox" checked={form.sold} onChange={(e) => setForm({ ...form, sold: e.target.checked })} />
          sold
        </label>
        {form.sold && (
          <Field label="sold price" type="number" value={form.sold_price} onChange={(v) => setForm({ ...form, sold_price: v })} testid="lot-sold-price" />
        )}
        <div className="flex gap-2 pt-2">
          <button type="submit" data-testid="lot-submit" className="kik-btn kik-btn-primary flex-1">{editingId ? "update" : "create"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="kik-btn">cancel</button>}
        </div>
      </form>

      <div className="lg:col-span-2 border border-black bg-white overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead className="bg-black text-[#f4f4f4]">
            <tr><Th>#</Th><Th>title</Th><Th>artist</Th><Th>auction</Th><Th>—</Th></tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no lots</td></tr>
            )}
            {items.map((l) => {
              const auction = auctions.find((a) => a.id === l.auction_id);
              return (
                <tr key={l.id} className="border-t border-black">
                  <Td>{l.lot_number}</Td>
                  <Td>{l.title_en}</Td>
                  <Td>{l.artist_name || "—"}</Td>
                  <Td>{auction ? `#${auction.edition_number}` : "—"}</Td>
                  <Td>
                    <button data-testid={`edit-lot-${l.id}`} onClick={() => onEdit(l)} className="underline hover:text-[var(--kik-accent)]">edit</button>
                    <span className="mx-2">·</span>
                    <button data-testid={`delete-lot-${l.id}`} onClick={() => onDelete(l.id)} className="underline hover:text-[var(--kik-accent)]">delete</button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- ARTISTS ---------- */
function ArtistsAdmin() {
  const empty = { name: "", bio_en: "", bio_ru: "", image_url: "", instagram: "", website: "" };
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get("/artists").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (editingId) await api.put(`/admin/artists/${editingId}`, form);
    else await api.post("/admin/artists", form);
    setForm(empty);
    setEditingId(null);
    load();
  };
  const onEdit = (a) => { setEditingId(a.id); setForm({ ...a }); };
  const onDelete = async (id) => {
    if (!window.confirm("Delete artist?")) return;
    await api.delete(`/admin/artists/${id}`);
    load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
      <form onSubmit={onSubmit} data-testid="admin-artist-form" className="lg:col-span-1 border border-black p-5 space-y-3 bg-white lg:mr-6 mb-6 lg:mb-0 self-start">
        <div className="kik-label">{editingId ? "edit artist" : "new artist"}</div>
        <Field label="name *" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} testid="artist-name" />
        <FileUpload
          folder="artists"
          label="portrait"
          value={form.image_url}
          onChange={(url) => setForm({ ...form, image_url: url })}
        />
        <Field label="instagram url" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} testid="artist-instagram" />
        <Field label="website url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} testid="artist-website" />
        <TextField label="bio (EN)" value={form.bio_en} onChange={(v) => setForm({ ...form, bio_en: v })} testid="artist-bio-en" />
        <TextField label="bio (RU)" value={form.bio_ru} onChange={(v) => setForm({ ...form, bio_ru: v })} testid="artist-bio-ru" />
        <div className="flex gap-2 pt-2">
          <button type="submit" data-testid="artist-submit" className="kik-btn kik-btn-primary flex-1">{editingId ? "update" : "create"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(empty); }} className="kik-btn">cancel</button>}
        </div>
      </form>

      <div className="lg:col-span-2 border border-black bg-white">
        <table className="w-full font-mono text-xs">
          <thead className="bg-black text-[#f4f4f4]"><tr><Th>name</Th><Th>links</Th><Th>—</Th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={3} className="p-6 text-center uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no artists</td></tr>}
            {items.map((a) => (
              <tr key={a.id} className="border-t border-black">
                <Td className="font-medium">{a.name}</Td>
                <Td>{[a.instagram && "ig", a.website && "web"].filter(Boolean).join(" · ") || "—"}</Td>
                <Td>
                  <button data-testid={`edit-artist-${a.id}`} onClick={() => onEdit(a)} className="underline hover:text-[var(--kik-accent)]">edit</button>
                  <span className="mx-2">·</span>
                  <button data-testid={`delete-artist-${a.id}`} onClick={() => onDelete(a.id)} className="underline hover:text-[var(--kik-accent)]">delete</button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- RSVPs ---------- */
function RsvpsAdmin() {
  const { t } = useI18n();
  const [auctions, setAuctions] = useState([]);
  const [filter, setFilter] = useState("");
  const [items, setItems] = useState([]);

  const load = () => {
    const q = filter ? `?auction_id=${filter}` : "";
    api.get(`/admin/rsvps${q}`).then((r) => setItems(r.data));
  };
  useEffect(() => {
    api.get("/auctions").then((r) => setAuctions(r.data));
  }, []);
  useEffect(() => { load(); }, [filter]);

  const onDelete = async (id) => {
    if (!window.confirm("Remove RSVP?")) return;
    await api.delete(`/admin/rsvps/${id}`);
    load();
  };

  const exportCsv = () => {
    const rows = [["name", "email", "favorite_color", "auction", "date"]];
    items.forEach((r) => {
      const a = auctions.find((x) => x.id === r.auction_id);
      rows.push([r.name, r.email, r.favorite_color, a ? `#${a.edition_number} ${a.title_en}` : r.auction_id, r.created_at]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kik-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="border border-black bg-white p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[240px]">
          <span className="kik-label">filter by auction</span>
          <select
            data-testid="rsvp-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="kik-input mt-1.5"
          >
            <option value="">all</option>
            {auctions.map((a) => (
              <option key={a.id} value={a.id}>#{a.edition_number} {a.title_en}</option>
            ))}
          </select>
        </div>
        <button data-testid="rsvp-export" onClick={exportCsv} className="kik-btn">
          {t.admin.rsvps_export} ↓
        </button>
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--kik-ink-soft)]">{items.length}</span>
      </div>

      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead className="bg-black text-[#f4f4f4]">
            <tr><Th>name</Th><Th>email</Th><Th>color</Th><Th>auction</Th><Th>date</Th><Th>—</Th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="p-6 text-center uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no rsvps</td></tr>}
            {items.map((r) => {
              const a = auctions.find((x) => x.id === r.auction_id);
              return (
                <tr key={r.id} className="border-t border-black">
                  <Td className="font-medium">{r.name}</Td>
                  <Td>{r.email}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-3 h-3 border border-black" style={{ background: r.favorite_color }} />
                      {r.favorite_color}
                    </span>
                  </Td>
                  <Td>{a ? `#${a.edition_number}` : "—"}</Td>
                  <Td>{formatDate(r.created_at, "en")}</Td>
                  <Td>
                    <button data-testid={`del-rsvp-${r.id}`} onClick={() => onDelete(r.id)} className="underline hover:text-[var(--kik-accent)]">remove</button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- NEWSLETTER ---------- */
function NewsletterAdmin() {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [compose, setCompose] = useState({ subject: "", html_body: "", language: "" });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendErr, setSendErr] = useState("");

  const load = () => api.get("/admin/newsletter").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const onDelete = async (id) => {
    await api.delete(`/admin/newsletter/${id}`);
    load();
  };

  const send = async (e) => {
    e.preventDefault();
    setSendErr("");
    setSendResult(null);
    if (!window.confirm(`Send to ${items.length} subscriber(s)?`)) return;
    setSending(true);
    try {
      const payload = { subject: compose.subject, html_body: compose.html_body };
      if (compose.language) payload.language = compose.language;
      const { data } = await api.post("/admin/newsletter/send", payload);
      setSendResult(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setSendErr(typeof detail === "string" ? detail : "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
      {/* Compose */}
      <form onSubmit={send} data-testid="newsletter-compose" className="lg:col-span-1 border border-black p-5 space-y-3 bg-white lg:mr-6 mb-6 lg:mb-0 self-start">
        <div className="kik-label">{t.admin.compose.title}</div>
        <Field label={t.admin.compose.subject} required value={compose.subject} onChange={(v) => setCompose({ ...compose, subject: v })} testid="compose-subject" />
        <label className="block">
          <span className="kik-label">{t.admin.compose.body}</span>
          <textarea
            data-testid="compose-body"
            required
            rows={10}
            value={compose.html_body}
            onChange={(e) => setCompose({ ...compose, html_body: e.target.value })}
            className="kik-input mt-1.5 resize-none"
            placeholder="<h1>kik. pop-up #03</h1><p>thursday 23:00 ...</p>"
          />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)] mt-1 block">{t.admin.compose.body_hint}</span>
        </label>
        <SelectField
          label={t.admin.compose.lang}
          value={compose.language}
          onChange={(v) => setCompose({ ...compose, language: v })}
          testid="compose-lang"
          options={[
            { v: "", l: t.admin.compose.all },
            { v: "en", l: "EN" },
            { v: "ru", l: "RU" },
          ]}
        />
        <button type="submit" disabled={sending || items.length === 0} data-testid="compose-send" className="kik-btn kik-btn-primary w-full">
          {sending ? t.admin.compose.sending : `${t.admin.compose.send} (${items.length}) →`}
        </button>
        {sendResult && (
          <div data-testid="compose-result" className="border border-black bg-[#EBEBEB] p-3 text-xs font-mono uppercase tracking-[0.2em]">
            {t.admin.compose.result(sendResult.sent, (sendResult.failed || []).length)}
          </div>
        )}
        {sendErr && (
          <div data-testid="compose-error" role="alert" className="border border-[var(--kik-accent)] bg-[var(--kik-accent)] text-white p-2 text-[10px] font-mono uppercase tracking-[0.18em]">
            {sendErr}
          </div>
        )}
      </form>

      {/* Subscribers */}
      <div className="lg:col-span-2 border border-black bg-white">
        <div className="p-4 border-b border-black flex justify-between font-mono text-xs uppercase tracking-[0.22em]">
          <span>subscribers</span>
          <span>{items.length}</span>
        </div>
        <table className="w-full font-mono text-xs">
          <thead className="bg-black text-[#f4f4f4]"><tr><Th>email</Th><Th>lang</Th><Th>date</Th><Th>—</Th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={4} className="p-6 text-center uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no subscribers</td></tr>}
            {items.map((s) => (
              <tr key={s.id} className="border-t border-black">
                <Td>{s.email}</Td>
                <Td>{s.language?.toUpperCase()}</Td>
                <Td>{formatDate(s.created_at, "en")}</Td>
                <Td><button data-testid={`del-sub-${s.id}`} onClick={() => onDelete(s.id)} className="underline hover:text-[var(--kik-accent)]">remove</button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- CONTACT MESSAGES ---------- */
function ContactAdmin() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/admin/contact").then((r) => setItems(r.data)); }, []);
  return (
    <div className="space-y-4">
      {items.length === 0 && <div className="border border-black p-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">no messages</div>}
      {items.map((m) => (
        <div key={m.id} className="border border-black bg-white">
          <div className="border-b border-black p-3 flex justify-between font-mono text-xs uppercase tracking-[0.2em]">
            <span>{m.name} · {m.email}</span>
            <span>{formatDate(m.created_at, "en")}</span>
          </div>
          <div className="p-4 font-mono text-sm whitespace-pre-wrap">{m.message}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Helpers ---------- */
function Field({ label, value, onChange, type = "text", required = false, testid }) {
  return (
    <label className="block">
      <span className="kik-label">{label}</span>
      <input
        data-testid={testid}
        type={type}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="kik-input mt-1.5"
      />
    </label>
  );
}
function TextField({ label, value, onChange, testid }) {
  return (
    <label className="block">
      <span className="kik-label">{label}</span>
      <textarea
        data-testid={testid}
        rows={3}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="kik-input mt-1.5 resize-none"
      />
    </label>
  );
}
function SelectField({ label, value, onChange, options, required, testid }) {
  return (
    <label className="block">
      <span className="kik-label">{label}</span>
      <select
        data-testid={testid}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="kik-input mt-1.5"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
function Th({ children }) {
  return <th className="text-left p-3 font-mono text-[10px] uppercase tracking-[0.22em]">{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`p-3 align-top ${className}`}>{children}</td>;
}
