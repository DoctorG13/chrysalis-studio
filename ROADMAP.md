## Post-1.0 — Finance Intelligence

- [x] Correct recorded payment amount, date, method and description from Finance
- [x] Harden payment correction against stale invoice context
- [x] Send payment corrections using the payment's persisted invoice identity
- [x] Use a payment-specific API route for Finance payment corrections
- [x] Remove an incorrectly recorded payment from Finance
- [x] Show persistent payment activity for recorded, edited and removed payments
- [x] Make Finance payment activity directly editable and removable
- [x] Make Payment Activity clearly expandable with persisted recorded, edited and removed events
- [x] Render persistent Payment Activity directly in Finance
- [x] Render persistent Payment Activity directly in the BizziBuddi account invoice view
- [x] Backfill persistent Payment Activity for pre-existing invoice payments
- [x] Allow persistent Finance payment activity event types in BizziBuddi event validation
- [x] Guarantee Payment Activity for existing invoice payment records
- [x] Guarantee visible Payment Activity when invoice payments exist
- [x] Polish Payment Activity dates, amounts and customer-facing invoice references
- [x] Record detailed payment audit changes for amount, date, method and description
- [x] Record only actual payment-field changes in audit events
- [x] Repair legacy edited-payment audit history and prevent duplicate recorded events
- [x] Fix legacy payment-audit migration amount parsing
- [x] Make legacy payment-audit reconciliation deterministic
- [x] Fix Payment Activity retrieval for persisted payment update and removal events
- [x] Stabilise Payment Activity as a read-only audit trail\n- [x] Add one-time repair utility for the corrupted legacy payment audit snapshot
- [x] Correct the legacy repair snapshot to preserve the original $150 Cash payment and avoid duplicate $300 → $100 audit events
- [x] Preserve persisted Payment Activity through invoice API serialization
- [x] Add Finance Revenue Overview with persisted payment metrics and six-month revenue view
- [x] Add Finance Cashflow Outlook using recorded payments and outstanding invoices
- [x] Add persistent Finance Expenses & Outgoings with net cashflow calculations
- [x] Add six-month Finance cashflow intelligence and expense category analysis
- [x] Add Finance monthly reporting with selected-month transaction detail and CSV export
- [x] Add Australian financial-year and custom date-range Finance reports
- [x] Allow Finance report content to be customised before CSV export
- [x] Add printable Finance reports with browser PDF output using the selected period and report contents
- [x] Add horizontal workspace section submenus across BizziBuddi navigation
- [x] Make BizziBuddi primary workspace sections navigate directly to their contextual destination
- [x] Align contextual submenus visually beneath their parent workspace sections



- [x] Preserve natural-language payment amounts during parsing
- [x] Show persistent payment history on each invoice
- [x] Return payment history with invoice data for reliable Finance rendering
- [x] Simplify and indent invoice payment history presentation
- [x] Display payment history as a compact multi-payment ledger
- [x] Add direct payment entry from Finance invoices
- [x] Recognize natural-language payment received phrasing in Buddi

- [x] Buddi answers who currently owes money
- [x] Buddi reports client-specific outstanding balances
- [x] Buddi identifies overdue invoices
- [x] Buddi provides total outstanding invoice balances
- [x] Buddi links finance answers directly to Finance

## Buddi Natural-Language Job Details

- [x] Parse natural-language due dates
- [x] Parse natural-language job pricing
- [x] Persist due date and price on account jobs
- [x] Sync job due dates into production tracking
- [x] Show parsed details during confirmation and in Jobs

## Account Buddi Job Creation

- [x] Route direct job-creation requests inside the account-backed Buddi assistant
- [x] Pre-fill an unambiguous person and job title from natural language
- [x] Require explicit review and confirmation before saving
- [x] Persist confirmed jobs through the authenticated Jobs API

## Buddi Natural-Language Job Creation

- [x] Recognise direct job-creation commands reliably
- [x] Pre-fill job details from natural-language requests
- [x] Match an unambiguous existing client when named
- [x] Parse common due-date and price formats
- [x] Keep explicit review and confirmation before persistence

## Production Time Tracking

- [x] Persistent time entries
- [x] Start/stop production timer
- [x] Live elapsed time
- [x] Per-job logged time totals
- [x] Recent time history
- [x] Automation events for timer activity

## Production Task Templates

- [x] Persistent production task templates
- [x] Create and edit reusable task lists
- [x] Delete templates
- [x] Apply templates to production jobs without overwriting existing tasks
- [x] Automation event when a template is applied

# 🦋 Chrysalis Roadmap

> Chrysalis is a production-quality operating system for Donna's dressmaking business.

---

# Vision

Every feature should answer one question:

> "Does this help Donna run her business better today?"

If not, it probably belongs in a later release.

---

# Release 0.5 — Workflow

## ✅ Dashboard Intelligence

- [x] Dashboard Insight Engine
- [x] Production workflow statuses
- [x] Workspace job progress improvements

## 🚧 Jobs

- [x] Automatic workflow events
- [x] Job timeline automation
- [x] Job progress tracker
- [x] Production task progress
- [x] Production completion intelligence
- [x] Due date highlighting
- [x] Outstanding payment warnings
- [x] Dashboard intelligence
- [x] Today view

## 🚧 Clients

- [x] Client timeline
- [x] Measurement history
- [x] Client search improvements

## 🚧 Dashboard

- [x] Smart priorities
- [x] Recent activity
- [x] Business health indicators

---

# Release 0.6 — Studio

- [x] Calendar improvements
- [x] Notifications
- [x] Better appointment management
- [x] Garment scheduling
- [x] Keyboard shortcuts

---

# Release 0.7 — Business

- [x] Reporting
- [x] Financial summaries
- [x] Exporting
- [x] Monthly statistics
- [x] Business insights

---

# Release 0.8 — Polish

- [x] UI refinement
- [x] Performance optimisation
- [x] Accessibility
- [x] Responsive improvements

---

# Release 0.9 — Beta

- [x] Full workflow testing
- [x] Data validation
- [x] Bug fixing
- [x] Documentation

---

# Release 1.0

- [x] Production release

Version `1.0.0` establishes the production application baseline with documented workflows, persistent account-backed business data, production startup, backup/restore support and release verification.

Donna can comfortably run Chrysalis as her primary business application every day.

---

# Post-1.0 — Operational Depth

## ✅ Production Workflow 2.0

- [x] Production queue
- [x] Due-today and overdue views
- [x] Ready and complete views
- [x] Job-centric production cards
- [x] Production stage workflow
- [x] Task progress visibility
- [x] Quick completion action
- [x] Dashboard / Buddi production state synchronisation

## Next

- [x] Production task templates
- [x] Production time tracking
- [x] Client/job detail deep links
- [x] Production workload balancing
- [x] Today record-level action links
- [x] Job detail next-action workflow
- [x] Calendar record focus and production links


## Post-1.0 — Assistant Intelligence

- [x] Buddi production workload awareness
- [x] Buddi proactive business focus


## Post-1.0 — Actionable Assistant

- [x] Create jobs from Buddi
- [x] Confirmation-based Buddi production actions


## Post-1.0 — Actionable Assistant

- [x] Buddi confirmed production task actions

- [x] Preserve natural-language payment amounts during parsing
- [x] Show persistent payment history on each invoice
- [x] Return payment history with invoice data for reliable Finance rendering
- [x] Simplify and indent invoice payment history presentation
- [x] Display payment history as a compact multi-payment ledger
- [x] Add direct payment entry from Finance invoices
- [x] Recognize natural-language payment received phrasing in Buddi

- [x] Buddi answers who currently owes money
- [x] Buddi reports client-specific outstanding balances
- [x] Buddi identifies overdue invoices
- [x] Buddi provides total outstanding invoice balances
- [x] Buddi links finance answers directly to Finance

## Buddi Natural-Language Job Details

- [x] Parse natural-language due dates
- [x] Parse natural-language job pricing
- [x] Persist due date and price on account jobs
- [x] Sync job due dates into production tracking
- [x] Show parsed details during confirmation and in Jobs

## Account Buddi Job Creation

- [x] Route direct job-creation requests inside the account-backed Buddi assistant
- [x] Pre-fill an unambiguous person and job title from natural language
- [x] Require explicit review and confirmation before saving
- [x] Persist confirmed jobs through the authenticated Jobs API

## Buddi Natural-Language Job Creation

- [x] Recognise direct job-creation commands reliably
- [x] Pre-fill job details from natural-language requests
- [x] Match an unambiguous existing client when named
- [x] Parse common due-date and price formats
- [x] Keep explicit review and confirmation before persistence

## Production Time Tracking

- [x] Persistent time entries
- [x] Start/stop production timer
- [x] Live elapsed time
- [x] Per-job logged time totals
- [x] Recent time history
- [x] Automation events for timer activity

## Production Task Templates

- [x] Persistent production task templates
- [x] Create and edit reusable task lists
- [x] Delete templates
- [x] Apply templates to production jobs without overwriting existing tasks
- [x] Automation event when a template is applied

# 🦋 Chrysalis Roadmap

> Chrysalis is a production-quality operating system for Donna's dressmaking business.

---

# Vision

Every feature should answer one question:

> "Does this help Donna run her business better today?"

If not, it probably belongs in a later release.

---

# Release 0.5 — Workflow

## ✅ Dashboard Intelligence

- [x] Dashboard Insight Engine
- [x] Production workflow statuses
- [x] Workspace job progress improvements

## 🚧 Jobs

- [x] Automatic workflow events
- [x] Job timeline automation
- [x] Job progress tracker
- [x] Production task progress
- [x] Production completion intelligence
- [x] Due date highlighting
- [x] Outstanding payment warnings
- [x] Dashboard intelligence
- [x] Today view

## 🚧 Clients

- [x] Client timeline
- [x] Measurement history
- [x] Client search improvements

## 🚧 Dashboard

- [x] Smart priorities
- [x] Recent activity
- [x] Business health indicators

---

# Release 0.6 — Studio

- [x] Calendar improvements
- [x] Notifications
- [x] Better appointment management
- [x] Garment scheduling
- [x] Keyboard shortcuts

---

# Release 0.7 — Business

- [x] Reporting
- [x] Financial summaries
- [x] Exporting
- [x] Monthly statistics
- [x] Business insights

---

# Release 0.8 — Polish

- [x] UI refinement
- [x] Performance optimisation
- [x] Accessibility
- [x] Responsive improvements

---

# Release 0.9 — Beta

- [x] Full workflow testing
- [x] Data validation
- [x] Bug fixing
- [x] Documentation

---

# Release 1.0

- [x] Production release

Version `1.0.0` establishes the production application baseline with documented workflows, persistent account-backed business data, production startup, backup/restore support and release verification.

Donna can comfortably run Chrysalis as her primary business application every day.

---

# Post-1.0 — Operational Depth

## ✅ Production Workflow 2.0

- [x] Production queue
- [x] Due-today and overdue views
- [x] Ready and complete views
- [x] Job-centric production cards
- [x] Production stage workflow
- [x] Task progress visibility
- [x] Quick completion action
- [x] Dashboard / Buddi production state synchronisation

## Next

- [x] Production task templates
- [x] Production time tracking
- [x] Client/job detail deep links
- [x] Production workload balancing
- [x] Today record-level action links
- [x] Job detail next-action workflow
- [x] Calendar record focus and production links


## Post-1.0 — Assistant Intelligence

- [x] Buddi production workload awareness
- [x] Buddi proactive business focus


## Post-1.0 — Actionable Assistant

- [x] Create jobs from Buddi
- [x] Confirmation-based Buddi production actions


## Post-1.0 — Actionable Assistant

- [x] Buddi confirmed production task actions