# safenest

Monorepo scaffold using **pnpm workspaces** with:

- `packages/frontend` → React + Vite + Tailwind CSS
- `packages/backend` → Node.js + Express

## Prerequisites

- Node.js 18+
- pnpm 10+

## Workspace Structure

```text
safenest/
├─ package.json
├─ pnpm-workspace.yaml
└─ packages/
   ├─ frontend/
   └─ backend/
```

## Install

From the repo root:

```bash
pnpm install:all
```

(Equivalent to `pnpm install`.)

## Development

Start both frontend and backend:

```bash
pnpm dev:up
```

Stop both services (kills ports `3000` and `5173`):

```bash
pnpm dev:down
```

## Ports

- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:3000`

## Backend Quick Check

After `pnpm dev:up`, verify backend is reachable:

- `http://localhost:3000/` → returns JSON status
- `http://localhost:3000/health` → returns health JSON

## Other Scripts

Run workspace package `dev` scripts in parallel (raw workspace mode):

```bash
pnpm dev
```

## Notes

- This is scaffold-only setup; no application/business logic is included yet.
