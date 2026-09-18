# Changelog

All notable changes to Chrysalis are recorded here.

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
