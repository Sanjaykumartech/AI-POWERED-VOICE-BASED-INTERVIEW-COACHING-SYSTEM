# Project Structure

```text
AI interview assistant/
├── app/                 # Next.js frontend deployed to Vercel
│   ├── src/app/         # App Router pages and layouts
│   ├── src/components/  # Reusable UI, dashboard, auth, interview components
│   ├── src/lib/         # API client, theme helpers, utilities
│   └── src/store/       # Zustand auth and interview state
├── server/              # Express API deployed to Render/Railway/Fly
│   └── src/
│       ├── controllers/ # HTTP request handlers
│       ├── middleware/  # Auth and error handling
│       ├── models/      # MongoDB/Mongoose schemas
│       ├── routes/      # REST route registration
│       └── services/    # Auth, AI, interview, analytics, OCR, voice logic
├── shared/              # Shared TypeScript contracts used by app and server
├── docs/                # Architecture, deployment, API, and report documents
├── vercel.json          # Frontend deployment config
├── render.yaml          # Backend deployment blueprint
├── package.json         # Root workspace scripts
└── .env.example         # Safe example environment variables
```

Generated folders such as `node_modules/`, `app/.next/`, `server/dist/`, and `shared/dist/` are ignored and should not be committed.
