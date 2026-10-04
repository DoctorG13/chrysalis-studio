## BizziBuddi Demo Sandbox — Proper Data Entry UX

### Changed

- Replaced browser prompt dialogs with proper inline demo forms.
- Added a clear **Add a person** form at the top of the Demo People workspace with Name, Email and Phone fields.
- Added equivalent inline forms for demo Jobs, Appointments and Custom Fields.
- Added inline remove confirmation instead of browser confirm dialogs.
- Kept all demo mutations strictly inside the isolated in-memory demo dataset.
- Made it explicit that demo records never write to the authenticated People, Jobs, Calendar or other account workspaces.

---

## BizziBuddi Demo Sandbox 2.0

### Added

- Converted Explore BizziBuddi from a read-only sample view into an interactive temporary sandbox.
- Added temporary demo People creation/removal.
- Added temporary demo Jobs creation/removal and status cycling.
- Added temporary demo Appointments.
- Added temporary Production task interaction.
- Added temporary Custom Field creation.
- Added dynamic demo Buddi priorities based on sandbox changes.
- Added prominent Reset Demo / Restore Original Sample Business controls.
- Confirmed sandbox actions do not call BizziBuddi APIs or write to the production database.

---

## BizziBuddi Universal Business Foundation

### Added

- Added an isolated Explore BizziBuddi demo workspace with realistic sample People, Jobs, Calendar, Finance, Production, Automation, custom-field and Buddi examples.
- Added configurable business profiles with industry starting templates for general business, dressmaking, hairdressing, tattoo studios, schools, trades and consulting.
- Added configurable business terminology so industry language can sit above the shared BizziBuddi core.
- Added persistent custom-field definitions and values for People, Jobs, Appointments and Invoices.
- Added Account → Business Profile configuration for selecting an industry template and adding custom fields.
- Kept demo data isolated from real BizziBuddi account storage.

### Changed

- BizziBuddi account data now exposes business type and terminology configuration alongside existing account information.

---

## BizziBuddi Clean Start / Business Reset

### Added

- Added a secure **Account → Start fresh** business-data reset workflow.
- Requires the explicit confirmation phrase **START FRESH** before deletion.
- Creates a full database safety backup before clearing account data.
- Clears account-scoped People, Jobs, Calendar, Finance, Expenses, Production, Production Templates, Production Time, Measurements and Automation data.
- Preserves the BizziBuddi account, login, membership and business identity.
- Removed the legacy local-demo reset from the Dashboard.
- Replaced development-preview wording with production-ready account language.

## People Client Calendar Snapshot

### Added

- Added a Calendar snapshot to the People Client Overview.
- Shows upcoming appointments and fittings linked to the selected person.
- Shows appointment date/time, title and linked job where available.
- Added direct **Open** actions for individual bookings and an **Open calendar** action for the next booking.
- Keeps calendar changes in the Calendar workspace while the People overview remains read-only.

## People Client Production Snapshot

### Added

- Added a Production snapshot to the People Client Overview.
- Shows the client's current production job, stage and due date.
- Added direct **Open production** navigation for the linked job.
- Keeps production data read-only from the People workspace.

## People Client Payment Snapshot

### Added

- Added payment activity to the People Client Overview.
- Shows total payments received and payment count across linked invoices.
- Shows the latest payment date plus recent payment method, invoice, description and amount.
- Uses the existing invoice payment data, keeping the People view read-only and Finance as the place for payment changes.

## People Client Finance Snapshot

### Added

- Added a Finance snapshot to the People Client Overview.
- Shows linked invoice count, invoice totals and outstanding balance.
- Shows up to three recent linked invoices with status, amount and balance due.
- Added direct **Open finance** / **View invoices** actions using the existing Finance view.

## People Client Overview

### Added

- Added a focused Client Overview panel from the People workspace.
- Clicking a person's name now surfaces their contact details, jobs, next booking and outstanding balance.
- Added quick access to the latest job, timeline, measurements and recent activity.
- Kept the existing People cards and actions available underneath the overview.

## BizziBuddi Help Rail Text Direction

### Changed

- Reversed the vertical text direction on the fixed Ask Buddi and Help rail.
- Kept **Ask Buddi** as the top action and **Help** as the lower action.
- Preserved the existing icons, click behaviour, active states and mobile horizontal layout.

## People Upcoming Booking Accuracy

### Fixed

- People card booking snapshots now ignore past appointments when selecting the next booking.
- The displayed booking is now the nearest booking from today onward.

## People Client Relationship Snapshot

### Added

- Added at-a-glance job status, next booking and outstanding balance information to People cards.
- Used the nearest upcoming booking for each person.
- Calculated outstanding balance from linked invoice balances.
- Preserved existing People actions and responsive card structure.

## People Primary Action Polish

### Changed

- Made the most relevant action on each People card visually prominent.
- People with jobs now show a direct **Open job** primary action.
- People without jobs now use **Timeline** as the primary action.
- Kept Timeline, Measurements, Edit and Delete available as secondary actions.

## People Relationship Summary

### Added

- Added compact Jobs, Bookings and Invoices relationship badges to each People card.
- Made each person's current business relationship easier to scan without opening their timeline.
- Preserved all existing Timeline, Measurements, Edit and Delete actions.

## People Summary Card Formatting Fix

### Fixed

- Separated People summary labels, counts and descriptions into clear vertical rows.
- Prevented summary text from running together on desktop layouts.
- Preserved the existing three-card responsive layout and People metrics.

## BizziBuddi People Parse Error Hotfix

### Fixed

- Corrected the People form conditional introduced by the workspace landing polish.
- Restored valid JSX conditional syntax so Vite/OXC can transform the page successfully.

## BizziBuddi People Workspace Landing Polish

### Changed

- Added a clearer People workspace hero with direct Add a person action.
- Added People, With Jobs and With Bookings summary metrics for quick orientation.
- Clarified how People connects to jobs, appointments, finance and production.
- Added narrow-screen responsive treatment for the People header and summary.
- Preserved existing search, editing, timeline, measurements and deletion workflows.

## BizziBuddi Today Responsive Polish

### Changed

- Added a dedicated responsive treatment for the completed Today operating view.
- Tightened panel padding and heading scale on narrow screens.
- Stacked Today information grids cleanly at tablet/mobile widths.
- Kept the summary metrics compact and readable in a two-column mobile layout.
- Preserved existing navigation, actions and desktop presentation.

## BizziBuddi Today Dashboard Completion Pass

### Changed

- Tightened the spacing between the Today dashboard's major sections.
- Reduced panel padding and grid gaps for a cleaner operating-view rhythm.
- Preserved the existing Today hierarchy, content, actions and responsive layout.

## BizziBuddi Today Business Health States

### Changed

- Added clear Good, Watch and Neutral state badges to Business Health metrics.
- Improved the visual hierarchy between each metric's state, value and detail.
- Preserved the existing descriptive health calculations and data.

## BizziBuddi Today Notifications Polish

### Changed

- Added clear Urgent, Attention and Today status badges to notifications.
- Strengthened notification title hierarchy and action visibility.
- Preserved existing Open and Dismiss behaviour and notification filtering.

## BizziBuddi Today Recent Activity Categories

### Changed

- Added clear category badges to Recent Activity for Finance, Jobs, Calendar, Production and Automation.
- Matched each activity category with a distinct visual treatment for faster scanning.
- Preserved existing activity ordering, timestamps and navigation actions.

## BizziBuddi Today Workflow Status Polish

### Changed

- Added clear workflow status badges for Overdue, Tasks Outstanding, Stage Update Needed and Waiting.
- Combined workflow blockers into one compact, scannable list while avoiding duplicate jobs.
- Preserved direct job navigation from every workflow item.

## BizziBuddi Today Due Soon Polish

### Changed

- Added clearer relative deadline labels for invoices and production deadlines: Today, Tomorrow and This week.
- Kept the underlying due dates visible for precise reference.
- Preserved existing Finance and Jobs navigation actions.

## BizziBuddi Today Schedule Grouping

### Changed

- Split today's appointment view into a clearer Now and Today presentation.
- Added current-hour detection for appointments with recognisable times.
- Kept today's appointments sorted by time for easier scanning.
- Preserved the existing Due Soon and Workflow views and their actions.

## BizziBuddi Today Priority Card Polish

### Changed

- Added clear urgency badges to Today priority cards: Urgent, Attention, Today and Next.
- Added a simple priority position indicator so the queue is easier to scan.
- Improved priority-card text hierarchy and detail readability without changing the underlying intelligence or actions.
- Preserved existing priority ordering, deep links and action handlers.

## BizziBuddi Today Operating View Command Bar

### Added

- Added a compact Today command bar to the main business operating view.
- Shows the current day prominently and provides direct jumps to Priorities, Upcoming and Attention.
- Added live counts for priority actions, today's appointments and active attention items.
- Preserved the existing sticky navigation, deep links and no-horizontal-scroll behaviour.

## BizziBuddi Today Navigation Polish

### Changed

- Verified the Today submenu now provides four distinct daily operating views: Overview, Priorities, Upcoming and Attention.
- Kept Overview focused on the current business picture and highest-priority actions.
- Kept Priorities focused on actionable items requiring follow-up.
- Kept Upcoming focused on today's schedule and near-term due work.
- Kept Attention focused on active notifications with open and dismiss actions.
- Preserved existing deep links, sticky navigation, in-page scrolling and no-horizontal-scroll safeguards.

## BizziBuddi Account Submenu Polish

### Changed

- Verified and completed the Account submenu with Plans, Membership and Account destinations.
- Kept Plans linked to the membership/pricing view and Membership linked to the account membership section.
- Kept Account linked to the account details section.
- Preserved the balanced submenu sizing, sticky navigation and no-horizontal-scroll safeguards.

## BizziBuddi Assist Submenu Polish

### Changed

- Applied and verified the balanced submenu treatment for Assist: Buddi and Automation.
- Kept the two Assist items evenly distributed within the existing Assist navigation span.
- Preserved existing Assist routes, sticky navigation and no-horizontal-scroll safeguards.

## BizziBuddi Insights Submenu Polish

### Changed

- Applied the balanced submenu sizing treatment to Insights: Reports, Performance and Trends.
- Kept the three Insights items evenly distributed within the existing Insights navigation span.
- Preserved existing Insights routes, anchors, sticky navigation and no-horizontal-scroll safeguards.

## BizziBuddi Work Submenu Polish

### Changed

- Applied the balanced submenu sizing treatment to Work: People, Jobs, Calendar and Production.
- Kept each Work item evenly distributed within the existing Work navigation span.
- Preserved the existing Work routes, anchors, sticky navigation and no-horizontal-scroll safeguards.

## BizziBuddi Finance Overlap Fix and Today Submenu Polish

### Changed

- Fixed the Finance submenu sizing so Expenses & Outgoings no longer overlaps Cashflow Outlook.
- Applied border-box sizing and contained text rendering to the balanced Finance controls.
- Applied the same balanced-width treatment to the Today submenu for a cleaner, more consistent navigation row.
- Added full-label hover titles for submenu items while preserving the existing labels, routes, sticky behaviour and no-horizontal-scroll safeguards.

## BizziBuddi Finance Submenu Balance

### Changed

- Balanced the five Finance submenu controls across the available Finance navigation area.
- Kept Finance items visually consistent while allowing the longer Expenses & Outgoings label to remain contained.
- Preserved existing Finance labels, routes, anchors, sticky behaviour and no-horizontal-scroll safeguards.

## BizziBuddi Finance Navigation Terminology

### Changed

- Renamed the Finance submenu's Overview item to Revenue to reflect its destination more directly.
- Renamed Expenses to Expenses & Outgoings for clearer financial terminology.
- Renamed Cashflow to Cashflow Outlook to better describe the linked cashflow view.
- Preserved all existing Finance routes, anchors, sticky navigation behaviour and no-horizontal-scroll safeguards.

## BizziBuddi Workspace Navigation — Responsive No-Scroll Polish

### Changed

- Added a compact three-column workspace menu layout below 900px.
- Added a two-column workspace menu layout on narrow screens.
- Let contextual submenus use the full available width on smaller screens instead of preserving desktop column offsets.
- Reduced navigation button sizing at phone widths while keeping all menu items accessible.
- Preserved the sticky navigation and the no-horizontal-scroll requirement.

---

## BizziBuddi Workspace Navigation — Compact Sticky No-Scroll Refinement

### Changed

- Kept **FINANCE** as the primary label for the money-management section.
- Made the outer workspace navigation shell the single sticky container, avoiding nested sticky behaviour.
- Kept the primary menu and contextual submenu visually connected as one compact navigation unit.
- Explicitly clipped horizontal overflow in the navigation layers so no horizontal scrollbar can be introduced by menu items.
- Preserved all existing submenu destinations and in-page anchor scrolling.

---

## BizziBuddi Workspace Navigation — Utility Rail Outside Sticky Nav

### Changed

- Moved the **ASK BUDDI / HELP** rail outside the sticky workspace navigation container.
- Prevented the rail from being positioned relative to the sticky navigation's visual-effects container.
- Kept the utility rail fixed to the viewport with a high stacking order.
- Preserved the sticky primary menu and contextual submenu.

---

## BizziBuddi Workspace Navigation — Sticky Utility Rail Fix

### Changed

- Moved the **ASK BUDDI / HELP** utility rail completely outside the sticky workspace navigation DOM.
- Prevented the rail from being trapped inside the sticky navigation's visual effects or appearing over the selected menu.
- Kept the desktop utility rail fixed to the viewport and the compact mobile layout intact.
- Preserved the sticky primary menu and contextual submenu.

---

## BizziBuddi Workspace Navigation — Help Rail Placement

### Changed

- Moved the vertical **ASK BUDDI / HELP** utility rail out of the workspace navigation area so it no longer overlaps the selected primary menu or contextual submenu.
- Positioned the utility rail in the clear left-side viewport margin on desktop.
- Preserved the compact bottom utility bar on smaller screens.
- Kept the help rail fixed and available while the workspace navigation remains sticky.

---

## BizziBuddi Workspace Navigation — Sticky Help Rail

### Changed

- Kept the main workspace menu and contextual submenu sticky together at the top of the viewport while scrolling.
- Replaced the large inline **ASK BUDDI** / **HELP & SUPPORT** area beneath the navigation with a compact vertical sticky utility rail.
- Kept the help actions available without consuming a large block of workspace height.
- Kept the help rail keyboard- and screen-reader-friendly with labels, titles and accessible button names.
- Added a compact two-button bottom bar for narrow screens instead of allowing the help rail to interfere with the workspace.
- Preserved existing Ask Buddi and Help & Support navigation behaviour.

---

## BizziBuddi Workspace Navigation — Compact Sticky Menu

### Changed

- Made the sticky workspace navigation more compact to preserve more vertical space while scrolling.
- Kept the main menu and contextual submenu together as one sticky navigation unit.
- Kept all primary menu sections visible without horizontal scrolling.
- Kept submenu items wrapping within their aligned section rather than introducing a horizontal scrollbar.
- Kept contextual submenus visually close to and aligned beneath the selected main-menu section.
- Preserved the existing contextual destinations and in-page anchor scrolling.

---

## BizziBuddi Workspace Navigation — Sticky Fix

### Changed

- Fixed the workspace navigation so the **FINANCE** menu and all contextual submenus remain sticky during page scrolling.
- Changed the account page horizontal overflow handling to `overflow-x: clip`, allowing CSS `position: sticky` to work without introducing a horizontal scrollbar.
- Made the outer workspace navigation shell the single sticky container so the main menu and submenu stay together as one unit.
- Kept the submenu aligned beneath the selected main-menu section and wrapped within the available width.

---
## BizziBuddi Workspace Navigation — Sticky, No-Scroll Polish

### Changed

- Kept **FINANCE** as the primary label for the money section.
- Kept the authenticated workspace menu and contextual submenu sticky together while scrolling.
- Removed horizontal overflow from the primary menu so it cannot produce a horizontal scrollbar.
- Kept contextual submenu items wrapped within their aligned section area rather than scrolling sideways.
- Kept the submenu visually attached directly beneath the selected main-menu section.
- Preserved the existing contextual destinations and in-page anchor scrolling.

---
## BizziBuddi Sticky Workspace Navigation

### Changed

- Fixed the JSX parse error introduced while refining the workspace navigation.
- Kept **FINANCE** as the primary money section label.
- Made the main workspace navigation and its contextual submenu sticky so they remain available while scrolling.
- Removed horizontal menu/submenu scrolling and kept submenu items wrapped within their aligned section area.
- Kept submenu destinations connected to their real in-page sections, including Finance reporting, invoices, payments, expenses and cashflow; Reports sections; Account sections; and Today sections.
- Adjusted submenu alignment so each contextual tray sits beneath the selected main section without creating a horizontal scrollbar.
- Adjusted internal anchor scrolling so selected submenu destinations are not hidden beneath the sticky navigation.

---
## BizziBuddi Workspace Navigation — Sticky No-Scroll Navigation

### Changed

- Made the authenticated primary workspace menu and contextual submenu sticky together at the top of the workspace while scrolling.
- Kept Finance as the primary money-management label.
- Kept contextual submenu groups aligned beneath the selected primary section.
- Removed horizontal scrolling from the submenu tray so items wrap within their available section rather than showing a scrollbar.
- Preserved the existing in-page submenu destinations for Today, Finance, Insights and Account.

---

## BizziBuddi Workspace Navigation — Sticky Finance Navigation

### Changed

- Made the authenticated workspace navigation sticky so the primary menu and contextual submenu remain available while scrolling.
- Kept the Finance label as the primary name for the money-management section.
- Kept contextual submenu groups aligned beneath their selected primary section.
- Removed horizontal overflow from the submenu tray so items wrap rather than creating a horizontal scrollbar.
- Connected the Account submenu's Membership item to the account membership area instead of the Plans page.

---

## BizziBuddi Workspace Navigation — No-Scroll Layout

### Changed

- Removed horizontal scrolling from the primary workspace navigation and contextual submenus.
- Kept all six primary sections visible within the navigation container.
- Repositioned contextual submenu groups beneath the selected workspace section.
- Allowed submenu items to wrap naturally when space is limited instead of introducing a horizontal scrollbar.
- Preserved the existing contextual destinations and in-page anchor scrolling for submenu items.

---

## BizziBuddi Contextual Navigation Rendering Fix

### Fixed

- Corrected the contextual submenu to pass the generated style object to JSX instead of the submenu style function itself.
- Kept the Finance label and real submenu destinations introduced in the contextual navigation update.
- Tightened the submenu spacing so it sits immediately beneath the primary navigation while retaining alignment with the selected workspace section.

---

## BizziBuddi Contextual Navigation Links

### Changed

- Renamed the primary Money workspace section to Finance to match the existing Finance module.
- Made Today submenu items jump to Overview, Priorities, Upcoming and Attention areas on the dashboard.
- Made Finance submenu items jump directly to Revenue Overview, Invoices, Payment History, Expenses and Cashflow.
- Made Insights submenu items jump to Reports, Performance and Trends areas.
- Made Account submenu items connect to Plans, Membership and the new Account area.
- Added an account workspace view for authenticated account and membership details.
- Kept Work, Assist and existing workspace routes connected to their real destinations rather than creating placeholder pages.
- Repositioned the contextual submenu closer to the main navigation and aligned it with the selected primary section.
- Preserved keyboard navigation and browser-history behaviour.

---

## BizziBuddi Workspace Navigation Hierarchy

### Changed

- Made every primary workspace section navigate directly to its first contextual destination.
- Reworked the contextual submenu into a single clean navigation tray instead of allowing submenu items to wrap awkwardly beneath individual columns.
- Added contextual submenu items for Today, Work, Money, Insights, Assist and Account.
- Kept the active submenu item visibly highlighted and aligned with the selected workspace section.
- Preserved existing workspace routes, keyboard navigation and browser-history behaviour.

---

## Finance Printable / PDF Reports

### Added

- Added a print-ready Finance report generated from the same selected period and report-content settings used by CSV export.
- Added browser print/PDF output with A4 layout, financial summary, expense categories and transaction detail.
- Added report-safe HTML escaping for printed financial data.
- Kept PDF output dependency-free by using the browser's native print/save-as-PDF workflow.
- Preserved the existing CSV export alongside the printable report.

---

## Finance Financial Year & Custom Reports

### Added

- Added Australian financial-year reporting using the 1 July to 30 June financial year.
- Added selection of the current and previous financial years.
- Added custom start and end dates for flexible reporting periods.
- Added report-content controls for Summary, Transactions and Expenses by category.
- Updated Finance CSV export to use the selected reporting period and selected report contents.
- Kept the on-screen transaction view aligned with the selected reporting period.

---

## Finance Monthly Reporting & CSV Export

### Added

- Added a selected-month Finance report using the persistent payment and expense records already loaded by BizziBuddi.
- Added monthly Received, Expenses and Net Cashflow summary figures.
- Added a transaction-level view showing payment and expense date, type, amount, category, method and description, with invoice and client references for payments.
- Added a Finance-specific CSV export containing the selected month's summary and transactions.
- Added an Excel-friendly UTF-8 BOM to Finance CSV exports.
- Kept the report clearly scoped as a transaction report rather than a bank statement or tax return.

---

## Finance Cashflow Intelligence

### Added

- Added a six-month Money In vs Money Out view using persisted payment and expense records.
- Added monthly net cashflow values to the cashflow history.
- Added an expense-by-category breakdown so recurring outgoing areas are visible at a glance.
- Kept the analysis derived from existing Finance records without creating duplicate financial data.

---

## Finance Expenses & Outgoings

### Added

- Added persistent BizziBuddi expense storage with a dedicated Finance expenses table and migration.
- Added authenticated Finance expense APIs for listing, recording, editing and removing expenses.
- Added expense categories, payment methods, dates, amounts and descriptions.
- Added Finance expense totals for this month, all time and the next 30 days.
- Added net cashflow calculations using recorded customer payments minus recorded expenses.
- Expanded Cashflow Outlook to show money in, money out, current-month net cashflow and projected net cashflow for the next 30 days.
- Added Finance expense audit events for recorded, updated and removed outgoings.

---

## Finance Cashflow Outlook

### Added

- Added a Cashflow Outlook beneath Revenue Overview in Finance.
- Shows cash received this month, expected customer payments due within 30 days, known incoming cash and total outstanding.
- Added a visual indicator for the portion of outstanding invoice balances currently due within 30 days.
- Clearly identifies the view as incoming-cash intelligence because BizziBuddi does not yet record business expenses.

---

## Finance Revenue Overview file restoration

### Fixed

- Restored the complete `BizzibuddiAccountPage.jsx` after the Finance Revenue Overview commit accidentally truncated the Help & Support section.
- Reapplied the Revenue Overview changes to the intact page without removing existing account functionality.

---

## Finance Revenue Overview

### Added

- Added a database-backed Revenue Overview to the BizziBuddi Finance view.
- Shows revenue received this month and all time, outstanding balances, overdue balances and amounts due within 30 days.
- Added a six-month month-by-month revenue view based on persisted invoice payment records.
- Revenue metrics are calculated from the invoice payment data already returned by the authenticated Finance API; no duplicate revenue state is stored in the frontend.

---

## Payment Activity API response fix

### Fixed

- Preserved the persisted invoice paymentActivity array when invoice responses pass through the shared toInvoice() serializer.
- Prevented the account invoice view from falling back to the three current payment records and hiding historical Payment Activity events.
- Kept backward compatibility with the legacy payment_activity property shape.

---

## Historical Payment Audit Repair Utility

### Added

- Added an idempotent one-time repair utility for the affected legacy Payment Activity record.
- The repair targets the affected invoice/payment by persisted invoice and payment identity without changing the current payment row.
- Creates a database backup before applying the repair.
- Restores the original **$150.00 Cash** recorded snapshot for the affected payment.
- Preserves a real **$300.00 → $100.00** update event when one already exists and removes only the earlier synthetic repair duplicate.
- If the real update event is genuinely missing, the utility restores it using a stable source key.
- Safe to rerun without creating duplicate audit events.

---

## Payment Activity Audit Trail Stabilisation

### Fixed

- Made Payment Activity retrieval strictly read-only so opening an invoice can never rewrite historical audit records.
- Simplified event matching around persisted invoice and payment identities.
- Added the invoice ID to newly created payment update and removal event source keys for deterministic retrieval.
- Preserved support for older payment update and removal events whose source keys used the payment ID only.

### Important

- Historical audit data already overwritten by an earlier migration cannot be reconstructed from the current database alone. New payment edits now persist their before/after values in a dedicated update event without relying on display-time migration.

---

## Payment Audit Event Retrieval Fix

### Fixed

- Corrected Payment Activity retrieval so persisted `Payment updated` and `Payment removed` events are included even when their historical source keys contain a payment ID rather than the invoice ID.
- Preserved compatibility with existing recorded, updated and removed payment audit events.

---

## Deterministic Payment Audit Reconciliation

### Fixed

- Reconciled current payment audit events before attempting legacy edited-payment migration.
- Made historical payment edit detection reliable when a current payment event was missing or created by an earlier audit implementation.
- Preserved the customer-facing invoice number, AUD currency and payment details throughout the repaired audit trail.

---

## Payment Audit Migration Parsing Fix

### Fixed

- Corrected the legacy payment-audit migration amount parser so historical edited-payment events can be recognised correctly.
- Ensured a legacy $150 → $300 payment edit can be presented as a Payment recorded event followed by a Payment updated audit event instead of two recorded events.
- Prevented the legacy migration path from failing silently because of an incorrectly escaped whitespace expression.

---

## Repair Legacy Payment Audit History

### Fixed

- Corrected legacy edited-payment activity so an old **Payment recorded** entry can be paired with the corresponding current payment when the historical payment version is identifiable.
- Added a migrated **Payment updated** event showing the actual amount transition.
- Suppressed the misleading duplicate current **Payment recorded** event from the displayed audit trail when it represents an edited historical payment.
- Normalized the migrated recorded entry with AUD currency, Australian date formatting and the customer-facing invoice number.

## Correct Payment Audit Change Tracking

### Fixed

- Upgraded existing recorded-payment activity entries to use the current payment amount, date, method, description and customer-facing invoice number.
- Payment updates now record **only fields that actually changed**.
- Amount changes use currency formatting and date changes use the Australian date format.
- No update activity event is created when an edit produces no actual payment-field change.

## Detailed Payment Audit Activity

### Changed

- Payment Activity now records customer-facing invoice numbers rather than internal invoice IDs.
- Payment recorded events include amount, payment date, method and description.
- Payment updated events include old → new values for amount, date, method and description.
- Payment removed events retain the removed payment's amount, date, method and description.

## BizziBuddi Payment Activity Polish

### Changed

- Formatted Payment Activity timestamps for the Australian locale as **2 Oct 2026 · 1:09 PM**.
- Formatted fallback activity amounts as currency.
- Replaced the internal invoice UUID in fallback activity descriptions with the customer-facing invoice number.
- Kept Payment History as the transaction ledger and Payment Activity as the separate audit trail.

## Visible Invoice Payment Activity Fallback

### Fixed

- Ensured the BizziBuddi invoice view renders **PAYMENT ACTIVITY** whenever payment records exist.
- Uses persisted payment activity events when available and derives a safe legacy display from the invoice's payment records when older activity data is unavailable.
- Keeps the activity panel collapsed by default with the event count visible.

## Guaranteed Invoice Payment Activity

### Fixed

- Ensured invoice responses always expose a complete Payment Activity history for existing payment records.
- Persisted missing **Payment recorded** events using idempotent payment-specific source keys.
- Added a response fallback for legacy databases so existing payments cannot disappear from Payment Activity while the persistent records are established.

## Finance Payment Activity Event Types

### Fixed

- Added the three persistent Finance payment activity event types to the BizziBuddi automation-event whitelist.
- Existing invoice payments can now be backfilled into Payment Activity, and future recorded, edited and removed payment events can be persisted successfully.

## Invoice Payment Activity Backfill

### Fixed

- Backfilled persistent **Payment recorded** activity events for existing invoice payments that were created before payment activity tracking was introduced.
- Made the backfill idempotent using the existing payment-specific activity source keys, preventing duplicate events.
- Kept newly recorded, edited and removed payment events on the existing persistent activity path.

## BizziBuddi Invoice Payment Activity

### Changed

- Replaced the small native **PAYMENT ACTIVITY** details control beneath invoice payment history with a prominent expandable activity panel.
- Added a clear **▸ / ▾** expand indicator and event-count badge.
- Kept activity collapsed by default while allowing each invoice to expand independently.
- Preserved the existing dark BizziBuddi visual language and persisted payment activity data.
- Continued displaying recorded payment activity with event detail and timestamp information.

## Finance Payment Activity Presentation

### Added

- Added a prominent expandable **Payment Activity** row directly beneath Finance's **Recent Payments** ledger.
- Made the entire header clickable with a visible **▸ / ▾** expand indicator.
- Added an event-count badge and kept the activity collapsed by default.
- Clearly separated the activity history from the actual payment transaction ledger.
- Loaded payment activity from the persistent database timeline.
- Finance-recorded payments now persist **Payment Recorded**, **Payment Edited**, and **Payment Removed** events.
- Displayed event timestamps and payment details when expanded.

## Payment Activity Presentation

### Added

- Made **Payment Activity** a clearly visible expandable section in job payments.
- Added an activity count and whole-row click target while keeping the section collapsed by default.
- Persisted payment activity events for **Payment Recorded**, **Payment Edited**, and **Payment Removed**.
- Added timestamps and payment details to each activity event.

## Finance Payment Activity Actions

### Added

- Added direct **Edit** and **Delete** actions to Finance payment activity.
- Reused the authenticated payment APIs so activity changes remain persistent and account-scoped.
- Added the same confirmation flow for deleting a payment from the activity list.

## Finance Payment Corrections

### Fixed

- Added persistent Finance payment activity for recorded, edited and removed payments.
- Added account-scoped payment removal from Finance with confirmation and automatic invoice balance/status recalculation.
- Routed Finance payment corrections through a payment-specific API endpoint so editing no longer depends on the invoice card's route identity.
- Finance payment corrections now use the persisted payment invoice ID when sending an edit request.
- Made payment corrections resolve the persisted payment record by its account-scoped payment ID, avoiding stale parent-invoice state from causing a false “Payment not found” response.

### Added

- Added an **Edit** action to each recorded invoice payment.
- Added compact editing for payment amount, date, method and description.
- Recalculated the invoice balance and status when an existing payment is corrected.
- Kept payment corrections account-scoped and persisted through the authenticated Finance API.
- Fixed Finance payment-entry defaults to use the browser's local calendar date rather than UTC.

## Payment Entry Improvements

### Added

- Added a direct **Add payment** action to outstanding invoices in Finance.
- Added a compact inline payment form for amount, date, method and description.
- Kept **Mark paid** as a shortcut for recording the remaining invoice balance.

### Fixed

- Buddi now recognises natural-language phrasing such as `Payment received from Jessica Williams of $200` and routes it through the existing payment confirmation flow.

## Finance Payment History Ledger

### Improved

- Added a compact paid-total summary to invoice payment history.
- Displayed multiple payments as a concise ledger-style list of amount, date, method and description.
- Kept payment history visually subordinate to the invoice while allowing it to scale to multiple instalments.

## Finance Payment History Presentation

### Improved

- Indented invoice payment history so it reads as supporting detail beneath the invoice.
- Simplified payment rows by removing the redundant “Payment received” label.
- Kept amount, date, method and optional payment description visible in a more compact layout.

## Finance Payment History Reliability

### Fixed

- Returned persisted payment history with invoice data so Finance does not depend on a separate request for each invoice.
- Kept payment history available immediately after recording a payment and after a fresh Finance load.
- Added a visible fallback when an invoice reports recorded payments but detailed payment rows are unavailable.

## Finance Payment History

### Added

- Added a persistent Finance payment-history view for each invoice.
- Added an authenticated invoice payment-history API endpoint backed by the existing `bizzibuddi_payments` records.
- Displayed payment amount, date, method and description directly beneath the relevant invoice.
- Kept invoice balances and existing payment recording behaviour unchanged.

## Buddi Payment Amount Parsing Fix

### Fixed

- Preserved the amount when Buddi parses natural-language payment requests such as `Record a $500 payment from Jessica Williams...`.
- Prevented the payment command prefix from consuming the amount before the payment amount parser runs.
- Kept the existing confirmation gate and invoice-matching behaviour unchanged.

## Buddi Finance Intelligence

### Added

- Buddi now answers read-only finance questions directly from the current account invoice data.
- “Who owes me money?” returns outstanding balances grouped by client.
- Client-specific questions return the client's outstanding invoices and balances.
- Overdue questions identify invoices past their due date with remaining balances.
- Outstanding/unpaid questions return the current aggregate balance.
- Finance answers include a direct link to the Finance view.
- These read-only finance answers do not create or modify records.

## Buddi Payment Invoice Matching

### Added

- Buddi now automatically selects the only outstanding invoice when recording a natural-language payment for a matched client.
- When a client has multiple outstanding invoices, Buddi can match the payment description against the persisted invoice description when there is one clear match.
- Ambiguous payments remain unselected and still require the user to choose the invoice during confirmation.

## Buddi Natural-Language Invoice Creation

### Added

- Buddi can now recognise invoice requests such as “Create an invoice for Jessica Williams for Wedding Dress, $2,400.”
- Invoice details are pre-filled into a review form with client, description, amount, issue date and due date.
- The default due date is seven days from creation when no due date is specified.
- Invoice descriptions are now persisted in the account-backed finance database.
- Invoice creation remains confirmation-gated and uses the existing account-backed invoice API.

## Buddi Natural-Language Finance Actions

### Added

- Buddi can now recognise payment requests such as “Record a $500 payment from Jessica Williams.”
- Payment details are pre-filled into a confirmation form, including client, amount, date, method, description and outstanding invoice.
- When a client has multiple outstanding invoices, Buddi requires an explicit invoice selection before recording the payment.
- Payments are validated against the selected invoice balance before saving.
- Financial mutations remain confirmation-gated and use the existing account-backed invoice payment API.

## Follow-up: Natural Booking Phrases

### Fixed

- Buddi now recognises conversational booking requests such as “Book Jessica Williams in for a fitting next Tuesday at 2pm.”
- The appointment parser now handles the person-first “book [person] in for [appointment]” phrasing and removes leading articles from the appointment title.

## Buddi Natural-Language Appointment Creation

### Added

- Buddi can now recognise natural-language appointment requests such as “Book Jessica Williams in for a fitting next Tuesday at 2pm.”
- Appointment dates, times, duration, status and client details are pre-filled into a review form.
- Existing client matching and the existing new-client creation flow are supported.
- Appointment creation remains confirmation-gated; nothing is saved until the user confirms.
- Confirmed appointments use the existing account-backed Calendar API and reminder automation.

## People and Jobs Open Job Navigation

### Fixed

- Fixed the People timeline **Open job** action, which referenced a missing handler.
- People timeline job links now close the person timeline and navigate to the selected job.
- Jobs opened from a job deep link now open the existing job editor instead of only highlighting the job card.

## Jobs Open Job Behaviour

### Fixed

- Changed the Jobs timeline **Open job** action so it opens the selected job in the existing job editor rather than attempting to navigate to an already-open Jobs view.
- Opening a job now closes its timeline and focuses the selected job.
- Jobs deep-linked from the URL are focused without automatically opening their timeline.

## Jobs Timeline Open Job Fix

### Fixed

- Fixed **Open job** buttons inside the Jobs timeline so they now actively focus the associated job.
- The timeline closes when opening the job, making the action visibly take effect even when the user is already on the Jobs screen.
- The selected job is scrolled into view and remains visually highlighted.

## Buddi Unmatched Client Creation

### Added

- When Buddi cannot match a client name from a natural-language job request, the review form now offers **Create new client**.
- The new-client flow pre-fills the requested name and allows optional email and phone details.
- Confirming the job can create the new client first and then create the job against that newly created client.
- Existing-client selection remains available, and the confirmation gate still applies before any records are created.

## Unmatched Buddi Job Client Parsing

### Fixed

- Fixed natural-language job requests such as “create a job for Sarah, wedding dress” so the client phrase is removed cleanly from the job title.
- Buddi now remembers the requested person name when it cannot match that name to an account person.
- Unmatched client names now require an explicit person selection before the job can be saved, preventing accidental assignment to the wrong client.
- Cleaned residual punctuation from job titles after natural-language date, price, and client parsing.

## Buddi Natural-Language Job Details

### Added

- Buddi can now extract common job due dates and prices from natural-language requests.
- Account job confirmation now includes editable **Due date** and **Price (AUD)** fields.
- Due dates and prices are persisted on account jobs.
- A confirmed job's due date is also applied to its production tracking record so existing workload intelligence can use it immediately.
- The Jobs workspace now displays stored due dates and prices.

## Account Buddi Job Creation

### Added

- Wired the account-backed Buddi assistant to the authenticated Jobs API.
- Direct requests such as **create a job** now open a review form instead of being sent to the general chat service.
- Added person, job title and status prefill from natural-language requests.
- Added an explicit confirmation step before any job record is created.

## Buddi Natural-Language Job Prefill

### Added

- Hardened Buddi job-command routing so direct requests such as **create a job** open the job review form instead of falling through to the general chat service.
- Added natural-language prefill for common job details including an unambiguous client, job name, garment type, due date and price.
- Added support for common date phrases such as today, tomorrow, weekdays and Australian-style day/month dates.
- Kept the existing confirmation gate: parsed details only populate the review form and are not persisted until **Save job** is explicitly confirmed.

## Buddi Job Creation

### Added

- Added a **Create a job** quick action to Buddi.
- Added a review form for client, job name, garment type, due date, starting price, starting stage and notes.
- Job creation uses the existing persistent Chrysalis job service and live workspace state.
- Successful creation navigates directly to Jobs and records the result in the Buddi conversation.
- Existing client creation, appointment creation, production actions and Buddi Focus behaviour remain intact.

## Buddi Proactive Focus

### Added

- Added a **Buddi Focus** card to the live assistant so Buddi proactively surfaces the current business pressure before a question is asked.
- Added focus detection for overdue jobs, outstanding job balances, jobs due within seven days and today's appointments.
- Added compact summary counts for overdue jobs, due-this-week jobs, unpaid jobs and today's appointments.
- Added direct navigation from the focus card into Jobs, Finance, Garments or Calendar when action is relevant.
- Kept all existing Buddi questions, confirmations, client creation and appointment creation workflows unchanged.

## Calendar Record Focus + Production Links

### Changed

- Calendar deep links now highlight and smoothly scroll to the exact appointment record.
- The selected appointment remains visually identifiable while its editor is open.
- Upcoming garment production entries in Calendar now provide a direct **Open production →** action.
- Production links preserve the exact job focus when opening the Production workspace.

## Today Summary Spacing + Job Detail Next Actions
## Today Summary Spacing + Job Detail Next Actions

### Changed

- Fixed the Today business-picture summary metrics so values and labels have deliberate vertical spacing instead of running together.
- Kept the summary responsive so the four metrics collapse cleanly on narrower screens.
- Added a focused **Next Action** area to the selected Job.
- Job next actions now reflect the current production state:
  - overdue production → Open production
  - outstanding production tasks → Open production
  - ready / stage update needed → Open production
  - not started → Start production
  - waiting job → Review job
  - complete job → Review timeline
- Selected Jobs are highlighted and smoothly scrolled into view when opened from a deep link or timeline selection.
- Preserved the existing Timeline, Production, Edit and Delete actions.

### Fixed

- Wired Job timeline "Open job" actions back into the Jobs workspace so related job links resolve correctly.

## Today Secondary Record Links
## Today Secondary Record Links

### Changed

- Daily Operating View items now open their exact appointment, invoice or job.
- Recent Activity items now deep-link to the underlying job, appointment, invoice or production job.
- Today Notifications now preserve the exact record behind finance, production and calendar alerts.
- Automation notifications continue to open the Automation workspace because they represent activity rather than a single business record.

### Result

- The Today command centre now consistently follows the same pattern: identify the item, open the exact record, then act.

## Today Record-Level Action Links

### Added

- Today priority actions now carry the underlying invoice, appointment or job identifier.
- Dashboard actions now open the exact relevant record instead of only opening the parent module.
- Finance deep links scroll directly to and highlight the selected invoice.
- Existing Jobs, Calendar and Production deep-link behaviour is now used by the Today command centre.

### Fixed

- Preserved module-level navigation when no specific record identifier is available.

## Today Command Centre

### Added

- Added a prominent **Next Action** card to the Today workspace.
- The card uses the highest-priority item from the shared BizziBuddi intelligence engine.
- Added direct navigation into the relevant workspace area from the Next Action card.
- Kept the existing Today attention queue, daily operating view, notifications, activity and health sections intact.

## Buddi Finance Attention

### Added

- Added a dedicated Finance Attention panel to Buddi for overdue, due-today and upcoming unpaid invoices.
- Added urgency styling consistent with production attention states.
- Added direct **Open finance →** navigation from each highlighted invoice.

### Improved

- Production Attention now passes the selected job id when opening Production, preserving the clicked job focus and scroll target.

## Production Job Focus Navigation

### Improved

- Buddi's production attention links now preserve the relevant job when opening Production.
- Production automatically scrolls to the selected job's work item editor after navigation or job selection.
- The existing production queue and workload selection behaviour remains unchanged.

## Buddi Production Attention Visibility

- Added a dedicated Production Attention panel for overdue, due-today and high-pressure production work.
- Added urgency styling and direct Open production actions.

## Buddi Action Urgency Styling

### Added

- Proposed Buddi actions now use distinct visual urgency states.
- Overdue actions use the strongest alert treatment.
- Due-today actions use a warning treatment.
- High-pressure actions use a softer warning treatment.
- Normal actions retain the standard Buddi styling.

## Buddi Confirmed Production Task Actions

### Added

- Buddi can propose completing an outstanding production task when workload pressure or due-date pressure indicates the job needs attention.
- Completing a task requires explicit confirmation.
- Confirmed task completion uses the existing persistent production workflow and refreshes the job state.

## Production Queue Job Selection Fix

### Fixed

- Prevented the production deep-link target from overriding a user's manual job selection.
- Clicking **Manage** on a production queue job now keeps that job selected, even when the Production page was originally opened with another job deep link.
- Preserved automatic selection of the requested deep-link job and fallback selection when the current job is removed.

## Buddi Confirmation-Based Actions

### Added

- Added explicit proposed production actions to Buddi.
- Buddi can propose starting production for jobs that have not started.
- Buddi can propose completing production when a job is Ready and all production tasks are complete.
- Actions require an explicit user confirmation before any production record is changed.
- Successful actions persist through the existing production API and refresh the workspace state.

### Workflow

Buddi identifies an opportunity → proposes the action → user confirms → production record is updated.

## Buddi Production Workload Awareness

### Added

- Added production workload pressure, task remaining, logged time and workload-level context to Buddi.
- Added the most pressured production jobs to Buddi's business context so workload questions can be answered with job-level detail.
- Added a dedicated quick prompt for production workload questions.
- Added production navigation actions when users ask Buddi about workload, pressure, capacity or remaining tasks.

### Workflow

Production workload → Buddi → production workspace

## BizziBuddi Production Workload Balancing

### Added

- Added production workload pressure analysis using active jobs, remaining tasks and ready-by dates.
- Added Light, Normal, Heavy and Overloaded workload levels.
- Added workload-focused production job ordering.
- Added active job, remaining task and logged time workload metrics.
- Added workload visibility to the main business dashboard.
- Added shared workload intelligence for future Buddi and dashboard actions.

### Workflow

Production now answers both **what is happening** and **where the workload pressure is building**.

---

## BizziBuddi Client / Job Detail Deep Links

### Added

- Added shareable workspace URLs for People, Jobs, Production and Calendar.
- Added direct client deep links that open the requested client's timeline.
- Added direct job deep links that open the requested job timeline.
- Added one-click navigation from a client timeline to its related job.
- Added one-click navigation from Jobs to the matching Production work item.
- Added direct appointment deep links that open the appointment editor.
- Added browser Back / Forward support for BizziBuddi workspace navigation.
- Kept deep-link state account-scoped and compatible with the existing single-page workspace model.

### Workflow

People → Client timeline → Job → Production

---

## Production Time Tracking

### Added

- Added persistent production time entries tied to BizziBuddi jobs.
- Added start/stop production timer controls.
- Added live elapsed-time display for the active timer.
- Added per-job logged-time totals and recent time history.
- Prevented more than one active production timer per account.
- Added automation events when production timers start and stop.

## Production Task Templates

### Added

- Added persistent BizziBuddi production task templates with user-scoped database storage.
- Added template names, descriptions and reusable production task lists.
- Added template creation, editing and deletion from the Production workspace.
- Added one-click template application to the selected production job.
- Template application appends missing tasks without overwriting existing job tasks.
- Added automation logging when a production template is applied.
- Kept existing Production Workflow 2.0 task tracking, readiness and Dashboard/Buddi intelligence intact.

## BizziBuddi Production Workflow 2.0

### Added

- Rebuilt the Production workspace as an operational production queue rather than a single-job editor.
- Added Active, Due today, Overdue, Ready, Complete and All production queue views.
- Added production summary metrics for active work, due today, overdue work, ready work, completed work and task progress.
- Added job-centric production cards showing client, job, stage, progress, readiness, ready-by date and task completion.
- Added quick production actions to open a work item and mark production complete.
- Added a clearer stage workflow editor with clickable stage progression.
- Added contextual empty states for each production queue view.
- Kept production records persistent and connected to the existing Jobs, Dashboard intelligence, Automation and Buddi workflows.
- Synced the local job production summary immediately after production saves so Dashboard and Buddi see the updated production state without requiring a reload.

### Workflow

Jobs → Production queue → Stage / tasks → Ready → Complete → Dashboard / Buddi

---

## Buddi Actionable Intelligence

### Added

- Added a shared BizziBuddi Priority Engine used by both Today/Dashboard and Buddi.
- Unified overdue payments, due-soon payments, production issues, production due dates, today's appointments, waiting jobs and ready production into one prioritised intelligence model.
- Added contextual Buddi actions that route directly to Finance, Calendar, Jobs or Production based on the current priority picture.
- Added structured intelligence metrics for workload, completion, finance and production.
- Kept Buddi read-only: contextual actions navigate to workspace modules without changing business records.

---

## BizziBuddi Buddi Intelligence Foundation

### Added

- Expanded Buddi's business context with explicit workload, production, finance and attention summaries.
- Added structured intelligence data for open, waiting and completed jobs, upcoming appointments, overdue invoices, outstanding balances and production readiness.
- Added a focused "What should I focus on next?" prompt and expanded job-attention guidance.
- Updated Buddi's workspace copy to reflect account-backed business intelligence rather than an account preview.

---

## BizziBuddi Reports Production Display Fix

### Fixed

- Removed the duplicate "Complete" production row from the Reports production status panel.
- Kept the dedicated Active and Complete totals while showing only non-complete production stages underneath.

---

## BizziBuddi Reports Load Fix

### Fixed

- Fixed the Reports API summary construction so overdue invoice counts use the calculated overdue invoice records.
- Restored the report summary objects passed into Business Insights for jobs, calendar, finance and production.
- Fixed the Reports page error caused by undefined report summary variables.

---

## BizziBuddi UX Simplification

### Changed

- Reorganised the signed-in workspace navigation into clear groups: Today, Work, Money, Insights, Assist and Account.
- Replaced the ambiguous "Account preview" workspace entry with a clear Today home.
- Added a concise "How BizziBuddi works" workflow guide to the dashboard linking People → Jobs → Production → Calendar → Finance.
- Kept account/login navigation separate from the signed-in business workspace.
- Added responsive behaviour for the grouped workspace navigation on smaller screens.

---

## BizziBuddi Job Assignment Response Fix

### Fixed

- Normalized job create and update API responses through the shared `toJob` mapper.
- Ensured `personId` and `clientName` are returned in the same shape expected by the Jobs UI.
- Fixed job assignment appearing as `Unassigned` immediately after editing a job.

---

## BizziBuddi People Panel Toggle Fix

### Fixed

- Made Timeline and Measurements mutually exclusive within a person card.
- Opening Measurements now closes Timeline.
- Opening Timeline now closes Measurements and clears the hidden measurement view state.
- Prevented the two expanded panels from competing for the same horizontal layout space.

---

## BizziBuddi Client Timeline Compactness

### Changed

- Changed client timeline entries to use the same compact card treatment as measurement history.
- Timeline entries now flow into responsive columns when space allows.
- Reduced timeline padding, typography and spacing while preserving date, event and detail information.

---

## BizziBuddi Measurement History Compactness

### Changed

- Changed measurement history snapshots to flow into compact responsive columns instead of a single vertical stack.
- Kept each snapshot internally compact with a consistent three-column measurement grid.
- Reduced snapshot padding and measurement-cell spacing while preserving all measurement data and notes.

---

## BizziBuddi Measurement Form Reset Fix

### Fixed

- Preserved the measurement form element before the asynchronous save request completes.
- Fixed the `Cannot read properties of null (reading 'reset')` error after a successful measurement snapshot save.
- Measurement snapshots now save and reset the form cleanly without showing a false error state.

---

## BizziBuddi People Measurements and Job Automation Fixes

### Fixed

- Corrected the BizziBuddi People API route so `/people/:id/measurements` is no longer captured by the generic person route.
- Restored measurement history loading and snapshot creation for individual people.
- Corrected the BizziBuddi automation-event INSERT so the `job_id` column matches the supplied SQL parameter.
- Restored job creation so creating a job no longer fails with `column index out of range`.
- Preserved the existing People, Jobs, Production and Automation workflows.

---

## BizziBuddi Account Blank Screen Fix

### Fixed

- Removed the duplicate `formatTimelineDate` function declaration from `BizzibuddiAccountPage.jsx`.
- Restored successful module parsing so the BizziBuddi account page can render again.
- Verified that the account page now contains a single `formatTimelineDate` declaration.

---

## BizziBuddi People Render Parse Fix

### Fixed

- Removed the inline People search IIFE from the JSX render tree.
- Moved People search filtering into the component logic before the JSX return.
- Corrected the People list to render the filtered collection.
- Added workflow contract checks for the simplified People render structure.

---

## BizziBuddi Account Page Parse Fix

### Fixed

- Restored the missing React fragment wrapper around the account page return tree.
- Fixed the Vite/Oxc JSX parse error at the keyboard-shortcuts dialog.
- Added workflow contract checks so the required fragment wrapper and closure cannot be accidentally removed again.

---

## BizziBuddi 1.0.0 Production Release

### Added

- Established the Chrysalis/BizziBuddi `1.0.0` production release baseline.
- Added a dedicated `npm run release:check` production release gate.
- Added static verification for the production build/start scripts, authenticated backend, production gateway, backup validation, workflow contracts and current documentation.
- Updated README release guidance and documented the current production boundary.
- Marked Release 1.0 Production release complete in the roadmap.

### Release boundary

- Live subscription billing remains outside the current product scope.
- The release gate verifies repository structure and contracts; it does not replace deployment-specific browser, infrastructure or operational checks.

---

## BizziBuddi Documentation

### Added

- Updated the project README to describe the current BizziBuddi modules, persistence model, development commands and documentation set.
- Replaced the outdated development guide with current repository workflow and quality rules.
- Added `docs/BIZZIBUDDI.md` as the current application architecture and operating guide.
- Documented Dashboard, People, Jobs, Production, Calendar, Finance, Automation, Reports and Buddi workflows.
- Documented keyboard shortcuts, persistence boundaries and the static workflow verification command.
- Marked Release 0.9 Documentation complete in the roadmap.

---

## BizziBuddi Bug Fixing

### Fixed

- Fixed the Dashboard Today View production due-soon window so it matches the displayed “next 7 days” label.
- Production ready-by dates within seven days now appear consistently alongside invoices due within seven days.
- Added a workflow contract check to prevent the production due-soon window from regressing to a shorter range.

---

## BizziBuddi Business Insights

### Added

- Added a server-backed Business Insights panel to Reports.
- Added descriptive three-month trend comparisons for invoicing, payments, new client activity and job activity.
- Added current workload and outstanding-balance signals from persisted account data.
- Added Business Insights to the existing CSV export.
- Kept insights descriptive rather than prescriptive; trend comparisons use the most recent three months against the preceding three months.

## BizziBuddi Monthly Statistics

### Added

- Added a server-backed 12-month monthly statistics view to Reports.
- Added monthly counts for new people, jobs and appointments.
- Added monthly invoiced and recorded payment amounts.
- Added monthly completed-production counts.
- Added the monthly statistics to the existing CSV export.
- Kept month calculations account-scoped and derived from persisted BizziBuddi data.

## BizziBuddi Report Export

### Added

- Added CSV export to the Release 0.7 Reports workspace.
- Exported the current account-backed people, jobs, calendar, finance, production and insight summary metrics.
- Added generated-date and metric labels to keep exported data self-describing.
- Added a dated `bizzibuddi-report-YYYY-MM-DD.csv` filename for each export.
- Kept exporting client-side so no additional server storage or export service is required.

## BizziBuddi Financial Summaries

### Added

- Shipped the Release 0.7 Financial Summaries module inside Reports.
- Added account-backed invoiced, paid, outstanding and overdue amounts.
- Added paid/open invoice counts and average invoice value.
- Added collection rate and overdue balance reporting.
- Kept the summary descriptive and based on persisted BizziBuddi invoice data.

## BizziBuddi Reporting

### Added

- Shipped the Release 0.7 Reporting module as an account-backed business reporting view.
- Added live operational reporting for people, jobs, calendar, finance and production activity.
- Added job completion, payment collection and production completion indicators.
- Added a report refresh control so the current server-backed snapshot can be reloaded without leaving Reports.
- Added report generation timestamp so the displayed figures are clearly identified as a current account snapshot.
- Kept reporting descriptive and separate from the upcoming dedicated Financial Summaries work.

## BizziBuddi Keyboard Shortcuts

### Added

- Added keyboard navigation for Dashboard, People, Jobs, Calendar, Finance, Automation and Reports.
- Added `?` to show or hide the shortcut guide.
- Added `Esc` to close the shortcut guide.
- Shortcuts are ignored while typing in form controls.
- Added an in-app shortcut reference.

---

## BizziBuddi Garment Scheduling

### Added

- Added a Garment Schedule to the Calendar.
- Upcoming production ready-by dates now appear alongside appointments.
- Production entries show the garment/job, ready-by date and current production stage.
- The schedule uses the existing persistent Production records, keeping calendar and production information connected without duplicating data.

---

## BizziBuddi Appointment Management

### Added

- Added appointment search across title, person, job and notes.
- Added appointment status filtering.
- Kept the existing Upcoming, Today, Past and All views working together with search and status filters.
- Added a compact search toggle so the calendar stays uncluttered when search is not needed.
- Preserved existing appointment creation, editing, deletion, duration and buffer controls.

---

## BizziBuddi Notifications

### Added

- Added a dashboard notification feed for important business events.
- Surfaces overdue payments, production attention items, today's appointments and automation events.
- Added direct navigation from each notification to its source module.
- Added per-session dismissal controls and a clear notification state.
- Kept notifications local to the existing BizziBuddi account data; no external messaging service is introduced.

---

## BizziBuddi Calendar Improvements

### Added

- Added Upcoming, Today, Past and All calendar filters.
- Added appointment counts for each calendar view.
- Sorted appointments chronologically by date and time.
- Added a clearer calendar-view summary and empty-state handling.
- Kept existing appointment creation, editing, deletion and advanced scheduling intact.

---

## BizziBuddi Business Health Indicators

### Added

- Added a dashboard Business Health panel.
- Added descriptive work-completion, payment-collection, production-flow and daily-schedule indicators.
- Added clear empty-state handling when a business area has no recorded data.
- Kept health indicators derived from existing account-backed BizziBuddi data.
- Added contextual detail beneath each indicator so the numbers remain understandable.

### Workflow

`Business data → Health indicator → Context → Operating decision`

---

## BizziBuddi Recent Activity

### Added

- Added a unified Recent Activity panel to the dashboard.
- Recent activity combines Jobs, Calendar, Finance, Automation and Production updates.
- Activity is ordered newest first using the latest available record timestamp.
- Added direct navigation from each activity item to its source module.
- Limited the dashboard display to the latest eight activity items to keep the operating view compact.

### Workflow

`Business activity → Recent activity → Source module → Continue work`

---

## BizziBuddi Smart Priorities

### Added

- Added priority scoring to the dashboard business action queue.
- Urgent payment and production issues now rise above routine attention items.
- Due-today and same-day activity are prioritised ahead of lower-urgency work.
- The dashboard now presents the six highest-priority actions first.
- Lower-priority actions remain counted so the dashboard still reflects the complete workload.

### Workflow

`Business activity → Priority signal → Ordered action queue → Next action`

---

## BizziBuddi Client Search Improvements

### Added

- Added a search field to the People workspace.
- Added instant filtering across client name, email address and phone number.
- Added a clear empty state when a search returns no matching people.
- Added a one-click Clear search action.
- Preserved Timeline, Measurements, Edit and Delete actions for filtered client records.

### Workflow

`People → Search → Match client → Continue client workflow`

---

## BizziBuddi Measurement History

### Added

- Added persistent measurement snapshots for each BizziBuddi person.
- Added common dressmaking measurement fields including bust, waist, hip, shoulder, sleeve, neck, back waist, inseam and height.
- Added optional snapshot labels and fitting notes.
- Added chronological measurement history directly inside the People workspace.
- Measurements are stored per authenticated account and survive refresh and logout/login.

### Workflow

`Person → Measurement snapshot → History → Compare changes over time`

---

## BizziBuddi Client Timeline

### Added

- Added a Timeline action to each person in the People workspace.
- Added a unified client activity view covering person creation, related jobs, appointments, invoices and production updates.
- Timeline entries are derived from the existing account-backed business data, so no second client-history store is required.
- Added chronological activity formatting with direct context for each related business record.

### Workflow

`Person → Jobs → Appointments → Invoices → Production → Client timeline`

---

## BizziBuddi Today View

### Added

- Added a structured Today & Next Up dashboard view.
- Added a dedicated Today card for appointments.
- Added a Due Soon card covering upcoming invoice and production dates.
- Added a Workflow card for production actions and waiting jobs.
- Kept each item linked directly to the relevant BizziBuddi module.

### Changed

- The dashboard now combines high-level attention intelligence with a compact daily operating view.
- The Today view uses the same account-backed Jobs, Calendar, Finance and Production data already powering the dashboard.

---

## BizziBuddi Dashboard Intelligence

### Added

- Upgraded the dashboard attention panel into a unified business action queue.
- Added due-soon and overdue invoice visibility alongside production workflow issues, due-soon production work, today's appointments and waiting jobs.
- Added action-item summary counts so the dashboard shows the current workload at a glance.
- Kept each attention item linked directly to the relevant BizziBuddi module.
- Preserved the Buddi assistant handoff so the dashboard can turn the current picture into a next action.

### Changed

- Dashboard attention is now derived from account-backed Jobs and Finance data rather than relying only on a small subset of urgent items.
- Production readiness and production due dates now contribute directly to the dashboard action queue.

---

## BizziBuddi Outstanding Payment Warnings

### Added

- Finance now highlights overdue invoices directly in the invoice list.
- Invoices due today or within the next seven days receive a clear due-soon signal.
- Finance summary now shows overdue and due-within-seven-days invoice counts.
- Paid invoices remain visually clear without payment warnings.

### Workflow

`Invoice → Balance → Due date → Payment warning → Mark paid`

---

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

## BizziBuddi Data Validation

### Added

- Added strict calendar-date validation for invoices, payments, appointments and production ready-by dates.
- Added strict 24-hour time validation for appointments.
- Prevented impossible dates such as February 30 from entering persistent business records.
- Kept existing business rules and user-facing workflows intact.

## BizziBuddi Workflow Testing

### Added

- Added a repeatable workflow contract test covering the authenticated BizziBuddi backend route surface.
- Added UI workflow contract checks for Dashboard, People, Jobs, Calendar, Finance, Automation, Production, Reports and Buddi.
- Added checks for persistent reporting, production, job timeline and measurement-history integrations.
- Added the `npm run test:workflow` command for local beta validation without introducing a new test framework.

## BizziBuddi Responsive Improvements

### Added

- Improved account navigation behaviour at tablet and mobile widths.
- Added a horizontally scrollable, keyboard-focusable container for the monthly statistics table.
- Added mobile-safe image sizing and tighter help navigation layouts.
- Added extra-small-screen navigation and spacing adjustments without changing desktop presentation.

## BizziBuddi Accessibility Improvements

### Added

- Added a keyboard-accessible skip link to jump directly to the account workspace content.
- Added a focusable account-content landmark for keyboard and assistive-technology navigation.
- Added polite live-region announcements for account status and action messages.
- Preserved the existing visible UI, workflows and responsive behaviour.

## BizziBuddi Performance Optimisation

### Changed

- Parallelised legacy Production record migration during account loading.
- Replaced sequential migration requests with Promise.allSettled() so multiple legacy records can migrate concurrently.
- Preserved successful migrations when an individual legacy record fails.
- Preserved the existing cleanup and sorting behaviour after migration.
- Kept the persistent server-backed Production workflow unchanged for current accounts.

## BizziBuddi UI Refinement

### Changed

- Added a consistent account-page interaction layer with smoother button, form-control and focus states.
- Added keyboard-visible focus treatment for navigation, actions and form controls.
- Refined the account navigation into a contained glass-style panel with clearer separation from the page background.
- Improved mobile account-page spacing and navigation containment.
- Respected reduced-motion preferences for the new interaction transitions.
- Preserved all existing account workflows, data handling and branding.

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

---

## BizziBuddi Demo — People Workspace Positioning

### Fixed

- Made the Demo People module reliably scroll into its own workspace after selecting **People**.
- Reworked the scroll timing to wait for the People panel to mount before positioning it.
- Uses the actual module element as the scroll target and offsets it for the sticky authenticated workspace navigation.
- Keeps the **Add a person** form as the first functional area visible in the People workspace.


---

## BizziBuddi Demo — Navigation Isolation

### Changed

- Demo mode now hides the authenticated workspace main navigation.
- Demo mode also hides the authenticated Ask Buddi / Help utility rail.
- The Demo workspace's own Overview, People, Jobs, Calendar, Finance, Production, Automation, Custom fields and Ask Buddi navigation is now the only navigation presented while exploring the sandbox.
- Prevents Demo → People from accidentally routing into the real account-backed People workspace.


---

## BizziBuddi Demo — Session Persistence

### Added

- Demo workspace state now persists for the current browser session using sessionStorage.
- Refreshing the Demo no longer discards temporary people, jobs, appointments, production changes or custom fields.
- The active Demo module is restored after refresh.
- Demo session data remains completely isolated from authenticated account data and is never written to the BizziBuddi database.
- **Exit demo** and **Create real account** explicitly clear the temporary Demo session.


---

## BizziBuddi Demo — Route Persistence Fix

### Fixed

- Demo module selection now writes an explicit view=demo route.
- The active Demo module is stored in the URL as demoModule.
- Refreshing Demo → People, Jobs, Calendar, Finance or another Demo module now remains inside the isolated Demo workspace.
- Prevents a Demo module from being interpreted as the authenticated account-backed workspace after refresh.


---

## BizziBuddi Demo — Authenticated Refresh Isolation

### Fixed

- Demo mode is now detected before authenticated session restoration.
- An active Demo session cannot be replaced by the authenticated account workspace during page refresh.
- Existing login sessions no longer cause Demo to fall through to account-backed Reports, People or other workspace views.
- Demo remains a public, isolated sandbox even when the browser also has an authenticated BizziBuddi session.


---

## BizziBuddi Demo → Real Account Handoff

### Added

- Demo **Create real account** now carries explicit handoff context into account creation.
- Account creation explains that Demo data is not copied into the real workspace.
- New accounts start with a clean business dataset.
- Business onboarding now captures the business type during initial setup.
- Supported starter business types include general business, dressmaker/fashion, hairdresser/salon, tattooist/studio, school/education, trades/field service and consultant/professional services.
- Business type is persisted through the existing account configuration flow so BizziBuddi can apply the appropriate terminology and starter fields.
