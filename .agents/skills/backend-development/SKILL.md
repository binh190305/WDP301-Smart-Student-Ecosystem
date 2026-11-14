---
name: Backend Development
description: Skill for implementing, extending, and maintaining the Node.js/Express backend of STE.
trigger: on_backend_task
---

## When to Activate
- Adding new API endpoints, controllers, services, or middleware.
- Modifying existing backend logic (e.g., recommendation algorithms).
- Updating environment configuration (`backend/.env`).
- Refactoring backend code respecting the existing CommonJS module style.

## Required Context / Input
- Target file path(s) relative to `backend/`.
- Description of the functional change (business requirement).
- Any new data model requirements (must be marked **TBD** if schema change is needed).

## Step‑by‑Step Workflow
1. **Read** relevant existing source files (`src/*`, `src/models/*`).
2. **Identify** affected modules and dependencies.
3. **Draft** the smallest code change (e.g., a new controller function).
4. **Run** `npm run dev` locally and verify the endpoint works with Postman or curl.
5. **Add** unit tests in `backend/test/` covering success and error paths.
6. **Lint** with `npm run lint` (ESLint) – ensure no rule violations.
7. **Document** the new endpoint in `docs/API_DOCUMENTATION.md`.
8. **Commit** using Conventional Commits (e.g., `feat: add /api/recommendations`).
9. **Notify** the code‑review skill for peer review.

## Implementation Standards
- Use **async/await** with proper `try/catch`.
- Validate request bodies with **Joi** schemas placed in `backend/src/validators/`.
- Return JSON responses with a consistent envelope `{ success: boolean, data: ..., error?: string }`.
- Log each request with correlation ID (via `morgan` + custom logger).

## Validation Checklist
- [ ] Linter passes (`npm run lint`).
- [ ] All unit tests pass (`npm test`).
- [ ] Endpoint appears in API docs.
- [ ] No new vulnerabilities introduced (`npm audit` clean).
- [ ] Security rules (rate‑limit, auth) are applied.

## Common Mistakes to Avoid
- Modifying Mongoose schema without migration plan.
- Hard‑coding secrets or environment values.
- Forgetting to export the new controller/function.
- Missing Joi validation leading to unchecked input.
- Ignoring error handling for async operations.

