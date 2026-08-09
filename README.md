# ToyTrade — CKB Toy Trading Platform

ToyTrade is a peer-to-peer toy exchange platform that helps parents swap outgrown toys. The platform leverages the Nervos CKB blockchain for trustless transaction escrow and Spore DOBs (Toy Passports) to record ownership history.

## Features
- **JoyID Wallet Integration**: Log in securely using device biometrics (passkeys/fingerprint) with no seed phrase setup.
- **On-Chain Escrow**: Dual-signature CKB smart contract locks funds until delivery is confirmed by both parties.
- **Toy Passports (Spore DOB)**: Minited on-chain NFTs recording the toy's brand, condition history, and ownership trace.
- **Three-Price Market Integrity**: Real-time listing displays comparing the seller's price, Google Lens visual market checks, and CKB conversion rates.

## Getting Started

1. **Configure Environment**:
   Copy `.env.example` to `.env.local` and set your API credentials:
   ```bash
   cp .env.example .env.local
   ```

2. **Sync Database Schema**:
   Prisma client structures will auto-generate on installation. Sync the PostgreSQL schema:
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

## ⚠️ Security & Design Limitations (MVP Disclaimer)

This implementation is built as an educational MVP. Several design constraints should be addressed before any production launch:

### 1. Escrow Lock: Transaction Hijacking
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
