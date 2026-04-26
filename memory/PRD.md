# kik — Nomadic Contemporary Art Auction House

## Original Problem Statement
"build me a website for an auction house 'kik'. we want to make offline pop-up auctions every month and we sell contemporary art"

## User Choices (December 2025)
- Visual aesthetic: **Brutalist / experimental**
- Scope: Full platform with **admin panel** (auctions / lots / artists)
- Content population: **Admin uploads** everything
- Integration: **Newsletter** (email capture)
- Languages: **EN / RU**

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB), JWT bearer auth (PyJWT + bcrypt)
- **Frontend**: React 19 + React Router v7, Tailwind CSS, custom brutalist component layer
- **DB**: MongoDB collections — `users`, `auctions`, `lots`, `artists`, `newsletter`, `contact_messages`
- **Auth**: Single seeded admin (`admin@kik.art` / `kikadmin2025`); JWT 24h; Bearer token in `localStorage`

## User Personas
1. **Visitor / Bidder** — discovers upcoming pop-up auctions, browses lots & artists, subscribes to newsletter
2. **Press / Consignor** — uses contact form
3. **Admin (kik staff)** — manages auctions, lots, artists, newsletter list, messages

## Implementation Status — December 2025

### ✅ Done (v1)
- Bilingual (EN/RU) public site: Home, Auctions list (upcoming/past tabs), Auction detail with lots grid, Artists list, Artist detail, About, Contact
- Brutalist design system: Cabinet Grotesk + IBM Plex Mono, signal-red `#FF2A00` accent, 1px black borders, no rounded, marquee strip, grayscale→color image hovers
- Admin: login + dashboard with 5 tabs (Auctions, Lots, Artists, Newsletter, Messages), full CRUD for auctions/lots/artists, auction-delete cascades to lots
- Newsletter signup (deduped by email) + Contact form (admin can read)
- Backend tested: 8/8 pytest cases pass; Frontend tested via Playwright

### Backlog (P1)
- Replace native `datetime-local` with shadcn Calendar/DateTimePicker for design consistency
- Image upload (currently URLs only) — S3 / Cloudinary
- Auction countdown timer on hero
- RSVP for pop-up (collect attendee email + party size)
- Pagination on admin tables once content grows

### Backlog (P2)
- Stripe deposit / consignment fee collection
- Email-out from `/admin/newsletter` (Resend or SendGrid)
- Lot result PDF export for past auctions
- Public RSS feed of upcoming auctions

## Test Credentials
See `/app/memory/test_credentials.md`
- Admin: `admin@kik.art` / `kikadmin2025`
