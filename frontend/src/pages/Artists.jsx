import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useI18n } from "../i18n";
import { Header, Footer } from "../Layout";

export function ArtistsList() {
  const { t } = useI18n();
  const [artists, setArtists] = useState([]);
  useEffect(() => {
    api.get("/artists").then((r) => setArtists(r.data));
  }, []);
  return (
    <div className="App">
      <Header />
      <section className="border-b border-black px-4 md:px-8 py-12 md:py-20">
        <div className="kik-label">/ {t.artists.title.toLowerCase()}</div>
        <h1 className="font-display text-6xl md:text-8xl lowercase leading-[0.85] mt-4">
          {t.artists.title.toLowerCase()}<span className="text-[var(--kik-accent)]">.</span>
        </h1>
      </section>

      {artists.length === 0 ? (
        <div className="px-4 md:px-8 py-24 text-center text-sm font-mono uppercase tracking-[0.2em] text-[var(--kik-ink-soft)]">
          {t.artists.none}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {artists.map((a) => (
            <Link
              key={a.id}
              to={`/artists/${a.id}`}
              data-testid={`artist-card-${a.id}`}
              className="kik-img-wrap border-b border-r border-black aspect-[3/4] relative overflow-hidden"
            >
              {a.image_url ? (
                <img src={a.image_url} alt={a.name} className="absolute inset-0 w-full h-full object-cover kik-img" />
              ) : (
                <div className="absolute inset-0 bg-[#dcdcdc]" />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-[#EBEBEB] border-t border-black p-3 flex items-center justify-between">
                <div className="font-display text-xl lowercase leading-none truncate">{a.name}</div>
                <span className="text-[10px] font-mono">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}

export function ArtistDetail() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [artist, setArtist] = useState(null);

  useEffect(() => {
    api.get(`/artists/${id}`).then((r) => setArtist(r.data));
  }, [id]);

  if (!artist) {
    return (
      <div className="App">
        <Header />
        <div className="px-4 md:px-8 py-32 text-center font-mono text-sm uppercase tracking-[0.25em]">loading...</div>
      </div>
    );
  }

  const bio = lang === "ru" ? artist.bio_ru || artist.bio_en : artist.bio_en;

  return (
    <div className="App">
      <Header />
      <section className="grid grid-cols-12 border-b border-black">
        <div className="col-span-12 lg:col-span-5 relative min-h-[50vh] lg:min-h-[80vh] bg-[#dcdcdc] border-r border-black">
          {artist.image_url && (
            <img src={artist.image_url} alt={artist.name} className="absolute inset-0 w-full h-full object-cover kik-img" />
          )}
        </div>
        <div className="col-span-12 lg:col-span-7 p-6 md:p-12">
          <Link to="/artists" data-testid="back-link" className="kik-label hover:text-[var(--kik-accent)]">← {t.artists.title}</Link>
          <h1 className="font-display text-5xl md:text-7xl lowercase leading-[0.85] mt-4">{artist.name}<span className="text-[var(--kik-accent)]">.</span></h1>
          {bio && <p className="mt-8 max-w-2xl font-mono text-sm md:text-base leading-relaxed">{bio}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            {artist.instagram && (
              <a href={artist.instagram} target="_blank" rel="noreferrer" className="kik-btn">instagram ↗</a>
            )}
            {artist.website && (
              <a href={artist.website} target="_blank" rel="noreferrer" className="kik-btn">website ↗</a>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
