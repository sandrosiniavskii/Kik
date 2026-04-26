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
- Admin: login + dashboard with 6 tabs (Auctions, Lots, Artists, RSVPs, Newsletter, Messages), full CRUD, auction-delete cascades to lots (RSVPs preserved)
- Newsletter signup (deduped by email) + Contact form (admin can read)
- **Cloudinary signed image upload** for auction cover / lot image / artist portrait (with manual URL fallback)
- **RSVP** for upcoming pop-ups (name + email + favorite color), per-auction filter + CSV export in admin
- **Newsletter campaign send** via Mail.ru SMTP (subject + HTML body + optional language filter)
- Backend tested: 16/16 pytest pass; Frontend Playwright 100%

### Required env (placeholders for now)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `SMTP_HOST=smtp.mail.ru` / `SMTP_PORT=465` / `SMTP_USER` / `SMTP_PASSWORD` / `SMTP_FROM`

### Backlog (P1)
- Replace native `datetime-local` with shadcn Calendar/DateTimePicker
- Auction countdown timer on hero
- Async newsletter send (background task — current impl is synchronous smtplib)
- Pagination on admin tables once content grows
- Replace `window.confirm` with styled modal

### Backlog (P2)
- Stripe deposit / consignment fee collection
- Lot result PDF export for past auctions
- Public RSS feed of upcoming auctions
- Cloudinary asset deletion when DB record removed

## Test Credentials
See `/app/memory/test_credentials.md`
- Admin: `admin@kik.art` / `kikadmin2025`
