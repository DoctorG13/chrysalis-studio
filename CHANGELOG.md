# Changelog

All notable changes to Chrysalis are recorded here.

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