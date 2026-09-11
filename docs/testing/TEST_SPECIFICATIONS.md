# ToyTrade - Complete Test Specifications (Test Specs)

**Document Version**: 1.0  
**SDLC Framework**: V-Model Traceability Standard (`docs/sdlc/SDLC_GUIDE.md`)  
**Scope**: Unit Testing (UT) and Integration Testing (IT) across all active ToyTrade platform modules.

---

## Traceability Summary Table

| Module Code | Domain Feature Area | Specification Prefix | Test Files | Total Test Cases |
|---|---|---|---|---|
| **ESC** | Escrow, Dual-Lock & In-Person QR Handover | `UT-ESC-xxx`, `IT-ESC-xxx` | `tests/unit/escrow_lock.test.ts`, `tests/integration/trades_escrow.test.ts` | 10 tests |
| **USR** | JoyID Passkey Auth & User Profiles | `IT-USR-xxx`, `UT-AUT-xxx` | `tests/api_comprehensive.test.ts`, `tests/auth.test.ts` | 4 tests |
| **LST** | Toy Listings, Legacy Normalization & Query | `IT-LST-xxx` | `tests/api_comprehensive.test.ts` | 4 tests |
| **PAY** | Fiber Network Lightning Payments | `IT-PAY-xxx` | `tests/fiber.test.ts` | 4 tests |
| **PAS** | Spore DOB Toy Passports & Ownership Logs | `IT-PAS-xxx` | `tests/spore.test.ts`, `tests/api_comprehensive.test.ts` | 2 tests |
| **UI** | Client Error Boundary & Render Guard | `UT-UI-xxx` | `tests/errorBoundary.test.ts` | 4 tests |

---

## 1. Escrow & QR Handover Module (`ESC`)

### `[UT-ESC-001]` On-Chain Dual Confirmation Release
- **Target Component**: `contracts/escrow-lock` (RISC-V binary via `ckb-testtool`)
- **Traceability**: `REQ-ESC-001`, `REQ-ESC-004` | `SPEC-ESC-005`
- **Preconditions**:
  - Escrow cell deployed with args: `[buyerLockHash (32B)] + [sellerLockHash (32B)] + [timeout (8B)] + [tradeId (32B)]`.
  - Transaction includes input cell signed by buyer lock and input cell signed by seller lock.
- **Input Data**:
  - `dummyArgsBuyer`: `0x1111...` (32 bytes)
  - `dummyArgsSeller`: `0x2222...` (32 bytes)
- **Execution**: Run `verifier.verifySuccess(true)` with `--script-version 2`.
- **Expected Outcome**:
  - Verification succeeds with exit code `0`.
  - Consumes ~21.8k cycles.

### `[UT-ESC-002]` On-Chain Timeout Reclaim
- **Target Component**: `contracts/escrow-lock`
- **Traceability**: `REQ-ESC-006` | `SPEC-ESC-005`
- **Preconditions**:
  - Escrow cell deployed with timeout = 1000.
  - Transaction input `since` relative header set to `0x4000000000000000n + 1001n` (exceeds timeout).
  - Buyer input cell signed; seller does not sign.
- **Expected Outcome**:
  - Verification succeeds with exit code `0`.
  - Unlocks 100% of cell capacity and funds back to buyer.

### `[UT-ESC-003]` Premature Refund Rejection
- **Target Component**: `contracts/escrow-lock`
- **Traceability**: `REQ-ESC-006` | `SPEC-ESC-005`
- **Preconditions**:
  - Transaction input `since` header set to `0x4000000000000000n + 999n` (prior to timeout expiry).
  - Buyer signs, seller does not sign.
- **Expected Outcome**:
  - `verifier.verifyFailure()` succeeds; lock script exits with non-zero error.

### `[UT-ESC-004]` Unauthorized Unlock Rejection
- **Target Component**: `contracts/escrow-lock`
- **Traceability**: `REQ-ESC-005` | `SPEC-ESC-005`
- **Preconditions**:
  - Only seller signs before timeout expiry; buyer signature is missing.
- **Expected Outcome**:
  - Script exits with non-zero error; unauthorized cell unlock blocked.

### `[IT-ESC-001]` Escrow Trade Initiation
- **Target Component**: `POST /api/trades`
- **Traceability**: `REQ-ESC-001` | `SPEC-ESC-001`
- **Input**:
  ```json
  {
    "listingId": "<listing_id>",
    "buyerId": "<buyer_id>",
    "priceFiat": 250,
    "priceCkb": "25000000000",
    "exchangeRate": 0.02,
    "method": "MEETUP"
  }
  ```
- **Expected Outcome**:
  - HTTP 201 Created.
  - Returns trade record with `status = "ESCROW_FUNDED"`.
  - Listing record in DB updated to `status = "RESERVED"`.

### `[IT-ESC-002]` Ephemeral QR Token Generation
- **Target Component**: `GET /api/trades/[id]/qr`
- **Traceability**: `REQ-ESC-003` | `SPEC-ESC-002`
- **Preconditions**: Trade exists in `ESCROW_FUNDED` state.
- **Expected Outcome**:
  - HTTP 200 OK.
  - Generates token prefixed with `QR_HANDOVER_`.
  - `expiresAt` set to 15-30 minutes into the future.
  - Returns verified seller and buyer JoyID addresses.

### `[IT-ESC-003]` In-Person Handover Settlement
- **Target Component**: `POST /api/trades/[id]/qr`
- **Traceability**: `REQ-ESC-004` | `SPEC-ESC-003`
- **Input**:
  ```json
  {
    "token": "<valid_token>",
    "buyerAddress": "<buyer_joyid_address>"
  }
  ```
- **Expected Outcome**:
  - HTTP 200 OK with `success: true`.
  - Trade status in DB transitions to `"COMPLETED"`.
  - Listing status in DB transitions to `"TRADED"`.
  - Creates new `PassportLog` entry transferring toy ownership to buyer.

### `[IT-ESC-004]` Self-Escrow and Unauthorized Scanner Rejection
- **Target Component**: `POST /api/trades` & `POST /api/trades/[id]/qr`
- **Traceability**: `REQ-ESC-002`, `REQ-ESC-005` | `SPEC-ESC-001`, `SPEC-ESC-003`
- **Case 1 (Self-Trade)**: Buyer ID equals seller ID -> HTTP 400 with error `"Sellers cannot initiate escrow trades on their own listings"`.
- **Case 2 (Unauthorized Scanner)**: Submitting valid QR token with attacker address -> HTTP 403 with error `"Caller address does not match the trade buyer"`.

### `[IT-ESC-005]` 7-Day Inactive Timeout Auto-Sweep
- **Target Component**: `POST /api/trades/expire`
- **Traceability**: `REQ-ESC-006` | `SPEC-ESC-004`
- **Preconditions**: Stale trade in `ESCROW_FUNDED` with `createdAt` > 7 days ago.
- **Expected Outcome**:
  - HTTP 200 OK with `expiredCount >= 1`.
  - Stale trade transitions to `"EXPIRED"`.
  - Associated listing reverts from `"RESERVED"` back to `"ACTIVE"`.

---

## 2. Authentication & User Profiles Module (`USR`)

### `[IT-USR-001]` User Registration & Region Assignment
- **Target Component**: `POST /api/users`
- **Traceability**: `REQ-USR-001` | `SPEC-USR-001`
- **Input**: `joyIdAddress`, `displayName: "Alice UK"`, `region: "UK"`.
- **Expected Outcome**:
  - HTTP 200 OK. User persisted with default UK region and 100 initial reputation.

### `[IT-USR-002]` Regional Normalization
- **Target Component**: `POST /api/users`
- **Traceability**: `REQ-USR-002` | `SPEC-USR-001`
- **Input**: `region: "VN"`.
- **Expected Outcome**:
  - HTTP 200 OK. System defensively normalizes short code `"VN"` to Prisma enum `"VIETNAM"`.

### `[UT-AUT-001]` Development Cryptographic Signature Validation
- **Target Component**: `verifySignature(message, signature, address)`
- **Traceability**: `REQ-SEC-001` | `SPEC-AUT-001`
- **Input**: Valid mock signature string `mock-sig-<address>`.
- **Expected Outcome**: Returns `true`.

### `[UT-AUT-002]` Invalid Signature Rejection
- **Target Component**: `verifySignature(message, signature, address)`
- **Traceability**: `REQ-SEC-001` | `SPEC-AUT-001`
- **Input**: Invalid / corrupted signature string.
- **Expected Outcome**: Returns `false`.

---

## 3. Toy Listings & Catalog Module (`LST`)

### `[IT-LST-001]` Multi-Currency Listing Creation
- **Target Component**: `POST /api/listings`
- **Traceability**: `REQ-LST-001` | `SPEC-LST-001`
- **Input**: Title, description, `priceFiat: 500000`, `currency: "VND"`, `shippingRegion: "VIETNAM"`.
- **Expected Outcome**: HTTP 201 Created with status `ACTIVE`.

### `[IT-LST-002]` Legacy Field Defensive Normalization
- **Target Component**: `POST /api/listings`
- **Traceability**: `REQ-LST-002` | `SPEC-LST-001`
- **Input**: `condition: "USED"`, `shippingRegion: "VN"`.
- **Expected Outcome**: HTTP 201 Created with condition normalized to `"GOOD"` and region to `"VIETNAM"`.

### `[IT-LST-003]` Automatic Passkey User Upsert
- **Target Component**: `POST /api/listings`
- **Traceability**: `REQ-LST-003` | `SPEC-LST-001`
- **Preconditions**: Unregistered JoyID address connecting for the first time.
- **Expected Outcome**: Listing created, and new User record automatically provisioned in DB.

### `[IT-LST-004]` Catalog Query Listing
- **Target Component**: `GET /api/listings`
- **Traceability**: `REQ-LST-004` | `SPEC-LST-002`
- **Expected Outcome**: HTTP 200 OK returning array of active toy listings.

---

## 4. Fiber Network Payment Module (`PAY`)

### `[IT-PAY-001]` Fiber Lightning Invoice Creation
- **Target Component**: `fiberClient.createInvoice(amount, description)`
- **Traceability**: `REQ-PAY-001` | `SPEC-PAY-001`
- **Expected Outcome**: Returns lightning invoice with valid Bech32 address and `0x`-prefixed payment hash.

### `[IT-PAY-002]` Instant Lightning Payment Dispatch
- **Target Component**: `fiberClient.sendPayment(invoiceAddress)`
- **Traceability**: `REQ-PAY-002` | `SPEC-PAY-002`
- **Expected Outcome**: Returns payment status `"Success"` and cryptographic `preimage` proof.

### `[IT-PAY-003]` Fiber Node Health Monitoring
- **Target Component**: `fiberClient.checkHealth()`
- **Traceability**: `REQ-PAY-003` | `SPEC-PAY-003`
- **Expected Outcome**: Returns node reachability and channel availability boolean.

### `[IT-PAY-004]` Pre-Flight Route Viability Probe
- **Target Component**: `runPreflightProbe(invoiceAddress)`
- **Traceability**: `REQ-PAY-004` | `SPEC-PAY-004`
- **Expected Outcome**: Classifies channel route viability (`ROUTE_VIABLE` vs `ROUTE_BLOCKED`) and maps RPC liquidity errors.

---

## 5. UI Error Boundaries & Render Safety (`UI`)

### `[UT-UI-001]` Error Boundary State Derivation
- **Target Component**: `ErrorBoundary.getDerivedStateFromError(error)`
- **Traceability**: `REQ-UI-001`
- **Expected Outcome**: Returns state with `hasError: true` and captured error instance.

### `[UT-UI-002]` Healthy Child Component Rendering
- **Target Component**: `ErrorBoundary.render()`
- **Traceability**: `REQ-UI-001`
- **Expected Outcome**: Passthrough rendering of child React nodes when no error occurred.

### `[UT-UI-003]` Fallback UI Exception Display
- **Target Component**: `ErrorBoundary.render()`
- **Traceability**: `REQ-UI-002`
- **Expected Outcome**: Renders `.error-boundary-container` warning card when child throws an unhandled exception.

### `[UT-UI-004]` Custom Fallback Element Injection
- **Target Component**: `ErrorBoundary.render()` with `fallback` prop
- **Traceability**: `REQ-UI-002`
- **Expected Outcome**: Renders developer-provided custom React element instead of default card.
