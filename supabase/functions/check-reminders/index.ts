import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const italyTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const currentTime = italyTime;
    console.log(`Checking reminders for time: ${currentTime} (Italy)`);

    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("active", true)
      .contains("times", [currentTime]);

    if (error) throw error;
    console.log(`Found ${reminders?.length || 0} reminders matching ${currentTime}`);

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify({ message: "No reminders to send", time: currentTime }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`;
    const results = [];

    for (const reminder of reminders) {
      console.log(`Sending reminder "${reminder.text}" to user ${reminder.user_id}`);

      // Log notification to DB so user can view it later
      await supabase.from("notification_log").insert({
        user_id: reminder.user_id,
        text: reminder.text,
        title: "🔥 Fire Mind - Promemoria",
        reminder_id: reminder.id,
      });

      const res = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_ids: [reminder.user_id],
          title: "🔥 Fire Mind - Promemoria",
          body: reminder.text,
          data: { type: "reminder", reminder_id: reminder.id },
        }),
      });
      const result = await res.json();
      console.log(`Result for reminder ${reminder.id}:`, JSON.stringify(result));
      results.push({ reminder_id: reminder.id, ...result });
    }

    return new Response(
      JSON.stringify({ time: currentTime, reminders_found: reminders.length, results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("check-reminders error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
