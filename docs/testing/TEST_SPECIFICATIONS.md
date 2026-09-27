# ToyTrade - Complete Test Specifications (Test Specs)

**Document Version**: 1.0  
**SDLC Framework**: V-Model Traceability Standard (`docs/sdlc/SDLC_GUIDE.md`)  
**Scope**: Unit Testing (UT) and Integration Testing (IT) across all active ToyTrade platform modules.

---

## Traceability Summary Table

| Module Code | Domain Feature Area | Specification Prefix | Test Files | Total Test Cases |
|---|---|---|---|---|
| **ESC** | Escrow, Dual-Lock & In-Person QR Handover | `UT-ESC-xxx`, `IT-ESC-xxx`, `IT-SEC-xxx` | `tests/unit/escrow_lock.test.ts`, `tests/escrow.test.ts`, `tests/integration/trades_escrow.test.ts`, `tests/api_comprehensive.test.ts` | 26 tests |
| **USR** | JoyID Passkey Auth & User Profiles | `IT-USR-xxx`, `UT-AUT-xxx` | `tests/api_comprehensive.test.ts`, `tests/auth.test.ts`, `tests/integration/user_profile_and_ratings.test.ts` | 7 tests |
| **LST** | Toy Listings, Reputation Metrics & Query | `IT-LST-xxx`, `IT-DAT-xxx` | `tests/api_comprehensive.test.ts`, `tests/api.test.ts`, `tests/integration/user_profile_and_ratings.test.ts` | 6 tests |
| **RAT** | Mutual Trade Ratings & Reviews | `IT-RAT-xxx` | `tests/integration/user_profile_and_ratings.test.ts` | 6 tests |
| **PAY** | Fiber Network Lightning Payments | `IT-PAY-xxx` | `tests/fiber.test.ts` | 5 tests |
| **PAS** | Spore DOB Toy Passports & Ownership Logs | `IT-PAS-xxx` | `tests/spore.test.ts`, `tests/api_comprehensive.test.ts` | 2 tests |
| **UI** | Client Error Boundary & Render Guard | `UT-UI-xxx` | `tests/errorBoundary.test.ts` | 4 tests |
| **REC** | Two-Tier Toy Safety Recall Engine (CPSC) | `UT-REC-xxx` | `tests/recall_checker.test.ts` | 5 tests |
| **TOTAL** | **Entire Test Suite Coverage** | | **11 Test Suites** | **61 Test Cases** |

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

### `[IT-ESC-007]` Buyer Rejection & Mutual Cancellation Request
- **Target Component**: `POST /api/trades/[id]/cancel`
- **Traceability**: `REQ-ESC-007` | `SPEC-ESC-006`
- **Input**: `action: "REQUEST_CANCEL"`, `actorType: "BUYER"`, `reason: "Damaged packaging"`.
- **Expected Outcome**: HTTP 200 OK with trade status transitioning to `CANCEL_REQUESTED`.

### `[IT-ESC-008]` Seller In-Hand Possession Confirmation & Escrow Refund
- **Target Component**: `POST /api/trades/[id]/cancel`
- **Traceability**: `REQ-ESC-007` | `SPEC-ESC-006`
- **Input**: `action: "CONFIRM_CANCEL"`, `actorType: "SELLER"`.
- **Expected Outcome**: HTTP 200 OK with trade status transitioning to `CANCELLED`, listing reverting to `ACTIVE`, and `PassportLog` entry created.

### `[IT-ESC-009]` Unauthorized Third-Party Cancellation Rejection
- **Target Component**: `POST /api/trades/[id]/cancel`
- **Traceability**: `REQ-ESC-007` | `SPEC-ESC-006`
- **Preconditions**: Caller address does not match buyer or seller.
- **Expected Outcome**: HTTP 403 Forbidden with error `"Unauthorized"`.

### `[IT-ESC-010]` Trade Confirmation Unauthorized Caller Rejection
- **Target Component**: `POST /api/trades/[id]/confirm`
- **Traceability**: `REQ-ESC-008` | CKB Development Guardrails
- **Preconditions**: Caller address does not match trade party.
- **Expected Outcome**: HTTP 403 Forbidden with error `"Unauthorized: Caller is not the trade buyer/seller"`.

### `[IT-ESC-011]` Trade Confirmation Authorized Caller Execution
- **Target Component**: `POST /api/trades/[id]/confirm`
- **Traceability**: `REQ-ESC-008` | CKB Development Guardrails
- **Input**: `actorType: "BUYER"`, `callerAddress: "<buyer_joyid_address>"`.
- **Expected Outcome**: HTTP 200 OK with `buyerConfirmed: true` and proper state advancement.

### `[IT-ESC-012]` On-Chain Escrow Live Cell & Capacity Verification
- **Target Component**: `POST /api/trades`
- **Traceability**: `REQ-ESC-009` | CKB Development Guardrails
- **Preconditions**: Client supplies spent or non-existent outpoint on CKB Testnet.
- **Expected Outcome**: HTTP 400 Bad Request with error stating escrow cell is not live or insufficient capacity.

### `[IT-SEC-001]` Self-Trade Rejection Guard (Security S3)
- **Target Component**: `POST /api/trades` (`tests/api_comprehensive.test.ts`)
- **Traceability**: `REQ-ESC-002`
- **Preconditions**: Buyer ID equals Seller ID.
- **Expected Outcome**: HTTP 400 Bad Request with error `"Sellers cannot initiate escrow trades on their own listings"`.

### `[IT-SEC-002]` Unauthorized QR Scanner Security Guard (Security S2 & S2b)
- **Target Component**: `POST /api/trades/[id]/qr` (`tests/api_comprehensive.test.ts`)
- **Traceability**: `REQ-ESC-005`
- **Preconditions**: Submitting scanner address that does not match the trade buyer.
- **Expected Outcome**: HTTP 403 Forbidden with error `"Caller address does not match the trade buyer"`.

### `[IT-SEC-003]` Auto-Expiration of 7-Day Inactive Escrow (Security S4)
- **Target Component**: `POST /api/trades/expire` (`tests/api_comprehensive.test.ts`)
- **Traceability**: `REQ-ESC-006`
- **Preconditions**: Trades older than 7 days in `ESCROW_FUNDED` state.
- **Expected Outcome**: Reverts listing status to `ACTIVE` and marks trade `EXPIRED`.

### `[UT-ESC-VAL]` Escrow Lock Native Script Validation Suite
- **Target Component**: `tests/escrow.test.ts`
- **Traceability**: `REQ-ESC-001`, `REQ-ESC-006` | `SPEC-ESC-005`
- **Coverage**:
  - Success path 1: Dual confirmation execution (both buyer and seller locks signed).
  - Success path 2: Timeout reclaim execution (timeout expired and buyer lock signed).
  - Failure path 1: Seller signs alone before timeout expiry (rejected).
  - Failure path 2: Buyer signs alone before timeout expiry (rejected).

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

### `[IT-USR-003]` User Profile Name & Region Update
- **Target Component**: `PATCH /api/users/profile`
- **Traceability**: `REQ-USR-003` | `SPEC-USR-002`
- **Input**: `joyIdAddress`, `displayName: "Alice Toy Boutique"`, `region: "VIETNAM"`.
- **Expected Outcome**:
  - HTTP 200 OK. Updates and persists new displayName and region in database.

### `[IT-USR-004]` Invalid Profile Name Validation
- **Target Component**: `PATCH /api/users/profile`
- **Traceability**: `REQ-USR-003` | `SPEC-USR-002`
- **Input**: `displayName: " "` (< 2 characters).
- **Expected Outcome**:
  - HTTP 400 Bad Request with error stating display name must be at least 2 characters.

### `[IT-USR-005]` First-Time Connected Wallet Profile Upsert
- **Target Component**: `PATCH /api/users/profile`
- **Traceability**: `REQ-USR-003` | `SPEC-USR-002`
- **Preconditions**: Wallet connecting for the first time without prior database registration.
- **Input**: `joyIdAddress`, `displayName: "Ghost Rider"`, `region: "UK"`.
- **Expected Outcome**:
  - HTTP 200 OK. Automatically provisions a new user record and sets profile details.

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

### `[IT-LST-006]` Seller Reputation Metrics Aggregation
- **Target Component**: `GET /api/listings`
- **Traceability**: `REQ-LST-006` | `SPEC-LST-003`
- **Expected Outcome**:
  - HTTP 200 OK. Computes and returns seller reputation profile on each listing:
  - `seller.rating` (average star rating rounded to 1 decimal place).
  - `seller.reviewCount` (number of verified ratings received).
  - `seller.completedTrades` (count of successfully completed trades as seller).

### `[IT-DAT-001]` Database Models & Schema Sanity
- **Target Component**: `tests/api.test.ts`
- **Traceability**: `REQ-DAT-001`
- **Expected Outcome**: Validates CRUD read/write schema sanity for User and Listing entities with JSON-serialized outpoint fields.

---

## 4. Mutual Trade Ratings & Reviews Module (`RAT`)

### `[IT-RAT-001]` Buyer Review & Rating Submission
- **Target Component**: `POST /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-001` | `SPEC-RAT-001`
- **Preconditions**: Trade is in `COMPLETED` status.
- **Input**: `callerAddress: buyerAddress`, `score: 5`, `comment: "Gundam in perfect condition, prompt handover!"`.
- **Expected Outcome**:
  - HTTP 201 Created. Rating persisted with `raterId = buyer.id` and `ratedUserId = seller.id`.

### `[IT-RAT-002]` Seller Mutual Review Submission
- **Target Component**: `POST /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-001` | `SPEC-RAT-001`
- **Preconditions**: Trade is in `COMPLETED` status.
- **Input**: `callerAddress: sellerAddress`, `score: 5`, `comment: "Great buyer, very polite and on time."`.
- **Expected Outcome**:
  - HTTP 201 Created. Rating persisted with `raterId = seller.id` and `ratedUserId = buyer.id`.

### `[IT-RAT-003]` Duplicate Review Prevention
- **Target Component**: `POST /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-002` | `SPEC-RAT-001`
- **Preconditions**: Caller has already submitted a review for this trade.
- **Expected Outcome**:
  - HTTP 400 Bad Request with error stating user has already submitted a rating for this trade.

### `[IT-RAT-004]` Unauthorized Counterparty Rejection
- **Target Component**: `POST /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-003` | `SPEC-RAT-001`
- **Preconditions**: Caller is an uninvolved third party (neither buyer nor seller).
- **Expected Outcome**:
  - HTTP 403 Forbidden with error stating caller is neither buyer nor seller.

### `[IT-RAT-005]` Incomplete Trade Review Rejection
- **Target Component**: `POST /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-004` | `SPEC-RAT-001`
- **Preconditions**: Trade status is `PENDING` or `ESCROW_FUNDED`.
- **Expected Outcome**:
  - HTTP 400 Bad Request with error stating reviews can only be submitted for COMPLETED trades.

### `[IT-RAT-006]` Trade Ratings Retrieval
- **Target Component**: `GET /api/trades/[id]/rate`
- **Traceability**: `REQ-RAT-005` | `SPEC-RAT-002`
- **Expected Outcome**:
  - HTTP 200 OK returning array of rating objects including rater and rated counterparty details.

---

## 5. Fiber Network Payment Module (`PAY`)

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

### `[IT-PAY-005]` Fiber Payment Caller Authorization
- **Target Component**: `POST /api/fiber/pay`
- **Traceability**: `REQ-PAY-005` | CKB Development Guardrails
- **Preconditions**: Request callerAddress does not match trade buyer JoyID address.
- **Expected Outcome**: HTTP 403 Forbidden blocking unauthorized outbound lightning liquidity dispatch.

---

## 6. UI Error Boundaries & Render Safety (`UI`)

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


---

## 7. Two-Tier Toy Safety Recall Engine (`REC`)

### `[UT-REC-001]` Tier 1: Instant Local Hazard Pattern Detection
- **Target Component**: `checkToySafety(title, description)`
- **Traceability**: `REQ-REC-001` | `SPEC-REC-001`
- **Input Data**: Known hazardous models (*Rock 'n Play*, *Magnetix*, *Aqua Dots*).
- **Expected Outcome**: Returns `isRecalled: true`, `severity: "HIGH"`, `source: "LOCAL_CATALOG"`, and specific regulatory recall reason.

### `[UT-REC-002]` Tier 1: Benign Toy Model Clean Verification
- **Target Component**: `checkToySafety(title, description)`
- **Traceability**: `REQ-REC-001` | `SPEC-REC-001`
- **Input Data**: Standard non-hazardous toy (e.g. *"LEGO Star Wars Millennium Falcon"*).
- **Expected Outcome**: Returns `isRecalled: false`, `severity: "SAFE"`, `source: "CLEAN"`, and `recallReason: null`.

### `[UT-REC-003]` Tier 2: Live US CPSC REST API Recall Detection
- **Target Component**: `checkToySafetyAsync(title, description)`
- **Traceability**: `REQ-REC-002` | `SPEC-REC-002`
- **Input Data**: Officially recalled toy (e.g. *"Fisher-Price Brunch & Go Stroller"*).
- **Expected Outcome**: 
  - Returns `isRecalled: true`, `severity: "HIGH"`, `source: "CPSC_GOV"`.
  - Populates `recallUrl` with official government link (`https://www.cpsc.gov/Recalls/...`).
  - Populates `hazard` with official regulatory explanation (e.g. choking hazard).

### `[UT-REC-004]` Tier 2: Live CPSC Safe Clearance for Non-Recalled Toys
- **Target Component**: `checkToySafetyAsync(title, description)`
- **Traceability**: `REQ-REC-002` | `SPEC-REC-002`
- **Input Data**: Safe product terms not present in CPSC recall records.
- **Expected Outcome**: Returns `isRecalled: false` and `severity: "SAFE"`.

### `[UT-REC-005]` In-Memory 24-Hour TTL Performance Caching
- **Target Component**: `checkToySafetyAsync(title, description)`
- **Traceability**: `REQ-REC-003` | `SPEC-REC-003`
- **Execution**: Issue identical search query twice consecutively.
- **Expected Outcome**: Second execution completes in under 5ms from in-memory cache without repeating outbound HTTP request.


---

## 8. Toy Passport & Spore DOB Module (`PAS`)

### `[IT-PAS-001]` Spore DOB Mint Transaction Skeleton Construction
- **Target Component**: `prepareMintToyPassport(sellerAddress, toyMetadata)` (`tests/spore.test.ts`)
- **Traceability**: `REQ-PAS-001` | `SPEC-PAS-001`
- **Expected Outcome**: Returns constructed CCC Transaction skeleton with Spore cell generated at output index 0.

### `[IT-PAS-002]` Trade Settlement Toy Passport Transfer
- **Target Component**: `POST /api/fiber/pay` & `POST /api/trades/[id]/qr` (`tests/api_comprehensive.test.ts`)
- **Traceability**: `REQ-PAS-002` | `SPEC-PAS-002`
- **Expected Outcome**: Creates immutable `PassportLog` entry recording ownership transfer to the buyer upon payment settlement.
