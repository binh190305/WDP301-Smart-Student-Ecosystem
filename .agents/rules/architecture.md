---
trigger: on_startup
description: Preserve existing architecture and tech stack
---

# Architecture Rule

- The STE project uses **Node.js (Express)** for the backend and **React + Vite** for the frontend.
- **Do not replace** these frameworks or language versions.
- All new modules must be added **within** the existing folder hierarchy (`backend/src/…`, `frontend/src/…`).
- Any architectural change must be approved by the lead architect and documented in `docs/SYSTEM_ARCHITECTURE.md`.
- New services may only be introduced as **independent npm packages** under the existing monorepo if they do not interfere with the core stack.

