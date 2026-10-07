# Redesign verification — 2026-10-08

## Checks
- TypeScript: passes.
- Production build: passes. Initial JS entry decreased from 2,998.75 kB / 825.40 kB gzip to about 826 kB / 245 kB gzip with lazy workspace routes. Heavy editor/renderer chunks load on demand; build still reports large secondary chunks.
- 49 existing tests across five suites pass with local placeholder PayPal plan IDs for configuration-only tests. The full unconfigured run passes 47/55; three import tests need a database and three VectorEngine tests need external API configuration. No backend or payment behavior was changed.
- Browser audit covers all routed pages, including the default error route, account recovery/verification states, policy pages, pricing, client review, payment display, and every workspace route.
- Desktop 1280px; mobile 390px; editor and client portal retested at 375px after correcting overflowing controls.
- English/Chinese homepage and pricing, language persistence, mobile site menu and workspace drawer verified. Existing partially untranslated app copy remains as before.
- Sample walkthrough tabs support keyboard arrows. FAQ buttons expand correctly. Primary CTA and sample PDF routes remain available.
- Local fixture sign-in, required wizard validation, wizard progress and summary review verified. Editor loads asynchronous content, tracks changes, saves to the local fixture, and reloads the saved content correctly.
- Filled and empty dashboards checked. Empty accounts show creation/import/template choices without empty analytics.

## Limits
Authenticated visual checks use isolated local sample data outside the repository. They do not verify live SMTP delivery, live AI generation, transactions, or customer PDF exports. Existing PDF-export and native-auth unit tests pass. No customer records were changed for QA, and no new account or transaction was created.

## Artifacts
Design preview and screenshots: `/Users/mingkai/.gstack/projects/proposalcraft/designs/editorial-redesign-20261008/`. The local fixture server is outside the application and excluded from deployment. Original untracked docs, scripts, and tests were preserved.
