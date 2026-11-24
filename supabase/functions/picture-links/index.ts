// Hands out temporary links to a calendar's pictures, which live in a private bucket.
//
// The caller proves what they may see exactly as the app does: with the edit token
// (the creator sees every window) or with only the calendar id and their local date
// (the receiver sees windows whose day has arrived). Those checks run in the database
// functions from supabase/schema.sql, called with the public key like the browser
// would. Only the pictures of the windows that come back get a link.
//
// Links last 30 days, so a copied or forwarded picture link stops working after a
// month. The app asks for fresh links every time a calendar is opened.

import { createClient } from "npm:@supabase/supabase-js@2";

const LINK_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
const BUCKET = "calendar-images";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

type Day = { image_path: string | null; image_path_2?: string | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Use POST." }, 405);

  let body: { calendarId?: unknown; editToken?: unknown; today?: unknown };
  try {
    body = await req.json();
  } catch {
    return reply({ error: "Expected a JSON body." }, 400);
  }
  const { calendarId, editToken, today } = body;
  if (typeof calendarId !== "string") return reply({ error: "calendarId is required." }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  // Same powers as the browser: the database functions decide what may be seen.
  const asVisitor = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
  });

  const { data, error } =
    typeof editToken === "string"
      ? await asVisitor.rpc("get_calendar_for_edit", { p_id: calendarId, p_token: editToken })
      : await asVisitor.rpc("get_shared_calendar", {
          p_id: calendarId,
          p_today: typeof today === "string" ? today : null,
        });
  if (error) return reply({ error: error.message }, 403);
  if (!data) return reply({ links: {} });

  const paths = [
    ...new Set(
      ((data as { days?: Day[] }).days ?? [])
        .flatMap((d) => [d.image_path, d.image_path_2])
        .filter((p): p is string => !!p),
    ),
  ];
  if (!paths.length) return reply({ links: {} });

  // Only this function holds the key that can read the private bucket.
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrls(paths, LINK_LIFETIME_SECONDS);
  if (signError) return reply({ error: signError.message }, 500);

  const links: Record<string, string> = {};
  for (const item of signed ?? []) {
    if (item.path && item.signedUrl) links[item.path] = item.signedUrl;
  }
  return reply({ links });
});
