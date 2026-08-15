#!/bin/bash
FILE="/Users/nghiadang/CKB/Toy_trading_platform/toytrade_pitch.pptx"

# Initialize clean presentation deck overwrite
officecli create "$FILE" --force

# ==============================================================================
# 1. Slide 1: Cover (Signature ToyTrade Dark + Neon Mint / Cyan Green)
# ==============================================================================
echo "Adding Slide 1..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[1] --type shape --prop geometry=rect --prop x=2cm --prop y=3.2cm --prop w=29.87cm --prop h=3.8cm --prop fill=none --prop text="ToyTrade" --prop font=Inter --prop size=64pt --prop font.color=FFFFFF --prop bold=true
officecli add "$FILE" /slide[1] --type shape --prop geometry=rect --prop x=2.1cm --prop y=7.4cm --prop w=29.87cm --prop h=2cm --prop fill=none --prop text="Secure, Provenance-Tracked Kids' Toy Exchange on Nervos CKB" --prop font=Segoe UI --prop size=22pt --prop font.color=60EFFF

officecli add "$FILE" /slide[1] --type shape --prop geometry=roundRect --prop x=2.1cm --prop y=10.2cm --prop w=15.5cm --prop h=2cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[1] --type shape --prop geometry=rect --prop x=2.5cm --prop y=10.6cm --prop w=14.5cm --prop h=1.3cm --prop fill=none --prop text="Protected by CKB Dual-Lock Escrow & Fiber Network" --prop font=Segoe UI --prop size=15pt --prop font.color=00FF87 --prop bold=true

officecli add "$FILE" /slide[1] --type shape --prop geometry=rect --prop x=2.1cm --prop y=14.5cm --prop w=20cm --prop h=2cm --prop fill=none --prop text="A Blockchain-Powered Sustainable Alternative to Buying New\nAugust 2026" --prop font=Segoe UI --prop size=14pt --prop font.color=94A3B8

# ==============================================================================
# 2. Slide 2: The Core Problem & Solution
# ==============================================================================
echo "Adding Slide 2..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[2] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.27cm --prop w=30.87cm --prop h=1.5cm --prop fill=none --prop text="Why Parents Need ToyTrade" --prop font=Inter --prop size=36pt --prop font.color=FFFFFF --prop bold=true

# Card Left: The Problem
officecli add "$FILE" /slide[2] --type shape --prop geometry=roundRect --prop x=1.5cm --prop y=3.5cm --prop w=14.5cm --prop h=13cm --prop fill=141A20 --prop line.color=332024
officecli add "$FILE" /slide[2] --type shape --prop geometry=rect --prop x=2.5cm --prop y=4.5cm --prop w=12.5cm --prop h=1.5cm --prop fill=none --prop text="The Problem in Second-Hand Trading" --prop font=Inter --prop size=22pt --prop font.color=FF4757 --prop bold=true
officecli add "$FILE" /slide[2] --type shape --prop geometry=rect --prop x=2.5cm --prop y=6.3cm --prop w=12.5cm --prop h=8.8cm --prop fill=none --prop text="• Rapid Outgrowth: Kids outgrow toys quickly, causing recurring financial waste for families.\n\n• High Counterfeit & Broken Toy Risk: Used marketplaces lack verifiable condition history and safety recall audits.\n\n• Zero Transactional Trust: Meetups and peer payments suffer from fake bank slips, ghosting, and payment disputes." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Card Right: The CKB Solution
officecli add "$FILE" /slide[2] --type shape --prop geometry=roundRect --prop x=17.5cm --prop y=3.5cm --prop w=14.5cm --prop h=13cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[2] --type shape --prop geometry=rect --prop x=18.5cm --prop y=4.5cm --prop w=12.5cm --prop h=1.5cm --prop fill=none --prop text="The CKB Architecture Solution" --prop font=Inter --prop size=22pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[2] --type shape --prop geometry=rect --prop x=18.5cm --prop y=6.3cm --prop w=12.5cm --prop h=8.8cm --prop fill=none --prop text="• Dual-Lock Cell Escrow: CKB smart contracts hold settlement funds trustlessly until both parties confirm delivery.\n\n• Spore DOB Toy Passport: On-chain digital object tracks toy condition history, owner reviews, and provenance.\n\n• JoyID Passkey Biometrics: Parents login and sign with device fingerprint/FaceID without seed phrase friction." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# ==============================================================================
# 3. Slide 3: How CKB Protects Both Buyer & Seller
# ==============================================================================
echo "Adding Slide 3 (Dual-Sided CKB Protection)..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[3] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.0cm --prop w=30.87cm --prop h=1.4cm --prop fill=none --prop text="How CKB Protects Both Buyer and Seller" --prop font=Inter --prop size=34pt --prop font.color=FFFFFF --prop bold=true

# Card 1: Buyer Protection
officecli add "$FILE" /slide[3] --type shape --prop geometry=roundRect --prop x=1.5cm --prop y=2.8cm --prop w=14.5cm --prop h=14.8cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[3] --type shape --prop geometry=roundRect --prop x=2.2cm --prop y=3.4cm --prop w=13.1cm --prop h=1.1cm --prop fill=00FF87 --prop line.color=none
officecli add "$FILE" /slide[3] --type shape --prop geometry=rect --prop x=2.5cm --prop y=3.55cm --prop w=12.5cm --prop h=0.8cm --prop fill=none --prop text="How CKB Protects the BUYER" --prop font=Inter --prop size=16pt --prop font.color=0A0A0A --prop bold=true

officecli add "$FILE" /slide[3] --type shape --prop geometry=rect --prop x=2.3cm --prop y=4.8cm --prop w=12.9cm --prop h=12.2cm --prop fill=none --prop text="1. Funds Locked in Smart Contract: Money stays safely in the CKB Escrow Cell until the buyer confirms physical handover.\n\n2. In-Person Inspection First: Buyer inspects the physical toy at meetup before scanning the QR code to release payment.\n\n3. 7-Day Auto-Timeout Refund: If the seller ghosts or fails to deliver, buyer independently reclaims 100% of their locked CKB.\n\n4. Verified Spore DOB Passport: Guarantees authentic ownership history and past parent rating scores." --prop font=Segoe UI --prop size=13.5pt --prop font.color=E2E8F0

# Card 2: Seller Protection
officecli add "$FILE" /slide[3] --type shape --prop geometry=roundRect --prop x=17.5cm --prop y=2.8cm --prop w=14.5cm --prop h=14.8cm --prop fill=141A20 --prop line.color=60EFFF
officecli add "$FILE" /slide[3] --type shape --prop geometry=roundRect --prop x=18.2cm --prop y=3.4cm --prop w=13.1cm --prop h=1.1cm --prop fill=60EFFF --prop line.color=none
officecli add "$FILE" /slide[3] --type shape --prop geometry=rect --prop x=18.5cm --prop y=3.55cm --prop w=12.5cm --prop h=0.8cm --prop fill=none --prop text="How CKB Protects the SELLER" --prop font=Inter --prop size=16pt --prop font.color=0A0A0A --prop bold=true

officecli add "$FILE" /slide[3] --type shape --prop geometry=rect --prop x=18.3cm --prop y=4.8cm --prop w=12.9cm --prop h=12.2cm --prop fill=none --prop text="1. Guaranteed Solvency Before Meetup: Seller only travels after CKB deposit is verified on-chain. Zero fake payment slips.\n\n2. Zero Chargeback Scams (Non-Repudiation): Once settled via Fiber preimage or dual-sign, payment is final and irreversible.\n\n3. Instant Handover Settlement: QR scan triggers sub-second release of funds directly to the seller's JoyID wallet.\n\n4. Immutable Seller Reputation: Completed trades record permanent on-chain ratings that protect honest sellers." --prop font=Segoe UI --prop size=13.5pt --prop font.color=E2E8F0

# ==============================================================================
# 4. Slide 4: Three-Price Market Integrity
# ==============================================================================
echo "Adding Slide 4..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.27cm --prop w=30.87cm --prop h=1.5cm --prop fill=none --prop text="Three-Price Market Integrity" --prop font=Inter --prop size=36pt --prop font.color=FFFFFF --prop bold=true

# Card 1: Seller Price
officecli add "$FILE" /slide[4] --type shape --prop geometry=roundRect --prop x=1.5cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=222D37
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=2.5cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="① Seller's Price" --prop font=Inter --prop size=22pt --prop font.color=60EFFF --prop bold=true
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=2.5cm --prop y=7.5cm --prop w=7.5cm --prop h=6cm --prop fill=none --prop text="Set directly by parents in their local currency (£ GBP / ₫ VND).\n\nMaintains a familiar, friendly fiat shopping experience for non-crypto parents." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Card 2: Market Reference
officecli add "$FILE" /slide[4] --type shape --prop geometry=roundRect --prop x=12.0cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=222D37
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=13.0cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="② Market Reference" --prop font=Inter --prop size=22pt --prop font.color=FFC107 --prop bold=true
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=13.0cm --prop y=7.5cm --prop w=7.5cm --prop h=6cm --prop fill=none --prop text="Retrieved automatically via Google Lens visual shopping matches.\n\nProtects buyers against overpriced listings and helps sellers price fairly." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Card 3: CKB Live Rate
officecli add "$FILE" /slide[4] --type shape --prop geometry=roundRect --prop x=22.5cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=23.5cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="③ CKB Equivalent" --prop font=Inter --prop size=22pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[4] --type shape --prop geometry=rect --prop x=23.5cm --prop y=7.5cm --prop w=7.5cm --prop h=6cm --prop fill=none --prop text="Converted in real-time from live CoinGecko price feeds.\n\nLocked at trade initiation for on-chain escrow or Fiber invoice settlement." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# ==============================================================================
# 5. Slide 5: On-Chain Escrow & Spore DOB Flow
# ==============================================================================
echo "Adding Slide 5 (Escrow & DOB Lifecycle)..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.27cm --prop w=30.87cm --prop h=1.5cm --prop fill=none --prop text="End-to-End Trade Settlement Lifecycle" --prop font=Inter --prop size=36pt --prop font.color=FFFFFF --prop bold=true

# Step 1
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=1.5cm --prop y=4.0cm --prop w=5.5cm --prop h=1.5cm --prop fill=00FF87 --prop text="1. Lock Escrow" --prop font=Inter --prop size=16pt --prop font.color=0A0A0A --prop bold=true
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=7.5cm --prop y=4.0cm --prop w=24cm --prop h=1.5cm --prop fill=none --prop text="Buyer funds the trade; CKB is locked inside the 2-of-2 Escrow Lock Cell on Layer 1." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Step 2
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=1.5cm --prop y=6.8cm --prop w=5.5cm --prop h=1.5cm --prop fill=60EFFF --prop text="2. Meetup / Ship" --prop font=Inter --prop size=16pt --prop font.color=0A0A0A --prop bold=true
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=7.5cm --prop y=6.8cm --prop w=24cm --prop h=1.5cm --prop fill=none --prop text="Seller hands over physical toy at local meetup or dispatches tracked shipping package." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Step 3
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=1.5cm --prop y=9.6cm --prop w=5.5cm --prop h=1.5cm --prop fill=00FF87 --prop text="3. Dual Release" --prop font=Inter --prop size=16pt --prop font.color=0A0A0A --prop bold=true
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=7.5cm --prop y=9.6cm --prop w=24cm --prop h=1.5cm --prop fill=none --prop text="Buyer scans seller's QR code (or confirms online); CKB releases to seller & Spore DOB transfers to buyer." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Step 4
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=1.5cm --prop y=12.4cm --prop w=5.5cm --prop h=1.5cm --prop fill=FF4757 --prop text="Safeguard" --prop font=Inter --prop size=16pt --prop font.color=FFFFFF --prop bold=true
officecli add "$FILE" /slide[5] --type shape --prop geometry=rect --prop x=7.5cm --prop y=12.4cm --prop w=24cm --prop h=1.5cm --prop fill=none --prop text="7-day timelock allows buyer to reclaim 100% of locked funds if seller fails to deliver." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# ==============================================================================
# 6. Slide 6: Cryptographic API Security & Architecture
# ==============================================================================
echo "Adding Slide 6 (Security Architecture)..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.27cm --prop w=30.87cm --prop h=1.5cm --prop fill=none --prop text="Security Architecture & Cryptographic Auth" --prop font=Inter --prop size=34pt --prop font.color=FFFFFF --prop bold=true

# Card 1: CCC Cryptographic Verifier
officecli add "$FILE" /slide[6] --type shape --prop geometry=roundRect --prop x=1.5cm --prop y=3.5cm --prop w=9.5cm --prop h=13cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=2.2cm --prop y=4.2cm --prop w=8.1cm --prop h=1.5cm --prop fill=none --prop text="1. JoyID & CCC Auth" --prop font=Inter --prop size=20pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=2.2cm --prop y=6.0cm --prop w=8.1cm --prop h=10cm --prop fill=none --prop text="• Uses CKB Common Chain Connector (CCC) SDK.\n\n• Verifies WebAuthn passkey signatures on backend before accepting listings or chat messages.\n\n• Zero identity spoofing or unauthorized trade modifications." --prop font=Segoe UI --prop size=15pt --prop font.color=E2E8F0

# Card 2: 2-of-2 Escrow Script
officecli add "$FILE" /slide[6] --type shape --prop geometry=roundRect --prop x=12.0cm --prop y=3.5cm --prop w=9.5cm --prop h=13cm --prop fill=141A20 --prop line.color=60EFFF
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=12.7cm --prop y=4.2cm --prop w=8.1cm --prop h=1.5cm --prop fill=none --prop text="2. Smart Escrow" --prop font=Inter --prop size=20pt --prop font.color=60EFFF --prop bold=true
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=12.7cm --prop y=6.0cm --prop w=8.1cm --prop h=10cm --prop fill=none --prop text="• Custom Rust CKB lock script.\n\n• Requires cryptographic confirmation from both buyer and seller to unlock settlement cell.\n\n• Enforces absolute solvency on every active trade." --prop font=Segoe UI --prop size=15pt --prop font.color=E2E8F0

# Card 3: Spore DOB Protocol
officecli add "$FILE" /slide[6] --type shape --prop geometry=roundRect --prop x=22.5cm --prop y=3.5cm --prop w=9.5cm --prop h=13cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=23.2cm --prop y=4.2cm --prop w=8.1cm --prop h=1.5cm --prop fill=none --prop text="3. Toy Passport DOB" --prop font=Inter --prop size=20pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[6] --type shape --prop geometry=rect --prop x=23.2cm --prop y=6.0cm --prop w=8.1cm --prop h=10cm --prop fill=none --prop text="• Backed by genuine CKB cell capacity.\n\n• Holds immutable ownership timeline and parent reviews.\n\n• Can never be deleted, forged, or stolen off-chain." --prop font=Segoe UI --prop size=15pt --prop font.color=E2E8F0

# ==============================================================================
# 7. Slide 7: Roadmap & Vision
# ==============================================================================
echo "Adding Slide 7..."
officecli add "$FILE" / --type slide --prop layout="Blank" --prop background="#0A0E12"

officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=1.5cm --prop y=1.27cm --prop w=30.87cm --prop h=1.5cm --prop fill=none --prop text="ToyTrade Evolutionary Roadmap" --prop font=Inter --prop size=36pt --prop font.color=FFFFFF --prop bold=true

# Card v1
officecli add "$FILE" /slide[7] --type shape --prop geometry=roundRect --prop x=1.5cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=2.5cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="v1: CKB Escrow" --prop font=Inter --prop size=22pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=2.5cm --prop y=7.5cm --prop w=7.5cm --prop h=6.5cm --prop fill=none --prop text="Core platform featuring listings, custom escrow lock scripts, Toy Passport DOBs, user rating systems, and 3-price dynamic displays." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Card v2
officecli add "$FILE" /slide[7] --type shape --prop geometry=roundRect --prop x=12.0cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=60EFFF
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=13.0cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="v2: Fiber Network" --prop font=Inter --prop size=22pt --prop font.color=60EFFF --prop bold=true
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=13.0cm --prop y=7.5cm --prop w=7.5cm --prop h=6.5cm --prop fill=none --prop text="Default instant Fiber handover with automated Layer 1 Escrow fallback. Enables sub-second meetup settlement and micro-toy trades." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Card v3
officecli add "$FILE" /slide[7] --type shape --prop geometry=roundRect --prop x=22.5cm --prop y=4.5cm --prop w=9.5cm --prop h=10.5cm --prop fill=141A20 --prop line.color=00FF87
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=23.5cm --prop y=5.5cm --prop w=7.5cm --prop h=1.5cm --prop fill=none --prop text="v3: Bitcoin Swaps" --prop font=Inter --prop size=22pt --prop font.color=00FF87 --prop bold=true
officecli add "$FILE" /slide[7] --type shape --prop geometry=rect --prop x=23.5cm --prop y=7.5cm --prop w=7.5cm --prop h=6.5cm --prop fill=none --prop text="Leveraging cross-chain hubs to support native Bitcoin settlements as alternative trade settlement options." --prop font=Segoe UI --prop size=16pt --prop font.color=E2E8F0

# Speaker notes
echo "Adding speaker notes..."
officecli set "$FILE" /slide[1] --prop notes="Introduce ToyTrade as the blockchain solution to kids' toy waste. Highlight that it is a direct trade ecosystem settled securely on CKB."
officecli set "$FILE" /slide[2] --prop notes="Explain the core friction: kids outgrow toys but parents face high costs and lack local trust. Show how CKB solves this with lock scripts, DOBs, and JoyID."
officecli set "$FILE" /slide[3] --prop notes="Explain specifically how CKB protects BOTH sides: the Buyer is protected by cell escrow locks, inspection rights, and 7-day refund timers; the Seller is protected by guaranteed solvency, non-repudiation (no chargebacks), and instant QR payouts."
officecli set "$FILE" /slide[4] --prop notes="Detail the 3-price display system: seller's choice, automated visual Google Lens matches to protect against overpricing, and live CKB conversion."
officecli set "$FILE" /slide[5] --prop notes="Walk through the step-by-step transaction lifecycle: lock, deliver, confirm release, and the final timeout safety refund safeguard."
officecli set "$FILE" /slide[6] --prop notes="Explain the cryptographic authentication layer using CCC and JoyID passkeys, along with Rust smart contract escrow and Spore DOB permanence."
officecli set "$FILE" /slide[7] --prop notes="Outline our evolutionary roadmap from core v1 CKB escrow to instant Fiber payments with L1 fallback and cross-chain Bitcoin support."

# Save document
echo "Saving document..."
officecli save "$FILE"
officecli close "$FILE"

echo "Pitch deck updated successfully with consistent Dark/Green ToyTrade style!"
