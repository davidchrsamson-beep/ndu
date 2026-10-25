# Ndu

Online storefronts for local vendors, a vendor-first main market, and (later) the chat-to-buy app — all on one Supabase backend.

Architecture and decisions: see the "Ndu Architecture Roadmap" doc.

## Folders
- `web/` — main market, vendor storefronts, vendor dashboard, admin (Next.js)
- `chat/` — chat-to-buy app (added in week 2)

## Run it locally
1. Install Node.js (LTS), Git and VS Code.
2. `cd web` then `npm install`
3. Copy `web/.env.example` to `web/.env.local` and fill in the keys from Supabase → Project Settings → API (ask an owner for access).
4. `npm run dev` and open http://localhost:3000

## Rules
- Never commit `.env.local` or paste keys anywhere.
- One branch and one pull request per change. `main` is always working.