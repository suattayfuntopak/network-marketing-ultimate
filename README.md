# Network Marketing Ultimate

Network Marketing Ultimate is a Next.js App Router dashboard for running a network marketing business from one system. The current foundation includes authentication, dashboard, contacts, tasks, pipeline, customer management, Supabase integration, and the product blueprint in `PRODUCT_SPECIFICATION.md`.

## Stack

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Tailwind CSS 4`
- `Supabase`
- `TanStack Query`
- `Zustand`
- `Framer Motion`

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-key
```

3. Initialize the database:

```sql
supabase/schema.sql
```

If you created the base schema earlier and need incremental additions, you can also run:

```sql
supabase/add_products_table.sql
supabase/add_orders_table.sql
```

4. Start the app:

```bash
npm run dev
```

## Quality Checks

```bash
npm run lint
npm run build
```

## Notes

- `.env.local` is ignored and should stay local.
- `dev_server.log` is ignored as a local artifact.
- The product direction and scope live in `PRODUCT_SPECIFICATION.md`.
