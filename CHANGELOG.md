# Changelog

All notable changes to Chrysalis are recorded here.

---

## Database Foundation

### Added

- Added a persistent SQLite database foundation for local business data.
- Added schema version tracking and migration checksums.
- Added automatic pre-migration database backups.
- Added database inspection and backup CLI commands.
- Added a local API health endpoint for database status.
- Added a minimum Node.js requirement of 24.15.0 for the built-in SQLite runtime.
- Protected the local `data/` directory from Git so client databases and backups are never committed.
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
