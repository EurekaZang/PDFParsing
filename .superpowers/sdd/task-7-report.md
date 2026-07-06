# Task 7 Report: Frontend Scaffold, Typed API Client, and Login UI

Status: DONE

## Implementation

Created the React/Vite frontend scaffold under `/home/eureka/pdf-po-extractor/frontend`:

- `package.json`, `package-lock.json`, `index.html`
- TypeScript and Vite configs
- React entrypoint and root app
- Shared frontend API types
- Auth token helpers backed by `window.localStorage`
- Typed API client for login, PDF parse, and Excel export endpoints
- Login page component with disabled submit state, error banner, and token handoff
- Authenticated placeholder shell with topbar, Sign out button, and Task 8 placeholder panel
- Accessible CSS for a disciplined procurement/document desk UI with a restrained blue-gray palette, ink-blue actions, visible focus states, responsive layout, and a subtle scanned-paper/grid motif

Backend code was not modified. Stash entries were listed only for confirmation and were not applied or touched.

## Deviations / compatibility additions

The task brief specified `typescript: latest`; `npm install` resolved TypeScript 6.0.3. Two compatibility additions were required for the specified `npm run build` to succeed:

- Added `ignoreDeprecations: "6.0"` to both TypeScript config files because TypeScript 6 errors on `moduleResolution: "Node"` without it.
- Added `@types/react`, `@types/react-dom`, and `src/vite-env.d.ts` because strict TSX compilation needs React DOM declarations and Vite ambient CSS import declarations.

## Verification

Build command run from `/home/eureka/pdf-po-extractor/frontend`:

```bash
npm run build
```

Result: passed. TypeScript compiled and Vite produced `frontend/dist`.

Runtime verification:

- Started Vite preview on `http://127.0.0.1:4173/`.
- Observed unauthenticated login UI in headless Chrome:
  - `PDF PO Extractor`
  - login explanatory text
  - Username and Password fields
  - disabled `Sign in` button when fields are empty
  - username/password autocomplete attributes present
- Seeded `pdf-po-extractor-token` in localStorage through Chrome DevTools Protocol and reloaded the app.
- Observed authenticated shell:
  - topbar title and JABIL upload/export copy
  - `Sign out` button
  - panel text: `Upload interface will be added in Task 8`
  - panel copy: `The login flow is connected. Continue with the upload and preview task.`

Screenshots captured locally during verification:

- `/tmp/pdf-po-login.png`
- `/tmp/pdf-po-authenticated-shell.png`

## Self-review

- Confirmed staged files are limited to `/home/eureka/pdf-po-extractor/frontend` and this report file.
- Confirmed required interfaces are exported:
  - `login(username: string, password: string): Promise<TokenResponse>`
  - `getToken()`, `setToken(token: string)`, `clearToken()`
  - `LoginPage` with `onLogin(token: string) => void`
- Confirmed root app uses stored token, renders login when absent, renders the exact requested authenticated placeholder shell when present, and clears token on sign out.
- Confirmed API paths match the backend contract from the brief: `/api/auth/login`, `/api/files/parse`, `/api/excel/export`.
- Confirmed `frontend/package-lock.json` is included.
- Automated reuse review noted future maintainability opportunities: generate or share API schemas from the backend contract, add a shared request helper, and centralize bearer header construction. I left these unchanged because Task 7 explicitly specifies manual frontend types and direct endpoint helpers, and there is no existing frontend abstraction to reuse yet.

## Concerns

No functional concerns. Notes:

- The approved dependency versions use `latest`, so future installs may resolve newer major versions. The current lockfile pins the working versions installed for this task.
- Automated code-review subagents were attempted for self-review; convention review completed with no findings, reuse review returned maintainability notes, one review hit a 429 rate-limit, and remaining review agents did not return promptly. I completed the self-review locally and verified the build/runtime surface before commit.
