import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// URWA has returned to administrator-led student admissions.
// This endpoint is intentionally disabled and never assesses or approves accounts.
Deno.serve(async (_req: Request) => {
  return new Response(JSON.stringify({
    status: "disabled",
    message: "URWA student applications are reviewed and approved by an administrator."
  }), {
    status: 410,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
  });
});
