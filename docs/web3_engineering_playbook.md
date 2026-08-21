# 🛡️ Web3 & Full-Stack Engineering Playbook: Lessons from ToyTrade

> A practical guide for developers building decentralized consumer applications on **Nervos CKB**, **JoyID Passkeys**, **Fiber Network L2**, and modern serverless stacks.

---

## 🌟 1. Web3 UX & Biometric Passkey Authentication (JoyID)

### 💡 The Problem: Seed Phrase Friction
Traditional Web3 onboarding asks users to write down 12 to 24 mnemonic seed phrases. Over 80% of non-crypto users drop off before ever making their first transaction.

### 🔑 Best Practice: Passkey & Account Abstraction
1. **Zero-Seed-Phrase Onboarding**:
   - Use **JoyID** (WebAuthn / Passkeys) to allow users to log in with Touch ID, Face ID, or Windows Hello.
   - JoyID uses Secp256r1 signatures directly validated on CKB smart contracts, turning the user's secure enclave into an on-chain hardware wallet.
2. **On-the-Fly Database Auto-Upsert**:
   - In traditional web apps, a user must sign up *before* doing anything. In Web3, a user connects their wallet and expects to act immediately.
   - **Pattern**: When a user submits an action (e.g. creating a listing), your API should automatically verify the passkey signature and auto-create the database user record if it doesn't already exist.

```typescript
// Pattern: Auto-upsert user on cryptographic action
if (!user && body.joyIdAddress) {
  user = await prisma.user.upsert({
    where: { joyIdAddress: body.joyIdAddress },
    update: {},
    create: {
      joyIdAddress: body.joyIdAddress,
      displayName: body.displayName || `Trader ${body.joyIdAddress.slice(-4)}`,
      region: normalizedRegion,
    },
  });
}
```

---

## ⚡ 2. Layer 2 Payment Channels & Fallback Strategies (Fiber Network)

### 💡 The Problem: Blockchain Confirmations vs. Real-World Meetups
Waiting 10–30 seconds for a Layer 1 blockchain block during an in-person toy handover is awkward. If a user is offline or a payment node is unreachable, the trade could freeze.

### 🚀 Best Practice: Sub-Second L2 + Resilient L1 Fallback
1. **Instant L2 Invoices (Fiber Network / Lightning)**:
   - For in-person meetups, use **Fiber Network (FNN)** to generate dynamic invoice QR codes that settle off-chain in under 500ms with zero gas fees.
2. **Graceful Fallback Mode**:
   - If the Fiber daemon or channel is temporarily offline, never show a raw error. Automatically switch to a **Standard Handover Token (Layer 1 Escrow)** with clear, friendly user messaging.

---

## 🏎️ 3. Performance & Web3 Caching Strategies

### 💡 The Problem: N+1 API Flooding & Slow External Oracles
Querying live crypto prices (e.g., CKB/GBP or CKB/VND) or blockchain nodes per-component triggers dozens of simultaneous HTTP requests, leading to rate limiting and 500ms+ page lag.

### ⚡ Best Practice: Three-Tier Caching Architecture

```
[ Client Component ]  ──(1. Check Memory Cache: <1ms)──> Instant Render
        │ (Cache Miss)
        ▼
[ Edge CDN Cache ]    ──(2. Vercel Edge Cache: <15ms)───> Return Cached JSON
        │ (TTL Expired)
        ▼
[ Serverless API ]    ──(3. Node In-Memory Cache: 60s)─> CoinGecko / RPC
```

1. **Client-Level Deduplication**:
   - Cache rates in a shared module variable or React Context so 20 toy cards share **1 single request** instead of making 20 calls.
2. **Server-Side In-Memory TTL (60s)**:
   - Cache third-party oracle/API responses in Node.js memory to prevent hitting rate limits:
   ```typescript
   const priceCache: Record<string, { rate: number; timestamp: number }> = {};
   if (cached && Date.now() - cached.timestamp < 60000) return cached.rate;
   ```
3. **Edge CDN Headers**:
   - Return `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` to let Vercel Edge network serve cached responses globally in ~15ms.

---

## 🗄️ 4. Serverless Databases vs. Ephemeral File Systems

### 💡 The Problem: Wiped SQLite Databases in Serverless (Vercel)
Vercel Lambdas are stateless and ephemeral. Any local SQLite file written to `/tmp` or the project root gets wiped whenever a new commit is deployed or containers cold-start.

### ☁️ Best Practice: Cloud SQLite (Turso / LibSQL)
1. **Serverless SQLite (LibSQL)**:
   - Use **Turso** for SQLite syntax with cloud replication, zero cold-starts, and persistent storage.
2. **Environment Variable Hygiene**:
   - Never wrap environment variables in unnecessary quotes (`""`) in Vercel settings, as Vercel interprets them as literal string characters (causing HTTP 400 invalid token errors).
   - Write defensive token sanitizers in code:
   ```typescript
   const authToken = process.env.TURSO_AUTH_TOKEN?.replace(/^["']|["']$/g, "").trim();
   ```

---

## 🛡️ 5. Automated Testing & Database Safety Protocol

### 💡 The Problem: Accidental Production Data Deletion
Running `npm test` when Prisma points to your live cloud database can execute `deleteMany()` and wipe all real user listings!

### 🔒 Best Practice: Environment-Isolated Test Databases
1. **Dedicated Test Database**:
   - Create a separate `toytrade-test` database on Turso.
2. **Automatic Route Interception**:
   - When `NODE_ENV === 'test'`, automatically intercept the database connection in `prisma.ts`:
   ```typescript
   if (process.env.NODE_ENV === "test" && process.env.TEST_DATABASE_URL) {
     return {
       url: process.env.TEST_DATABASE_URL,
       authToken: process.env.TEST_TURSO_AUTH_TOKEN,
     };
   }
   ```
3. **Defensive Input Normalization**:
   - Never blindly typecast inputs (`body.condition as ToyCondition`). Always provide defensive fallback dictionaries to handle legacy client caches or international variations (`VN` $\rightarrow$ `VIETNAM`, `USED` $\rightarrow$ `GOOD`).

---

## 📜 6. CKB Cell Model vs. EVM Account Model (Mental Model Shift)

### 💡 The Problem: Trying to Code CKB Like Ethereum
In EVM (Ethereum / Polygon), smart contracts are monolithic accounts holding balances and global storage variables in contract storage. In **Nervos CKB (UTXO / Cell Model)**, state and assets are stored in **first-class Cells** owned directly by the user or locked by scripts.

### 🧩 Best Practice: Cell Design Thinking
1. **Capacity Rule ($1\text{ CKB} = 1\text{ Byte}$)**:
   - Every Cell on CKB must hold enough CKBytes (`capacity`) to store its own data, type script, and lock script bytes.
   - When a trade completes or an escrow cell is spent, the locked CKB capacity is unlocked and returned to the recipient.
2. **Lock Script vs. Type Script**:
   - **Lock Script**: Answers *"Who has permission to spend/unlock this cell?"* (e.g., JoyID Secp256r1 lock, dual-confirmation escrow lock).
   - **Type Script**: Answers *"What rules govern how this cell transforms?"* (e.g., Spore DOB minting, supply limits, token rules).
3. **Escrow Dual-Confirmation Pattern**:
   - Instead of trusting a centralized escrow middleman, an on-chain lock script can require **either**:
     - *Path A*: Signatures from **both** Buyer AND Seller to release funds to the seller.
     - *Path B*: Signature from the Buyer **after** a 7-day timeout block timestamp to refund unfulfilled trades.

---

## 🧸 7. Digital Object Passports (Spore DOB Protocol)

### 💡 The Problem: Disconnected Real-World Assets (RWA)
Used physical items (like toys) have real histories (condition changes, previous owners, verified safety checks) that get lost between owners.

### 📜 Best Practice: Immutable On-Chain Digital Passports
1. **Spore Protocol for Zero-Fee Holding**:
   - Spore DOBs store their media and metadata directly in on-chain cell data (backed by CKB capacity). Unlike ERC-721 where metadata lives on centralized IPFS/web servers, Spore DOBs are truly permanent on the blockchain.
2. **Transferrable Timeline Logs**:
   - When a toy is traded via meetup or shipping, the Spore DOB outpoint is transferred to the buyer's JoyID address, and an immutable history record (`PassportLog`) is appended.

---

## 🔢 8. Web3 Full-Stack Gotchas: BigInt Serialization & Browser Origins

### 💡 The Problem 1: `TypeError: Do not know how to serialize a BigInt`
CKB amounts are measured in **Shannons** ($1\text{ CKB} = 10^8\text{ Shannons}$), requiring JavaScript `BigInt` or database `u64`. However, `JSON.stringify()` throws a runtime crash when encountering a `BigInt` in API response objects.

### 🔧 Fix:
Always serialize `BigInt` fields to string before returning JSON responses:
```typescript
const responseData = {
  ...trade,
  priceCkb: trade.priceCkb.toString(), // Convert BigInt to string
};
return NextResponse.json(responseData);
```

### 💡 The Problem 2: JoyID Origin Binding & Broken Asset URLs
JoyID passkey authentication is cryptographically bound to the browser's current `window.location.origin`. 
- If you hardcode URLs (e.g. `logo: "https://toytrade.vercel.app/logo.png"`), local dev (`localhost:3000`) or preview deployments will trigger origin mismatches and browser popup blocker errors.
- **Fix**: Always dynamically derive `origin` from `window.location.origin` or pass relative paths.

---

## 📜 Summary Checklist for Future Web3 Projects

- [ ] **Auth**: JoyID / Passkey biometrics with on-the-fly user creation.
- [ ] **Cell Model**: Design for first-class state ($1\text{ CKB} = 1\text{ Byte}$ capacity rule).
- [ ] **Payments**: Layer 2 (Fiber) for instant speed + Layer 1 smart contracts for escrow security.
- [ ] **RWA / Passports**: Spore DOBs for on-chain provenance and verified condition history.
- [ ] **Performance**: 3-tier caching (Client state $\rightarrow$ Edge CDN $\rightarrow$ Server memory TTL).
- [ ] **Database**: Dedicated Cloud LibSQL (Turso) for production + dedicated test database for Jest.
- [ ] **Serialization**: Explicit `.toString()` conversions for all `BigInt` token amounts.
- [ ] **Validation**: Defensive enum mapping and sanitizers on every API route.

