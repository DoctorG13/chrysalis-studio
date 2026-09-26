## BizziBuddi Production Due Date Highlighting

### Added

- Job cards now visually distinguish production ready-by dates that are overdue or due within the next two days.
- Due-today and due-tomorrow labels provide clearer operational timing.
- Normal future ready-by dates remain visible without urgent styling.
- Completed production keeps its ready-by date informational rather than urgent.

### Workflow

`Job → Production stage → Tasks → Readiness → Due-date signal`

---

## BizziBuddi Production Completion Intelligence

### Added

- Jobs now derive a production readiness state from stage, task completion and ready-by date.
- Jobs can surface `Ready`, `Tasks outstanding`, `Stage update needed`, `Overdue`, `In progress`, `Not started` or `Complete`.
- Job cards now show the current readiness state alongside production progress.
- Readiness details are available as contextual information on the job card.

### Workflow

`Job → Stage → Tasks → Readiness → Action`

The readiness state is derived from persisted production data and does not replace the existing five-stage production workflow.

---

## BizziBuddi Production Task Progress

### Added

- Production tasks are now persistent checklist items rather than text-only task lines.
- Tasks can be checked, reopened, added and removed from the Production workspace.
- Task completion counts and percentages are shown in Production.
- Job cards now show completed production tasks alongside stage progress.
- Production task completion and reopening are recorded in the Job Timeline.
- Fixed Production record normalization so Job progress correctly reads persisted stage and task data.

### Workflow

`Job → Production stage → Tasks → Task progress → Timeline`

The five production stages remain the primary workflow state, while task completion provides the granular work-progress view.

---

## BizziBuddi Job Progress Tracker

### Added

- Production tracking is automatically initialised when a new Job is created.
- Jobs expose their linked production stage and progress percentage.
- Job cards show a visual production progress bar and ready-by date.
- Production stage changes are recorded in the Job Timeline.

### Workflow

`Job → Production stage → Progress → Timeline`

The existing five-stage Production workflow remains the source of truth for production progress.

---

## BizziBuddi Job Timeline & Workflow Events

### Added

- Added persistent job-linked workflow events using the existing Automation event store.
- Jobs now record creation events automatically.
- Job status changes are recorded automatically with the previous and new status.
- Other job edits are recorded as job update events.
- Added an authenticated job timeline endpoint.
- Added a Timeline control to each BizziBuddi job so its workflow history can be viewed without leaving the Jobs screen.

### Changed

- Automation events can now optionally reference a persistent Job.
- Job workflow history now survives refresh and logout/login with the BizziBuddi account database.

### Notes

- This feature uses the existing Automation event infrastructure rather than introducing a second timeline data store.
- Timeline events are account-scoped and limited to the authenticated user's jobs.

---

## BizziBuddi Membership & Reporting Cleanup

### Changed

- Removed the obsolete statement that Reports were browser-local.
- Development preview messaging now reflects the current account-backed People, Jobs, Calendar, Finance, Automation, Production and Reports modules.
- Membership persistence and server-backed reporting are now represented consistently in the account UI.

---

## BizziBuddi Membership Persistence

### Changed

- Membership selections now persist to the authenticated BizziBuddi workspace.
- Selecting Free, Professional or Business updates the stored workspace membership plan.
- Refreshing or signing back in now restores the selected membership from the server.
- The Plans screen now describes the development-preview persistence accurately.

### Notes

- This is still a development membership preview; no payment or live subscription billing is created.
- The stored plan controls BizziBuddi feature access after refresh.

---

## BizziBuddi Reports Server Storage

### Added

- Added an authenticated BizziBuddi Reports endpoint that generates business reporting from the persistent account database.
- Added server-authoritative totals for People, Jobs, Calendar, Finance and Production.
- Added server-side calculation of upcoming appointments and overdue invoices.
- Added grouped Job status and Production stage reporting.

### Changed

- Reports no longer calculate their primary figures from browser-local BizziBuddi records.
- The Reports screen now loads the latest account-backed figures when opened.
- Reports now shows a clear server-load error instead of silently falling back to local preview data.

### Notes

- Reports remains available to Business membership levels.
- No separate Reports data table is required because the report is derived from the persistent business modules.

---

## BizziBuddi Production Database Storage

### Added

- Added a persistent `bizzibuddi_production` database table tied to the authenticated BizziBuddi account.
- Added authenticated Production list, save, update and delete endpoints.
- Added server-side validation for production stages, ready-by dates, notes and production tasks.
- Added account-safe links between Production records and persistent Jobs.
- Added one-time migration support for legacy browser-local Production records.

### Changed

- Production records are no longer stored as the primary browser-local business data.
- Production progress now survives refresh and logout/login through the BizziBuddi account database.
- Saving production progress now reports server-side failures instead of silently storing browser data.
- Dashboard and account messaging now identify Production as an account-backed module.

### Notes

- Production remains available to Business membership level.
- Reports remains browser-local until its migration stage.
- Billing/subscriptions remain disconnected; membership selection is still a local preview.

---

## BizziBuddi Automation Database Storage

### Added

- Added persistent BizziBuddi automation event storage tied to the authenticated account.
- Added authenticated Automation event list and event creation endpoints.
- Added a server-side automation check for overdue invoices.
- Added duplicate-safe automation source keys so repeated checks do not create duplicate flags.
- Added persistent appointment reminder events linked to the saved calendar appointment.

### Changed

- Automation events are no longer stored in browser localStorage.
- Automation events now survive refresh and logout/login.
- Running Automation checks now evaluates the account's persistent Finance records on the server.
- The Automation screen now reports newly flagged items from the server.

### Notes

- Automation remains available to Professional and Business membership levels.
- Automation currently prepares and stores follow-up events; it does not send email, SMS or external notifications.
- Production and Reports remain browser-local preview data until their migration stages.

---

## BizziBuddi Finance Migration Fix

- Fixed an incorrectly placed Finance database migration that caused `server/index.js` to fail parsing.
- Restored the migration to the main migration array so the backend can start and apply the Finance schema normally.

---

## BizziBuddi Finance Database Storage

### Added

- Added persistent BizziBuddi invoice and payment tables.
- Added authenticated Finance list and create endpoints.
- Added authenticated invoice payment recording.
- Added automatic invoice balance calculation from recorded payments.
- Added automatic financial status handling for Issued, Part Paid, Paid and Overdue invoices.
- Added account-safe links between invoices and People.
- Added server-side validation for invoice amounts, dates and payments.

### Changed

- Finance is no longer stored in browser localStorage.
- Invoice records now survive refresh and logout/login.
- Mark paid now records a real payment against the invoice instead of changing a browser-only status.
- Finance totals now use server-authoritative balances and payment totals.
- BizziBuddi account messaging now identifies People, Jobs, Calendar and Finance as persistent account-backed modules.

### Notes

- Finance remains available to Professional and Business membership levels.
- Billing/subscriptions are still not connected; membership selection remains a local preview.
- Automation, Production and Reports remain browser-local preview data for their future migration stages.

---

## BizziBuddi Calendar Load Fix

- Prevent a Calendar API/load failure from clearing successfully loaded People and Jobs.
- Account startup now handles People, Jobs and Calendar loading independently.

---

## BizziBuddi Calendar Database Storage

### Added

- Added a dedicated `bizzibuddi_calendar` database table tied to the authenticated BizziBuddi account.
- Added persistent calendar entries linked to People and Jobs.
- Added authenticated Calendar list, create, update and delete endpoints.
- Added server-side validation for appointment title, date, time, duration, buffer and status.
- Added safe `ON DELETE SET NULL` relationships so deleting a Person or Job does not delete calendar history.
- Added Edit and Delete controls with confirmation and error handling.

### Changed

- Calendar appointments are no longer stored in browser localStorage.
- Calendar data now survives refresh and logout/login.
- Calendar selectors use the real persistent People and Jobs records.
- Free accounts retain basic appointment details, while Professional and Business accounts expose the existing advanced scheduling controls.

### Notes

- People, Jobs and Calendar are now persistent BizziBuddi business-data modules.
- Finance, Automation, Production and Reports remain browser-local preview data until their respective migration stages.

---

## BizziBuddi Jobs Database Storage

### Added

- Added a dedicated `bizzibuddi_jobs` database table linked to the authenticated BizziBuddi account.
- Linked each job to a persistent BizziBuddi Person record.
- Added authenticated Jobs list, create, update and delete endpoints.
- Added server-side validation for job name, assigned person and status.
- Added safe `ON DELETE SET NULL` handling so deleting a Person does not delete their Jobs.
- Updated the Jobs screen to load and save records through the server database.
- Added Edit and Delete actions with confirmation and save-state/error handling.

### Changed

- Jobs are no longer stored in browser localStorage.
- Jobs now survive refresh and logout/login through persistent account storage.
- The Jobs client selector uses the real People database IDs.
- If a linked Person is deleted, the Job remains and is displayed as Unassigned.

### Notes

- People and Jobs are now the first two persistent BizziBuddi business-data modules.
- Calendar, Finance, Automation, Production and Reports remain browser-local preview data until their respective migration stages.

---

## BizziBuddi People Compile Fix

### Fixed

- Removed a duplicate `smallActionButton` declaration introduced while finishing People edit and delete support.
- Restored the BizziBuddi account page to a valid Vite/JSX build.
- Preserved the existing People Edit and Delete functionality.

---

## BizziBuddi People Edit, Delete & Cleanup

### Added

- Added server-backed People editing.
- Added server-backed People deletion with account ownership checks.
- Added Edit and Delete actions to each People record.
- Added confirmation before permanently deleting a person.
- Added clear save/delete error handling and save-state feedback.

### Changed

- People now have complete first-stage CRUD support: create, read, update and delete.
- The People form now supports both adding and editing records without changing the existing visual direction.
- The previous duplicate test records can now be safely cleaned up through the People interface.

### Notes

- People remain persistent database records tied to the authenticated BizziBuddi account.
- Jobs have not yet been migrated and therefore are not yet linked to People at the database level.

---

## BizziBuddi People Save Form Fix

### Fixed

- Fixed the People form attempting to call `reset()` on React's cleared event target after the asynchronous database save completed.
- People can now be saved without the post-save `Cannot read properties of null (reading 'reset')` error.
- Preserved the server-backed People persistence introduced in the previous release.

---

## BizziBuddi People Database Storage

### Added

- Added a dedicated `bizzibuddi_people` database table linked to the authenticated BizziBuddi account.
- Added authenticated People list and create endpoints.
- Added server-side validation for person name, email and phone details.
- Updated the BizziBuddi People screen to load records from the server database.
- Updated new People records to persist through the authenticated account session.

### Changed

- People are no longer stored in browser localStorage.
- Existing local demo storage remains in place for the other BizziBuddi modules until each module is migrated.
- People records are scoped to the authenticated BizziBuddi account.

### Notes

- This is the first BizziBuddi business-data module moved to persistent server storage.
- Jobs, Calendar, Finance, Automation, Production and Reports remain browser-local preview data for their respective migration stages.

---

## BizziBuddi Logged-Out Help Navigation Styling

### Fixed

- Moved the shared BizziBuddi account-page Help & Support navigation styles outside the authenticated-account conditional.
- Logged-out users now see the intended styled Ask Buddi and Help & Support controls instead of browser-default buttons.
- Kept the floating Ask Buddi launcher account-only.
- Preserved the existing navigation, authentication protection and responsive layout.

---

## BizziBuddi Registration Email Validation Fix

### Fixed

- Corrected the BizziBuddi server-side email validation regular expression.
- Valid email addresses containing the letter `s` are now accepted correctly during account registration.
- Preserved the existing authentication flow, password validation and account security behaviour.

---

## BizziBuddi Real Account Authentication

### Added

- Replaced the BizziBuddi browser-only mock registration and login with a real server-backed account flow.
- Added persistent BizziBuddi user records using the existing account foundation database.
- Added username support with a unique database index.
- Added secure password hashing using Node's built-in scrypt implementation with per-password salts.
- Added server-side BizziBuddi sessions stored in SQLite with random session tokens, expiry and server-side logout invalidation.
- Added same-origin authentication endpoints for registration, login, session recovery, business setup and logout.
- Added local BizziBuddi authentication service and Vite proxy support.
- Connected the production gateway to the same BizziBuddi authentication service logic so local and public builds use the same account behaviour.
- Scoped the remaining browser-local BizziBuddi demo business records to the authenticated account ID to prevent users in the same browser from sharing those preview records.
- Protected the account dashboard and business modules from unauthenticated access in the account UI.

### Changed

- BizziBuddi account creation and login no longer store account credentials in localStorage.
- Business setup now persists the business name to the server account record.
- The account preview now clearly distinguishes live account authentication from the remaining local business-data preview.
- Existing Chrysalis authentication remains separate and unchanged.
- Membership plan selection remains a local preview until billing/subscriptions are implemented.

### Notes

- People, Jobs, Calendar, Finance, Automation, Production and Reports are still browser-local preview data at this stage.
- The next data-storage stage will move those records behind the authenticated account and server database.

---

## BizziBuddi Mobile Dashboard Buddi Layout

### Fixed

- Made the Dashboard Ask Buddi card responsive on narrow mobile screens.
- Stacked the Buddi card content and full-width action button on small screens so the description no longer collapses into a narrow column.
- Hid the floating Ask Buddi launcher on the Dashboard at mobile widths to prevent it from obscuring dashboard content.
- Preserved the existing desktop and tablet dashboard layout and Buddi access on other account views.

# Changelog

## BizziBuddi Buddi Direct Actions

- Added direct navigation actions to Buddi responses for Finance, Calendar, Jobs and Production.
- Actions are suggested from the question and the supplied dashboard attention data, keeping them relevant to the current business picture.
- Attention responses can now lead directly from an overdue payment, today's appointments, waiting jobs or ready production to the relevant BizziBuddi area.
- Kept the Buddi experience read-only; these actions only navigate and do not modify records.

## BizziBuddi Dashboard-to-Buddi Attention Flow

- Connected the dashboard's **Ask Buddi what needs attention →** action directly to Buddi.
- Added the dashboard attention picture to Buddi's supplied business context so the response is grounded in the same overdue payments, today's appointments, waiting jobs and ready production items shown on the dashboard.
- Automatically sends **What needs attention today?** when that dashboard action is used, instead of merely opening the Buddi screen.
- Added BizziBuddi-specific assistant guidance to keep attention responses concise, prioritised and practical.
- Kept Buddi read-only; no records are created or changed by this flow.

## BizziBuddi Dashboard Attention Overview

- Made **What needs attention today?** the central dashboard business overview.
- Added live attention items for overdue invoices, today's appointments, waiting jobs and production ready items.
- Added summary figures for attention count, today's appointments, open jobs and outstanding money.
- Added direct navigation from each attention item into the relevant BizziBuddi area.
- Added prominent **Ask Buddi** actions so Buddi can help interpret the current business picture.
- Preserved the existing dashboard stats, membership access and quick actions beneath the new overview.

## BizziBuddi Support Form Runtime Fix

- Fixed the Contact Support blank-page error caused by the support textarea style referencing `inputStyle` before that style was initialized.
- Kept the support textarea styling visually consistent without introducing a dependency on declaration order.

## BizziBuddi Help Centre Contact Support

- Added a functional **Contact support** panel to Help & Support.
- Added support categories covering the main BizziBuddi areas.
- Added subject, message, name and email fields with local demo persistence.
- Added a clear confirmation state and support-request history storage for the current browser.
- Kept the experience ready for a future connection to a real support service without inventing a support endpoint.

## BizziBuddi Help Centre FAQs

- Added an expandable **Frequently asked questions** section to Help & Support.
- Added practical answers covering BizziBuddi, memberships, People, Jobs, Calendar, Buddi, upgrading and getting help.
- Added automatic scrolling to the FAQ section when opened.
- Kept the FAQ interaction consistent with the existing Getting Started and Feature Guides Help Centre pattern.

## BizziBuddi Help Centre Feature Guides

- Made the **Getting Started** selection automatically scroll to the **BIZZIBUDDI QUICK START** guide.
- Added an expandable **Feature Guides** Help Centre experience covering People, Jobs, Calendar, Finance, Automation, Production and Reports.
- Added feature-specific explanations, practical steps and direct navigation into each available BizziBuddi area.
- Kept the existing Help & Support structure and visual language intact.

## BizziBuddi Getting Started Style Collision Fix

- Fixed the blank BizziBuddi account page caused by the Getting Started item array being passed to a React `style` prop.
- Renamed the Getting Started data collection separately from its layout style object.
- Preserved the existing Getting Started design and behaviour.

## BizziBuddi Help Navigation CSS Rendering Fix

- Moved the new help-navigation presentation from React inline style objects into scoped CSS classes.
- Removed the CSSStyleDeclaration indexed-property failure that could blank the local account page in Chromium.
- Preserved the approved Ask Buddi / Help & Support visual design and responsive behaviour.


## BizziBuddi Getting Started Guide

- Added a guided five-step **Getting Started** experience inside Help & Support.
- Added direct actions into the dashboard, People, Jobs, Calendar and Ask Buddi areas.
- Kept the guide local and lightweight with no changes to account, billing or business data architecture.


## BizziBuddi Help Navigation Runtime Fix

- Corrected the Ask Buddi/help navigation icon style reference that caused the account page to render blank.
- No visual or behavioural changes beyond restoring the new help navigation.


## BizziBuddi Help Navigation Visual Upgrade

- Elevated the **Need a hand?** area into a larger, more prominent help block.
- Made **Ask Buddi** the visually dominant assistance action.
- Added supporting descriptions and directional arrows to both help actions.
- Replaced the generic robot emoji treatment with a cleaner chat-style Buddi icon.
- Kept the approved BizziBuddi colour language and existing interactions intact.


## BizziBuddi Help Navigation Hierarchy

- Grouped **Ask Buddi** and **Help & Support** as a dedicated assistance area in the account navigation.
- Added clearer visual hierarchy so Buddi is the primary help action while Help & Support remains directly beside it.
- Preserved the existing account navigation and assistant behaviour.


## BizziBuddi Help & Floating Buddi

- Added a dedicated **Help & Support** area to the BizziBuddi account experience.
- Added **Ask Buddi** as the primary action from Help & Support.
- Added a persistent floating **Ask Buddi** launcher for signed-in/local account previews.
- Kept the existing Buddi assistant, branding and business-data context intact.


All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Buddi Dashboard Visibility

### Added

- Added a dedicated Ask Buddi navigation tab to the BizziBuddi account experience.
- Added a prominent Buddi assistant card near the top of the BizziBuddi business dashboard.
- Kept the existing Ask Buddi dashboard action and assistant experience intact.

## BizziBuddi Buddi Import Fix

### Fixed

- Corrected the BizziBuddi account Buddi component's relative logo import so Vite resolves the shared BizziBuddi logo correctly.

## BizziBuddi Account Buddi Assistant

### Added

- Added a dedicated Buddi assistant experience inside the BizziBuddi account dashboard.
- Added an Ask Buddi dashboard action that opens the assistant with the current local BizziBuddi business data as context.
- Added quick business questions covering attention, workload, upcoming activity, outstanding money and jobs in progress.
- Added the visible “Buddi is thinking” animation while the assistant is processing a request.
- Added business-aware assistant prompting so the shared OpenAI service identifies the account experience as BizziBuddi and responds as Buddi.
- Kept this first account integration informational only: Buddi does not create or modify BizziBuddi records from this screen.

## BizziBuddi Production JSX Parsing Fix

### Fixed

- Reworked the BizziBuddi Production panel JSX structure to remove the nested fragment/conditional structure that was causing the Vite JSX transform failure.
- Preserved the existing Business-only production tracking behaviour and UI while simplifying its render structure.

## BizziBuddi Entry and Account Flow

### Fixed

- Connected the public BizziBuddi hero and closing CTA buttons directly to account creation.
- Connected the public pricing buttons to BizziBuddi account creation for Free and the membership plans preview for Professional and Business.
- Connected the BizziBuddi landing-page Log in links directly to the BizziBuddi account login view.
- Added a clear Log out action to the BizziBuddi account dashboard.
- Preserved local BizziBuddi business data when logging out so the mock account can be logged into again.
- Updated the mock login flow to recover the stored local account after logout.
- Kept billing, subscriptions and real authentication disconnected as planned.


## BizziBuddi Business Advanced Reporting Preview

### Added

- Added a Business-only Advanced Reporting preview to BizziBuddi.
- Added business-at-a-glance metrics for people, open jobs, upcoming appointments and outstanding invoices.
- Added finance reporting for invoiced, paid, outstanding and overdue amounts.
- Added job status reporting across New, In progress, Waiting and Complete.
- Added calendar activity reporting for total, upcoming, booked/confirmed and cancelled appointments.
- Added production status reporting for active, complete and stage-level production records.
- Kept reporting local-only and calculated from existing BizziBuddi browser data.
- Added Reports to the BizziBuddi dashboard and membership access experience.
- Locked Advanced Reporting for Free and Professional membership with an upgrade path to Business.


## BizziBuddi Business Production Tracking Preview

### Added

- Added a local BizziBuddi Production preview for Business membership.
- Added production stages from Not started through Complete.
- Added ready-by dates and production notes.
- Added production task entry for each tracked job.
- Added production progress visibility and tracked-job summaries.
- Added Production to the BizziBuddi dashboard and membership access experience.
- Locked Production for Free and Professional membership with an upgrade path to Business.
- Kept production tracking local-only and independent from the existing production Chrysalis garment workflow.


---

## BizziBuddi Professional Automation Preview

### Added

- Added a local BizziBuddi Automation preview for Professional and Business membership.
- Added automatic local reminder events when appointments are created.
- Added a local overdue-invoice automation check.
- Added automation event history to the BizziBuddi account preview.
- Added Automation to the BizziBuddi dashboard and membership access experience.
- Locked Automation for Free membership with an upgrade path to membership plans.
- Kept automation local-only with no external email, messaging or notification delivery.


---

## BizziBuddi Advanced Scheduling Preview

### Added

- Added Professional and Business advanced scheduling controls to the BizziBuddi calendar preview.
- Added appointment duration tracking.
- Added optional buffer time between appointments.
- Added appointment status tracking for Booked, Confirmed, Pending and Cancelled.
- Added advanced scheduling details to appointment listings.
- Clearly identify the Professional scheduling capability in the calendar preview.
- Kept Free membership on the existing basic calendar experience.
- Kept advanced scheduling local-only and independent from the production Chrysalis Calendar implementation.


## BizziBuddi Professional Finance Preview

### Added

- Added a local BizziBuddi Finance preview for Professional and Business membership.
- Added local invoice creation with client, amount and due date.
- Added invoice totals for outstanding and paid amounts.
- Added local invoice payment status with a simple Mark paid workflow.
- Added local browser persistence for BizziBuddi invoices.
- Locked Finance for Free membership and provided an upgrade path to the membership plans.
- Kept the finance preview independent from the existing production Chrysalis Finance implementation.
- Kept billing, subscriptions and real payment processing disconnected as planned.


## BizziBuddi Calendar Preview

### Added

- Added a local BizziBuddi Calendar preview for the Free membership.
- Added appointment creation with date, time, optional person and notes.
- Added appointment listing ordered by date and time.
- Added local browser persistence for BizziBuddi calendar appointments.
- Added Calendar as a dashboard starting point and business stat.
- Kept the calendar preview independent from the existing production Chrysalis Calendar implementation.

All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Membership Feature Access

### Added

- Added a membership access panel to the BizziBuddi account preview.
- Connected the account preview to the shared membership entitlement helper.
- Clearly show which current and planned capabilities are included in the selected membership.
- Show locked Professional and Business capabilities without pretending those future features are already available.
- Kept the feature-access model local and billing-free as planned.

All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Pricing Baseline

### Changed

- Set the BizziBuddi Professional membership to $29/month.
- Set the BizziBuddi Business membership to $59/month.
- Kept Free at $0 forever.
- Kept pricing centralised in the shared BizziBuddi membership definition so the public pricing and account preview remain aligned.
- Kept billing and subscriptions disconnected as planned; these prices are currently presentation and membership-definition values only.

All notable changes to Chrysalis are recorded here.

---

## BizziBuddi Membership Tiers Foundation

### Changed

- Replaced the four-tier BizziBuddi pricing model with three membership levels: Free, Professional and Business.
- Removed Team membership from the current product direction so BizziBuddi remains focused on individual business owners.
- Removed team and shared-workspace language from the BizziBuddi account preview.
- Added a shared BizziBuddi membership definition with explicit feature entitlements for future feature gating.
- Kept membership selection local-only with no live billing or subscriptions.
- Positioned membership tiers as the mechanism for unlocking additional BizziBuddi functionality as the product expands.

### Membership levels

- Free — People & contacts, Basic jobs, Calendar and Dashboard.
- Professional — Free features plus Advanced scheduling, Payments & invoices and Automation.
- Business — Professional features plus Production tracking, Advanced reporting, Priority features and Professional controls.

## BizziBuddi Jobs Workspace Preview

### Added

- Added the first functional Jobs workspace to the local BizziBuddi preview.
- Added job creation with a job name, client assignment and status.
- Added a simple jobs list with client and status visibility.
- Added local-only job persistence in the browser.
- Connected the workspace welcome screen's “Create a job” action to the Jobs workspace.
- Kept job creation dependent on a person being available for assignment.


## BizziBuddi People Workspace Preview

### Added

- Added the first functional People workspace to the local BizziBuddi preview.
- Added a simple people list with name, email and phone details.
- Added local-only person creation and browser persistence.
- Connected the workspace welcome screen's “Add your people” action to the People workspace.
- Kept the feature independent from the existing Chrysalis People page and real database until the BizziBuddi workspace architecture is ready.


## BizziBuddi Workspace Welcome Preview

### Changed

- Reworked the completed local account dashboard into a simple BizziBuddi workspace welcome screen.
- Replaced the simulated account-dashboard messaging with workspace-focused People, Jobs and plan starting points.
- Added a clearer “your workspace is ready” experience after onboarding.
- Kept all actions local and clearly marked the workspace as a development preview.
- Removed the unused business-name field from account creation so workspace naming remains part of the onboarding step.


## BizziBuddi Account Onboarding Flow

### Changed

- Separated account creation from workspace setup so the business name is collected once during onboarding.
- Added clear step labels for the account and workspace stages.
- Updated the account action labels to make the transition into workspace setup explicit.


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
