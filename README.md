# 🦋 Chrysalis Studio

> BizziBuddi — a business operating system for independent makers.

---

## About

Chrysalis Studio is the application platform behind **BizziBuddi**, designed to help independent dressmakers and makers manage their business from one connected workspace.

BizziBuddi brings People, Jobs, Calendar, Finance, Automation, Production, Reports and Buddi together around persistent account-backed business data.

---

## Current BizziBuddi Modules

### Dashboard
- Today and Due Soon operating view
- Smart priorities
- Recent activity
- Business health indicators
- Notifications
- Quick navigation into business modules

### People
- Client records
- Search by name, email and phone
- Client timeline
- Persistent measurement history

### Jobs
- Job creation and status tracking
- Production progress
- Production readiness intelligence
- Due-date highlighting
- Job timeline and workflow events
- Persistent production task progress

### Calendar
- Upcoming, Today, Past and All views
- Appointment search and status filters
- Appointment management
- Garment scheduling from production ready-by dates

### Finance
- Persistent invoices and payments
- Payment reconciliation
- Outstanding and overdue balances
- Due-within-seven-days indicators

### Automation
- Persistent workflow events
- Overdue invoice checks
- Appointment reminder events
- Duplicate-safe automation sources

### Production
- Persistent production records
- Five-stage workflow
- Task checklists and progress
- Ready-by dates
- Production completion intelligence

### Reports
- Account-backed operational reporting
- Financial summaries
- CSV export
- 12-month monthly statistics
- Descriptive business insights

### Buddi
- BizziBuddi assistant interface
- Workspace context
- Natural-language business questions

---

## Data & Authentication

BizziBuddi uses the Chrysalis server/database layer for account-backed business data.

Persistent areas include:
- account identity and workspace membership
- People
- Jobs
- Calendar
- Finance
- Automation
- Production
- Measurements
- Reports derived from persisted business records

Development membership selection is still a preview feature; it does not create live subscriptions or process payments.

---

## Development

### Requirements

- Node.js 24.15.0 or newer
- npm
- Git

### Install

```bash
npm install
```

### Development server

```bash
npm run dev
```

### Database service

```bash
npm run server
```

### Production build

```bash
npm run build
```

### Workflow contract checks

```bash
npm run test:workflow
```

The workflow checker performs static contract checks across the authenticated BizziBuddi routes and major UI workflows. It is intentionally lightweight and does not replace full browser or integration testing.

### Database utilities

```bash
npm run db:init
npm run db:migrate
npm run db:info
npm run db:backup
npm run db:audit
```

---

## Project Structure

```
src/
  components/
  pages/
  data/
  styles/

server/
  bizzibuddi-auth.js
  index.js
  start.js
  production-entry.js

scripts/
  test-bizzibuddi-workflow.js
```

---

## Documentation

- `ROADMAP.md` — product release roadmap
- `CHANGELOG.md` — shipped changes
- `CONTRIBUTING.md` — development workflow and coding rules
- `docs/BIZZIBUDDI.md` — current application architecture and operating guide
- `TODO.md` — legacy task list retained for historical reference

---

## Development Philosophy

Every feature should:
- solve a real business problem
- reduce clicks or repeated work
- preserve the existing architecture
- keep business data account-scoped
- be production quality
- be understandable and maintainable

---

## Authors

**Founder & Product Owner**

Darren Griffiths

**Software Architecture & Development Partner**

Winson

---

## License

See the LICENSE file for details.

---

🦋 Chrysalis Studio
