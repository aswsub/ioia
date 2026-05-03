# Google OAuth Backend Env

These values are read by the serverless API routes under `api/google/oauth/*`. Do not prefix them with `VITE_`; they must not be exposed to browser code.

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=
GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.modify
APP_BASE_URL=http://localhost:3000
```

`GOOGLE_CLIENT_ID` comes from the Google Cloud OAuth Web Client.

`GOOGLE_CLIENT_SECRET` comes from the same OAuth Web Client and is used only by `api/google/oauth/callback.ts`.

`GOOGLE_REDIRECT_URI` must exactly match an Authorized redirect URI in Google Cloud.

`GOOGLE_TOKEN_ENCRYPTION_KEY` encrypts the refresh token before it is stored in an HttpOnly cookie. Use a long random value.

`GOOGLE_OAUTH_SCOPES` defaults to `https://www.googleapis.com/auth/gmail.modify` if omitted. Keep this as the only Gmail scope for the current OAuth flow.

`APP_BASE_URL` is used to validate post-OAuth redirects and return users to `?view=Outreach`.

## Local Dev

Run the backend in one terminal:

```bash
npm run dev:api
```

Run the frontend in another terminal:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies `/api/*` to the Node backend on `http://localhost:3001`.
