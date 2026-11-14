---
trigger: on_commit
description: Enforce consistent coding style across the project
---

# Coding Standards

## General
- Use **ESLint** with the `eslint-config-airbnb-base` style for both backend and frontend JavaScript/TypeScript.
- Indentation: 2 spaces.
- Quotes: single quotes for strings, back‑ticks only when template literals are needed.
- Semi‑colons: required.
- No dangling commas in multi‑line objects/arrays.

## Backend (Node/Express)
- Files are **CommonJS** (`module.exports`, `require`).
- Controllers must export functions named after the HTTP verb (e.g., `createUser`, `updateTeam`).
- Async/await preferred over callbacks; all promises must be `try/catch` wrapped.
- Use `Joi` for request validation; keep schemas in `backend/src/validators/`.
- Log with `morgan` and avoid `console.log` in production code.

## Frontend (React + Vite)
- All components are **function components** using React Hooks.
- Use TypeScript where a `*.tsx` file exists; otherwise keep `.jsx` with PropTypes.
- Follow the **Airbnb React** style guide.
- Styling via **TailwindCSS** utility classes; avoid inline `style` attributes.
- All API calls go through the central axios wrapper in `frontend/src/api/index.js`.

## Commit Messages
- Follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Include ticket or issue reference if applicable.

> Violations will be flagged by the Antigravity linter integration.

