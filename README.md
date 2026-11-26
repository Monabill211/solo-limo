This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Supabase database setup

The numbered SQL files in `supabase/migrations/` are the schema source of truth. A new Supabase project starts by applying those files in order, either with the Supabase CLI migration workflow or in the Dashboard SQL Editor. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY` in the application environment.

### Reset the audited existing project

1. Open the Supabase project matching `NEXT_PUBLIC_SUPABASE_URL`. Confirm the target and access its backup or export before the cutover.
2. Run `node supabase/generate-reset.mjs` at the repository root. Open `supabase/reset.generated.sql`, review it, and paste the **entire file** into the project's SQL Editor. Run it once as a single query. It checks the audited Auth account fingerprint, app data counts, and Storage dependencies before dropping any objects. It removes the approved Auth accounts and app records while keeping the existing project and bucket configuration.
3. Stop if a guard or dependency check fails. The reset runs in one transaction. If the editor keeps a failed transaction open, run `ROLLBACK;` before inspecting it. Refresh the live inventory and review the failure before regenerating or retrying the reset.
4. Deploy the application code that calls the new database functions after the SQL succeeds. When adopting CLI migrations after a SQL Editor installation, reconcile the migration history with the exact versions already applied before pushing future migrations.

### Create the first administrator

Sign up with the intended email at `/login?mode=signup` and complete confirmation if the project requires it. For confirmation links, allow the app's `/auth/callback` in Supabase Auth redirect settings. In the SQL Editor, replace the placeholder email and run:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id and lower(u.email) = lower('YOUR_EMAIL_HERE')
returning p.id, p.role;
```

Expect one returned row before opening `/admin/login`. The signup trigger always creates customer profiles first. Set the production exchange rate in the dashboard before accepting USD bookings. The fresh schema starts with a rate of 50 EGP per USD.

### Verify before opening bookings

Test in the target Supabase project with designated admin and customer accounts. Check signup and session refresh, customer isolation, listing and image CRUD, two overlapping car or apartment requests, a one-use discount, and the booking's finance record. Use Paymob sandbox credentials for checkout and signed callback tests. Without Paymob credentials, the app keeps bookings on its existing manual payment flow.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
