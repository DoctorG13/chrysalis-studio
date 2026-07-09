# Changelog

All notable changes to Chrysalis are recorded here.

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
- Automatic identification of overdue jobs.
- Automatic identification of jobs due today.
- Automatic identification of garments ready for collection.


### Added

- Dashboard intelligence now detects overdue jobs.
- Added jobs due today.
- Improved weekly due calculations.
- Dashboard focus list now prioritises critical work before routine tasks.

### Added

- Added shared `getJobHealth()` utility.
- Added overdue job detection.
- Added jobs due today detection.
- Improved dashboard insights model.
- Established a shared health model for future dashboard and job components.

### Changed

- Refactored Today's Priorities to use the shared `getDashboardInsights()` utility.
- Added visual priority levels for dashboard focus items.
- Simplified the component by moving business logic into the dashboard utility layer.

### Changed

- Jobs Due This Week now displays shared job health indicators.
- Added colour-coded borders and health labels using the shared dashboard intelligence.

### Changed

- StatsGrid now displays contextual subtitles based on live dashboard data.
- Active Jobs highlights overdue work.
- Today's Appointments indicates when the schedule is clear.
- Outstanding Payments confirms when all invoices have been paid.

### Changed

- Improved dashboard statistics with contextual subtitles.
- Active Jobs now highlights overdue work.
- Today's Appointments indicates when no appointments are scheduled.
- Outstanding Payments confirms when all payments have been received.

## Release 0.5.1

Added Smart Job Status Engine.

- Workflow helper functions
- Automatic progress calculation
- Next workflow step
- Next action generation
- Due today detection
- Overdue detection
- Needs Attention flag
- Job enrichment helper