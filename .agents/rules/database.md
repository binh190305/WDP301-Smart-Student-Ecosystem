---
trigger: on_schema_change
description: Preserve existing database schema and guard against destructive migrations
---

# Database Rule

- The project uses **MongoDB** with Mongoose schemas defined under `backend/src/models/`.
- **Do NOT** modify existing collection structures without a migration plan documented in `docs/DATABASE_SCHEMA.md`.
- New fields must be **optional** (or have default values) to maintain backward compatibility.
- Indexes may only be added after performance testing and approval.
- All schema changes must be accompanied by unit tests covering CRUD operations.
- Never drop a collection in production.
- Database connection strings are read from environment variable `MONGO_URI`; never hard‑code credentials.

> Agents must signal `TBD` when a required schema change is identified.

