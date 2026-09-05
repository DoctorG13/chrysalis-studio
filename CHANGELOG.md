# Changelog

All notable changes to Chrysalis are recorded here.

---

## Job Workflow Automation

### Added

- Added automatic timeline events when a job is created.
- Added automatic timeline events when a job workflow status changes.
- Workflow events are written to the persistent `timeline_events` table and mirrored into the related job and client timeline data.
- Workflow event creation occurs in the same database transaction as the job change, keeping the job and its timeline history consistent.

---

## Database Foundation

### Added

- Added a persistent SQLite database foundation for local business data.
- Added schema version tracking and migration checksums.
- Added automatic pre-migration database backups.
- Added database inspection and backup CLI commands.
- Added a local API health endpoint for database status.
- Added a minimum Node.js requirement of 24.15.0 for the built-in SQLite runtime.
- Protected the application data directory from Git so client databases and backups are never committed.
- Added a safe legacy `chrysalis-clients` JSON importer.
- Added deterministic IDs so a repeated import does not create duplicate records.
- Added a pre-import SQLite backup.
- Preserved the complete original client/job records in `data_json` fields during import.

### Architecture

- Established the application/database separation required for future client updates.
- Database migrations are additive and versioned; an already-applied migration cannot be silently changed.
- Existing client data will remain in the persistent database while application revisions are deployed independently.
- Legacy localStorage data remains untouched during the import phase.

---

## SQLite Client Integration

### Added

- Added a local SQLite-backed Client API.
- Added Client create, read, update and delete operations through the local API.
- Added a React client API service for the SQLite-backed Client records.
- Changed `ChrysalisProvider` to load Clients from SQLite on startup.
- Changed existing Client save/delete flows to persist changes to SQLite.
- Preserved the existing Client object shape while SQLite becomes the source of truth.
- Kept the legacy localStorage data untouched during the transition.

---

## SQLite Job Integration

### Added

- Added a dedicated SQLite-backed Job API.
- Added Job create, read, update and delete operations against the existing `jobs` table.
- Added a React Job API service.
- Changed `ChrysalisProvider` to load Jobs independently from Clients.
- Changed Client Job creation, editing and deletion to persist directly to SQLite.
- Kept Job data available to the existing Client Workspace and Jobs Workspace without changing the existing UI model.
- Added a combined local server launcher for the Client API and Job API.

### Architecture

- Jobs now use `jobs.client_id` as the persistent relationship to their Client.
- Client records no longer act as the authoritative storage location for Jobs.
- Existing nested Job data remains available in the UI while the migration away from localStorage continues.

---

## Release 0.5

### 0.5.1

#### Added

- Dashboard Insight Engine.
- Dynamic dashboard summaries.
- "Today's Focus" dashboard panel.

---

### 0.5.2

#### Changed

- Replaced generic job statuses with the Chrysalis production workflow.

Quote

Booked

Pattern

Cutting

Construction

First Fitting

Alterations

Ready

Collected

Completed

Cancelled

---

#### Added

- Workspace production workflow progress indicator.

### Changed

- Centralised production workflow stages and status colours into shared constants.
- Standardised workflow progress calculations across the application.

### Added

- Dashboard "Jobs Requiring Attention" widget.

---

## Invoice Print / PDF Layout

### Added

- Added a professional A4 invoice print layout.
- Added Chrysalis invoice branding, client details and invoice metadata to the printable document.
- Added line-item, subtotal, GST, total, paid and balance-owing sections.
- Added linked Job Reference to the printable invoice when available.
- Added invoice notes and customer thank-you text.
- Added a `Print / PDF` action to Invoice Management.
- Uses the browser's native print dialog so invoices can be printed or saved as PDF without adding a new PDF dependency.

---

## Calendar & Today View

### Added

- Added a dedicated Today View above the existing calendar grid.
- Added today's appointment summary and clickable appointment list.
- Added today's SQLite-backed fitting summary and clickable fitting list when fitting records are present on client data.
- Added jobs due today and overdue production attention lists.
- Added outstanding balance visibility on production jobs.
- Added direct navigation from Today View items into the existing Client Workspace and Job Workspace.
- Extended the existing calendar day events to surface fittings alongside appointments and job due dates.
- Preserved the existing month navigation, date selection and selected-day detail workflow.

---

## Deployment Security Gate

### Added

- Added production authentication using environment-configured credentials.
- Added signed, HTTP-only, Secure, SameSite session cookies with an 8-hour lifetime.
- Added timing-safe credential and session-signature comparisons.
- Added login rate limiting for repeated failed attempts.
- Added an authenticated application gate and production login screen.
- Protected all production `/api/*` routes except health and authentication endpoints.
- Added same-origin protection for state-changing production requests.
- Removed wildcard CORS behaviour from the public production gateway while sanitising upstream CORS headers.
- Added `.env.example` documenting the production authentication and persistent-data configuration.

### Security requirements

- `CHRYSALIS_AUTH_USERNAME`, `CHRYSALIS_AUTH_PASSWORD`, and `CHRYSALIS_SESSION_SECRET` are required for production startup.
- The production password must be at least 12 characters.
- The production session secret must be at least 32 characters.
- Real credentials must never be committed to Git.

---

## Production Logout

### Added

- Added an authenticated account menu to the application header.
- Added a server-side `POST /api/auth/logout` action from the account menu.
- Added logout progress and error feedback without silently discarding a failed sign-out request.
- Reloads the application after a successful logout so the authentication gate immediately returns the user to the secure login screen.

---

## Production Gateway Health Check Reliability

### Fixed

- Replaced the recursive production-service health-check retry implementation with deterministic polling.
- Added a single-settlement guard for each health probe so timeout, error and response events cannot create competing retry chains.
- Added an explicit 30-second readiness deadline for each backend service.
- Added a short retry interval so the public gateway starts promptly once all backend services are healthy.
- Preserved the existing production gateway, authentication, proxying, static serving and graceful shutdown behaviour.

---

## Production Session Revocation

### Fixed

- Added server-side session revocation when a user logs out.
- Prevented a previously issued session token from being replayed after logout.
- Added automatic cleanup of expired revoked-session entries.
- Preserved the existing Secure, HttpOnly and SameSite=Strict cookie configuration.

---

## Production API Routing

### Fixed

- Removed browser-side dependencies on container-internal `127.0.0.1` API ports from the production data services.
- Changed Client, Job, Appointment, Measurement, Payment, Asset, Timeline, Invoice and Quote API services to use same-origin `/api` routes.
- Preserved the existing Vite development proxy architecture and production gateway routing.
- Allows the deployed frontend to reach the persistent Railway-backed application data through the authenticated production gateway.

---

## Authenticated Data Loading

### Fixed

- Moved `ChrysalisProvider` mounting inside the authenticated application gate.
- Prevented the provider from attempting its initial Client, Job and Appointment API loads before the production session has been established.
- Ensured the application loads persistent business data only after authentication succeeds.

---

## Authoritative Payment Balances

### Fixed

- Changed Job and Client cards to load payment records from the SQLite-backed Payment API when calculating outstanding balances.
- Prevented cards from treating the full quoted job price as outstanding when payments are stored separately from the Job record.
- Kept the existing fallback balance calculation for resilience if the Payment API is temporarily unavailable.
- Aligned list and card balance displays with the authoritative payment history shown in the Job Workspace.
