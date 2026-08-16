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
