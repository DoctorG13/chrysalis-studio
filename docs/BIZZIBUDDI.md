# BizziBuddi Application Guide

## 1. Purpose

BizziBuddi is the business-management workspace within Chrysalis Studio.

It is designed around one connected workflow:

`People → Jobs → Calendar → Production → Finance → Reports`

Automation and Buddi provide supporting intelligence around that workflow.

---

## 2. Account & Workspace

BizziBuddi uses authenticated account and workspace records.

The account workspace is loaded from the server and provides the current People, Jobs, Calendar, Finance, Automation and Production data used by the application.

Reports are generated from persisted account data rather than acting as a separate data store.

Membership selection remains a development-preview entitlement. It does not create a live subscription or process payment.

---

## 3. Dashboard

The Dashboard is the daily operating view.

### Today

Shows appointments scheduled for the current day.

### Due Soon

Shows outstanding invoices and production ready-by dates within the next seven days.

### Workflow

Shows production items requiring attention and Jobs waiting for their next workflow step.

### Smart Priorities

Dashboard attention items are deduplicated and ordered using urgency and due-date signals.

### Recent Activity

Recent Jobs, Calendar, Finance, Automation and Production activity is combined into one chronological feed.

### Business Health

Health indicators describe current workload, payment collection, production flow and today's schedule.

---

## 4. People

People contains the client records used by the business.

Available workflows include:
- create and edit people
- search by name, email or phone
- open a client timeline
- create and review measurement snapshots
- delete records where permitted

Measurement history is account-scoped and stored persistently.

---

## 5. Jobs

Jobs connect client work to the production workflow.

A Job can include:
- client
- title
- status
- due date
- production stage
- production progress
- production tasks
- workflow history

Job workflow events are stored through the Automation event infrastructure and can be viewed from the Jobs workspace.

---

## 6. Production

Production is persistent account-backed workflow data.

The production workflow uses five stages and can additionally track:
- ready-by date
- notes
- task checklist
- task completion
- completion percentage
- readiness state

Production readiness can identify states such as Ready, Tasks outstanding, Stage update needed, Overdue, In progress, Not started and Complete.

Legacy browser-local Production records may be migrated into the persistent account store when the account workspace loads.

---

## 7. Calendar

Calendar provides:
- Upcoming
- Today
- Past
- All

Appointments can be searched and filtered by status.

The Calendar also exposes upcoming production ready-by dates through the Garment Schedule.

---

## 8. Finance

Finance stores invoices and payments against the authenticated account.

Invoice information includes:
- amount
- issue date
- due date
- payment state
- recorded payments
- outstanding balance

Unpaid invoices due within seven days are highlighted. Overdue invoices are surfaced separately.

---

## 9. Automation

Automation stores persistent workflow events.

Current automated checks include:
- overdue invoice detection
- appointment reminder event creation
- Job workflow events
- production task workflow events

Automation events are duplicate-safe through source keys where applicable.

Automation prepares and records events; it does not by itself send email or SMS.

---

## 10. Reports

Reports is derived from the current account data.

It includes:
- operational summaries
- financial summaries
- job and production completion indicators
- CSV export
- monthly statistics covering the previous twelve months
- descriptive business insights

The CSV export is generated client-side from the loaded report snapshot.

---

## 11. Buddi

Buddi is the BizziBuddi assistant interface.

It can use current workspace context to answer questions about:
- people
- jobs
- garments
- payments
- upcoming work

Buddi is currently informational. Confirmation-based action execution remains a future enhancement.

---

## 12. Keyboard Shortcuts

When the account workspace is open:

| Key | Destination |
| --- | --- |
| D | Dashboard |
| P | People |
| J | Jobs |
| C | Calendar |
| F | Finance |
| A | Automation |
| R | Reports |
| ? | Shortcut guide |
| Esc | Close shortcut guide |

Shortcuts are ignored while typing in form controls.

---

## 13. Persistence

The current account-backed modules are designed to survive page refresh and logout/login.

Persistent data is account-scoped on the server.

The browser may still contain legacy records used for migration or compatibility, but these are not intended to be the authoritative store for the migrated modules.

---

## 14. Verification

Run:

```bash
npm run test:workflow
```

This performs static workflow-contract checks for:
- authentication
- major BizziBuddi backend routes
- dashboard navigation
- People
- Jobs
- Calendar
- Finance
- Automation
- Production
- Reports
- Buddi
- persistent Production
- Job Timeline
- Measurement History
- accessibility
- responsive reporting
- the seven-day Today View production window

For production releases, combine these checks with browser-based workflow testing and database backup/audit procedures.
