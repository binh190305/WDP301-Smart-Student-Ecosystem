---
trigger: on_deployment
description: Enforce security best‑practices for the STE application
---

# Security Rule

- All HTTP endpoints must be accessed over **HTTPS** in production. Development can use HTTP on localhost.
- Use **helmet** middleware (already in `backend/src/app.js`) to set security headers.
- Validate request bodies with **Joi**; reject any request that fails validation with a 400 response.
- Implement **rate‑limit** (already present) for authentication routes to mitigate brute‑force attacks.
- Store secrets (JWT secret, DB credentials, AI API keys) only in environment variables; never commit them.
- JWT tokens must be signed with HS256 and have an expiration (`expiresIn: '1h'`).
- Passwords are hashed with **bcryptjs** (minimum 10 salt rounds).
- Sanitize any user‑generated content before rendering on the frontend to prevent XSS.
- CORS policy: only allow origins that match the configured front‑end URL (`http://localhost:5173` for dev, production domain otherwise).
- Log authentication failures and suspicious activity but never log secret values.

> Agents must raise a **TBD** if they need to add new security middleware or modify existing config.

