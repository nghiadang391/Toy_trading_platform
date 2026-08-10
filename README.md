# ToyTrade — CKB Toy Trading Platform

ToyTrade is a peer-to-peer toy exchange platform that helps parents swap outgrown toys. Built on the **Nervos CKB** blockchain, ToyTrade provides trustless transaction escrow, on-chain provenance tracking via **Spore DOBs (Toy Passports)**, and real-time safety verification to protect parent buyers.

---

## ✨ Key Features

- **🔑 JoyID Passkey Integration**: Log in seamlessly using device biometrics (Fingerprint / FaceID / Windows Hello) without managing 12-word seed phrases.
- **📱 QR Code Meetup Handover**: Generate a 1-time dynamic QR code for local meetups. Sellers scan the code to instantly settle 2-of-2 CKB escrow and transfer the Toy Passport on the spot.
- **🛡️ Automated Safety Recall Checker**: Real-time validation checking toy titles against official safety hazard databases (CPSC / EU Safety Gate) during listing creation to block recalled toys.
- **📜 Spore DOB Toy Passport & Timeline**: Immutable on-chain digital passports tracking a toy's condition history, previous owners, verified parent ratings, and CKB outpoints.
- **💰 Three-Price Market Transparency**: Real-time side-by-side display comparing the Seller's price (£/₫), Google Lens market reference, and live CKB settlement cost.
- **📍 Detailed Meetup Locations**: Specific address & neighborhood tags (e.g. "Hammersmith, London" or "District 1, HCMC") for local trades.

---

## 🛠️ Tech Stack & Architecture

- **Frontend & App Router**: Next.js 16 (React 19), Tailwind CSS
- **Database & ORM**: PostgreSQL via Prisma ORM
- **Blockchain**: Nervos CKB (Testnet), CKB CCC Core SDK
- **Passkeys & Wallet**: JoyID CKB SDK (`@joyid/ckb`)
- **Digital Objects (DOB)**: Spore Protocol (`@spore-sdk/core`)

---

## 🚀 Getting Started

1. **Configure Environment**:
   Copy `.env.example` to `.env.local` and set your database credentials:
   ```bash
   cp .env.example .env.local
   ```

2. **Sync Database Schema**:
   Prisma client structures auto-generate on install. Sync the PostgreSQL schema:
   ```bash
   npx prisma db push
   ```

3. **Start Development Server**:
   The start script automatically cleans port leaks before booting:
   ```bash
   npm run dev
   ```

4. **Launch Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) to browse and list toys.

---

## 📊 Presentation Deck

A complete 6-slide presentation deck is included in the root directory:
- **`toytrade_pitch.pptx`**: Platform architecture, CKB smart contract escrow flow, 3-price mechanics, and strategic roadmap.

---

## ⚠️ Security & Design Limitations (MVP Disclaimer)

This implementation is built as an educational MVP. Several design constraints should be addressed before any production launch:

### 1. Escrow Lock: Transaction Witness Validation
- **Vulnerability**: The Rust smart contract checks if the buyer's/seller's lock hashes exist anywhere in the inputs list (`Source::Input`).
- **Risk**: An attacker could append a dummy input cell carrying the matching lock hash to spend the escrow cells without validating actual signatures.
- **Production Fix**: Upgrade contract logic to locate and verify signatures inside the transaction witnesses structure.

### 2. Backend API: Unsigned Confirmations
- **Vulnerability**: `/api/trades/[id]/confirm` relies on an `actorType` parameter inside the JSON payload to update db trade status.
- **Risk**: Attackers can spoof HTTP requests to confirm delivery without owning the keys.
- **Production Fix**: Require users to sign a confirmation payload using JoyID and verify the cryptographic signature on the backend before finalizing trades.

### 3. Currency Rates: Off-Chain Feeds
- **Vulnerability**: CKB conversion rates are computed at trade initialization using public REST APIs (CoinGecko).
- **Risk**: Network downtime, API throttling, or sudden price swings can cause discrepancies.
- **Production Fix**: Utilize an on-chain oracle provider (e.g., DIA or RedStone) to handle price feed checks.
