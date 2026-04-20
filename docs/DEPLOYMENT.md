# Deployment Guide

This repository is organized as an npm workspace monorepo.

## Recommended Production Architecture

- Frontend: Vercel, using the root `vercel.json`
- Backend API: Render, Railway, Fly.io, or another Node service
- Database: MongoDB Atlas
- Files: no permanent file storage is required for v1 because resume/audio uploads are processed and discarded

## Frontend on Vercel

Deploy from the repository root.

Vercel settings:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build:web`
- Output directory: `app/.next`

Environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com/api
```

Google OAuth production setup:

- Authorized JavaScript origin: `https://your-vercel-domain.vercel.app`
- OAuth callback remains on the backend: `https://your-backend-domain.com/api/auth/google/callback`

## Backend on Render or Similar

The included `render.yaml` can be used as a Render blueprint.

Build command:

```bash
npm install && npm run build:api
```

Start command:

```bash
npm run start --workspace server
```

Required backend environment variables:

```env
API_PORT=4001
MONGODB_URI=your-mongodb-atlas-uri
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
SESSION_IDLE_TIMEOUT_MINUTES=30
OPENAI_API_KEY=your-openai-compatible-key
OPENAI_MODEL=gpt-4.1-nano
OPENAI_BASE_URL=https://your-openai-compatible-base-url.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-domain.com/api/auth/google/callback
APP_URL=https://your-vercel-domain.vercel.app
FRONTEND_URL=https://your-vercel-domain.vercel.app
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

## Local Development

```bash
npm install
npm run dev
```

Seed demo data:

```bash
npm run seed:demo --workspace server
```

## GitHub Checklist

- Commit source files only.
- Do not commit `.env`, Google client secret JSON files, `node_modules/`, `.next/`, or `dist/`.
- Rotate any secret that was pasted into chat or committed accidentally.
- Use `.env.example` as the safe reference for contributors.
