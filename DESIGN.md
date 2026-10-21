# Design system — ProposAI

## Product
Proposal writing and delivery software for trade contractors. The public website explains the document workflow; the application supports drafting, reviewing, exporting, sending, and tracking proposals.

## Direction
Restrained editorial. Minimal decoration, document-led composition, asymmetric marketing layout and disciplined application grid. The user approved this direction on 2026-10-08.

## Typography
- Display: Instrument Serif, regular; Georgia fallback. Marketing headings 48–80px, section headings 36–48px; app page headings 32–40px.
- Body/UI: DM Sans, 400–700; system sans fallback. Body 16px, controls 14px, metadata 12px.
- Data: DM Sans with tabular numerals. System monospace only for document references.
- Load from Google Fonts with display=swap. Chinese uses system CJK fonts.

## Color
- Paper: #f7f5ef; white document/card surface: #fffefa.
- Ink: #202a24; muted text: #626b63; rule: #dcded5.
- Forest: #244c3a; pale green: #e9eee6; secondary paper: #efede5.
- Success #2d684a; warning #906328; error #ac3f39; information #426574.
- Dark mode: deep green-neutral surfaces, lighter desaturated green actions, off-white text.

## Spacing and layout
4px base. Marketing section spacing 80–112px, max width 1200px. Workspace sidebar 232px, content max width 1200px, forms 680–800px. Two-column composition becomes one column below 900px. Account split becomes one column below 800px. Content must fit 375px widths.

## Components
4–6px corners for controls and panels; pills only for status. 44px primary touch targets. Thin borders, quiet backgrounds, no gradient buttons, floating badges, decorative glows, or colored icon circles. Document shadow only where it expresses an actual sheet of paper. Clearly labeled examples; no fabricated testimonials or outcome metrics.

## Motion/accessibility
150ms color transitions, no ornamental movement. Respect reduced motion. Visible keyboard focus, real buttons for disclosures, proper labels, named icon controls, and document landmarks. Keep all existing product actions and validation.

## Decision log
2026-10-08: User chose restrained editorial; hybrid layout keeps character in marketing and density in the workspace. Editorial reference: [Proposify](https://www.proposify.com/) and [Better Proposals](https://betterproposals.io/) show the importance of a visible proposal output and document workflow. ProposAI uses its own typography, palette, composition, and copy.
