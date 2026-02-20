# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collaborative family tree web app. Users can sign up, create family trees, add members with photos, and share them publicly. Built as a pnpm monorepo targeting web first, with mobile planned via React Native (Expo).

**Live app:** https://family-tree-chi-three.vercel.app/

## Stack

- **Web app** (`apps/web/`): Next.js 16, App Router, TypeScript, Tailwind CSS 4
- **Backend**: Supabase — Postgres, Auth (email/password), Storage, Real-time subscriptions
- **Shared types** (`packages/shared/`): `@family-tree/shared` workspace package
- **Deployment**: Vercel (auto-deploys from `main`)

## Monorepo structure

```
apps/web/          Next.js web app
packages/shared/   Shared TypeScript types (Member, Family, Profile)
supabase/          DB schema and migrations
```

Root `package.json` scripts delegate to `apps/web` via `--filter`.

## apps/web — key files

### Routing (`src/app/`)

| Route | Description |
|---|---|
| `/` | Homepage — hero + public families grid |
| `/auth/login` | Login |
| `/auth/signup` | Signup |
| `/auth/callback` | Supabase OAuth/email confirmation callback |
| `/dashboard` | Protected — user's families, create new tree |
| `/tree/[id]` | Family tree viewer/editor |
| `/profile` | Edit display name and avatar |

### Components (`src/components/`)

- `nav.tsx` — Server component; shows avatar → `/profile`, My trees, Sign out when logged in
- `tree-canvas.tsx` — Main interactive client component: renders generation rows, SVG connector lines (cubic bezier via `getBoundingClientRect`), real-time sync via `postgres_changes`
- `member-modal.tsx` — Add/edit/delete modal; uploads photos to Supabase Storage
- `auth-form.tsx` — Login/signup form; redirects to `/dashboard` on success
- `create-family-form.tsx` — Create family, redirects to `/tree/[id]`
- `profile-form.tsx` — Edit name + avatar; uploads to `avatars/` bucket
- `sign-out-button.tsx` — Client component for sign out

### Supabase clients (`src/lib/supabase/`)

- `client.ts` — Browser client (`createBrowserClient`)
- `server.ts` — Server client (`createServerClient` + cookies)
- `storage.ts` — `uploadFile(bucket, path, file)` helper

### Other

- `src/proxy.ts` — Session refresh on every request (Next.js 16 uses `proxy` export, not `middleware`)

## Database

Three tables with RLS enabled: `profiles`, `families`, `members`.

Migrations live in `supabase/migrations/`. To apply:

```bash
supabase link --project-ref <ref>
supabase db push
```

Storage buckets: `member-photos` (per-family member photos), `avatars` (user profile photos).

## Key behaviors

- `buildGens()` in `tree-canvas.tsx` groups members into generation arrays by walking `parent_id` links (roots have `parent_id: null`)
- Deleting a member recursively deletes all descendants
- Real-time sync uses `supabase.channel().on('postgres_changes', ...)` filtered by `family_id`
- Tree layout is CSS flexbox rows — no graph algorithm; children appear under their parent's generation row

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Development

```bash
pnpm install
pnpm dev        # starts apps/web at localhost:3000
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow, code style, and deployment guidelines.
