# SafeNest 🛡️

A privacy-first proof-of-concept that detects grooming patterns through local behavioral metadata analysis — never reading message content — and enables anonymous reporting with zero identity exposure.

---

## Built For
- Hackathon: FOSSASIA HACKATHON
- Theme: Security and Privacy by Design for Young Users
- License: MIT

## Team
- Team Name: Please
- Member 1: Kaung Hset Hein
- Member 2: Wunna Moe San
- Member 3: Htoo Myat Naing
- Member 4: Kyi Phyu Thiri Khaing
- Member 5: Felice Christiara Median Putri

---

## The Problem
Current safety tools often surveil the same children they are supposed to protect. Systems that rely on content scanning create privacy backdoors and normalize over-collection of sensitive communication data. Safety and privacy are frequently treated as a tradeoff, and this project is built on the opposite assumption: behavior-level protection without message-content surveillance.

---

## Our Approach
SafeNest performs local behavioral scoring in the browser using only metadata signals implemented in `anomalyScorer.js`: social proximity (`inContacts` and `sharedGroups`), account age, late-night activity ratio (`22:00-04:00`), and week-over-week message escalation. For reporting, the frontend requests a one-time token from `/request-token` and uses it to submit `/submit-report`; this is a token-gated anonymized submission flow, not a full cryptographic blind-signature implementation. Parent alerts are consent-based UI events sent via `BroadcastChannel` (`contactName`, `riskScore`, `reasons`, and `type`) rather than server-pushed monitoring. Message text is rendered in the chat UI demo, but scoring logic does not parse or score content keywords.

---

## How It Works
1. Teen opens app: the chat view loads immediately in current code (no separate one-time consent screen is implemented).
2. Chat loads with contacts and the scorer runs locally in browser memory (`scoreAll(simulationData)`).
3. Safe contacts show no anomaly banner.
4. Medium risk shows a soft yellow warning banner with dismiss action.
5. High risk shows a red warning banner with behavioral reasons and report option.
6. Teen reports: client requests token (`/request-token`), submits report (`/submit-report`), and success view shows identity fields as null in the local receipt card.
7. Teen dismisses high risk: parent alert is triggered via `BroadcastChannel("safenest-parent")`.
8. Parent chooses actions in dashboard: `Tell Me More`, `Dismiss This Alert` (ignore), or `Ask My Child First`.
9. `Ask My Child First` posts `parent-check-in` over `BroadcastChannel("safenest-teen")`, opening the teen check-in modal.

---

## Privacy Model

| What SafeNest protects | How |
|---|---|
| Message content | Never read for scoring — anomaly logic uses metadata signals only |
| Platform identity | Report payload excludes personal identity fields; token-gated submission reduces direct user linkage in app-level data |
| Parent seeing messages | Parent alert includes risk summary fields (`contactName`, `riskScore`, `reasons`) and does not transmit chat transcripts |
| On-device processing | Scorer executes entirely in browser memory (`anomalyScorer.js`) |

| What requires additional protection | Why |
|---|---|
| Network IP address | Requires VPN — SafeNest operates at application layer only |

For full network anonymity, SafeNest is designed to be used alongside a VPN such as ExpressVPN.

---

## Key Design Decisions
- No keyword scanning: the earlier keyword list was removed and scoring now relies only on metadata signals to avoid content-level surveillance.
- No database: backend stores reports and tokens in memory (`reports` array and `validTokens` set), so data is ephemeral per server process.
- No silent parental surveillance: parent visibility is event-triggered from teen-side actions (dismiss/report), not continuous background syncing.
- `socialProximity` over `mutualFriends`: the model now derives trust context from `inContacts` + `sharedGroups` for platform-adaptive proximity signals.
- `BroadcastChannel` for parent alerts: teen and parent views communicate locally in-browser without a relay server in the middle.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo tooling | pnpm workspaces |
| Frontend runtime | React, React DOM, React Router DOM |
| Frontend build/dev | Vite, @vitejs/plugin-react |
| Frontend styling | Tailwind CSS, PostCSS, Autoprefixer |
| Backend runtime | Node.js, Express, CORS |
| Root dev tooling | concurrently, kill-port |

---

## Project Structure

```text
safenest/
├── packages/
│   ├── frontend/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── tailwind.config.js
│   │   ├── vite.config.js
│   │   └── src/
│   │       ├── App.jsx
│   │       ├── ChatApp.jsx
│   │       ├── ParentDashboard.jsx
│   │       ├── anomalyScorer.js
│   │       ├── index.css
│   │       ├── main.jsx
│   │       ├── simulationData.js
│   │       └── components/
│   │           ├── AnomalyBanner.jsx
│   │           ├── ContactGraph.jsx
│   │           ├── ReportFlow.jsx
│   │           └── VPNComparison.jsx
│   └── backend/
│       ├── package.json
│       ├── server.js
│       └── src/
│           └── index.js
└── README.md
```

---

## Setup Instructions

Requirements: Node.js 18+, pnpm

```bash
# Clone
git clone [repo-url]
cd safenest

# Install
pnpm install

# Run
pnpm dev
```

```bash
# Individual packages (scripts exist)
pnpm --filter @safenest/frontend dev
pnpm --filter @safenest/backend dev
```

Routes:
- `/` Teen chat view
- `/parent` Parent dashboard
- `/graph` Contact risk graph
- `/privacy` VPN comparison

---

## Known Limitations & Production Roadmap
- Scoring thresholds are heuristic and manually tuned, not trained on labeled datasets.
- `socialProximity` depends on platform-available context (`inContacts`, `sharedGroups`) and may vary by integration depth.
- Network IP is not protected at application layer; VPN/proxy infrastructure is required for network-level anonymity.
- Current flow is session-local (in-memory alerts/reports), with no persistent cross-session history.
- Production hardening would need labeled data pipelines, per-user baselines, stronger anonymity protocols, and platform API integrations.

---

## Scoring Logic

| Signal | Condition | Points |
|---|---|---|
| Social proximity | `!inContacts && sharedGroups === 0` | +30 |
| Social proximity | `!inContacts && sharedGroups <= 1` | +10 |
| Social proximity | `inContacts && sharedGroups >= 4` | -30 |
| Social proximity | `inContacts && sharedGroups >= 2` | -25 |
| Social proximity | `inContacts` (fallback branch) | -15 |
| Account age | `< 30 days` | +25 |
| Account age | `30-90 days` | +10 |
| Account age | `> 365 days` | -25 |
| Late-night ratio (`22:00-04:00`) | `>= 0.60` | +20 |
| Late-night ratio (`22:00-04:00`) | `>= 0.40` | +15 |
| Late-night ratio (`22:00-04:00`) | `>= 0.25` | +8 |
| Week-over-week escalation | `maxEscalationRate >= 1.0` | +20 |
| Week-over-week escalation | `maxEscalationRate >= 0.5` | +12 |
| Week-over-week escalation | `maxEscalationRate >= 0.25` | +6 |

Thresholds used in code:
- `high`: `score >= 61`
- `medium`: `score >= 31`
- `safe`: `score <= 30`

---

## Demo Data

| Name | Risk Level | Key Signals |
|---|---|---|
| Sarah Chen | Safe | In contacts, high shared groups, old account, low late-night pattern |
| Marcus Williams | Safe | In contacts, moderate shared groups, old account, low late-night pattern |
| Coach_Dave | Medium | Not in contacts, low shared groups, newer account window, notable late-night activity |
| Unknown43 | High | Unknown contact, zero shared groups, very new account, high late-night concentration, rising cadence |
| GamerPro99 | High | Unknown contact, zero shared groups, newer account, substantial late-night concentration, upward cadence |

---

## Open Source
This project is MIT licensed and open for contributions.