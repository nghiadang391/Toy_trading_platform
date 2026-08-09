# ToyTrade — CKB Toy Trading Platform

ToyTrade is a toy trading marketplace for parents to trade, buy, and sell used toys. It uses the CKB blockchain to handle secure escrow settlements and store toy trading history on-chain using Spore DOBs (Toy Passports).

## Getting Started

1. Copy `.env.example` to `.env.local` and configure your API keys.
2. Initialize and sync your Prisma database:
   ```bash
   npx prisma db push
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## ⚠️ Security & Design Limitations (Learning Project)

Because this is a learning-focused MVP, several simplifications have been made that **must** be addressed before deploying to any production or mainnet environment:

### 1. Smart Contract: Transaction Structure Hijacking
*   **Vulnerability:** The escrow lock script verifies buyer/seller execution by checking if their lock hashes exist anywhere in the input cells (`Source::Input`).
*   **Risk:** An attacker could spend a dummy cell they control that matches the target lock hash, bypassing signature verification for the escrow cell.
*   **Production Fix:** Upgrade the contract to verify cryptographic signatures inside witness structures mapping directly to transaction outputs (e.g., verifying signature hashes over the whole transaction payload).

### 2. Backend: Unauthenticated Confirmation Requests
*   **Vulnerability:** The `/api/trades/[id]/confirm` endpoint relies on the `actorType` parameter sent in the raw JSON request body to confirm whether a buyer or seller has finalized a trade.
*   **Risk:** Anyone can call this API directly to mock confirmation actions without possessing the actual wallet keys.
*   **Production Fix:** Require the user to sign a verification message using JoyID (`@joyid/ckb` message signing) and validate the signature on the backend before updating database state.

### 3. Currency Settle: Off-Chain Price Feed
*   **Vulnerability:** The live CKB/fiat exchange rate is pulled from an off-chain API (CoinGecko) and calculated at trade creation time.
*   **Risk:** Price volatility or API downtime could lead to settlement price differences.
*   **Production Fix:** Use an on-chain price oracle (e.g. DIA or Chainlink equivalent on CKB) to fetch and verify exchange rates directly on-chain.
