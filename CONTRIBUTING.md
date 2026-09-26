# Chrysalis Development Guide

## Purpose

This repository contains the Chrysalis Studio application and the BizziBuddi business-management platform.

The development goal is to ship focused, production-quality business workflows without unnecessary redesign.

---

## Development Rules

- Inspect the current repository before changing code.
- Preserve the existing architecture unless a change has a clear technical reason.
- Implement one feature or fix at a time.
- Prefer reusable components and account-backed services.
- Keep business logic outside presentation-only code where practical.
- Do not silently reintroduce browser-local storage as the source of truth for persistent business data.
- Keep account data isolated to the authenticated workspace.
- Update the roadmap and changelog when a roadmap item is shipped.
- Prefer complete file replacements when a source file needs substantial changes.
- Perform static sanity checks before declaring a feature shipped.

---

## Development Workflow

1. Inspect the current implementation.
2. Identify the smallest safe change.
3. Update the relevant complete file.
4. Update documentation when behaviour or architecture changes.
5. Run the appropriate static contract checks.
6. Review the resulting repository state.
7. Commit the change to `main` when the feature is ready.

---

## Useful Commands

```bash
npm install
npm run dev
npm run server
npm run build
npm run test:workflow
npm run lint
```

Database utilities:

```bash
npm run db:init
npm run db:migrate
npm run db:info
npm run db:backup
npm run db:audit
```

---

## Repository Documentation

- `README.md` — project overview and setup
- `ROADMAP.md` — release roadmap
- `CHANGELOG.md` — shipped changes
- `docs/BIZZIBUDDI.md` — application architecture and operating guide
- `CONTRIBUTING.md` — this development guide

---

## Git Commit Style

Use a concise imperative message that describes the shipped change.

Examples:

```
feat(bizzibuddi): add production task progress
fix(bizzibuddi): correct due-soon window
docs(bizzibuddi): update application guide
refactor(bizzibuddi): extract shared workflow logic
```

---

## Quality Expectations

Before shipping:
- verify the intended marker or workflow exists
- verify obsolete behaviour has been removed
- check affected documentation
- run the relevant static workflow checks
- avoid unrelated changes

Runtime/browser testing should be added when a change requires behaviour that static checks cannot reasonably validate.
