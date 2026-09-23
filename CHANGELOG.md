# Changelog

All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Start Free Account Entry

### Changed

- Connected the landing-page **Start Free** actions to the BizziBuddi local account creation flow.
- Added support for opening the account page directly in create-account mode.
- Kept pricing-plan buttons as development placeholders with no billing connection.


## BizziBuddi Tablet Closing CTA Compactness

### Changed

- Tightened the closing BizziBuddi CTA section on tablet-sized screens.
- Reduced heading, supporting copy and button spacing while preserving the desktop layout and existing CTA behaviour.


## BizziBuddi Mobile Closing CTA Compactness

### Changed

- Reduced the closing BizziBuddi CTA section footprint on small mobile screens.
- Tightened the heading, supporting copy and CTA spacing while keeping the final message prominent.
- Preserved the desktop CTA layout and existing action behaviour.


## BizziBuddi Tablet Pricing Card Compactness

### Changed

- Reduced pricing-card padding and internal spacing on tablet-sized screens.
- Tightened plan descriptions, feature lists, popular-plan banner and action buttons for the two-column tablet layout.
- Preserved the desktop pricing layout and the more compact small-mobile treatment.


## BizziBuddi Tablet Content Grid Compactness

### Changed

- Changed the Why BizziBuddi and Features cards to use two columns on tablet-sized screens.
- Reduced vertical page length while preserving the single-column mobile layout below 520px.
- Preserved all existing card content, branding and desktop layout.


## BizziBuddi Mobile Content Card Compactness

### Changed

- Reduced Why BizziBuddi and Features card padding and minimum heights on small mobile screens.
- Tightened card headings, supporting text and internal spacing so the public landing page remains compact without changing the desktop layout.
- Preserved all existing card content, branding and responsive structure.


# Changelog

All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Mobile Pricing Card Compactness

### Changed

- Reduced pricing-card padding and internal spacing on small mobile screens.
- Tightened plan descriptions, feature lists, popular-plan banner and action buttons.
- Preserved all mock pricing, plans, feature lists and placeholder billing actions.


## BizziBuddi Mobile Content Compactness

### Changed

- Reduced vertical spacing across the public landing-page content sections on tablet and mobile widths.
- Tightened section headings and supporting copy for smaller screens.
- Preserved the desktop layout, content and existing responsive card grids.


## BizziBuddi Mobile Footer Compactness

### Changed

- Reduced the BizziBuddi landing-page footer footprint on small mobile screens.
- Tightened footer column spacing, account links, legal links and the development note.
- Preserved all footer links, legal destinations and branding.


## BizziBuddi Mobile Hero Compactness

### Changed

- Reduced the BizziBuddi landing-page hero footprint on small mobile screens.
- Tightened the hero logo, headline, supporting message and CTA spacing below 520px.
- Preserved the desktop hero hierarchy, branding and content.


## BizziBuddi Mobile Navigation Compactness

### Changed

- Reduced mobile navigation vertical spacing and menu gaps on the public BizziBuddi landing page.
- Reduced the mobile menu button height and horizontal padding.
- Preserved all mobile navigation links, actions and behaviour.


## BizziBuddi Landing Header Compactness

### Changed

- Reduced the sticky header height and horizontal spacing.
- Reduced the header BizziBuddi logo size.
- Tightened desktop navigation spacing.
- Preserved all navigation links, the Start Free placeholder action and mobile menu behaviour.


## BizziBuddi Pricing Section Compactness

### Changed

- Reduced the vertical footprint of the public pricing section.
- Tightened pricing-card padding, typography, feature spacing and button sizing.
- Preserved all four mock plans, pricing values, feature lists and placeholder actions.
- Kept pricing disconnected from billing and subscriptions as planned.


## BizziBuddi Landing Section Compactness

### Changed

- Reduced vertical spacing in the Why BizziBuddi, Features and closing CTA sections.
- Reduced card padding, minimum heights and typography so more content fits comfortably on screen.
- Tightened the BizziBuddi footer layout, links and legal row.
- Preserved the existing content, branding, colours and responsive structure.


## BizziBuddi Landing Hero Compactness

### Changed

- Compact the opening BizziBuddi hero so the core message is visible with substantially less vertical space.
- Reduced the logo, headline, supporting copy and spacing while preserving the existing CTAs.
- Removed the three supporting hero cards from the opening section so the primary brand message has a cleaner, tighter presentation.
- Set the opening brand lockup to “BUSINESS SUPPORT, SIMPLIFIED.” as requested.


## BizziBuddi Hero Messaging Polish

### Changed

- Set “Your personal assistant for business.” as the primary hero headline.
- Set “Gives you time.” as the prominent supporting brand promise.
- Set “Helping you organise, plan and grow.” as supporting explanatory copy.
- Kept “Business management, simplified.” as the approved BizziBuddi tagline.
- Left pricing and account buttons unchanged as development placeholders.

## BizziBuddi Hero Brand Message

### Changed

- Updated the BizziBuddi tagline from “Business support, simplified.” to “Business management, simplified.”
- Applied the revised wording consistently to the landing-page hero lockup and sidebar BizziBuddi branding.
- Preserved the existing logo geometry, palette and supporting “Your personal assistant for business.” message.

## BizziBuddi Landing Hero Hierarchy

### Changed

- Made `BUSINESS MANAGEMENT, SIMPLIFIED` the clear eyebrow statement.
- Reduced `Run your business. With BizziBuddi` to supporting headline status.
- Made `One clear workspace for your people, jobs, production, calendar and money.` the dominant hero message.
- Preserved the approved BizziBuddi logo, palette and existing hero actions.

## Sidebar Rendering Recovery

### Fixed

- Removed the experimental viewport-height logic that was preventing the sidebar from rendering in the local development build.
- Restored the last known working sidebar implementation while retaining the BizziBuddi footer containment fix.
- Kept the approved BizziBuddi branding and navigation behaviour unchanged.

## Sidebar Viewport Reference Error Fix

### Fixed

- Corrected the sidebar viewport state declaration order.
- Prevented `compactSidebar` from referencing `viewportHeight` before it was initialised.
- Restored sidebar rendering after the responsive short-viewport change.

## Sidebar Blank-Screen Hardening

### Fixed

- Removed direct browser viewport access from the sidebar state initializer.
- Initialise viewport height safely before the browser resize effect runs.
- Preserved the responsive short-viewport behaviour without requiring `window` during component initialisation.


---

## BizziBuddi Sidebar Short-Viewport Behaviour

### Changed

- Added responsive sidebar sizing for shorter laptop and browser viewports.
- Reduced non-essential sidebar spacing and control dimensions below 760px viewport height.
- Further compacted the BizziBuddi footer below 650px while preserving the approved logo, messaging and upgrade action.
- Kept the main navigation independently scrollable so all menu items remain accessible.

## BizziBuddi Sidebar Navigation Containment

### Fixed

- Added an explicit overflow boundary around the sidebar's main content region.
- Prevented navigation items from painting beneath the fixed BizziBuddi footer.
- Preserved independent scrolling for the main navigation area.

## BizziBuddi Sidebar Footer Layout Fix

### Fixed

- Reduced the sidebar BizziBuddi footer footprint so it no longer obscures the main navigation.
- Kept the approved shared BizziBuddi logo and final brand treatment intact.
- Constrained the sidebar itself to the viewport so navigation remains contained and scrollable when space is limited.

---

## BizziBuddi Sidebar Branding

### Changed

- Replaced the old pink “B” platform card in the sidebar footer with the approved BizziBuddi clock logo and wordmark.
- Applied the navy, blue and cyan BizziBuddi palette to the footer card and upgrade button.
- Added the approved “Business support, simplified.” and “Your personal assistant for business.” messaging.
- Updated the dark BizziBuddi wordmark so “Bizzi” remains light while “Buddi” retains the approved blue treatment.

---

## BizziBuddi Sidebar Footer Branding

### Changed

- Replaced the old BizziBuddi sidebar footer badge with the approved BizziBuddi clock logo and wordmark.
- Added the approved “Business support, simplified.” lockup and “Your personal assistant for business.” descriptor.
- Kept the footer's existing plans and upgrade action.
- Corrected the Sidebar JSX closing structure so the application compiles cleanly.

---

## BizziBuddi Final Logo Geometry

### Changed

- Rebuilt the BizziBuddi clock mark from the approved final artwork rather than using a loose interpretation.
- Matched the pointed navy stem, clock-hand proportions, three clockwise-increasing segments and equal segment spacing.
- Preserved the approved navy, blue and cyan palette and the no-centre-dot clock treatment.
- Updated the shared logo component so the same approved mark is used consistently throughout the product.

---

## BizziBuddi Assistant Logo Correction

### Changed

- Corrected the Buddi assistant's light-background logo treatment to use the approved navy BizziBuddi mark rather than the dark-background white variant.
- Kept the dark variant for dark launcher surfaces.
- Ensured the same approved clock mark is used consistently across the assistant header, welcome card and Buddi responses.

---

## BizziBuddi Brand Artwork Refinement

### Changed

- Refined the BizziBuddi clock mark to match the supplied brand artwork more closely.
- Updated the wordmark to the navy/blue split used in the supplied artwork and added the ™ mark.
- Added the full brand lockup treatment with “BUSINESS SUPPORT, SIMPLIFIED.”, “Your personal assistant for business.” and “ORGANISE | PLAN | DO | GROW”.
- Applied the refined lockup to the BizziBuddi website hero while retaining the compact mark for the Buddi assistant and launcher.

---

## BizziBuddi Clock Rebrand

### Changed

- Introduced the new BizziBuddi clock-inspired lowercase “b” logo.
- Added the navy, blue and cyan BizziBuddi brand palette with slate and light neutrals.
- Applied the new logo and branding to the public BizziBuddi landing page and account experience.
- Updated the Buddi launcher and assistant panel to use the new BizziBuddi visual identity.
- Added the supporting brand message “Business support, simplified.” and “Your personal assistant for business.”
- Added the “Organise | Plan | Do | Grow” brand feature line.
- Kept the clock mark's three arc segments evenly spaced while increasing in size clockwise.

---

## Buddi Thinking Animation Reliability

### Fixed

- Restored the visible “Buddi is thinking” label alongside the thinking dots.
- Moved the dot animation styling into the Buddi component so the three dots animate independently and reliably.
- Added staggered animation delays to create a clear bouncing/pulsing sequence.
- Kept the thinking indicator visually prominent while Buddi is processing a request.

---

## Buddi OpenAI Provider

### Changed

- Switched the Buddi assistant service from Gemini to OpenAI.
- Added support for configuring the OpenAI model through `OPENAI_MODEL`.
- Set the default OpenAI model to `gpt-4o-mini`.
- Updated the assistant health response to report the active provider and model.
- Updated the missing-configuration message to reference `OPENAI_API_KEY`.

### Configuration

- Set `OPENAI_API_KEY` in the server environment.
- Optionally set `OPENAI_MODEL` to choose another supported OpenAI model.

---

## BizziBuddi Assistant Visual Polish

### Changed

- Reworked the Buddi assistant panel into a polished, branded studio companion interface.
- Added a structured header with branded identity, greeting and improved visual hierarchy.
- Replaced plain form controls and browser-default action buttons with consistent branded controls.
- Added styled welcome guidance, quick-question pills, conversation message bubbles and Buddi response cards.
- Improved appointment and client creation forms with clearer grouping, spacing and action areas.
- Added a more compact composer with a branded send control.
- Improved panel sizing, scrolling, borders, shadows and responsive behaviour.
- Preserved the existing Buddi question handling, client creation and appointment creation workflows.

---

## Buddi Assistant Improvements

### Added

- Added the BizziBuddi Assistant interface and Buddi branding.
- Added a more prominent “Ask Buddi” launcher for quick access to the assistant.
- Added a visible thinking animation while Buddi processes a question.
- Added natural-language question handling through the connected assistant service.
- Added workspace context so Buddi can answer questions about clients, jobs, garments, payments and upcoming work.
- Added recent conversation history, with the latest enquiry displayed first.

### Changed

- Updated the assistant title to display as `BizziBuddi Assistant`.
- Increased and varied the thinking delay to make processing feedback more apparent.
- Removed provider-specific wording from the visible assistant interface and error messages.

### Notes

- Buddi currently provides informational assistance using the workspace data supplied to the current session.
- Action execution and confirmation-based workflow actions remain future enhancements.

---

## Sidebar Submenu Interaction Fix

### Fixed

- Changed parent navigation items to open their flyout menus on click rather than on hover.
- Prevented hovering over a parent menu item from activating or appearing to select its first submenu item.
- Cleared transient submenu hover states when switching or closing menus.
- Preserved deliberate submenu selection only after the user clicks a submenu option.

---

## Scrollbar-Free Chrysalis Sidebar

### Changed

- Removed the visible sidebar navigation scrollbar.
- Reduced menu spacing and control dimensions so the navigation fits more comfortably within the viewport.
- Kept the BizziBuddi promotional card anchored at the bottom of the sidebar.
- Preserved the BizziBuddi card's prominent crimson border, gradient background and upgrade link.
- Prevented the sidebar itself from overflowing the viewport.

---

## BizziBuddi Account Navigation and Login Improvements

### Added

- Added username capture to the local BizziBuddi account preview.
- Added email-address-or-username login matching for the local mock account flow.
- Linked the public `/login` route to the BizziBuddi account and plans experience.
- Added a `View BizziBuddi plans & upgrade →` call-to-action to the Chrysalis sidebar platform card.

### Changed

- Updated BizziBuddi navigation hover styling so the Log in link receives the same crimson hover treatment as the other menu items.
- Kept the existing production Chrysalis authentication form available outside the public `/login` route.

### Notes

- The BizziBuddi account flow remains a local browser-only mock experience. It is not yet live authentication or billing.

---

## Account Foundation Database Schema

### Added

- Added database migration v4, named `account-foundation`.
- Added a persistent `users` table for account identity, email, display name, password-hash storage and account status.
- Added a persistent `workspaces` table for business/workspace ownership, slug identity and subscription state.
- Added a `workspace_memberships` table linking users to workspaces with role and membership status.
- Added supporting indexes for account status, workspace ownership, subscription state and membership lookups.
- Kept this stage schema-only: existing business records and API behaviour are unchanged.

### Notes

- No live registration, password handling or workspace data isolation has been wired into the application yet.
- Migration v4 runs through the existing migration/backup system before later account and authentication work.

---

## BizziBuddi Account Preview Blank Screen Fix

### Fixed

- Restored the missing account-preview style declarations, including the navigation tab style, status message, plan grid, dashboard cards and callout styles.
- Prevented the BizziBuddi account preview from failing at runtime with `tabStyle is not defined`.

---

## BizziBuddi Mock Registration and Onboarding

### Added

- Added a local-only mock account creation flow to the BizziBuddi account preview.
- Added local mock login behaviour using browser-stored demo account data.
- Added workspace onboarding with business/workspace name capture.
- Added a simulated account dashboard showing workspace readiness, selected plan and billing status.
- Added local plan selection without creating subscriptions or processing payments.
- Added a reset option to clear the mock account from the current browser.

### Notes

- This feature is for interface and workflow testing only.
- No passwords, accounts, payments or subscription records are sent to a server.
- Real authentication, secure storage and billing remain future implementation work.

---

## Bright Red BizziBuddi Theme Accents

### Changed

- Updated the production authentication screen to use the brighter BizziBuddi crimson-red accent colour.
- Updated the production login background, panel, fields, button, error state and account-upgrade link to match the dark BizziBuddi visual direction.
- Kept the upgrade destination at `/bizzibuddi/account` and preserved the existing live login API flow.

---

## BizziBuddi Account Upgrade Navigation

### Added

- Added a clear `View BizziBuddi plans & upgrade` link to the production Chrysalis login screen.
- Connected the production login experience back to `/bizzibuddi/account` for plan information and upgrade options.
- Preserved the existing authentication flow and login behaviour.

---

## BizziBuddi Account Pricing Alignment

### Changed

- Updated the account preview to use the same four plans as the public BizziBuddi pricing section.
- Added Free at $0 forever, Professional at $9/month, Team at $19/month and Business at $39/month.
- Matched plan descriptions, feature lists and the Most Popular treatment for Team.
- Corrected the Free plan billing label so it displays `forever` rather than `/ month`.

---

## BizziBuddi Account Page Visual Styling

### Changed

- Matched the BizziBuddi account preview background to the public website's dark charcoal-to-crimson gradient.
- Updated account-page colours, panels, tabs, form controls and notices to use the public BizziBuddi visual language.
- Matched the account branding mark and crimson accent treatment to the public site.

---

## BizziBuddi Landing Page Styling

### Changed

- Reworked the hero hierarchy so the main workspace message is the dominant headline.
- Reduced the emphasis of the supporting “Run your business. With BizziBuddi.” line.
- Removed the redundant “Included in your workspace” labels from feature cards.
- Expanded the descriptions for People, Jobs, Production, Calendar, Finance and Reports.
- Refined typography throughout the landing page with lighter font weights, particularly in navigation, branding, buttons and footer content.
- Improved hero text sizing and wrapping for clearer presentation across screen sizes.

---

## bizzibuddi Rebrand

### Changed

- Renamed the public business-management platform branding to bizzibuddi.
- Updated the public platform route and navigation links to `/bizzibuddi`.
- Updated the bizzibuddi landing page, legal pages, footer and application dialog branding.
- Updated the platform logo mark to the new b mark.
- Updated the application sidebar platform attribution to bizzibuddi.

---

## Invoice Payment Reconciliation

### Added

- Invoice balances are now reconciled against payments recorded against the invoice's linked Job.
- Invoice responses now expose the authoritative `amountPaid` and `balance` values derived from Job payments.
- Linked invoices now expose a `paymentStatus` reflecting their current financial state.
- Non-draft linked invoices automatically resolve to `Issued`, `Part Paid`, `Paid` or `Overdue` based on recorded payments and due date.
- Draft invoices remain Draft until they are issued.
- Reconciled payment and balance values are persisted when an invoice is saved so stored invoice data remains aligned with the current financial state.

### Changed

- Invoice financial state no longer depends solely on manually entered `amountPaid`, `balance` or status values when the invoice is linked to a Job.
- Existing unlinked invoices retain their stored payment information and document status.

---

## Local Authentication Wiring

### Added

- Added a dedicated local Authentication API on port 4183 using the existing secure authentication module.
- Added local authentication health checking to the development backend launcher.
- Routed `/api/auth/*` requests from the Vite development server to the Authentication API while leaving business APIs on the Database API.
- Added local login, session verification and logout endpoints backed by the existing `server/auth.js` implementation.

### Changed

- The development environment now mirrors the production separation between authentication and business APIs instead of sending authentication requests to the database API.

---

## Client Timeline
