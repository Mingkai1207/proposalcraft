# ProposAI redesign

## Direction
The user selected restrained editorial on 2026-10-08. Warm paper, dark ink, forest green, a distinctive serif for display text, and a practical sans serif for controls. ProposAI should feel like a professional proposal workspace for trade contractors.

## Audit
The current site mixes an orange SaaS landing page, glowing dark account forms, and separately styled workspace pages. Repeated badges, floating notifications, aggressive sales copy, icon cards, and model promotion distract from the actual document. Dashboard navigation disappears on other workspace pages. The demo simulates generation but presents itself as live.

## Execution
1. Establish tokens, fonts, shared brand, header/footer, account shell, and responsive workspace navigation.
2. Rebuild the homepage around a clearly labeled sample HVAC proposal, straightforward workflow, useful feature explanations, launch pricing, and accessible FAQs. Preserve sample PDF access and CTA analytics; remove unverified performance claims and simulated live-generation claims.
3. Rebuild pricing as a readable comparison while retaining the launch offer and existing entry routes.
4. Apply the account shell to sign-in, registration, verification, and password recovery. Keep existing validation, return paths, and authentication behavior.
5. Use persistent workspace navigation for dashboard, guided proposal creation, template creation, import, editor/detail, and settings. Keep actions and data behavior; simplify surface styling and empty/loading states.
6. Bring client portal, payment states, legal pages, and error states into the same visual system without changing legal text or transaction behavior.
7. Verify TypeScript, existing server tests, production build, desktop/mobile layouts, both languages, account validation, wizard progress, navigation, and representative workspace states. Use isolated local fixture data for visual checks, never production customer data.
8. Publish after verification and confirm the live pages.

## Design tradeoffs
Serif headings give the public site character but remain limited in the data-heavy app. Forest green becomes a meaningful action color; semantic status colors remain distinct. Tighter corners and horizontal rules replace decorative shadows. Public pages are spacious, workspace forms remain efficient.

## Completion criteria
Every routed page uses the shared system; mobile navigation works; sample content is labeled; existing APIs and customer data remain intact; checks pass; production renders the new design.
