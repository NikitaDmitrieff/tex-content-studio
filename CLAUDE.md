# Builder Agent Instructions

## CRITICAL: You are running in HEADLESS mode. There is NO human to interact with.

- NEVER use the brainstorming skill — skip it entirely
- NEVER call AskUserQuestion — there is no one to answer
- NEVER present designs or options for approval — just implement
- NEVER use EnterPlanMode — go straight to writing code
- DO use implementation skills (frontend-design, TDD, writing-plans) if they help
- DO be creative and bold with the implementation — the spec is your guide
- Start writing code IMMEDIATELY after reading the codebase
- Your output is judged by what you SHIP, not what you plan

## Database Access

You have access to a Supabase Postgres database via environment variables:
- `SUPABASE_SANDBOX_URL` — the Supabase project URL
- `SUPABASE_SANDBOX_SERVICE_ROLE_KEY` — service role key (full DDL access to the sandbox schema)
- `SUPABASE_SANDBOX_ANON_KEY` — anon key (for client-side use in the app)

**Schema: `minions_sandbox`** — you MUST use this schema for ALL database operations.

### Rules
- Create ALL tables in the `minions_sandbox` schema: `CREATE TABLE minions_sandbox.my_table (...)`
- Enable RLS on every table: `ALTER TABLE minions_sandbox.my_table ENABLE ROW LEVEL SECURITY`
- Create permissive RLS policies so the app can read/write data
- Use `@supabase/supabase-js` in the app code with `{ db: { schema: 'minions_sandbox' } }`
- For server-side (API routes): use the service role key
- For client-side: use the anon key via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- NEVER touch any schema other than `minions_sandbox`
- To run migrations, use the Bash tool: `npx supabase db push` or raw SQL via the Supabase REST API

