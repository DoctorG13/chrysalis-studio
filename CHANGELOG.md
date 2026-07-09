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

### Changed

- All jobs are now automatically enriched by the Smart Job Status Engine before being exposed through the Chrysalis context.
- UI components can now consume:
  - progress
  - workflowIndex
  - nextStep
  - nextAction
  - overdue
  - dueToday
  - needsAttention

### Improved

- Job cards now display:
  - Progress percentage
  - Next Action
  - Due Today badge
  - Overdue badge
  - Needs Attention badge

- Removed duplicated status colour logic by using the shared workflow constants.

### Changed

- DashboardPage now accepts live jobs.
- Added central dashboard summary object.
- Shared dashboard metrics with child components.
- Established a single source of truth for dashboard calculations.

### Changed

- StatsGrid no longer performs its own calculations.
- All statistics now come from the shared dashboard summary.
- Added live Ready for Collection tile.
- Added live Needs Attention tile.
- Eliminated duplicated dashboard calculation logic.

### Improved

- Today's Priorities is now generated entirely from live job data.
- Priorities automatically include:
  - Overdue jobs
  - Due today
  - Needs attention
- Each priority displays the job, current status and recommended next action.

### Improved

- Jobs Due This Week now uses enriched job data.
- Added workflow progress bar.
- Added overdue and due today highlighting.
- Added next action display.
- Sorted jobs by due date.
- Removed dependency on dashboard helper functions for job health.