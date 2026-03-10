# SafeNest

A privacy-first proof-of-concept that detects grooming patterns through local metadata analysis, enabling anonymous reporting with zero identity exposure.

## Hackathon

Built for [Hackathon Name] sponsored by ExpressVPN.
Theme: Security and Privacy by Design for Young Users.

## The Problem

Many online safety tools rely on continuous surveillance, reading private messages and collecting identity metadata to detect risk. This can protect users in some cases, but it also normalizes invasive monitoring and erodes trust between teens, parents, and platforms. Young users need protection that does not require giving up privacy by default.

## Our Approach

SafeNest scores risk locally on-device using behavioral metadata patterns instead of message-content surveillance. The system focuses on signals like account freshness, contact overlap, unusual timing, and escalation rate without exposing full chat content to a central service. When a user chooses to report, the flow uses anonymous, blind-signature-inspired tokenization so the server receives only report payloads with identity fields stripped to null. Parent awareness is consent-based and event-driven, designed to support check-ins without enabling silent background spying.

## Key Features

- Local anomaly detection (no content scanning)
- Anonymous reporting via blind signatures
- Consent-based parental alerts
- Zero identity metadata on server
- VPN-compatible by design

## Architecture

```text
Chat UI
   |
   v
Local Scorer
   |
   v
Anomaly Banner
   |
   v
Report Flow (tokenized / blind-signature style)
   |
   v
Backend (/submit-report -> NULL logs)
   |
   v
Parent Alert (consent-based)
```

## Setup Instructions

Requirements: Node.js 18+, pnpm

```bash
git clone [repo]
pnpm install
pnpm dev
```

Frontend: http://localhost:5173
Parent view: http://localhost:5173/parent
Backend: http://localhost:3000

## Tech Stack

- React + Vite + Tailwind CSS
- Node.js + Express
- BroadcastChannel API
- Web Crypto API (blind signatures)
- pnpm workspaces

## Privacy Design Decisions

- Scoring runs locally in the client so raw chat content does not need to be uploaded for analysis.
- Report ingestion is intentionally metadata-minimized (`identity`, `ip`, `sessionId`, `timestamp` stored as null).
- Demo backend uses in-memory storage (no database) to reduce persistence and limit accidental data retention.
- Parent alerting is explicit and bounded, avoiding silent continuous parental surveillance.

## License

MIT
