# Design: Gmail OAuth Demo Flow

## Components

- `api/google/oauth/start.ts` starts OAuth.
- `api/google/oauth/callback.ts` exchanges the code and stores encrypted token state.
- `api/google/oauth/status.ts` reports connection status.
- `api/google/oauth/disconnect.ts` clears connection state.
- `api/google/messages/send.ts` sends a selected draft through Gmail when connected.
- `api/_lib/*` contains shared cookie, crypto, env, Gmail, OAuth, and token helpers.
- `src/lib/gmail-client.ts` is the browser-facing client wrapper.

## Local topology

The Vite app runs separately from the API backend in development:

```bash
npm run dev      # frontend
npm run dev:api  # API server on the local API port
```

The frontend proxies `/api/*` requests to the local backend. OAuth redirect URI must match the Google Cloud console entry exactly.

## Security posture

This is a demo implementation, but it should still avoid obvious leaks:

- Keep refresh tokens in encrypted HttpOnly cookie state.
- Keep Google secrets out of `VITE_` variables.
- Use the narrow Gmail scope documented in `docs/google-oauth.md`.
- Do not log token payloads, authorization codes, or encryption keys.

## Kiro usage

Kiro should help with setup and regression checks:

- The env hook should identify missing variable names without printing values.
- Specs should document where OAuth lives so future changes do not sprawl into unrelated UI.
- Build hooks should catch import mistakes across `api/`, `server/`, and `src/`.
