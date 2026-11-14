---
trigger: on_ai_module_change
description: Guidelines for AI model integration and safe usage
---

# AI Development Rule

- All AI‑related code lives under `backend/src/recommendation/`.
- **Do not** invoke external LLMs without explicit API keys stored in environment variables (`OPENAI_API_KEY`, `HF_API_TOKEN`).
- Model inference must be wrapped in a **timeout** (default 30 s) and include error handling that returns a graceful fallback response.
- Outputs from LLMs must be **validated** against a JSON schema before being stored or sent to the frontend.
- AI may **recommend** teams, skills, or resources, but **must never** auto‑assign or modify persistent data without user confirmation.
- Log every AI request/response with correlation ID for auditability (use `morgan` or custom logger).
- When adding new AI capabilities, update `docs/AI_CORE_DESIGN.md` and the relevant skill file.

> Any deviation will be flagged by the Antigravity rule engine.

