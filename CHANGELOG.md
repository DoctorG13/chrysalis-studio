# Changelog

All notable changes to Chrysalis are recorded here.

---

## Calendar Navigation & Wider Workspaces

### Fixed

- Notification Calendar actions now open the Calendar page directly at the main calendar section instead of leaving the user at the top of the page.

### Changed

- Widened the shared workspace SlidePanel from 640px to 900px so the Workflow Labour Costing table and other workspace content have more usable horizontal space.
- Updated the in-panel save confirmation positioning to remain centered against the wider workspace panel.

---

## Workflow Labour Costing & Notification Links

### Added

- Added individual actionable header notifications for overdue jobs, jobs due today, today's appointments, and ready jobs with outstanding balances.
- Added direct notification actions that open the related Job Workspace or Calendar.
- Added an editable default labour hourly rate for workflow costing under Settings.
- Added a job-specific labour hourly rate that can override the Settings default.
- Added estimated and actual labour hours for each visible Job Workflow stage.
- Added estimated labour cost, actual labour cost and hour variance totals to the Job Workflow area.
- Job-specific labour rates are retained with the job once labour hours are recorded, so later changes to the global default do not alter historical job costing.

---

## Business Notifications

### Added

- Added actionable notifications to the header bell for overdue jobs, jobs due today, today's appointments, and ready jobs with outstanding balances.
- The notification badge appears automatically when attention is required.
- Existing temporary deleted-client backup expiry warnings remain available in the same notification panel.
- Notifications are derived from the live Clients, Jobs and Appointments workspace data and update as that data changes.

---

## Appointment Status Visibility

### Added

- Added clear visual status treatment for calendar appointments.
- Confirmed appointments are shown as active confirmed events.
- Completed appointments are visually muted and marked as completed.
- Cancelled appointments are visually muted and struck through so they remain visible without competing with active appointments.
- Appointment status is also shown in the calendar event label and hover text.

---

## Appointment Conflict Protection

### Added

- Added appointment overlap detection based on date, start time and duration.
- Cancelled and completed appointments do not block new appointments.
- Appointment conflicts are checked in the Appointment Editor before saving.
- The Appointment API performs the same validation server-side and returns a `409` conflict response, preventing conflicting appointments from being persisted.

---

## Unique Job References

### Fixed

- Repaired duplicate Job References in the persistent SQLite database using each job's creation date and the next available sequence number.
- Kept the Job Reference synchronized between the database column and the stored job data.
- Added database-level protection so newly created or edited jobs cannot retain a blank or duplicate Job Reference.
- Job References continue to use the `CHR-DDMMYYYY-NNN` format.

---

## Jobs Balance & Save Feedback

### Fixed

- Changed the Jobs Workspace Outstanding summary to calculate balances from the authoritative Payment API instead of the Job deposit field alone.
- The Jobs summary now uses Total Job Value minus actual payments received, so a $300 job with $200 paid correctly shows $100 outstanding.
- Made successful Job save confirmation visible inside the Jobs Workspace instead of relying on a fixed-position notification.
- Kept save errors visible in the same confirmation area.
- Centered the Job Editor save confirmation above the action buttons so success and error feedback stays with the Save controls.

---

## Job Save Confirmation & Workflow Event Cleanup

### Added

- Added a visible success confirmation after a Job is successfully saved.
- Added save error feedback when a Job save fails.
- Save confirmation automatically clears after a short period.

### Fixed

- Removed the client-side duplicate `Status Changed` timeline event when a workflow status changes.
- Workflow status changes now rely on the persistent automatic workflow timeline event created by the Job API.

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
