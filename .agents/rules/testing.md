---
trigger: on_test_suite
description: Testing standards and regression prevention
---

# Testing Rule

- **Backend**: Use **Jest** for unit and integration tests. All test files reside in `backend/test/**/*.test.js`.
- Aim for **>=80 %** statement coverage.
- Mock external services (e.g., AI API calls) with `jest.mock` and provide deterministic fixtures.
- **Frontend**: Adopt **Jest** + **React Testing Library** for component tests and **Cypress** for end‑to‑end flows. Place unit tests alongside components (`*.test.jsx`) and e2e specs under `frontend/cypress/`.
- Tests must run on every commit via CI (GitHub Actions). Failing tests block merges.
- New code must include **at least one test** covering the primary public function or component.
- Test data should never contain real user credentials; use fabricated seeds.
- All test scripts are invoked via `npm test` (backend) and `npm run test:frontend` (frontend).

> Agents adding new features must create corresponding test files and update coverage reports.

