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
