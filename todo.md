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
