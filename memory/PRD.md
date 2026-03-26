# FUN COLLECTION (Yellow Pecora) - PRD

## Problem Statement
Web app marketplace/social per collezionisti, stile Vinted/Subito, focalizzata sullo SCAMBIO. Interfaccia italiana, mobile-first, accessibile in max 3 click. Titolo sito: "FUN COLLECTION".

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: Emergent Google OAuth
- **Storage**: Emergent Object Storage
- **AI**: OpenAI GPT-4o Vision (riconoscimento oggetti)
- **Fonts**: Outfit (headings) + Manrope (body)
- **Theme**: Chiaro, minimalista, giallo solo per Yellow Pecora

## User Personas
1. Collezionista esperto - scambia pezzi rari, cerca match specifici
2. Collezionista principiante - esplora, cerca ispirazione
3. Venditore - vuole monetizzare la propria collezione

## What's Been Implemented (2026-03-26)
- [x] Titolo "FUN COLLECTION" centrato in alto
- [x] Mascotte Yellow Pecora SVG custom
- [x] Tasto Home nella navbar
- [x] Homepage con banner mascotte + caroselli
- [x] Pagina Esplora con filtri sidebar (7 categorie, 60+ sottocategorie)
- [x] Pagina Dettaglio Oggetto con galleria + info + CTA
- [x] Profilo Utente con tab e badge
- [x] Upload multi-foto (max 6) con drag & drop
- [x] AI Recognition reale (GPT-4o Vision) con campi editabili
- [x] Sottocategoria "Altra serie..." per input personalizzato
- [x] Sistema collezioni con % completamento (auto + manuale)
- [x] Match Perfetto - notifiche quando qualcuno carica un oggetto dalla tua wishlist
- [x] Conteggio persone che cercano l'oggetto caricato
- [x] Campanella notifiche nella navbar
- [x] Scambio desiderato (specifica cosa vuoi in cambio)
- [x] Wishlist veloce con cuore su ogni card
- [x] Auth Google OAuth (Emergent)
- [x] Object Storage per upload reali

## Prioritized Backlog
### P0
- [ ] Messaggistica interna tra utenti
- [ ] Flow completo proposta scambio (accept/reject)

### P1
- [ ] Sistema valutazione utenti post-scambio
- [ ] Geolocalizzazione reale
- [ ] Notifiche push browser

### P2
- [ ] Cronologia scambi
- [ ] Multi-lingua
- [ ] Statistiche collezione avanzate
