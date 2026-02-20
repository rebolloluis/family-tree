# Roadmap

A collaborative family tree app — free, cross-platform, and visually alive.

---

## Vision

A shared space where families can build and explore their history together. Anyone can browse; members log in to contribute. The visual centerpiece is a living tree that grows in shape and detail as the family expands — eldest members form the trunk, younger generations become branches and leaves.

---

## Platforms & Priority

1. **Web** (current focus)
2. **iOS**
3. **Android**

Goal: maximize shared code and data across all three with minimal rework.

---

## Features by Phase

### Phase 1 — Web Foundation
- [x] Define and finalize stack (frontend framework, backend, auth, DB)
- [x] Migrate single-file app to modular project structure
- [x] Authentication (sign up / log in / log out)
- [x] User profiles (display name + avatar photo)
- [x] Family tree data model: members, relationships, ownership
- [x] Public browsing — homepage with public family trees
- [x] Private editing — only logged-in members can add/edit
- [x] Real-time sync across devices/users (Supabase `postgres_changes`)
- [x] Photo uploads per member (Supabase Storage)
- [x] Deploy to production (Vercel)
- [x] Link user profile to a member node in their own tree

### Phase 2 — Living Tree Visualization
- [ ] Replace current connector-line layout with an illustrated, organic tree
- [ ] Trunk = eldest generation; branches/leaves = younger generations
- [ ] Animations: new member added → sprout/seed grows in; tree reshapes as family expands
- [ ] Earthly color palette (bark, moss, amber, leaf tones)
- [ ] Smooth transitions and micro-interactions

### Phase 3 — iOS
- [ ] Evaluate shared codebase strategy (see Stack section)
- [ ] Native feel: gestures, haptics, navigation patterns
- [ ] App Store submission

### Phase 4 — Android
- [ ] Port/adapt from iOS
- [ ] Play Store submission

---

## Stack

- **Web**: Next.js (App Router) — SSR for public tree pages (SEO), client components for interactive editing
- **Mobile**: React Native via Expo — shares TypeScript types, Supabase client, and business logic with web
- **Backend**: Supabase — Postgres DB, auth (email + OAuth), file storage for photos, real-time subscriptions
- **Language**: TypeScript throughout
- **Monorepo**: single repo with `apps/web`, `apps/mobile`, `packages/shared` (types, Supabase client, tree logic)

---

## Design Direction
- Earthly palette: bark browns, moss greens, warm ambers, cream
- Organic, hand-drawn-feeling tree as the main canvas
- Animations tied to family growth (sprout → sapling → full tree)
- Clean, minimal UI chrome so the tree is the star

---

## Out of Scope (for now)
- Monetization
- GEDCOM import/export
- DNA / ancestry integrations
