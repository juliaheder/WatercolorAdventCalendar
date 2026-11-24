# Watercolor Advent Calendar

Make a personal advent calendar: put the receiver's name on the house, put up to two pictures
and a message behind each of the 25 windows, then share one link. The receiver opens a window a day (or all at once, if you choose) and
can't change anything.

## How it works

| Link | Who has it | What it can do |
| --- | --- | --- |
| `…/#/edit/<id>/<secret>` | The creator only | Change the title, settings, pictures and messages |
| `…/#/c/<id>` | The receiver | Open windows whose day has arrived. Read-only. |

All data lives in Supabase. The browser never touches the tables directly: every read and write
goes through database functions in [supabase/schema.sql](supabase/schema.sql). Saving requires the
secret from the edit link (only its hash is stored), and a window's picture and text are not even
sent to the receiver until its day has come, on the receiver's own clock.

Without Supabase configured, the app runs in **demo mode**: everything is saved in the current
browser, so you can try it, but links won't work on other devices.

## Connect Supabase (one time)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project, open **SQL Editor → New query**, paste all of
   [supabase/schema.sql](supabase/schema.sql), and press **Run**. This creates the tables, the
   functions, and a `calendar-images` storage bucket. Run it again after pulling changes to
   `schema.sql`: it's safe to re-run and only adds what's missing.
3. Open **Project Settings → API** (or **Connect**) and copy the **Project URL** and the
   **anon / publishable** key. Both are meant to be public, so they're safe in the browser.
4. Copy `.env.example` to `.env.local` and fill in those two values.
5. Restart the dev server. The "Demo mode" banner disappears once it's connected.

## Run locally

Needs Node 22 and pnpm (versions in `.mise.toml`).

```bash
pnpm install
pnpm dev        # http://localhost:8443
pnpm build      # static site in dist/
```

## Put it online

The build is a plain static site, so any static host works (Vercel, Netlify, Cloudflare Pages).
Import the GitHub repo, use `pnpm build` with output folder `dist`, and add the same two
environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's settings.
Links use `#/…` routes, so no rewrite rules are needed.

## Code map

- `src/views/HomeView.tsx`: start page and "your calendars" list
- `src/views/EditorView.tsx`: the creator's editor (details, share links, 25 windows, window dialog)
- `src/views/CalendarView.tsx`: the receiver's house and opened windows
- `src/lib/backend.ts`: Supabase calls, plus the in-browser demo backend
- `src/lib/dates.ts`: which windows are open on a given day
- `src/components/winter.tsx`: built-in illustrations and messages for windows left empty
