# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file, zero-dependency family tree web app (`family-tree.html`). No build step, no package manager, no server — open the file directly in a browser.

## Architecture

Everything lives in `family-tree.html` with three sections:

- **CSS** (`<style>`): CSS custom properties for the design system (colors, fonts). Two Google Fonts: DM Serif Display (headings/names) and DM Sans (body). Components: header, `.card` (member tile), `.tray` (bottom action bar on selection), `.modal`/`.overlay` (add/edit form).

- **HTML**: Static shell with `#tree-canvas` (contains `#svg-lines` SVG overlay + `#tree-root` where cards render), a fixed `.tray`, and a modal `.overlay`.

- **JavaScript** (inline `<script>`): Vanilla JS, no frameworks.
  - `members[]` — flat array of member objects: `{ id, parentId, name, born, died, relation, note, photo }`
  - `buildGens()` — groups members into generation rows by walking `parentId` links (roots have `parentId: null`)
  - `render()` — full re-render: clears DOM, calls `buildGens()`, creates `.gen-row` divs, then `requestAnimationFrame(drawLines)`
  - `drawLines()` — reads card positions via `getBoundingClientRect()` and draws cubic bezier SVG paths between parent/child cards
  - `persist()` — saves to `localStorage` key `ftree_v3` (also attempts `window.storage` for any host-injected storage API)
  - `load()` — on startup, tries `window.storage` → `localStorage` → falls back to hardcoded demo data

## Key Behaviors

- Deleting a member also recursively deletes all descendants (`desc()` in `del()`)
- Photos are stored as base64 data URLs in `localStorage` alongside other member data
- Clicking outside cards/tray/buttons deselects the current member
- The tree layout is purely CSS flexbox rows — no graph layout algorithm; children appear under their `parentId` owner's generation row
