# ToyTrade SDLC Engineering Guide: V-Model Framework

This guide defines the standardized Software Development Life Cycle (SDLC) for the ToyTrade platform. To guarantee stability, auditability, and production readiness across both Web2 application layers and Web3 on-chain smart contracts, ToyTrade adopts the **V-Model**.

---

## 1. Overview of the V-Model

The V-Model establishes direct bidirectional verification and validation between design phases (left wing) and testing phases (right wing), with Coding/Development at the vertex.

```
RD (Requirements Definition) ────────────────────────────────── IT (Integration Testing)
   \                                                               /
    AD (Architectural Design) ────────────────────────── IT (Integration Testing)
       \                                                   /
        UD (Unit / Detailed Design) ────────────── UT (Unit Testing)
               \                                   /
                CD (Coding & Development Phase) ───
```

### Phase Definitions

| Phase | Acronym | Full Name | Primary Objective | Output Artifact | Verification Partner |
|---|---|---|---|---|---|
| **Phase 1** | **RD** | Requirements Definition | Define user, business, and regulatory needs. State WHAT the system must do without implementation bias. | `docs/sdlc/<module>/RD.md` | **IT** (Integration / Acceptance Tests) |
| **Phase 2** | **AD** | Architectural Design | Define high-level system structure, multi-tier boundaries, data flow, component interactions, and state machines. | `docs/sdlc/<module>/AD.md` | **IT** (Integration Tests & Security Audits) |
| **Phase 3** | **UD** | Unit / Detailed Design | Specify low-level specifications: API payloads, error codes, database schemas, and on-chain lock script binary contracts. | `docs/sdlc/<module>/UD.md` | **UT** (Unit Tests & Script Verifier) |
| **Phase 4** | **CD** | Coding & Development | Implement source code adhering strictly to the UD specifications. | `src/`, `contracts/` | Continuous Linting & Build Verification |
| **Phase 5** | **UT** | Unit Testing | Verify that individual functions, route handlers, and lock scripts satisfy the exact conditions specified in UD. | `tests/unit/*.test.ts` | Validates **UD** |
| **Phase 6** | **IT** | Integration Testing | Verify that combined modules, database state transitions, and on-chain settlements satisfy AD and RD. | `tests/integration/*.test.ts` | Validates **AD & RD** |

---

## 2. Traceability Identification Taxonomy

Every artifact, requirement, and test case must carry a standardized identifier formatted according to the following syntax:

`[TYPE]-[MODULE]-[INDEX]`

### Identifier Prefixes

- `REQ-<MOD>-<NUM>`: Requirement item in RD.
- `ARCH-<MOD>-<NUM>`: Architecture/Subsystem component or state definition in AD.
- `SPEC-<MOD>-<NUM>`: Unit specification, route handler schema, or contract function in UD.
- `UT-<MOD>-<NUM>`: Automated unit test case in UT.
- `IT-<MOD>-<NUM>`: Automated integration test case in IT.

### Domain Module Codes (`<MOD>`)

- `ESC`: Escrow, Dual-Lock Contracts, and In-Person QR Handover.
- `LST`: Toy Listings, Visual AI Condition Scoring, and Catalog Search.
- `CHT`: End-to-End P2P Encrypted Chat and Negotiation Channels.
- `PAS`: Spore DOB Toy Passports and On-Chain Provenance Logs.
- `USR`: JoyID Passkey Authentication, Session Management, and Profiles.
- `PAY`: Fiber Network Lightning Payments and CKB L1 Fallback Transfers.

---

## 3. Mandatory Engineering Rules

### Rule 1: Bidirectional Traceability
No line of production business logic or smart contract script may exist without a corresponding `SPEC` (in UD) and `REQ` (in RD). Every test in `tests/unit/` or `tests/integration/` must explicitly tag its test title with `[UT-...]` or `[IT-...]`.

### Rule 2: Web3 Resource & Capacity Cost Transparency
Web3 systems consume finite resources on-chain (CKB cell storage capacity, Shannon fee rates, Fiber channel liquidity). Every RD and AD document must explicitly address:
1. **Who pays**: Buyer, Seller, or Platform Treasury.
2. **How much**: Quantitative CKB capacity (e.g. 61 CKB base cell, 142 CKB Spore DOB).
3. **Capacity Reclamation**: Exact conditions and mechanisms for unlocking and refunding capacity.

### Rule 3: Client/Server Boundary Enforcement
- **Frontend / Client Layer**: Responsible solely for UI presentation, collecting user parameters, triggering JoyID passkey signatures, and presenting responses.
- **Backend Route Handlers**: Must cryptographically verify signatures, validate database constraints, authorize user roles, and interact with the CKB blockchain or Fiber daemon.

---

## 4. Directory Structure Standards

SDLC documents are version-controlled alongside application code in `docs/sdlc/`:

```
Toy_trading_platform/
├── docs/
│   └── sdlc/
│       ├── SDLC_GUIDE.md               <-- This framework guide
│       ├── escrow/                     <-- Escrow & QR Handover Pilot
│       │   ├── RD.md                   <-- Requirements Definition
│       │   ├── AD.md                   <-- Architectural Design
│       │   ├── UD.md                   <-- Unit / Detailed Design
│       │   └── RTM.md                  <-- Requirements Traceability Matrix
│       ├── listings/                   <-- Future module
│       ├── chat/                       <-- Future module
│       └── passport/                   <-- Future module
└── tests/
    ├── unit/                           <-- UD verification tests [UT-...]
    │   └── escrow_lock.test.ts
    └── integration/                    <-- AD & RD verification tests [IT-...]
        └── trades_escrow.test.ts
```
