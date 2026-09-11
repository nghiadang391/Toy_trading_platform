# Architectural Design (AD): Escrow & QR Handover

**Document ID**: `AD-ESC`  
**Module**: Escrow, Dual-Lock On-Chain Contracts, and In-Person QR Handover  
**SDLC Phase**: Phase 2 (Architectural Design)  
**Verification Partner**: Integration Testing (`IT-ESC`) & Security Audits

---

## 1. System Architecture & Boundaries

The Escrow and QR Handover architecture operates across three distinct tiers:
1. **Client Tier (Presentation & Signature)**: Next.js frontend, JoyID WebAuthn Passkey SDK.
2. **Application & Persistence Tier (Orchestration)**: Next.js App Router Route Handlers, Prisma ORM, Turso / SQLite database.
3. **Settlement & Consensus Tier (Finality)**: Nervos CKB L1 blockchain (`escrow-lock` RISC-V contract) and Fiber Network Lightning channels.

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│        Buyer Mobile Browser      Seller Mobile Browser │
│         (JoyID WebAuthn)           (JoyID WebAuthn)    │
└──────────────────┬───────────────────────┬─────────────┘
                   │                       │
           POST /api/trades         GET /api/trades/:id/qr
         POST /api/trades/:id/qr           │
                   │                       │
┌──────────────────▼───────────────────────▼─────────────┐
│                 Next.js API Application Tier           │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │  Trades Controller    │   │ QR Handover Engine   │  │
│  └───────────┬───────────┘   └──────────┬───────────┘  │
│              │                          │              │
│              └───────────┬──────────────┘              │
│                          │                             │
│                  Prisma ORM Client                     │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
┌────────────▼──────────┐   ┌────────────▼──────────────┐
│  Turso / SQLite DB    │   │      Nervos CKB L1        │
│  - Trade Model        │   │  - escrow-lock Contract   │
│  - Listing Model      │   │  - Dual-sign Unlock       │
│  - User Model         │   │  - Timeout Reclaim Cell   │
└───────────────────────┘   └───────────────────────────┘
```

---

## 2. Architectural Components (`ARCH-ESC`)

### `ARCH-ESC-001`: Escrow State Machine
The lifecycle of every trade is governed by a strict deterministic finite state machine (FSM):

```
                   [Initiate Trade]
                          │
                          ▼
                     ┌─────────┐
                     │ PENDING │
                     └────┬────┘
                          │ [Deposit Confirmed]
                          ▼
                    ┌──────────┐
         ┌──────────┤ ESCROWED ├──────────┐
         │          └────┬─────┘          │
[7-Day Timeout]          │                │ [Dispute Raised]
         │        [QR Handover]           │
         ▼               │                ▼
   ┌──────────┐          ▼          ┌──────────┐
   │ REFUNDED │    ┌──────────┐     │ DISPUTED │
   └──────────┘    │ RELEASED │     └──────────┘
                   └──────────┘
```

### `ARCH-ESC-002`: Ephemeral QR Security Architecture
- **Token Generation**: Seller initiates `GET /api/trades/[id]/qr`. The backend verifies seller identity, generates an entropy-dense crypto token (`qrCodeToken`), and sets `qrCodeExpiresAt = now + 15m`.
- **Token Delivery**: Rendered as a high-contrast QR code on the seller's mobile display.
- **Scanning & Ingestion**: Buyer scans QR code, extracting token and endpoint URL.
- **Settlement Verification**: Buyer client submits `POST /api/trades/[id]/qr` with payload `{ token, buyerAddress }`.
- **Atomic Release**: Backend verifies:
  1. `trade.buyer.joyIdAddress === buyerAddress`
  2. `trade.qrCodeToken === token`
  3. `now <= trade.qrCodeExpiresAt`
  4. `trade.status === ESCROWED`

### `ARCH-ESC-003`: CKB On-Chain Dual-Lock Contract (`escrow-lock`)
For on-chain settled trades, funds are held in a CKB cell locked with the custom binary `escrow-lock`.
- **Args Layout**: `[Buyer Lock Hash (32B)] + [Seller Lock Hash (32B)] + [Timeout Timestamp uint64 (8B)] + [Trade ID (32B)]`
- **Execution Paths**:
  1. **Dual Confirmation Path**: Valid if both Buyer and Seller input lock scripts are signed/executed within the same transaction. Releases funds directly to Seller.
  2. **Timeout Reclamation Path**: Valid if transaction `since` >= `timeout` and Buyer input lock script is signed. Unlocks 100% of capacity and funds back to Buyer.

---

## 3. Security Boundary & Authorization Matrix

| Actor | Action | Required Precondition | Error on Unauthorized |
|---|---|---|---|
| **Buyer** | Initiate Trade (`POST /api/trades`) | Must not be listing owner (`buyerId !== sellerId`) | 400 Bad Request |
| **Seller** | Generate QR (`GET /api/trades/:id/qr`) | Must be trade seller; trade must be `ESCROWED` | 403 Forbidden / 400 Bad Request |
| **Buyer** | Settle QR (`POST /api/trades/:id/qr`) | Must be designated trade buyer; token valid & unexpired | 403 Forbidden / 400 Bad Request |
| **Third Party** | Attempt Settle QR | Any non-buyer address | 403 Forbidden |
| **System / Cron** | Sweep Expired (`POST /api/trades/expire`) | Current time >= `createdAt + 7 days` | Skip if trade not expired |
