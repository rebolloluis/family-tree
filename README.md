# Family Tree

A collaborative family tree web app — build and share your family history together.

**[Live app →](https://family-tree-chi-three.vercel.app/)**

## Features

- Sign up and create your own family tree
- Add members with name, birth/death years, relation, note, and photo
- Parent–child relationships visualized with connector lines
- Public browsing — anyone can view family trees without an account
- Real-time sync — changes appear instantly across devices
- Photo uploads per member via cloud storage

## Stack

- **Web**: Next.js 16 (App Router, TypeScript, Tailwind)
- **Backend**: Supabase (Postgres, Auth, Storage, Real-time)
- **Monorepo**: pnpm workspaces (`apps/web`, `packages/shared`)

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
