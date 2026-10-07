import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const REMINDER_MS = Number(Deno.env.get("REMINDER_MINUTES") ?? "30") * 60 * 1000;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

let vapidError = "";
try {
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT")!,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );
} catch (e) {
  vapidError = String(e);
  console.error("VAPID setup failed:", vapidError);
}
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const fmt = (mins: number) =>
  mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;

Deno.serve(async (req) => {
  // only the scheduled job knows this secret
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  const { data: row } = await supabase
    .from("kv_store").select("value").eq("key", "timers-running").maybeSingle();
  const timers = row ? (typeof row.value === "string" ? JSON.parse(row.value) : row.value) : {};
  const now = Date.now();

  for (const [employee, t] of Object.entries<any>(timers)) {
    const elapsed = now - new Date(t.startTime).getTime();
    const count = Math.floor(elapsed / REMINDER_MS);
    if (count < 1) continue;

    const { data: st } = await supabase
      .from("reminder_state").select("*").eq("employee", employee).maybeSingle();
    const lastCount = st && st.start_time === t.startTime ? st.last_count : 0;
    if (count <= lastCount) continue; // already reminded for this interval

    const { data: subs } = await supabase
      .from("push_subscriptions").select("endpoint, subscription").eq("employee", employee);

    const payload = JSON.stringify({
      title: "Are you still working?",
      body: `${t.project} · ${fmt(Math.round(elapsed / 60000))}`,
    });

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.subscription, payload);
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          // device unsubscribed or uninstalled, so remove it
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        } else {
          console.error("push failed", e);
        }
      }
    }
    await supabase.from("reminder_state").upsert({
      employee, start_time: t.startTime, last_count: count,
    });
  }
  return new Response("ok");
});