# Requirements Traceability Matrix (RTM): Escrow & QR Handover

**Document ID**: `RTM-ESC`  
**Module**: Escrow, Dual-Lock On-Chain Contracts, and In-Person QR Handover  
**SDLC Phase**: Traceability (V-Model Integration)

---

## 1. Traceability Mapping Matrix

| Requirement ID (RD) | Architecture ID (AD) | Unit Design ID (UD) | Unit Test ID (UT) | Integration Test ID (IT) | Verification Status |
|---|---|---|---|---|---|
| `REQ-ESC-001` (Escrow Initiation) | `ARCH-ESC-001` (FSM `PENDING` -> `ESCROWED`) | `SPEC-ESC-001` (`POST /api/trades`) | - | `[IT-ESC-001]` (Trade creation & deposit lock) | **PASS** |
| `REQ-ESC-002` (Prevent Self-Escrow) | `ARCH-ESC-001` (Auth Matrix) | `SPEC-ESC-001` (Validation `buyer !== seller`) | - | `[IT-ESC-004]` (Reject seller self-trade) | **PASS** |
| `REQ-ESC-003` (QR Token Generation) | `ARCH-ESC-002` (Ephemeral Token Engine) | `SPEC-ESC-002` (`GET /api/trades/:id/qr`) | - | `[IT-ESC-002]` (15m validity & token generation) | **PASS** |
| `REQ-ESC-004` (Buyer QR Handover Release) | `ARCH-ESC-002` (Atomic QR Handover) | `SPEC-ESC-003` (`POST /api/trades/:id/qr`) | - | `[IT-ESC-003]` (Valid token releases escrow & marks sold) | **PASS** |
| `REQ-ESC-005` (Unauthorized Rejection) | `ARCH-ESC-002` (Security Boundary) | `SPEC-ESC-003` (Buyer check & 403 response) | - | `[IT-ESC-004]` (Reject unauthorized third-party scanner) | **PASS** |
| `REQ-ESC-006` (7-Day Timeout Sweep) | `ARCH-ESC-001` (FSM `ESCROWED` -> `REFUNDED`) | `SPEC-ESC-004` (`POST /api/trades/expire`) | - | `[IT-ESC-005]` (Sweep trades past 7-day cutoff) | **PASS** |
| `REQ-ESC-001` / `004` (On-Chain Dual Lock) | `ARCH-ESC-003` (CKB `escrow-lock`) | `SPEC-ESC-005` (`escrow-lock` binary) | `[UT-ESC-001]` (Dual confirmation release path) | - | **PASS** |
| `REQ-ESC-006` (On-Chain Timeout Refund) | `ARCH-ESC-003` (CKB `escrow-lock`) | `SPEC-ESC-005` (Timeout reclamation path) | `[UT-ESC-002]` (Timeout claim execution) | - | **PASS** |
| `REQ-ESC-006` (Reject Premature Refund) | `ARCH-ESC-003` (CKB `escrow-lock`) | `SPEC-ESC-005` (Since check < timeout) | `[UT-ESC-003]` (Reject premature refund attempt) | - | **PASS** |
| `REQ-ESC-005` (On-Chain Third-Party Theft Rejection) | `ARCH-ESC-003` (CKB `escrow-lock`) | `SPEC-ESC-005` (Missing buyer/seller signatures) | `[UT-ESC-004]` (Reject unauthorized unlock) | - | **PASS** |

---

## 2. Test Execution Cross-Reference

### Unit Tests (`tests/unit/escrow_lock.test.ts`)
- `[UT-ESC-001]`: `Success path 1: Dual Confirmation (Both buyer and seller locks executed)`
- `[UT-ESC-002]`: `Success path 2: Timeout Refund (Buyer claims refund after timeout)`
- `[UT-ESC-003]`: `Failure path 1: Premature Refund (Buyer attempts refund before timeout)`
- `[UT-ESC-004]`: `Failure path 2: Unauthorized Unlock (Neither dual sign nor timeout satisfied)`

### Integration Tests (`tests/integration/trades_escrow.test.ts`)
- `[IT-ESC-001]`: `POST /api/trades - Should create trade in PENDING/ESCROWED status`
- `[IT-ESC-002]`: `GET /api/trades/:id/qr - Should generate ephemeral 15-minute handover token`
- `[IT-ESC-003]`: `POST /api/trades/:id/qr - Should settle trade and transfer toy upon valid buyer scan`
- `[IT-ESC-004]`: `Security Validation - Should reject self-trades and unauthorized buyer claims`
- `[IT-ESC-005]`: `POST /api/trades/expire - Should sweep trades past 7-day timeout and revert listing`
