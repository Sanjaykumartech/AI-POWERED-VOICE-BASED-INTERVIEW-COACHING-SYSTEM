# AI Interview Coach & Evaluator Platform

Production-ready full-stack SaaS platform for mock interviews, answer evaluation, resume-aware coaching, voice input, analytics, and long-term learning memory.

## Stack

- Next.js 14 + React + Tailwind CSS
- Express + TypeScript + MongoDB + Mongoose
- Zustand for frontend state
- JWT authentication
- OpenAI-compatible LLM integration hooks
- Google OAuth
- Resume extraction and voice transcription

## Workspace layout

```text
AI interview assistant/
├── app/      # Next.js frontend for Vercel
├── server/   # Express API for Render/Railway/Fly
├── shared/   # Shared TypeScript contracts
├── docs/     # Deployment, structure, API, prompts, report docs
├── vercel.json
├── render.yaml
└── package.json
```

See [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) for the expanded structure.

## Quick start

1. Copy `.env.example` to `.env` in the repo root and fill in secrets.
   Add your OpenAI-compatible provider values for `OPENAI_API_KEY` and `OPENAI_BASE_URL` if you are using a custom gateway.
2. Install dependencies:

```bash
npm install
```

3. Run the platform locally:

```bash
npm run dev
```

4. Production build:

```bash
npm run build
```

Frontend-only build for Vercel:

```bash
npm run build:web
```

Backend-only build:

```bash
npm run build:api
```

5. Seed demo MongoDB analytics data:

```bash
npm run seed:demo --workspace server
```

Demo login after seeding:

- Email: `demo@interviewcoach.ai`
- Password: `DemoPass123`

## Core modules

- `Auth Service`: registration, login, session identity
- `Interview Service`: mock sessions, resume, question orchestration
- `Evaluation Service`: AI scoring and coaching feedback
- `Analytics Service`: readiness score, heatmaps, topic trend analysis
- `Recommendation Engine`: weakness-based guidance and adaptive practice

## Deployment notes

- Frontend deploys from the repo root using `vercel.json`.
- Backend can deploy with `render.yaml` or equivalent Node service settings.
- MongoDB Atlas is recommended for production persistence.
- Use `docs/DEPLOYMENT.md` for exact environment variables and platform settings.
- Add rate limiting, email verification, and background queues for higher traffic environments.

## GitHub notes

- Commit source and config files only.
- Do not commit `.env`, OAuth client secret JSON files, `node_modules/`, `.next/`, or `dist/`.
- If a secret was pasted into chat or committed by mistake, rotate it before deployment.
