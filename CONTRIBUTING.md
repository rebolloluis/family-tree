# Contributing

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- A [Supabase](https://supabase.com/) project (for auth, DB, and storage)

## Local setup

```bash
git clone https://github.com/rebolloluis/family-tree.git
cd family-tree
pnpm install
```

Copy the example env file and fill in your Supabase credentials:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Then start the dev server:

```bash
pnpm dev
```

## Project structure

```
apps/web/          Next.js app (App Router, TypeScript, Tailwind)
packages/shared/   Shared TypeScript types used across apps
supabase/          DB schema and migrations
```

## Database

Run any pending migrations against your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Workflow

1. Branch off `main`: `git checkout -b feat/your-feature`
2. Keep commits small and focused
3. Run `pnpm lint` before pushing
4. Open a pull request against `main` — describe what changed and why

## Code style

- TypeScript everywhere; avoid `any`
- Server components by default in Next.js; add `'use client'` only when needed
- Keep Supabase queries in server components or server actions — never expose service keys to the client
- New DB tables need RLS policies; add them to the relevant migration file
