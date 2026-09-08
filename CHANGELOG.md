# Changelog

All notable changes to Chrysalis are recorded here.

---

## Due Date Highlighting & Warnings

### Added

- Job cards now calculate due-date state directly when enriched job flags are not already present.
- Overdue jobs receive a clear red visual treatment and `Overdue` badge.
- Jobs due today receive a clear blue visual treatment and `Due Today` badge.
- The due-date display now communicates the urgency directly as `OVERDUE` or `DUE TODAY`.
- Completed, Collected and Cancelled jobs are not treated as due-today jobs.

### Changed

- Due-date status is now visible at the primary Job Card level rather than relying only on secondary filtering or pre-enriched data.
- Selected-job styling remains available for jobs without an urgent due-date state.

---

## Workflow Consistency & Production Tracking Foundation

### Added

- Centralised the production-stage workflow as `PRODUCTION_WORKFLOW`, derived from the authoritative job workflow.
- Updated the Job Editor to use the shared workflow sequence: Quote, Booked, Measuring, Pattern, Cutting, Sewing, Fitting, Alterations, Mending, Ready, Collected and Cancelled.
- Added workflow-stage changes to the job Timeline as workflow transition events.
- Limited Job Editor labour-hour tracking and costing to active production stages rather than quote, booking or terminal stages.
- Updated Production Workload to consume the same shared production-stage definition.

### Changed

- Job Editor workflow ordering, production workload stages and labour-stage reporting now use one authoritative workflow definition.
- Cancelled jobs no longer appear as though every earlier workflow stage has been completed in the Job Editor.

---

## Production Workload

### Added

- Added a Production Workload view to the Jobs area.
- Added a stage-based view of active production jobs across Measuring, Pattern, Cutting, Sewing, Fitting, Alterations, Mending and Ready.
- Added active, due-today, overdue and estimated stage-hour workload summaries.
- Added due-date ordering within each workflow stage.
- Added direct opening of the existing Job Editor from workload cards.
- Added estimated and actual workflow-hour visibility for jobs where hours have been recorded.
- Excluded Quote, Collected and Cancelled jobs from the production floor view.

### Changed

- Jobs now provides both high-level command-centre filtering and a visual production-floor workload view.

---

## Jobs Command Centre & Menu Shortcuts

### Added

- Added Jobs Command Centre quick filters for All Jobs, Overdue, Due Today, Due This Week, Ready and Outstanding.
- Added command-centre workload metrics for Active Jobs, Overdue, Due Today, Due This Week, Ready and total Outstanding value.
- Added job sorting by Due Date, Client, Workflow Status and Outstanding balance.
- Outstanding filtering and totals use the authoritative Payment API when available.
- Replaced numbered Alt+1 through Alt+7 navigation with menu-letter shortcuts: Alt+S Studio, Alt+P People, Alt+J Jobs, Alt+G Garments, Alt+C Calendar, Alt+F Finance and Alt+R Reports.
- Added Alt+Shift+S for Settings because Studio and Settings both begin with S.

### Changed

- Jobs is now a stronger operational command centre for prioritising production work and financial follow-up.

---

## Jobs Workspace & Garment Production Schedule

### Added

- Added Jobs as a first-class item in the main left-hand navigation.
- Added a dedicated Jobs page using the existing Jobs Workspace and Job Editor.
- Added a Garment Production Schedule to the Garments area.
- Production Schedule groups active garments into Overdue, Due Today, Next 7 Days and Later based on their existing due dates.
- Garments without due dates are identified separately rather than silently omitted.
- Schedule entries show the garment, client, Job Reference, workflow status and due date.
- Schedule entries open the related Job Workspace when selected.
- Collected and Cancelled jobs are excluded from the active production schedule.

### Changed

- Jobs is now treated as a primary workflow destination rather than only a workspace launched from Studio.

---

## Keyboard Shortcuts

### Added