# JobTrack setup and operations

[Back to the product overview](../README.md)

A private job application tracker built with Next.js, TypeScript, Tailwind CSS, and Supabase. Track a role from first interest through interviews and an offer, without maintaining a spreadsheet.

## Features

- Registration, password login, email confirmation, logout, and persistent cookie sessions.
- Protected Dashboard, Applications, Statistics, and Profile pages.
- Create, inspect, edit, and delete applications, with confirmation before deletion.
- All 13 requested statuses, with distinct badges and inline status updates.
- Live search across company, position, and location; combined status, company, and date filters.
- Ascending and descending sorting by company, position, application date, pipeline status, or last updated.
- Paginated spreadsheet view, summary cards, and three interactive Recharts charts.
- Light, dark, and system appearance; responsive navigation; keyboard-accessible dialogs.
- Separate browser-local demo, available without an account at `/demo`.

## Stack and requirements

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase Auth/PostgreSQL, Zod validation, Recharts, Radix Dialog, Lucide icons, and next-themes. ESLint, Vitest, and Prettier support development.

Use Node.js 24 LTS, npm, and a Supabase project. `.nvmrc`, `package.json`, and GitHub Actions use Node 24 consistently. The lockfile pins the tested dependency versions. No paid services or service-role key are needed by the application.

## Run locally

```sh
npm ci
```

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

On macOS/Linux, use `cp .env.example .env.local`. If `.env.local` already exists, edit it instead of replacing it.

Set these two variables:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Find both values in your Supabase project settings. Prefer a publishable key starting with `sb_publishable_`. A current legacy **anon** key also works in the same variable; `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported as a fallback. Never use a secret or service-role key. Public keys are intentionally available to the browser; row level security enforces privacy.

```sh
npm run dev
```

Open `http://localhost:3000`. Unauthenticated users are redirected to `/login`. Without environment variables, the login page explains setup and links to the working demo. Restart the development server after changing environment variables. Invalid keys must be replaced; a configured value alone does not mean Supabase accepted it.

## Create the database

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the complete contents of `supabase/migrations/202609080001_applications.sql`.
3. Run the query once. It creates the table, indexes, constraints, grants, four ownership policies, and automatic `updated_at` trigger.
4. Confirm the `applications` table appears in the Table Editor with RLS enabled.

Alternatively, with the Supabase CLI configured and linked to your project, run `supabase db push` from this repository. This migration is a one-time initial schema; do not rerun it against an existing table.

An anon/publishable key cannot create tables, run migrations, or administer your project. The SQL Editor or authenticated Supabase CLI is required. The schema does not create sample records or change other tables.

### Ownership and permissions

`applications.user_id` references `auth.users.id` with cascade deletion. Every SELECT/INSERT/UPDATE/DELETE policy compares this value to `auth.uid()`. The authenticated role can insert only editable fields and its user ID; it can update only editable fields. IDs, ownership, creation timestamps, and update timestamps cannot be overwritten by client updates. Anonymous users have no table privileges.

Next.js API routes independently verify the user with `auth.getUser()`, assign ownership on creation, and scope queries by the authenticated user. Zod rejects unexpected properties, invalid dates, unsafe URL schemes, and missing required fields. The Supabase proxy refreshes cookie sessions; protected server layouts and every API handler validate authentication. No service-role bypass is used.

## Configure authentication

In Supabase **Authentication → Providers**, enable Email and password authentication. Email confirmations should remain enabled for real use. Configure a minimum password length of 12 to match the registration form, and configure production SMTP before accepting public registrations.

Under **Authentication → URL Configuration**:

- Set **Site URL** to `http://localhost:3000` during local development.
- Add `http://localhost:3000/auth/callback` to the redirect allow list.
- If using the preview at `127.0.0.1`, also allow `http://127.0.0.1:3000/auth/callback`.
- When deploying, use your HTTPS production domain as Site URL and add `https://your-domain/auth/callback`.

Register an account and open the confirmation email. When opened in the same browser that started registration, the default PKCE flow can use its verifier cookie to sign you in automatically. Opening the email in another browser can still confirm the email but cannot complete that automatic sign-in; JobTrack takes you to the login form with a “Finish signing in” message. Revisited callbacks reuse an existing server-validated session. Explicit provider errors lead to a recovery page, and no callback parameter alone is treated as proof of confirmation. Supabase handles password hashing, session issuance, refresh, rate limits, and email delivery. JobTrack does not store passwords.

## Data model

| Field              | Type        | Notes                                         |
| ------------------ | ----------- | --------------------------------------------- |
| `id`               | UUID        | Database generated primary key                |
| `user_id`          | UUID        | Authenticated owner; references `auth.users`  |
| `company_name`     | text        | Required, max 160 characters                  |
| `position`         | text        | Required, max 200 characters                  |
| `job_link`         | text        | Optional http/https URL, max 2,048 characters |
| `location`         | text        | Optional, max 200 characters                  |
| `application_date` | date        | Required calendar date                        |
| `status`           | text        | Required, constrained to the 13 statuses      |
| `notes`            | text        | Optional, max 10,000 characters               |
| `created_at`       | timestamptz | Database controlled                           |
| `updated_at`       | timestamptz | Updated automatically by database trigger     |

Statuses: Interested, Applied, Waiting, Interview #1, Interview #2, Interview #3, Technical Interview, Final Interview, Offer, Accepted, Rejected, Ghosted, and Withdrawn.

## Statistics definitions

Statistics use current records, with no inferred status history:

- **Waiting:** exactly the Waiting status.
- **Interviews:** currently in any of the five interview stages.
- **Offers:** Offer plus Accepted.
- **Success rate:** Accepted / total applications × 100.
- **Interview rate:** currently interviewing / total applications × 100.
- **Offer rate:** (Offer + Accepted) / total applications × 100.
- **This month:** application date is in the current local calendar month.
- **Active:** excludes Accepted, Rejected, Ghosted, and Withdrawn.

Rates are rounded to the nearest whole percent; empty data produces 0%. Charts show daily applications over 30 days, monthly applications over six months, and current status totals. A completed interview is no longer counted under Interviews after its status changes to Offer, for example. Historical conversion rates would require a separate status history table.

## Demo

`/demo` is explicitly separate from the authenticated workspace. It contains sample applications, supports CRUD, search, filters, sorting, and analytics, and saves changes in this browser's local storage under `jobtrack-demo-v1`. Demo company links point to public company websites, not real advertised roles. Demo profile data is illustrative and is not editable; create an account to maintain a real profile. Delete that storage key in browser developer tools to reset the samples. Demo records are never uploaded or copied into a real account. Real workspaces start empty.

## Validation and production build

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm start` serves the production build at port 3000. Stop an existing server using that port first. For a second server use `npm start -- --port 3001`. `next build` does not run ESLint, so run the checks separately.

Unit tests cover validation, date and status handling, combined filters, sorting, and rates. API tests cover session rejection, server-assigned ownership, owner-scoped mutations, invalid requests, database errors, and multi-batch reads. API tests mock Supabase and do **not** prove deployed RLS or email delivery.

After configuring a real project, verify the full flow:

1. Register and confirm two accounts, A and B, in separate browser profiles.
2. As A, create an application, edit its details and status, and refresh to confirm persistence.
3. As B, confirm A's application is absent. Requests attempting to edit or delete A's ID must return 404. Direct Supabase queries with B's session must also be unable to read or change A's row.
4. As A, cancel a delete and confirm the row remains; confirm a delete and verify it disappears.
5. Log out. Protected pages must redirect to login and API requests must return 401.

## Deploy to Vercel

JobTrack needs a running Next.js server for API routes, cookie sessions, and authentication callbacks. GitHub Pages only serves static files and cannot host this version of the application. Do not enable `output: 'export'` or use the GitHub Pages Next.js deployment template. The GitHub Actions workflow runs lint, tests, and a production build; Vercel handles hosting separately through its Git integration.

1. Push this repository to your Git provider and import it in Vercel.
2. Use the Next.js preset, Node.js 24, build command `npm run build`, and default output settings.
3. Add the two `NEXT_PUBLIC_SUPABASE_*` variables to the target Vercel environments **before building**.
4. Apply the SQL migration to the target Supabase project if not already applied.
5. Configure the production authentication URLs as described above.
6. Deploy and perform the two-account checks. Environment changes require a new deployment because public variables are bundled at build time.

Use the project's stable production domain in Supabase's Site URL and redirect allow list, not an individual deployment's generated preview URL. Keep the existing localhost callbacks for development. No GitHub Actions secrets are required for the CI workflow; the public Supabase values belong in Vercel's project environment variables. Keep the Vercel Output Directory setting at its Next.js default, not `out`.

## Project structure

```text
app/
  (workspace)/            Protected dashboard, applications, statistics, profile
  api/applications/       Authenticated collection and record route handlers
  auth/                  Email confirmation callback and error recovery
  demo/                  Isolated local demo routes
  login/, register/      Authentication pages
  globals.css            Shared visual tokens, layout, light/dark, responsive rules
components/              Reusable shell, tables, filters, forms, dialogs, charts
hooks/use-applications   Workspace data state and mutation feedback
lib/
  supabase/              Typed browser/server clients and environment config
  applications.ts        Validation, search/filter/sort, and statistics
  api.ts                 Server authentication boundary
  demo.ts                Clearly labeled sample records
services/                Browser-to-API data access
types/                   Application, status, and database types
supabase/migrations/     PostgreSQL schema, grants, RLS, and trigger
tests/                   Meaningful model and API access-boundary tests
proxy.ts                 Supabase cookie session refresh
```

The browser loads the user's complete application list so filters and charts update immediately. The API reads the database in batches of 1,000 to avoid silently truncating at Supabase's default result limit. The table shows eight records per page. This is suitable for a personal tracker; a substantially larger dataset should move filtering, sorting, and aggregation into server queries.

## Troubleshooting

- **Invalid API key:** copy the current public key from the same project's API settings and restart/rebuild.
- **Could not load applications:** confirm the migration ran successfully, the project is active, and the public key is valid.
- **Email not confirmed / no confirmation email:** check spam, Supabase Auth logs and SMTP configuration; sign-up email delivery has service limits.
- **Confirmation link failed:** use the same browser that registered, confirm the callback allow list, and request a fresh signup confirmation if needed.
- **No rows visible after creation:** check the signed-in user and RLS policies. Do not disable RLS to troubleshoot privacy.

Implementation references: [Next.js App Router](https://nextjs.org/docs/app), [Supabase server-side auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client), and [Supabase row level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
