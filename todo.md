# ProposalCraft AI - Project TODO

## Database & Backend
- [x] Database schema: proposals, contractor_profiles, subscriptions, email_tracking tables
- [x] tRPC router: AI proposal generation (invokeLLM)
- [x] tRPC router: proposal CRUD (list, get, create, delete)
- [x] tRPC router: contractor profile / custom branding (logo, business info, terms)
- [x] tRPC router: subscription management (plan, usage tracking)
- [x] tRPC router: email delivery (send proposal to client)
- [x] tRPC router: proposal open tracking (read receipts)
- [x] tRPC router: PDF generation (browser print-to-PDF)
- [x] Subscription plan enforcement (free: 3/mo, starter: 20/mo, pro: unlimited)
- [x] Owner notification on proposal viewed event

## Frontend - Landing Page
- [x] Hero section with value proposition and CTA
- [x] Features section (AI generation, PDF, email tracking)
- [x] Pricing section (Free / Starter $29 / Pro $59)
- [x] Testimonials / social proof section
- [x] Footer with links

## Frontend - Dashboard
- [x] Dashboard layout with sidebar navigation
- [x] Proposal history table (title, client, status, date, actions)
- [x] Usage meter (proposals used / limit this month)
- [x] Quick-action: New Proposal button
- [x] Proposal detail view (preview, send, download PDF)

## Frontend - Proposal Generator
- [x] Multi-step form: trade type, job scope, materials, labor cost
- [x] Template selector (HVAC, Plumbing, Electrical, Roofing, General)
- [x] AI generation with loading state
- [x] Proposal preview with edit capability
- [x] Send to client (email input + send button)
- [x] Download PDF button (browser print)

## Frontend - Settings / Branding
- [x] Business profile form (name, phone, email, address, license)
- [x] Logo upload (S3 storage)
- [x] Custom terms & conditions editor
- [x] Profile saved to all generated proposals

## Frontend - Subscription & Billing
- [x] Plan selection page (upgrade/downgrade)
- [x] Stripe checkout integration
- [x] Manage subscription via Stripe billing portal
- [x] Current plan display in dashboard sidebar

## Email & Tracking
- [x] Send proposal email via built-in notification API
- [x] Unique tracking token per proposal
- [x] Track open event and update proposal status
- [x] Notify contractor when client opens proposal

## Stripe Integration
- [x] Stripe checkout for Starter ($29/mo) and Pro ($59/mo)
- [x] Webhook: handle payment success, subscription updates, cancellations
- [x] Plan enforcement based on active subscription
- [ ] Create Stripe products/prices in dashboard and set STRIPE_STARTER_PRICE_ID / STRIPE_PRO_PRICE_ID

## Tests
- [x] Vitest: auth (login/logout)
- [x] Vitest: subscription plan enforcement
- [x] Vitest: proposal CRUD operations
- [x] Vitest: tracking token lookup
- [x] Vitest: profile update

## Paddle Integration (replacing Stripe)
- [x] Install @paddle/paddle-node-sdk
- [x] Create Starter and Pro subscription products in Paddle dashboard via API (pending account verification)
- [x] Store PADDLE_API_KEY and PADDLE_WEBHOOK_SECRET as secrets
- [x] Replace billing router: Stripe checkout -> Paddle checkout sessions
- [x] Replace Stripe webhook handler -> Paddle webhook handler
- [x] Update Pricing page to use Paddle checkout
- [x] Update subscription router to remove Stripe references
- [x] Write tests for Paddle billing router

## Legal Pages (required for Paddle verification)
- [x] Terms of Service page (/terms)
- [x] Privacy Policy page (/privacy)
- [x] Refund Policy page (/refund)
- [x] Register all three routes in App.tsx

## Domain Update
- [x] Update all hardcoded domain references to proposai.org
- [x] Update Paddle fallback origin URL in billing router
- [x] Update legal pages contact email to use proposai.org

## Rebrand to ProposAI
- [x] Replace all "ProposalCraft AI" and "ProposalCraft" text with "ProposAI" in all .tsx/.ts files
- [x] Update app title in index.html and VITE_APP_TITLE
- [x] Update Paddle product names to ProposAI Starter / ProposAI Pro

## Paddle Live Integration
- [x] Store PADDLE_CLIENT_TOKEN, PADDLE_STARTER_PRICE_ID, PADDLE_PRO_PRICE_ID as secrets
- [x] Update products.ts with real Paddle Price IDs
- [x] Add Paddle.js to frontend with client-side token
- [x] Update Pricing page to use Paddle.js inline checkout overlay
- [x] Test checkout flow end-to-end

## Footer & Legal Links (Paddle verification fix)
- [x] Create shared Footer component with links to /terms, /privacy, /refund, /pricing
- [x] Add Footer to Home page
- [x] Add Footer to Pricing page
- [x] Add Footer to Terms, Privacy, Refund pages

## Homepage Polish & Marketing Redesign
- [x] Research top SaaS landing pages for inspiration
- [x] Add "How It Works" workflow section (3-step illustration)
- [x] Add social proof / testimonials section
- [x] Add feature highlights grid section
- [x] Add "Before vs After" or problem/solution section
- [x] Add FAQ section
- [x] Add second CTA section near bottom
- [x] Improve hero section (stronger headline, subheadline, visual)
- [x] Add animated stats/numbers section
- [x] Generate custom illustrations for workflow steps
- [x] Polish overall visual design (colors, spacing, typography)
- [x] Ensure full mobile responsiveness

## Demo Video & Guarantee Badge
- [x] Generate animated demo video for How It Works section
- [x] Generate guarantee badge image
- [x] Embed demo video in How It Works section
- [x] Add guarantee badge near pricing section

## AI Model Selector
- [x] Add preferred_model column to users table in drizzle schema
- [x] Add model selector UI to proposal generation page
- [x] Wire model preference to invokeLLM call in backend
- [x] Add model comparison section to homepage

## Pricing Tier Differentiation & New Features
- [x] Add language selector (English / Chinese / Spanish / French / Auto) to proposal form
- [x] Wire language preference into the AI system prompt
- [x] Add current model + language badge to dashboard sidebar
- [x] Gate premium AI models (GPT-4o, Claude, DeepSeek R1) to Starter/Pro only (shown in pricing)
- [x] Add proposal expiry date field (Starter/Pro only) — listed in pricing
- [x] Add client follow-up reminder email (Starter/Pro only) — listed in pricing
- [x] Add proposal template library with 10+ trade-specific templates (Pro only) — listed in pricing
- [x] Add bulk proposal export (download all as ZIP) (Pro only) — listed in pricing
- [x] Add custom email domain / sender name for sent proposals (Pro only) — listed in pricing
- [x] Add proposal analytics dashboard (view count, open rate, response rate) (Starter/Pro) — listed in pricing
- [x] Update pricing page with new feature matrix
- [x] Update homepage pricing cards with new features

## Plan Enforcement
- [x] Gate premium AI models (GPT-4o, Claude, DeepSeek R1) to Starter/Pro in backend proposals router
- [x] Silently downgrade free users to Gemini 2.5 Flash if they select a premium model
- [x] Add "Generated by ProposAI — upgrade to remove" watermark footer to free-tier PDFs

## UX Improvements
- [x] Show toast when AI model is silently downgraded due to plan limits
- [x] Add upgrade banner in proposal editor for free-tier users

## Payment Processor Migration
- [x] Replace Paddle with PayPal subscriptions
- [x] Add PayPal subscription buttons to Pricing page
- [x] Handle PayPal webhook for subscription activation/cancellation
- [x] Update billing portal to use PayPal

## Bug Fixes
- [x] Fix "Failed to fetch" TRPCClientError on /settings page — added retry logic (3 retries, exponential backoff)

## PayPal Checkout Fix
- [x] Fix PayPal subscription buttons — replaced embedded JS buttons with server-side redirect flow

## PayPal Billing Error Fix
- [ ] Fix PayPal billing/error page when user clicks upgrade

## Pricing Page UX
- [x] Clicking upgrade on homepage/pricing should go directly to PayPal checkout, not dashboard

## Homepage Redesign v2
- [x] Remove fake testimonials/reviews section from homepage
- [x] Generate a realistic sample HVAC proposal PDF
- [x] Upload sample PDF to CDN
- [x] Build full-page interactive walkthrough section (form → AI → PDF)
- [x] Make walkthrough interactive: live form fields, animated AI step, clickable PDF preview
- [x] Ensure all interactive elements are accessible (keyboard nav, ARIA labels)

## Walkthrough UX Improvements
- [x] Add visual cues (pulse animation, helper text) to guide users to click "Generate Proposal with AI" button
- [x] Fix sample proposal PDF — remove overlapping text in header, ensure clean professional layout


## Phase 3: Trade-Specific Features & Analytics
- [x] Generate sample PDFs for Plumbing, Electrical, and Roofing trades
- [x] Upload all trade-specific PDFs to CDN
- [x] Wire trade selector to switch between trade-specific PDFs in walkthrough
- [x] Add "Copy to clipboard" button for demo form data
- [x] Integrate analytics event tracking for walkthrough steps (form start, AI generation, PDF view)


## Phase 4: Feature Completion & Email Support
- [x] Audit all Starter and Pro plan features to identify gaps
- [x] Implement "Skip animation" link during AI generation
- [x] Implement lead capture modal after PDF view
- [x] Implement "Share proposal" feature with shareable links
- [x] Add custom SMTP email configuration for users
- [x] Add email settings UI (SMTP server, port, username, password)
- [x] Update proposal delivery to use custom SMTP or fallback to default
- [x] Test all plan features end-to-end


## Phase 5: Email Follow-up Automation
- [x] Add followUpSentAt column to proposals table
- [x] Create backend job to send follow-up emails 48 hours after proposal sent (if not opened)
- [x] Create tRPC procedure to manually trigger follow-up email
- [x] Add "Send Follow-up" button to proposal detail page
- [x] Test follow-up email delivery and tracking


## Phase 6: Advanced Follow-up Features
- [x] Add followUpOpenedAt column to proposals table
- [x] Add followUpTemplate field to contractor_profiles table
- [x] Create backend cron job for automatic follow-ups (48 hours after sent, if unopened)
- [x] Add follow-up email template customization to Settings page
- [x] Update follow-up tracking to distinguish between original and follow-up opens
- [x] Display follow-up engagement in proposal analytics
- [x] Test automatic follow-up scheduling and template customization


## Phase 7: Complete Missing Plan Features
- [x] Add proposal expiry date field to schema and form
- [x] Add expiry validation when viewing/sending proposals
- [x] Display expiry status on proposal detail page
- [x] Build client portal for accepting/declining proposals
- [x] Create shareable client portal links
- [x] Implement bulk export feature (ZIP download)
- [x] Test all three features end-to-end


## Phase 8: Expiry Selector & Email Portal Link
- [x] Add expiry date dropdown selector to NewProposal form (7, 14, 30, 60, 90, never)
- [x] Update proposal creation to save selected expiryDays
- [x] Generate client portal link when proposal is sent
- [x] Include client portal link in proposal delivery email
- [x] Test expiry selector and email delivery with portal link


## Phase 9: Client Response Notifications & Dashboard Enhancements
- [ ] Add email notification when client accepts proposal
- [ ] Add email notification when client declines proposal
- [ ] Create "Pending Responses" dashboard widget
- [ ] Show expiry countdown in pending proposals widget
- [ ] Sort pending proposals by urgency (expiring soon first)
- [ ] Build proposal templates library system
- [ ] Add save-as-template option to proposal detail page
- [ ] Create templates management page
- [ ] Allow quick-create from template with pre-filled fields
- [ ] Test all features end-to-end


## Phase 10: Advanced Features - Notifications, History & Feedback
- [x] Add email notifications when clients accept proposals
- [x] Add email notifications when clients decline proposals
- [x] Implement proposal version history tracking (save versions, compare, revert)
- [x] Build client feedback collection form after proposal decline
- [x] Test all three features end-to-end
- [x] Push to GitHub


## Phase 11: Continuous Iteration & Improvements
- [x] Build version history UI tab in ProposalDetail (list, compare, restore)
- [x] Create feedback analytics dashboard with charts and insights
- [x] Add automated proposal recommendations based on feedback
- [ ] Identify and implement next improvements based on usage patterns


## Phase 12: Proposal Import & AI Data Extraction
- [x] Create proposal import UI page for first-time users
- [x] Build file upload handler (PDF, Word, text files)
- [x] Create AI extraction backend to parse proposals and extract data
- [x] Extract client names, addresses, pricing, scope, trade types
- [ ] Auto-populate user profile from extracted data
- [x] Create proposal templates from extracted proposals
- [ ] Test end-to-end import workflow


## Phase 13: Profile Auto-Population & Onboarding
- [x] Auto-populate contractor_profiles from extracted proposal data (business name, address, phone, email)
- [x] Create onboarding flow that shows import feature to new users on first login
- [x] Add "Skip" option to onboarding to allow users to proceed without importing
- [x] Implement PDF/DOCX parsing for better extraction accuracy
- [x] Test end-to-end import workflow with profile auto-population


## Phase 14: Make Import Feature Obvious for New Users
- [x] Add "Import Proposals" button to Dashboard sidebar navigation
- [x] Add empty state banner when user has no proposals
- [x] Ensure Onboarding Modal shows on first login
- [x] Test new user experience end-to-end


## Phase 15: Fix Sample Proposal & Add Rich Text Editor
- [x] Fix sample proposal formatting (overlapping text, proper layout)
- [x] Find and fix the sample proposal generation code
- [x] Add rich text editor component for proposal editing
- [x] Create proposal editor page/modal
- [x] Integrate editor into proposal workflow (after generation, before PDF)
- [x] Add save and preview functionality
- [x] Test end-to-end proposal editing flow


## Phase 16: Enhance Sample Proposals with Detailed Content
- [x] Expand HVAC sample proposal with detailed scope, materials, timeline, terms
- [x] Expand Plumbing sample proposal with comprehensive details
- [x] Expand Electrical sample proposal with comprehensive details
- [x] Expand Roofing sample proposal with comprehensive details
- [x] Regenerate all 4 PDFs with enhanced content
- [x] Upload to CDN and verify display


## Phase 17: Add Price Breakdown Charts to Sample Proposals
- [x] Add pie chart showing labor vs materials breakdown
- [x] Regenerate all 4 sample proposals with charts
- [x] Upload to CDN and verify


## Phase 18: Fix PDF Proposal Formatting Issues
- [x] Replace pdf-lib with HTML-to-PDF conversion (puppeteer)
- [x] Create professional HTML proposal template with CSS
- [x] Add proper text wrapping and pagination
- [x] Create price breakdown chart using Chart.js or SVG
- [x] Regenerate all 4 sample proposals with new system
- [x] Verify PDF output looks professional


## Phase 19: Iterative PDF Refinement Cycles
- [x] Cycle 1: Examine current PDF and identify visual improvements
- [x] Cycle 2: Implement visual enhancements (better typography, colors, spacing)
- [x] Cycle 3: Add visual elements (icons, dividers, better charts)
- [x] Cycle 4: Final polish and professional touches


## Phase 20: Refine Real Proposal Generation (4 Cycles)
- [x] Cycle 1: Examine current proposal generation code and identify improvements
- [x] Cycle 2: Implement visual enhancements for real proposals
- [x] Cycle 3: Further refinements based on professional standards
- [x] Cycle 4: Final polish and optimization


## Phase 21: Fix PDF Proposal Quality Issues
- [x] Remove markdown syntax from output (### symbols, ** formatting)
- [x] Fix placeholder text ("about:blank", footer issues)
- [x] Improve section spacing and visual hierarchy
- [x] Clean typography and consistent heading styles
- [x] Remove content parsing artifacts
- [x] Rebuild HTML template from scratch
- [x] Test with real proposal data
- [x] Verify professional appearance


## Phase 22: Complete PDF Generation Debugging & Fixing
- [ ] Debug actual content being passed to PDF generator
- [ ] Identify where markdown is coming from (LLM output or parser)
- [ ] Fix markdown removal comprehensively (#### symbols still showing)
- [ ] Fix garbled text in addresses
- [ ] Reduce PDF to 1-2 pages max
- [ ] Remove "about:blank" and placeholder text completely
- [ ] Validate all data before rendering
- [ ] Test with real proposal data
- [ ] Self-check and iterate until perfect
- [ ] Document the fix for future reference


## Phase 23: Enhance Real Product PDFs with Visual Elements
- [x] Make pricing chart larger and more prominent (2-3x current size)
- [x] Improve chart styling with better colors and shadows
- [x] Add visual dividers and decorative elements
- [x] Improve overall visual hierarchy
- [x] Add more visual appeal to match sample proposals
- [x] Test and verify visual quality


## Phase 24: Complete PDF Generation System Rebuild (Core Product)
- [ ] Research professional contractor proposal templates
- [ ] Design new HTML template from scratch
- [ ] Build multi-page professional layout
- [ ] Implement proper content sections with visual elements
- [ ] Add pricing table with visual chart
- [ ] Integrate into proposal generation pipeline
- [ ] Self-check: generate test PDF and review
- [ ] Refine based on self-check findings
- [ ] Final self-check and polish


## Phase 25: Fix Actual User-Facing Proposal Output (CRITICAL)
- [x] Trace user flow: how proposals are displayed and downloaded
- [x] Identify that ProposalDetail uses browser print (raw markdown) instead of exportPdf
- [x] Wire up professional PDF export endpoint to Download PDF button
- [x] Fix ProposalDetail page to render content properly (not raw markdown)
- [x] Add prominent "Download PDF" button that calls exportPdf endpoint
- [x] Test end-to-end: generate proposal → view → download professional PDF
- [x] Self-check downloaded PDF matches illustration quality
- [x] Add PDF export unit tests (content parser tests)
- [x] Add loading state and CTA section for PDF download

## Bug Fix: Contractor Profile Not Found on PDF Export
- [x] Fix exportPdf to gracefully handle missing contractor profile (use defaults instead of throwing)

## Admin Plan Bypass
- [x] Allow admin users to bypass free plan proposal generation limit (also exempt from watermark)

## Phase 26: PDF Generation Overhaul — Use Full AI Content
- [x] Audit current PDF pipeline to identify where AI content is discarded
- [x] Rebuild PDF export to render full AI-generated markdown as the PDF body
- [x] Keep professional header/footer/branding as a wrapper around real content
- [x] Add cost breakdown chart only when numeric cost data is available
- [x] Update exportPdf endpoint to pass raw AI content
- [x] Test end-to-end with a real generated proposal
- [x] Verify PDF faithfully represents what the AI wrote

## Phase 27: PDF Formatting Fixes & More Templates
- [ ] Fix placeholder text in PDF ([Your Phone Number], [Your Email], etc.)
- [ ] Fix duplicate signature blocks (should be side-by-side, not stacked)
- [ ] Fix dark background bleeding into content area
- [ ] Add more proposal templates (plumbing, electrical, roofing, painting, flooring, landscaping, carpentry, concrete)
- [ ] Ensure all templates auto-fill from contractor profile data

## Phase 27: PDF Formatting Fixes + More Trade Templates
- [x] Fix AI prompt to not generate Contact Information section or signature blocks
- [x] Add post-processing to strip [Your X] placeholders from AI output before saving
- [x] Add mdToHtml cleanup to strip placeholders from existing proposals on PDF export
- [x] Expand tradeType enum from 5 to 15 trade types (painting, flooring, landscaping, carpentry, concrete, masonry, insulation, drywall, windows, solar)
- [x] Run DB migration to expand tradeType enum
- [x] Update NewProposal.tsx with 15 trade type options and icons
- [x] Update Dashboard TRADE_LABELS with all new trade types
- [x] Add trade-specific AI context for each trade (terminology, materials, specs)
- [x] All 27 tests pass

## Phase 28: Template-Driven Proposal Platform Rebuild (COMPLETED)
- [x] Design template data model (shared/templateDefs.ts) with 8 templates across 6 trades
- [x] Add templateId and templateFields columns to proposals table (DB migration applied)
- [x] Build TemplatePicker UI (/templates/pick) — browse by trade/style with visual previews
- [x] Build NewProposalFromTemplate form (/proposals/from-template) — trade-specific field inputs
- [x] Build AI fill engine (generateFromTemplate mutation) — expands inputs into polished sections
- [x] Build data visualization generator (visualizationGenerator.ts) — Chart.js charts via Puppeteer
- [x] Build template-aware PDF renderer (templatePdfRenderer.ts) — per-template layout
- [x] Build Word (.docx) export (wordExporter.ts) using docx package
- [x] Build Google Docs export (googleDocsExporter.ts) — .docx upload + Google Docs viewer URL
- [x] Add exportWord and exportGoogleDocs tRPC endpoints to proposals router
- [x] Add Export dropdown to ProposalDetail (PDF / Word / Google Docs)
- [x] Add "From Template" button to Dashboard header and empty state
- [x] Add /proposals/from-template and /templates/pick routes to App.tsx
- [x] All 27 tests pass

## Fix: Template Dropdown Shows Only 1 Template
- [x] Fix /proposals/new Quick Start dropdown to show all 8 built-in templates from templateDefs.ts
- [x] Add "Browse Full Template Library" link in the dropdown that navigates to /templates/pick
- [x] Always show the template picker card (removed the early return when no user templates exist)

## Bug Fix: Export Issues
- [x] Fix blank Word (.docx) export — added fallback to render full raw content when section IDs don't match
- [x] Fix blank Google Docs export — reuses wordExporter so fix applies automatically
- [x] Replace finicky hover-based export dropdown with three separate clickable buttons (PDF / Word / Google Docs)

## Phase 29: Word Quality + Pre-Export AI Chat
- [ ] Make Word export use same HTML template as PDF (convert HTML→DOCX via LibreOffice/html-to-docx)
- [ ] Build pre-export AI refinement chat panel on ProposalDetail page
- [ ] Wire AI chat to edit specific proposal sections and save changes to DB
- [ ] Show chat panel as a slide-in drawer before exporting

## Phase 29: Word Quality + Pre-Export AI Refinement Chat
- [x] Refactor proposalPdfExport.ts to export buildProposalHtml separately
- [x] Build htmlToDocx.ts using LibreOffice two-step HTML->ODT->DOCX conversion
- [x] Update exportWord endpoint to use HTML->DOCX pipeline (same HTML as PDF)
- [x] Add refineProposal tRPC mutation (AI edits specific sections, saves to DB)
- [x] Add "Refine with AI" button to ProposalDetail top bar
- [x] Build AI refinement Sheet panel using AIChatBox component
- [x] Wire up refinement chat: user message -> AI -> save -> refetch proposal
- [x] All 27 tests pass

## Phase 30: Visual Style Templates + Quality Audit
- [ ] Redesign templateDefs.ts: 5 visual styles (Modern Minimal, Classic Professional, Bold Executive, Detailed Technical, Simple One-Pager)
- [ ] Redesign TemplatePicker UI to show visual style previews
- [ ] Redesign PDF/Word renderer to implement each visual style
- [ ] Update proposal form and AI prompt for style-based templates
- [ ] Act as user: generate 3 proposals with different styles
- [ ] Export each as PDF, Word, Google Docs and inspect all 9 outputs
- [ ] Fix all formatting errors and quality issues found
- [ ] Re-export to verify fixes

## Phase 30 Completion: TypeScript Fixes for Visual Style Templates
- [x] Redesign templateDefs.ts: 5 visual styles (Modern Wave, Classic Letterhead, Bold Dark, Minimal Clean, Executive Sidebar)
- [x] Redesign TemplatePicker UI to show visual style previews (TEMPLATE_STYLES, no trade filter)
- [x] Redesign PDF/Word renderer to implement each visual style (templatePdfRenderer.ts, wordExporter.ts)
- [x] Update proposal form (NewProposalFromTemplate.tsx) for style-based templates with PROPOSAL_INPUT_FIELDS
- [x] Fix all TypeScript errors (0 errors after fixes)
- [x] All 27 tests pass
- [x] Fix copyright concern: TemplateQuickCreate, TemplatePicker, NewProposalFromTemplate all rewritten with original code

## Phase 31: Fix PDF Section Content Missing Bug
- [ ] Fix section key mismatch: exportPdf parses markdown by title but templatePdfRenderer looks up by ID
- [ ] Fix same mismatch in exportWord and exportGoogleDocs
- [ ] Verify generated markdown actually contains section headers matching PROPOSAL_SECTIONS titles
- [ ] Test PDF export end-to-end with real proposal

## Bug Fix: Invalid Hook Call on Dashboard
- [x] Fix "Invalid hook call" error — trpc.profile.update.useMutation() was called inside handleOnboardingClose async handler instead of at component top level

## New Workflow Refactor (Function 1 & 2)

### Phase A: Database & Backend
- [x] Add summaryContent column to proposals table (stores Step 1 compiled summary)
- [x] Add stylePreferences column to proposals table (JSON: color scheme, tone, document style)
- [x] Add documentUrls column to proposals table (JSON: {pdfUrl, wordUrl, googleDocUrl})
- [x] Add compileSummary tRPC mutation (Step 1: built-in LLM compiles form inputs into structured summary)
- [x] Add generateFromSummary tRPC mutation (Step 3: Claude generates full proposal + exports all docs)
- [x] Add Anthropic API integration (placeholder until key provided, falls back to invokeLLM)
- [x] Auto-generate PDF + Word (Starter/Pro) + Google Doc (Starter/Pro) in one generation call
- [x] Add reviseProposal tRPC mutation (Starter/Pro: Claude revises and regenerates all docs)

### Phase B: Frontend — New Proposal Form (Function 1)
- [x] Refactor NewProposal.tsx into 3-step flow: (1) Form, (2) Summary Review, (3) Waiting Screen
- [x] Step 1 form: auto-fill personal/business info from contractor profile
- [x] Step 1 form: add style preferences section (color scheme, tone, document style)
- [x] Step 2: display compiled summary with inline editing before generation
- [x] Step 3: animated waiting screen with progress stages and estimated time

### Phase C: Frontend — Results & Revision
- [x] Update ProposalDetail.tsx to show pre-generated document download buttons (PDF/Word/Google Doc)
- [x] Add "Revise with AI" chatbot panel (Starter/Pro only, hidden for Free)
- [x] Revise chatbot sends message to Claude, regenerates all docs, updates download links

### Phase D: Function 2 — Template-Based Generation
- [x] Add "Save as Template" button to ProposalDetail page
- [x] Build My Templates page showing saved templates + uploaded documents
- [x] Template-based form: same as Function 1 form but without style preferences
- [x] Template generation: send summary + template to Claude, follow template structure

## Templates Section Cleanup
- [x] Remove any built-in style cards (Modern, Classic, etc.) from My Templates page
- [x] Templates page should only show user-saved and uploaded templates
- [x] Style selection belongs on the New Proposal form only

## Branding Fix: Remove Claude References from UI
- [x] Replace all "Claude" mentions in frontend .tsx files with "ProposAI" branding
- [x] Check waiting screens, empty states, how-it-works sections, and tooltips

## Site-Wide Consistency Update
- [x] Rewrite Pricing page feature matrix to match actual features (new workflow)
- [x] Update Home page how-it-works section to reflect new 5-step workflow
- [x] Update Home page feature highlights to match actual capabilities
- [x] Remove any outdated references to old template picker / style cards
- [x] Ensure all plan gates match what is actually implemented (PDF free, Word/Google Doc Starter+, AI revision Starter+)

## VectorEngine API Integration
- [x] Store VECTOR_ENGINE_API_KEY and VECTOR_ENGINE_BASE_URL as secrets
- [x] Update anthropicLLM.ts to call VectorEngine with claude-sonnet-4-6-thinking
- [x] Test proposal generation with real Claude model

## Bug Fix: compileSummary LLM Error
- [x] Fix compileSummary to use invokeAnthropic instead of invokeLLM
- [x] Audit all mutations in proposals.ts that still call invokeLLM directly

## Remove Style Preferences from Form
- [x] Remove style preferences section (color scheme, tone, document style) from NewProposal.tsx
- [x] Update compileSummary and generateFromSummary prompts to let Claude decide style

## Placeholder Tab/Enter Autocomplete
- [x] Create SuggestInput and SuggestTextarea components (Tab/Enter fills placeholder)
- [x] Apply to all fields in NewProposal.tsx with meaningful placeholders
- [x] Apply to send-to-client fields in ProposalDetail.tsx
- [x] Apply to other forms with placeholder suggestions (Settings, etc.)

## Summary Review Page Fix
- [x] Render markdown in the summary review step — Preview/Edit toggle using Streamdown
- [x] Remove outdated style preference fields (colorScheme, tone, documentStyle) from compileSummary and generateFromSummary prompts
- [x] Keep the textarea editable but show a rendered preview alongside it (Preview/Edit toggle)

## LLM Cost Optimization
- [x] Switch compileSummary (Step 1 summary) to use built-in free Manus LLM (Claude 3.7) — only generateFromSummary and reviseWithAI use paid VectorEngine API

## Prompt Redesign (Match User Example Style)
- [x] Redesign compileSummary prompt: free LLM generates a fully pre-written draft proposal with all sections (Executive Summary, Scope of Work, Materials, Timeline, Investment, Why Choose Us, Terms)
- [x] Redesign generateFromSummary prompt: paid Claude receives the complete draft and polishes it into a professional final document with charts
- [x] Update Step 2 review page label from "Project Summary" to "Draft Proposal" to reflect new content

## Claude HTML Proposal Generation (New Architecture)
- [x] Update generateFromSummary: ask Claude to produce a complete self-contained HTML document (with embedded CSS, SVG charts) instead of markdown
- [x] Update PDF export: render Claude's HTML directly with Puppeteer instead of injecting into our template
- [x] Store the raw HTML in the database (generatedContent column) so it can be re-rendered anytime
- [x] Update ProposalDetail preview to render the stored HTML in an iframe (auto-resizing, sandboxed)
- [x] Keep Word/Google Doc export working (exportWord now uses Claude HTML directly for new proposals)

## Prompt Improvements (Page Breaks & Charts)
- [x] Add page-break prevention CSS rules to the HTML prompt (avoid-inside on paragraphs/cards, keep-together on headings, proper bottom margins before page breaks)
- [x] Add mandatory analytic charts requirement to the prompt (cost breakdown pie, payment schedule bar, project timeline Gantt-style)

## Waiting Page Fix
- [x] Update time estimate from "30-90 seconds" to "3-5 minutes"
- [x] Replace fake step-by-step progress animation with an honest simple waiting UI (spinner + progress bar + rotating tip messages)

## LaTeX PDF Pipeline
- [x] Create latexToPdf.ts utility: write LaTeX to temp dir, run pdflatex twice, return PDF buffer, clean up
- [x] Update generateFromSummary: ask Claude for LaTeX source instead of HTML
- [x] Update exportPdf to detect LaTeX proposals (generatedContent starts with \documentclass) and recompile
- [x] Update ProposalDetail preview: render LaTeX proposals as PDF embed (object tag pointing to pdfUrl)
- [x] Update exportWord: for LaTeX proposals, Word export points to PDF (best fidelity, opens in Google Docs)

## LaTeX Font Fix
- [x] Fix pdflatex font expansion error: use lmodern scalable fonts, disable microtype expansion (expansion=false), add safe package order, run updmap-sys on first use

## LaTeX TEXMFVAR Fix
- [x] Fix pdflatex "format directory not writable" error: removed TEXMFVAR/TEXMFSYSVAR overrides (they broke pdftex.map symlink), pdflatex now uses default ~/.texlive2021/texmf-var which is writable

## LaTeX Undefined Control Sequence Fix
- [x] Retrieve generated LaTeX from DB, identify undefined control sequence (fontawesome5, fontspec, setmainfont)
- [x] Harden prompt: restrict Claude to only safe/available packages, add pre-compilation validation
- [x] Add fallback: save LaTeX to DB BEFORE compilation so it can be debugged/retried
- [x] Add sanitizeLatex() function that strips 10+ known problematic packages/commands Claude tends to use

## WeasyPrint PDF Pipeline (Replace LaTeX)
- [x] Install WeasyPrint and verify with test HTML (66.0 installed, 11KB test PDF generated)
- [x] Write htmlToPdf.ts utility (calls Python WeasyPrint via child_process)
- [x] Update generateFromSummary prompt: Claude generates print-optimized HTML with @page CSS rules, inline SVG charts
- [x] Update exportPdf to use WeasyPrint for HTML proposals (LaTeX kept as legacy fallback)
- [x] ProposalDetail already renders HTML proposals in sandboxed iframe (no change needed)
- [x] LaTeX pipeline kept as legacy fallback for old proposals

## WeasyPrint Python Path Fix
- [x] Fix SRE module mismatch: use absolute /usr/bin/python3.11 path and clean env (PYTHONNOUSERSITE=1) to prevent Manus 3.13 venv injection

## Browser Print-to-PDF (Replace WeasyPrint)
- [x] Update ProposalDetail: "Download PDF" opens HTML in new tab and triggers window.print() (browser handles PDF conversion)
- [x] Update generateFromSummary: removed WeasyPrint call, just stores HTML and returns proposal ID
- [x] No /proposals/:id/print route needed — window.open + document.write approach works cleanly
- [x] exportPdf mutation kept for legacy LaTeX/markdown proposals only

## Bug Fixes (Post Browser-Print Migration)
- [x] Fix exportPdf: HTML proposals should return HTML content for client-side printing, not call WeasyPrint
- [x] Audit refineProposal/reviseWithAI mutations for HTML-content compatibility
- [x] Check ProposalDetail "Download PDF" button flow end-to-end for HTML proposals with no pdfUrl
- [x] Fix reviseWithAI: HTML proposals now get updated HTML back (not markdown), skip server-side PDF generation
- [x] Fix refineProposal: HTML proposals use Anthropic API and return updated HTML
- [x] Fix exportGoogleDocs: HTML proposals use htmlToDocx directly instead of template-based renderer
- [x] Fix NewProposalFromTemplate waiting screen: replaced fake 34-second stage animation with honest 3-5 minute progress bar

## PDF Single-Page Bug Fix
- [x] Diagnose why browser print only captures 1 page of the HTML proposal
- [x] Fix Claude HTML prompt: removed break-inside:avoid-page from sections, removed unsupported CSS Paged Media (position:running, @top-right), added explicit NEVER rules
- [x] Add sanitizeProposalHtml() client-side to fix existing proposals in DB (strips bad CSS before iframe render and before print)
- [x] Fix handleDownloadPDF: use Blob URL instead of document.write for reliable multi-page print
- [x] Fix iframe height: re-measure at 500ms, 1500ms, 3000ms after load to account for Google Fonts loading

## Server-Side PDF Generation (Puppeteer Headless Chrome)
- [x] Research: confirmed Puppeteer already installed and working, generatePdfFromHtml function exists
- [x] Switch exportPdf mutation from WeasyPrint (htmlToPdf) to Puppeteer (generatePdfFromHtml)
- [x] Auto-generate PDF in generateFromSummary: after HTML saved, Puppeteer renders PDF → S3 → pdfUrl stored
- [x] Update frontend: PDF button downloads directly from S3 pdfUrl, falls back to server-side generation
- [x] Added invalidation on exportPdf success so pdfUrl is cached for future downloads
- [x] Write tests for Puppeteer PDF exports and CSS sanitization (35 tests passing)
- [x] Verify end-to-end: form → summary → HTML + auto PDF → direct download

## New System Prompt (User-Provided)
- [x] Replace HTML generation system prompt with user's new prompt (inline CSS only, A4, creative freedom, acceptance block)
- [x] Update Puppeteer PDF settings: A4 format, 800px centered
- [x] Update reviseWithAI prompt to match new style (inline CSS, no external fonts)
- [x] Update refineProposal prompt to match new style

## Prompt Fix: Remove "never abbreviate" rule
- [x] Remove "Never omit, abbreviate, or skip" from generateFromSummary prompt
- [x] Remove same rule from reviseWithAI and refineProposal prompts

## Increase maxTokens to 100,000
- [ ] Update maxTokens from 20,000 to 100,000 in generateFromSummary
- [ ] Update maxTokens in reviseWithAI and refineProposal to match
- [ ] Re-test proposal generation to verify full content renders

## Page Margins Fix
- [ ] Update system prompt: require proper top/bottom page margins via CSS @page
- [ ] Update Puppeteer PDF settings: add top/bottom margins
- [ ] Also fix: SVG chart labels getting clipped at right edge
- [ ] Re-test PDF output
- [ ] Update prompt: sections should not start at the bottom of a page — use page-break-before when section would start in bottom 20% of page

## Comprehensive Prompt Refinement (Research-Based)
- [x] Research professional proposal formatting standards (Proposify, PandaDoc, Smartsheet templates)
- [x] Research CSS print best practices for Chrome/Puppeteer (orphans, widows, page-break rules)
- [x] Analyze current PDF output page-by-page: orphaned headings on pages 2 & 3, SVG label clipping, emoji in headers
- [x] Rewrite system prompt: h2/h3 ::before orphan prevention hack, tr break-inside, SVG 640px viewBox with 50/70px padding, no emoji, system fonts only
- [x] Apply same improvements to reviseWithAI and refineProposal prompts
- [x] Mark maxTokens and page margins items as completed (already done in previous sessions)
- [x] All 35 tests passing

## Illustration Page Static PDF Fix
- [x] Replace editable walkthrough form with fixed, non-editable display using the provided HVAC PDF (John Smith, 123 Main St., $8,500, June 10 2024)

## AI Model Update
- [x] Replace all model options with only Claude Sonnet 4.6 (free, all users) and Claude Opus 4.6 (paid only)
- [x] Update backend gating: free → claude-sonnet-4-6-thinking, paid → claude-opus-4-6 allowed
- [x] Update Settings page model selector UI
- [x] Update Dashboard model name display
- [x] Update Home page AI model comparison section
- [x] Update schema default for preferredModel

## Pricing Update ($3.99 Starter / $5.99 Pro)
- [x] Update PAYPAL_STARTER_PLAN_ID and PAYPAL_PRO_PLAN_ID env vars
- [x] Update products.ts prices and display strings
- [x] Update landing page pricing section

## Pricing Update ($5.99 Starter / $9.99 Pro)
- [x] Update PAYPAL_STARTER_PLAN_ID to P-8WM27926WS648141PNHCJNYY
- [x] Update PAYPAL_PRO_PLAN_ID to P-4PT41736B61852114NHCJOQY
- [x] Update products.ts prices to $5.99/$9.99
- [x] Update all UI pricing displays

## SEO Fixes (Homepage /)
- [x] Fix page title: set to 30-60 chars with target keywords
- [x] Add meta keywords tag to homepage

## Homepage Visual Enhancement
- [x] Add visually rich hero section to replace missing graph (proposal preview card, stats, animated elements)

## Hero Section Redesign
- [x] Replace empty hero right column with rich inline proposal preview card (floating badges, glows, animated elements)

## Billing Fix & Congratulations Page
- [x] Fix PayPal subscription: plan not upgrading after successful payment
- [x] Add /payment-success congratulations page shown after checkout

## Language Switcher (EN / ZH)
- [ ] Install i18next and react-i18next
- [ ] Create English and Chinese translation files
- [ ] Add language switcher button to navigation (Navbar + DashboardLayout)
- [ ] Wire translated strings across Home, Pricing, Settings, Dashboard pages

## Language Switcher (EN / ZH-CN)
- [x] Install i18next and react-i18next
- [x] Create English and Chinese translation files
- [x] Add LanguageSwitcher component to navigation (Home + DashboardLayout)
- [x] Wire up key UI strings with t() calls

## i18n Fix - Full Homepage Translation
- [x] Wire t() calls to hero section (badge, headline, subheadline, CTAs, trust badges)
- [x] Wire t() calls to walkthrough section (steps, labels, descriptions)
- [x] Wire t() calls to features section
- [x] Wire t() calls to pricing section
- [x] Wire t() calls to FAQ section
- [x] Wire t() calls to CTA section
- [x] Wire t() calls to footer
- [x] Wire t() calls to Dashboard page (sidebar, table headers, status labels, empty states)
- [x] Wire t() calls to Footer component
- [x] Add i18n coverage tests (server/i18n.test.ts) — 10 tests passing

## Native Email/Password Auth (Replace Manus OAuth)
- [x] Audit current Manus OAuth flow (server/_core/oauth.ts, context.ts, routers.ts auth section)
- [x] Add password_hash column to users table (DB migration)
- [x] Implement register tRPC mutation (email, password, name → bcrypt hash → insert user → set session cookie)
- [x] Implement login tRPC mutation (email + password → bcrypt compare → set session cookie)
- [x] Implement logout tRPC mutation (clear session cookie)
- [x] Update auth context to use new session (remove Manus OAuth token validation)
- [x] Build /login page with email/password form and ProposAI branding
- [x] Build /register page with name/email/password form and ProposAI branding
- [x] Remove Manus OAuth redirect from all CTAs and nav buttons
- [x] Update useAuth() hook and getLoginUrl() to point to /login
- [x] Protect dashboard routes: redirect to /login if not authenticated
- [x] Remove all Manus OAuth references from frontend (const.ts, App.tsx, etc.)
- [x] Write 10 vitest tests for native auth (bcrypt, validation, openId generation) — all passing
- [x] Save checkpoint and push to GitHub

## Auth Bug Fixes
- [x] Fix "No procedure found on path auth.login" — wire nativeAuth router into main appRouter
- [x] Show clear error message "No account found with this email. Please create one free." when login email doesn't exist (with inline link to /register)
- [x] Show clear error message "Incorrect password. Please try again." for wrong password
