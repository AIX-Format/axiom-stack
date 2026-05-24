<div align="center">
  <img src="./apps/axiomid/public/axiomid-banner.png" alt="Axiom Sovereign Stack" width="100%" />
</div>

<div align="center">

[![AIX Stack](https://img.shields.io/badge/AXIOM%20STACK-Echo369-FFD700?style=for-the-badge&labelColor=050505)](./docs/aix-format/AXIOM.md)
[![Spec](https://img.shields.io/badge/SPEC-AIX%2F1.0-FFD700?style=for-the-badge&labelColor=050505)](./docs/aix-format/AXIOM.md)
[![License](https://img.shields.io/badge/LICENSE-Proprietary-FFD700?style=for-the-badge&labelColor=050505)](./LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Next.js_16_|_Prisma_|_Pi_SDK-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)

</div>

<div align="center">

**Axiom Sovereign Stack** &nbsp;·&nbsp; Monorepo for Identity, Pi-KYC, Agent Skills & Docs

</div>

---

## 🧬 What is axiom-stack?

**axiom-stack** is the unified monorepo for the Axiom ecosystem. It merges:

| Source | Destination | Role |
|--------|-------------|------|
| `axiomid-project` | `apps/axiomid/` | L0 Root Authority — Pi KYC, identity, wallet, XP tiers |
| `aix-format` | `packages/@axiom/*/` | L1 Protocol — agent passport, AIX schema, parser, payment router |
| `docs/aix-format/` | `docs/` | Constitution, rules, governance, versioning |

### The Stack

| Layer | Package | Role |
|:-----:|---------|------|
| 👑 L0 | `apps/axiomid` | Root Authority · Human Authorization Protocol · Pi Network KYC |
| 🟢 L1 | `@axiom/pi` | Pi SDK adapter + KYC verification |
| 🟢 L1 | `@axiom/parser` | AIX manifest parser + canonicalization |
| 🟢 L1 | `@axiom/schema` | AIX JSON schema (zero deps) |
| 🟢 L1 | `@axiom/payment` | Agent payment router (Stripe optional) |
| ⚪ L2 | `apps/iqra` *(planned)* | Sovereign AI OS — memory + soul engine |
| ⚪ L3 | `skills/` *(planned)* | Agent skills marketplace |

---

## 🏛️ Architecture

```
axiom-stack/
├── apps/
│   └── axiomid/          # Next.js 16 · Prisma · Pi SDK
│       ├── src/app/      # Routes: /, /dashboard, /privacy, /terms
│       ├── src/app/api/  # API: auth/*, pi/*, agent/*, user/*
│       └── src/lib/      # Pi SDK, wallet, tiers, prisma client
├── packages/
│   └── @axiom/
│       ├── pi/           # Pi KYC adapter (Ed25519 + DID)
│       ├── parser/       # AIX parser + validation engine
│       ├── schema/       # aix.schema.json
│       └── payment/      # Agent payment router
├── docs/
│   └── aix-format/       # AXIOM.md, Constitution, Rules, Governance
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 9.15+

### Install & Run

```bash
# 1. Clone
git clone https://github.com/AIX-Format/axiom-stack.git
cd axiom-stack

# 2. Install dependencies (from root)
pnpm install

# 3. Set up environment
cp apps/axiomid/.env.example apps/axiomid/.env.local
# Edit apps/axiomid/.env.local with your keys

# 4. Initialize database
cd apps/axiomid && npx prisma db push && cd ../..

# 5. Run (from root)
pnpm --filter=axiomid dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build --filter=axiomid
```

---

## 🔐 Pi SDK Integration

The Pi Network SDK v2 is integrated at two levels:

### Client-side (`apps/axiomid/src/lib/`)
- `pi-sdk.ts` — Loads Pi SDK from CDN, patches postMessage for sandbox, calls `Pi.init()`
- `pi-wallet.ts` — `connectPiWallet()` + `createPiPayment()` using v2 object API
- `wallet-context.tsx` — React context for Pi auth with auto-connect in Pi Browser

### Server-side (`apps/axiomid/src/app/api/`)
- `POST /api/auth/pi` — Verifies Pi access token via `/v2/me`, creates/updates user
- `POST /api/pi/payment/approve` — Approves payment via Pi Platform API
- `POST /api/pi/payment/complete` — Completes payment + awards XP

### Environment Variables
See `apps/axiomid/.env.example` for the full list:
- `PI_API_KEY` — Server-side key for payment verification
- `PI_WALLET_PRIVATE_SEED` — Stellar seed for server-side transactions (optional)
- `NEXT_PUBLIC_PI_SANDBOX` — `true` for sandbox, `false` for mainnet

---

## 🗺️ Roadmap

| Phase | What | Status |
|-------|------|--------|
| 1 | Merge axiomid-project → `apps/axiomid/` | ✅ Done |
| 2 | Restructure aix-format → `packages/@axiom/*/` | ✅ Done |
| 3 | Merge IQRA → `apps/iqra/` + `packages/@axiom/memory/` | 🔜 Next |
| 4 | Agent skills → `skills/` | 📋 Planned |
| 5 | Ghost.build DB migration | 📋 Planned |

---

## 🤝 Credits

Built by **Mohamed Abdelaziz** with AI collaborators across the stack.

---

## 📄 License

Proprietary — All Rights Reserved © 2026 Mohamed Abdelaziz.

See [`LICENSE`](./LICENSE) for full terms.

---

<div align="center">
  <strong>"Identity is an Asset, not a Biometric."</strong>
</div>
