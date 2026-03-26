# FUN COLLECTION (Yellow Pecora) - PRD

## Problem Statement
Web app marketplace/social per collezionisti, stile Vinted/Subito, focalizzata sullo SCAMBIO. Titolo: "FUN COLLECTION". Interfaccia italiana, mobile-first.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor async)
- **Auth**: Emergent Google OAuth + Email/Password + Apple (UI) + Biometric (UI)
- **Storage**: Emergent Object Storage
- **AI**: OpenAI GPT-4o Vision (riconoscimento oggetti)
- **Fonts**: Outfit (headings) + Manrope (body)

## What's Been Implemented (2026-03-26)
### Core
- [x] "FUN COLLECTION" titolo centrato con barra scura
- [x] Mascotte Yellow Pecora SVG (navbar destra -> link a collezione)
- [x] Tasto Home + link Esplora nella navbar
- [x] Homepage con banner oggetto del giorno + foto + mascotte
- [x] Caroselli: Nuovi Arrivi, Trending, Collezionisti vicini

### Ricerca e Filtri
- [x] Barra ricerca "Completa la collezione..." con autocomplete suggerimenti
- [x] Pagina Esplora con sidebar filtri (7 categorie, 60+ sottocategorie)
- [x] Ordinamento: ultimi, meno recenti, prezzo crescente/decrescente, piu pregiati

### Caricamento Oggetti
- [x] Upload multi-foto (max 6) con drag & drop
- [x] AI Recognition reale (GPT-4o Vision) con campi editabili
- [x] Sottocategoria "Altra serie..." per input personalizzato
- [x] Collezione con % completamento (auto + manuale)
- [x] Campo "Scambio desiderato"

### Scambi e Proposte
- [x] Proponi Scambio funzionante - seleziona oggetti dalla propria collezione
- [x] Avviso per scambi multi-oggetto
- [x] Proposta scambio con differenza in denaro (EUR)
- [x] Accetta/Rifiuta proposte con notifiche

### Chat e Messaggi
- [x] Chat in-app tra compratore e venditore
- [x] Lista conversazioni con drawer laterale
- [x] Messaggi real-time con polling

### Notifiche e Match
- [x] Match Perfetto - notifica quando qualcuno carica un oggetto dalla wishlist
- [x] Conteggio persone che cercano l'oggetto caricato
- [x] Campanella notifiche con dropdown
- [x] Notifiche per proposte di scambio

### Autenticazione
- [x] Google OAuth (Emergent)
- [x] Email/Password (registrazione + login)
- [x] Apple ID (interfaccia UI)
- [x] Biometrico/TouchID (interfaccia UI)

### Profilo
- [x] Tab: Collezioni, Doppioni, Scambiabili, In Vendita, Desideri
- [x] Collezioni reali da DB con % editabile
- [x] Badge e livello collezionista
- [x] Wishlist con card oggetti

## Prioritized Backlog
### P0
- [ ] Notifiche push browser
- [ ] Integrazione reale Apple ID / WebAuthn biometrico

### P1
- [ ] Sistema valutazione utenti post-scambio
- [ ] Geolocalizzazione reale per collezionisti vicini
- [ ] Cronologia scambi completati

### P2
- [ ] Multi-lingua
- [ ] Dark mode
- [ ] PWA per installazione mobile
