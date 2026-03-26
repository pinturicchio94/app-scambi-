# Yellow Pecora - PRD

## Problem Statement
Web app marketplace/social per collezionisti, stile Vinted/Subito, focalizzata sullo SCAMBIO. Interfaccia italiana, mobile-first, accessibile in max 3 click.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: Emergent Google OAuth
- **Storage**: Emergent Object Storage
- **AI**: OpenAI GPT-4o Vision (riconoscimento oggetti)
- **Fonts**: Outfit (headings) + Manrope (body)

## User Personas
1. Collezionista esperto - scambia pezzi rari, cerca match specifici
2. Collezionista principiante - esplora, cerca ispirazione
3. Venditore - vuole monetizzare la propria collezione

## Core Requirements
- Struttura dati: Utente -> Collezioni -> Oggetti -> Tag
- CRUD oggetti con upload foto multiple
- Riconoscimento AI dell'oggetto da foto
- Sistema wishlist
- Filtri per categoria, sottocategoria, tipo transazione
- Profilo con tab (Collezioni, Doppioni, Scambiabili, In Vendita, Desideri)
- Mascotte Yellow Pecora come identita' del brand

## What's Been Implemented (2026-03-26)
- [x] Homepage con Yellow Pecora banner, caroselli (Nuovi Arrivi, Trending, Collezionisti vicini)
- [x] Pagina Esplora con sidebar filtri e griglia card
- [x] Pagina Dettaglio Oggetto con galleria, info, CTA
- [x] Profilo Utente con tab e badge
- [x] Modale Carica Oggetto a 3 step con AI recognition reale (GPT-4o)
- [x] Upload multiplo foto (max 6)
- [x] Campi editabili dopo riconoscimento AI
- [x] Campo "Scambio desiderato" per specificare cosa si cerca
- [x] Pulsante wishlist rapido su card e pagina dettaglio
- [x] Tasto Home nella navbar con mascotte SVG
- [x] Mascotte Yellow Pecora SVG animata
- [x] Autenticazione Google OAuth (Emergent)
- [x] Object Storage per upload reali
- [x] Mock data (12 oggetti, 3 utenti)

## Prioritized Backlog
### P0
- [ ] Messaggistica interna tra utenti per negoziare scambi
- [ ] Notifiche per match e proposte di scambio

### P1
- [ ] Sistema di valutazione utenti (feedback dopo scambio)
- [ ] Gestione completa delle proposte di scambio (accept/reject flow)
- [ ] Collezioni officiali con catalogo completo

### P2
- [ ] Geolocalizzazione reale per "collezionisti vicino a te"
- [ ] Cronologia scambi
- [ ] Multi-lingua
