# ToyTrade — CKB Toy Trading Platform

ToyTrade is a peer-to-peer toy exchange platform that helps parents swap outgrown toys. Built on the Nervos CKB blockchain, ToyTrade provides trustless transaction escrow, on-chain provenance tracking via Spore DOBs (Toy Passports), and real-time safety verification to protect parent buyers.

---

## Key Features

- **Fiber Network Instant Settlement**: Sub-second Layer 2 payment settlement for in-person meetup handovers with automatic Layer 1 Escrow fallback.
- **JoyID Passkey Integration**: Log in using device biometrics (Fingerprint / FaceID / Windows Hello) without managing 12-word seed phrases.
- **P2P Parent Chat**: Buyers and sellers can message each other directly through an in-app chat to coordinate trades.
- **QR Code Meetup Handover**: Generate a 1-time dynamic QR code for local meetups. Sellers scan the code to settle payments and transfer the Toy Passport.
- **Automated Safety Recall Checker**: Validates toy titles against official safety hazard databases (CPSC / EU Safety Gate) during listing creation to block recalled toys.
- **Spore DOB Toy Passport & Timeline**: Immutable on-chain digital passports tracking condition history, previous owners, verified parent ratings, and CKB outpoints.
- **Three-Price Market Transparency**: Side-by-side display comparing the seller's price (£/₫), Google Lens market reference, and live CKB settlement cost.
- **EN/VI Language Support**: Bilingual interface across all pages, forms, and prompt suggestions.
- **Meetup Locations**: Neighborhood and address tags for local in-person trades.

---

## Tech Stack & Architecture

| Layer | Technologies | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router), React 19, Vanilla CSS, Tailwind CSS 4 | Reactive interface, file-based routing, server-side pre-rendering |
| **Serverless Backend** | Next.js Route Handlers (`src/app/api/`) | 12 REST API endpoints handling listings, escrows, chat, safety recall checks, and pricing feeds |
| **Database & ORM** | Turso (Distributed LibSQL / SQLite), Prisma 7 | Serverless edge SQL database with type-safe schema modeling via `@prisma/adapter-libsql` |
| **Layer 1 Blockchain** | Nervos CKB (Aggron4 Testnet), `@ckb-ccc/core` | UTXO-based Cell Model storing on-chain assets, smart contracts, and permanent storage capacity |
| **Digital Objects (DOB)** | Spore Protocol (`@spore-sdk/core`) | Permanent on-chain toy passports (~244 CKB capacity per cell; mint once, trade forever) |
| **Layer 2 Payments** | Fiber Network (FNN JSON-RPC) | Off-chain payment channels for instant meetup settlement with zero gas |
| **Biometric Auth** | JoyID SDK (`@joyid/ckb`, `@joyid/core`) | WebAuthn passkey authentication (FaceID/TouchID) without browser extensions or seed phrases |
| **Testing & QA** | Jest, `ts-jest` | Automated unit and integration testing suite |

---

## Getting Started

1. **Configure Environment**:
   Create a `.env` file in the project root with your Turso database credentials:
   ```env
   DATABASE_URL="libsql://your-database.turso.io"
   TURSO_AUTH_TOKEN="your-turso-auth-token"
   ```

2. **Sync Database Schema to Turso**:
   ```bash
   npx ts-node scripts/sync-turso.ts
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

5. **Launch Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) to browse and list toys.

---

## Presentation Deck

A 6-slide presentation deck is included in the root directory:
- `toytrade_pitch.pptx`: Platform architecture, CKB smart contract escrow flow, 3-price mechanics, and strategic roadmap.

---

## Security & Design Limitations (MVP Disclaimer)

This implementation is built as an educational MVP. Several design constraints should be addressed before a production launch:

### 1. Escrow Lock: Transaction Witness Validation
- **Vulnerability**: The Rust smart contract checks if the buyer's/seller's lock hashes exist anywhere in the inputs list (`Source::Input`).
- **Risk**: An attacker could append a dummy input cell carrying the matching lock hash to spend the escrow cells without validating actual signatures.
- **Production Fix**: Upgrade contract logic to locate and verify signatures inside the transaction witnesses structure.

### 2. Currency Rates: Off-Chain Feeds
- **Vulnerability**: CKB conversion rates are computed at trade initialization using public REST APIs (CoinGecko).
- **Risk**: Network downtime, API throttling, or sudden price swings can cause discrepancies.
- **Production Fix**: Utilize an on-chain oracle provider (e.g., DIA or RedStone) to handle price feed checks.
