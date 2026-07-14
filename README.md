# Sales Portal

Internal sales portal and role-based launchpad for CRM tools. Staff log in once, land on a launchpad showing only the apps their role permits, and each downstream app enforces its own role gate server-side.

**Stack:** Next.js 16 (App Router) + Clerk + Vercel

## Prerequisites

- **Node.js** >= 20 (tested on 22.x)
- **npm** >= 10
- **A Clerk account** with an application instance ([clerk.com](https://clerk.com))

## 1. Clone and install

```bash
git clone https://github.com/JonoDeduk/SalesPortal.git
cd SalesPortal
npm install
```

## 2. Clerk instance setup

Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com). Then configure the following in the Clerk dashboard:

### Invite-only (no public signup)

1. Go to **User & Authentication > Email, Phone, Username**.
2. Under **Sign-up modes**, select **Restricted** so that only invited users can create accounts. Disable any self-service signup toggles.

### MFA required

1. Go to **User & Authentication > Multi-factor**.
2. Enable at least one MFA method (authenticator app recommended).
3. Set MFA to **Required** so it cannot be skipped during login.

### Session lifetime

1. Go to **Sessions**.
2. Set **Session maximum lifetime** to **1 week** (168 hours).
3. Set **Inactivity timeout** to a shorter window (e.g. **1 hour**) so idle sessions expire.

### Roles via public metadata

Roles are stored in each user's `publicMetadata` as `{ "role": "<role>" }`. The three roles are:

| Role | Access |
|------|--------|
| `admin` | All apps (Admin, Reports, CRM) |
| `manager` | Reports, CRM |
| `sales_rep` | CRM only |

To assign a role:

1. Go to **Users** and select a user.
2. Under **Public metadata**, set the JSON to:
   ```json
   { "role": "admin" }
   ```
   Replace `admin` with `manager` or `sales_rep` as appropriate.

## 3. Environment variables

Create a `.env.local` file in the project root (this file is gitignored):

```bash
cp /dev/null .env.local
```

Add the following keys from your Clerk dashboard (**Settings > API Keys**):

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

Set the app's public URL (used as the base for invitation redirect links):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

In production, set this to your deployed URL (e.g. `https://portal.yourdomain.com`).

Optionally configure the sign-in redirect path (defaults are usually fine):

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
```

## 4. Run locally

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000). An unauthenticated visitor is redirected to `/sign-in`.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run Vitest tests |
| `npm run typecheck` | Run `tsc --noEmit` |

## 5. Deploy to Vercel

### Initial setup

1. Push the repo to GitHub if you haven't already.
2. Go to [vercel.com](https://vercel.com) and import the GitHub repository.
3. Vercel auto-detects Next.js. Accept the defaults.
4. Add the environment variables in the Vercel project settings (**Settings > Environment Variables**):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Deploy. Vercel builds and serves the app at a `.vercel.app` URL.

### Subsequent deploys

Every push to `main` triggers an automatic production deploy. Pull requests get preview deploys.

## 6. Custom domain

### Acquire a domain

Purchase a domain from any registrar (Namecheap, Cloudflare, Google Domains, etc.).

### Point the domain to Vercel

1. In your Vercel project, go to **Settings > Domains**.
2. Add your domain (e.g. `portal.yourdomain.com`).
3. Vercel provides DNS records (usually a CNAME). Add these at your registrar.
4. Wait for DNS propagation (minutes to hours).

### Update Clerk for the production domain

1. In the Clerk dashboard, go to **Settings > Domains**.
2. Set the **Home URL** to your production domain (e.g. `https://portal.yourdomain.com`).

## 7. Single login across subdomains (Clerk satellite domains)

When downstream CRM apps live on separate subdomains (e.g. `crm.yourdomain.com`, `reports.yourdomain.com`), configure Clerk's primary/satellite domain feature so a single login covers all subdomains.

### Primary domain (the portal)

1. In the Clerk dashboard, go to **Settings > Domains**.
2. Set the portal as the **primary domain** (e.g. `portal.yourdomain.com`).

### Satellite domains (downstream apps)

For each downstream app deployed on its own subdomain:

1. In the Clerk dashboard, add the subdomain as a **satellite domain**.
2. In the downstream app's environment variables, add:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   CLERK_SATELLITE_DOMAIN=crm.yourdomain.com
   CLERK_PRIMARY_DOMAIN=portal.yourdomain.com
   ```
3. The downstream app must also use `@clerk/nextjs` with `ClerkProvider`. The satellite domain configuration tells Clerk to check the primary domain's session, so users who logged into the portal are automatically authenticated on the satellite.

### How it works

- User logs into `portal.yourdomain.com` (the primary domain).
- User clicks a tile to open `crm.yourdomain.com` (a satellite domain).
- Clerk's SDK on the satellite checks the primary domain's session cookie. No re-authentication needed.
- Each downstream app still enforces its own role gate using the shared `publicMetadata.role` claim.

## Architecture

```
src/
  access-policy.ts    Role-to-app access mapping (pure, no I/O)
  auth.ts             Auth adapter (isolates Clerk behind getCurrentUser/requireRole)
  role-gate.ts        URL-to-AppId mapping and access check (pure, reusable)
  app-directory.ts    App metadata (names, descriptions, routes)
  proxy.ts            Next.js middleware enforcing auth + role gates
  app/
    layout.tsx        Root layout with ClerkProvider
    page.tsx          Launchpad with role-filtered app tiles
    sign-in/          Clerk sign-in page
    apps/[appId]/     Stub downstream app pages with server-side role enforcement
```

### Access control

Access is enforced at two layers (defense in depth):

1. **Middleware** (`proxy.ts`): blocks requests to `/apps/*` if the user's role lacks permission.
2. **App page** (`apps/[appId]/page.tsx`): re-checks the role server-side, so direct URL access by a wrong-role user is rejected even if middleware is bypassed.

The launchpad hiding a tile is UX only. Security is enforced server-side.

### Adding a new app

1. Add the app ID and allowed roles to `accessPolicy` in `src/access-policy.ts`.
2. Add the app's display metadata in `src/app-directory.ts`.
3. The tile appears automatically on the launchpad for permitted roles.
4. For a real downstream app on a separate subdomain, deploy it with Clerk satellite domain config (see section 7 above).
