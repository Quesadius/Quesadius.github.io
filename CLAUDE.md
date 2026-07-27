# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This repo is the source for the `Quesadius.github.io` GitHub Pages site. Each `*.html` file at the repo root is an **independent, single-file web app** — all CSS, JS, and markup inline, with libraries pulled from CDNs at runtime. There is no build step, no bundler, no package manager, and no test suite. Editing `foo.html` and pushing to `main` publishes `foo.html`.

`index.html` is intentionally a placeholder ("Hello World") — the apps are reached by direct URL (e.g. `/cribbage.html`).

## Running locally

A static file server is required (so ES module imports and `fetch` work). The configured launch (`.claude/launch.json`) runs:

```
python3 -m http.server 8765
```

Then open `http://localhost:8765/<page>.html`. Any equivalent static server (e.g. `npx serve`) is fine — there is nothing to compile.

## Apps and their stacks

| File | What it is | Notable runtime deps (CDN) | Persistence |
| --- | --- | --- | --- |
| `cribbage.html` | Two-player cribbage with animated SVG board, peg pop-ups, hand breakdowns | Tailwind, Firebase (app/auth/firestore) | Firestore + `localStorage` (player name) |
| `tictactoe.html` | Multiplayer tic-tac-toe with shareable game IDs | Tailwind, Firebase | Firestore |
| `trash.html` | Multiplayer Trash/Garbage card game | Tailwind, Firebase | Firestore |
| `highpoints.html` | US state high-points tracker, choropleth map | Tailwind, D3 v7, TopoJSON v3, Google Fonts | none (in-memory) |
| `nationalparks.html` | National Park visit tracker on a map | Leaflet 1.9.4 | none |
| `lostcities.html` | Scorecard for the Lost Cities card game | (vanilla CSS/JS) | none |
| `accordion.html` | Single-player Accordion solitaire | (vanilla CSS/JS) | `localStorage` (options) |
| `cribsolv.html` | Cribbage discard solver/trainer: ranks all 15 discards by exact EV, explains why, quiz mode | none — fully self-contained, no CDN | `localStorage` (quiz preference) |
| `mahjong.html` | Two-player American-style mahjong with an original hand set | Tailwind, Firebase, Wikimedia tile SVGs | Firestore + `localStorage` (player name) |
| `words.html` | Two-player crossword game with full Scrabble rules (board, values, 100-tile bag, +50 bingo, live scoring, blanks, swaps) | Tailwind, Firebase, TWL06 Scrabble word list (jsDelivr → raw GitHub fallback) | Firestore + `localStorage` (player name, mute) |

## cribsolv.html is generated — don't hand-edit it

Unlike every other app here, `cribsolv.html` is the **build artifact** of a Vite + React + TypeScript project at `~/Code/cribsolv` (its own directory, outside this repo). All JS/CSS is inlined at build time, including its web worker, so the deployed file still follows this repo's one-file rule. To change the app: edit the source project and run `npm run deploy` there — it rebuilds and re-copies `cribsolv.html` into this repo. Then commit and push here as usual.

## Shared Firebase project (important)

`tictactoe.html`, `trash.html`, `cribbage.html`, `mahjong.html`, and `words.html` all initialize Firebase using the **same** hardcoded `firebaseConfig` for project `tictactoe-76547` (apiKey `AIzaSyBhP0eTmmHB2LNh4nIaOZtTk7f1pBbPvgI`). They use anonymous auth and Firestore. Things to keep in mind when working on any of these:

- The apps share one Firebase project but use different Firestore collections/document layouts. When adding a new multiplayer app, decide whether to reuse this project or stand up a new one — don't accidentally collide collection names. The Firestore rules only permit the `artifacts/{projectId}/public/data/games` collection, so `cribbage.html`, `mahjong.html`, and `words.html` namespace their docs inside it with document-ID prefixes (`crib_`, `mj2_`, `words_`) and a `_kind` field.
- The config is committed on purpose (it's a public web client key). Firestore security rules in the Firebase console are the actual access control — code changes that assume new collection paths will silently fail writes until rules are updated there.
- Each app's module-level `<script type="module">` block both imports Firebase and defines all game logic. There is no shared JS file; if you change a Firestore call pattern in one app, the others are untouched.

## Editing conventions that aren't obvious from the code

- **Everything is inline.** Do not introduce external `.css` / `.js` files or a build step unless the user asks for it — the single-file model is intentional and makes each page independently deployable/copyable.
- **Tailwind is loaded via the Play CDN** (`https://cdn.tailwindcss.com`). Classes work directly in markup; there is no `tailwind.config.js` on disk — per-page customizations (e.g. `highpoints.html`'s `climbed` / `unclimbed` colors) are configured inline via `tailwind.config = { ... }` in a `<script>` block.
- **No TypeScript, no JSX.** Plain ES2020+ in `<script type="module">` blocks.
- Files are large (cribbage is ~2k lines, others 300–730). Prefer targeted `Edit`s with enough surrounding context to disambiguate — searching for a CSS class or function name usually locates the right span quickly.

## CI and deployment

Pushing to `main` triggers `.github/workflows/ci.yml`, and **GitHub Pages deploys from that workflow** (not from the branch): lint + smoke must pass before the site updates, so a broken push leaves the last good deploy serving. The deploy job stages `*.html` only — the CI tooling never ships.

- **Lint**: `npm run lint` — ESLint via `eslint-plugin-html` checks the JS inside each page's `<script>` blocks (`no-undef`, `no-unused-vars`, `no-redeclare`; correctness only, no style rules). `cribsolv.html` is excluded (minified build artifact). Page-level CDN globals (`d3`, `L`, `tailwind`, …) are declared in `eslint.config.mjs`.
- **Smoke**: `npm test` — Playwright loads every page from a local static server and fails on any uncaught exception or `console.error`, plus a per-page readiness assertion (e.g. words.html must reach "TWL06 ✓", highpoints must draw >40 state paths). Read-only by design: it never creates games, so CI writes nothing to Firestore. `tests/global-setup.mjs` generates the gitignored `dummy_climb_data.csv` fixture that highpoints.html fetches on localhost.
- **Weekly CDN smoke** (`weekly-smoke.yml`): the same suite on a Monday cron. Notify-only — on failure it files a `cdn-smoke` issue instead of blocking anything. This is the detector for CDN deps rotting with no code change.

The `package.json` / `node_modules` are **dev-only tooling** — an intentional, bounded exception to the "no package manager" rule. No page may ever reference anything from npm at runtime; every page stays a self-contained HTML file. Run `npm ci` once locally, then `npm run lint` and `npm test` before pushing (the smoke suite reuses a dev server already running on port 8765).

There is no staging environment; to preview a change, run the local server above.
