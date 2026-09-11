# Requirements Definition (RD): Escrow & QR Handover

**Document ID**: `RD-ESC`  
**Module**: Escrow, Dual-Lock On-Chain Contracts, and In-Person QR Handover  
**SDLC Phase**: Phase 1 (Requirements Definition)  
**Verification Partner**: Integration Testing (`IT-ESC`)

---

## 1. Business Context & Objective

In physical toy trading, counterparty risk is the primary friction point. Sellers fear sending items without receiving funds; buyers fear paying without receiving the authentic toy. 

The **Escrow & QR Handover** module establishes a zero-trust settlement flow:
1. Buyer funds are locked on-chain or off-chain in an escrow vault.
2. The parties meet in person for physical inspection.
3. Seller displays an ephemeral QR code token.
4. Buyer scans the QR code to confirm physical satisfaction, instantly releasing locked escrow funds to the seller.
5. In case of abandonment or failure to meet, funds automatically revert to the buyer after a 7-day timeout.

---

## 2. Resource & Cost Economics (Rule 3)

| Resource Metric | Specification | Responsible Party | Lifecycle & Reclamation |
|---|---|---|---|
| **CKB L1 Cell Capacity** | ~61 to 142 CKB per escrow cell | **Buyer** deposits toy price + capacity reserve | Capacity is unlocked and returned when cell is consumed upon trade completion or timeout refund. |
| **Transaction Fees** | ~0.001 CKB (1,000 Shannons) | **Transactor** (initiator of state change) | Paid to miners. |
| **Fiber Network Alternative** | Sub-cent routing fees (<0.0001 CKB) | **Buyer / Sender** | Off-chain payment channel settles instantly without creating on-chain capacity cells per trade. |

---

## 3. Functional Requirements

### `REQ-ESC-001`: Escrow Initiation & Lock
- The system must allow an authenticated buyer to initiate an escrow trade for an active listing.
- The trade status must transition to `PENDING` upon creation and `ESCROWED` once deposit lock confirmation is received.
- The associated toy listing must be locked to prevent concurrent duplicate purchases.

### `REQ-ESC-002`: Self-Escrow Prevention
- The system must strictly prohibit a user from initiating an escrow trade on their own listing.
- If `buyerId === sellerId`, the request must be rejected with HTTP 400.

### `REQ-ESC-003`: Ephemeral QR Handover Token Generation
- The system must provide an endpoint for the seller to generate a time-limited cryptographic token for in-person handover.
- The QR token must have a maximum validity window of **15 minutes** (`expiresAt = now + 15m`).
- Regerating a token before expiration must invalidate prior tokens.

### `REQ-ESC-004`: Buyer QR Handover Settlement
- The system must allow the verified buyer to scan and submit the QR handover token to release escrow funds.
- Upon valid token verification, the trade status must atomically transition to `RELEASED` and the listing status to `SOLD`.
- Toy ownership must be transferred to the buyer in platform records.

### `REQ-ESC-005`: Unauthorized Claim Rejection
- The system must reject any QR confirmation attempt made by a user who is not the designated buyer of the trade.
- Requests with expired tokens or mismatched tokens must be rejected with HTTP 400.

### `REQ-ESC-006`: 7-Day Inactive Timeout & Sweep Refund
- If an escrowed trade remains uncompleted after 7 days (604,800 seconds), it is eligible for timeout expiration.
- A platform sweep worker or the buyer must be able to trigger the expiration sweep.
- Upon sweep execution:
  1. Trade status transitions to `REFUNDED`.
  2. Locked escrow funds/capacity are unlocked back to the buyer.
  3. The toy listing status reverts to `ACTIVE`.

---

## 4. Non-Functional Requirements (NFR)

### `REQ-ESC-NFR-001`: Cryptographic Verification
All state modifications and claim submissions must authenticate user identity via JoyID passkey signatures or verified session tokens.

### `REQ-ESC-NFR-002`: Data Integrity & Immutability
All status transitions must be recorded in an audit log (`PassportLog` / `TradeLog`) recording timestamps, trade IDs, buyer/seller addresses, and on-chain transaction hashes.

### `REQ-ESC-NFR-003`: Latency
QR token verification and database settlement must respond in under 500ms at 95th percentile to ensure frictionless in-person handovers.
