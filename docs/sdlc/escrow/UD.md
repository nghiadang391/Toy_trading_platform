# Unit / Detailed Design (UD): Escrow & QR Handover

**Document ID**: `UD-ESC`  
**Module**: Escrow, Dual-Lock On-Chain Contracts, and In-Person QR Handover  
**SDLC Phase**: Phase 3 (Unit / Detailed Design)  
**Verification Partner**: Unit Testing (`UT-ESC`)

---

## 1. Route Handler Specifications

### `SPEC-ESC-001`: `POST /api/trades` (Create Trade)
- **Path**: `/api/trades`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Request Body Schema**:
  ```json
  {
    "listingId": "string (UUID, required)",
    "buyerId": "string (UUID, required)",
    "amount": "number (positive integer, optional)",
    "type": "string (ESCROW | DIRECT, default: ESCROW)",
    "paymentMethod": "string (FIBER | CKB_ONCHAIN | CASH_ON_MEET)"
  }
  ```
- **Validation Logic**:
  1. Lookup `listing` by `listingId`. If missing, return `404 Not Found`.
  2. If `listing.sellerId === buyerId`, return `400 Bad Request` with error `"Sellers cannot initiate escrow trades on their own listings"`.
  3. If `listing.status !== "ACTIVE"`, return `400 Bad Request`.
- **Response Schema (201 Created)**:
  ```json
  {
    "id": "string",
    "status": "PENDING | ESCROWED",
    "listingId": "string",
    "sellerId": "string",
    "buyerId": "string",
    "createdAt": "ISO8601 string"
  }
  ```

---

### `SPEC-ESC-002`: `GET /api/trades/[id]/qr` (Generate Handover Token)
- **Path**: `/api/trades/[id]/qr`
- **Method**: `GET`
- **URL Parameter**: `id` (Trade UUID)
- **Execution Steps**:
  1. Retrieve `trade` including `listing`, `seller`, and `buyer`.
  2. Validate `trade.status === "ESCROWED"`. If not, return `400 Bad Request` with error `"Trade is not in escrowed status"`.
  3. Generate cryptographic random token: `crypto.randomBytes(16).toString("hex")` or UUID format.
  4. Compute expiration: `expiresAt = new Date(Date.now() + 15 * 60 * 1000)`.
  5. Update `trade` record: `qrCodeToken = token`, `qrCodeExpiresAt = expiresAt`.
- **Response Schema (200 OK)**:
  ```json
  {
    "tradeId": "string",
    "token": "string",
    "expiresAt": "ISO8601 string",
    "toyTitle": "string",
    "sellerAddress": "string",
    "buyerAddress": "string"
  }
  ```

---

### `SPEC-ESC-003`: `POST /api/trades/[id]/qr` (Settle Handover via QR)
- **Path**: `/api/trades/[id]/qr`
- **Method**: `POST`
- **URL Parameter**: `id` (Trade UUID)
- **Request Body Schema**:
  ```json
  {
    "token": "string (required)",
    "buyerAddress": "string (required)"
  }
  ```
- **Validation & Settlement Logic**:
  1. Fetch `trade` with `seller`, `buyer`, and `listing`.
  2. If `trade.status !== "ESCROWED"`, return `400 Bad Request` (`"Trade is not in escrow status"`).
  3. Verify authorization: If `trade.buyer.joyIdAddress !== buyerAddress`, return `403 Forbidden` (`"Unauthorized: Only the designated buyer can confirm handover"`).
  4. Verify token match: If `trade.qrCodeToken !== token`, return `400 Bad Request` (`"Invalid QR code token"`).
  5. Verify expiration: If `new Date() > trade.qrCodeExpiresAt`, return `400 Bad Request` (`"QR code token has expired"`).
  6. Atomic Mutation (Transaction):
     - Set `trade.status = "RELEASED"`
     - Set `listing.status = "SOLD"`
     - Create audit log `PassportLog` recording ownership transfer.
- **Response Schema (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Handover confirmed and escrow released",
    "trade": { "id": "string", "status": "RELEASED" }
  }
  ```

---

### `SPEC-ESC-004`: `POST /api/trades/expire` (7-Day Timeout Sweep)
- **Path**: `/api/trades/expire`
- **Method**: `POST`
- **Execution Steps**:
  1. Calculate expiration cutoff: `cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)`.
  2. Query trades where:
     - `status === "ESCROWED"`
     - `createdAt <= cutoffDate`
  3. For each expired trade:
     - Update `trade.status = "REFUNDED"`
     - Revert `listing.status = "ACTIVE"`
- **Response Schema (200 OK)**:
  ```json
  {
    "success": true,
    "sweptCount": "number",
    "sweptTrades": ["string"]
  }
  ```

---

## 2. Smart Contract Binary Unit Specification

### `SPEC-ESC-005`: `contracts/escrow-lock` Binary Contract
- **Target RISC-V Binary**: `target/riscv64imac-unknown-none-elf/release/escrow-lock`
- **Lock Script Args Structure**:
  - Bytes 0..31: `buyer_lock_hash` (32 bytes)
  - Bytes 32..63: `seller_lock_hash` (32 bytes)
  - Bytes 64..71: `timeout` (uint64, little-endian, 8 bytes)
  - Bytes 72..103: `trade_id` (32 bytes)
- **Branch A: Dual-Signature Release**:
  - Calls `check_lock_hash_signed(buyer_lock_hash)` and `check_lock_hash_signed(seller_lock_hash)`.
  - If both return `true`, returns exit code `0` (Success).
- **Branch B: Timeout Refund**:
  - Verifies transaction since header or lock period >= `timeout`.
  - Calls `check_lock_hash_signed(buyer_lock_hash)`.
  - If valid, returns exit code `0` (Success).
- **Branch C: Failure / Unauthorized**:
  - If neither condition is met, returns non-zero error code (`ERROR_UNAUTHORIZED = -1`).
