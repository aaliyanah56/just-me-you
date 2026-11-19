import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return reply({ error: "Sign in before requesting admission assessment." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretMap = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secretMap ? JSON.parse(secretMap).default : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiKey = Deno.env.get("URWA_KEY") || Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !serviceKey || !openAiKey) {
      return reply({ error: "Admissions AI is not fully configured. Your application remains pending; please contact URWA support." }, 503);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userResult, error: userError } = await admin.auth.getUser(token);
    if (userError || !userResult.user) return reply({ error: "Your session could not be verified." }, 401);

    const user = userResult.user;
    const { data: profile, error: profileError } = await admin
      .from("profiles").select("id,full_name,email,phone,role,status").eq("id", user.id).single();
    if (profileError || !profile) return reply({ error: "Your URWA profile is not ready." }, 404);
    if (profile.role !== "student") return reply({ error: "AI admissions only assesses student accounts." }, 403);
    if (profile.status === "suspended") return reply({ error: "This account is suspended. Contact URWA administration." }, 403);

    const { data: latest } = await admin.from("admission_ai_reviews")
      .select("decision,risk_score,reasons").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (profile.status === "approved" && latest?.decision === "approved") {
      return reply({ decision: "approved", status: "approved", already_assessed: true });
    }

    const metadata = user.user_metadata || {};
    const phone = String(profile.phone || metadata.phone || "").trim();
    const name = String(profile.full_name || metadata.full_name || "").trim();
    const email = String(profile.email || user.email || "").trim().toLowerCase();
    const programme = String(metadata.programme || "").trim();
    const level = String(metadata.level || "").trim();
    const preferredSession = String(metadata.preferred_session || "").trim();

    const reasons: string[] = [];
    if (!name || name.length < 3) reasons.push("Name is missing or unusually short.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) reasons.push("Email address is missing or invalid.");
    if (!phone || phone.replace(/\D/g, "").length < 9) reasons.push("Phone number is missing or too short.");

    // Duplicate phone numbers are a review signal, not proof of fraud (families may share numbers).
    if (phone) {
      const digits = phone.replace(/\D/g, "");
      const { data: possibleDuplicates } = await admin.from("profiles")
        .select("id").neq("id", user.id).eq("phone", phone).limit(3);
      if (possibleDuplicates?.length) reasons.push("Phone number is already associated with another URWA account; verify whether this is a shared family number.");
      if (digits.length < 9) reasons.push("Phone number has too few digits.");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are URWA's student registration quality checker. Assess only completeness, internal consistency, obvious automation/spam patterns, and duplicate indicators. Do not infer risk from a person's name, religion, ethnicity, gender, nationality, age, disability, or any protected/sensitive trait. Do not decide staff roles. A shared phone can be legitimate. Return JSON only: {risk_score: integer 0-100, flags: string[], rationale: string}. 0 means no visible concern; 100 means strong registration abuse signals. Missing essential contact details or clear automation may raise risk. Never recommend rejecting a person." },
          { role: "user", content: JSON.stringify({ full_name: name, email, phone, programme, level, preferred_session: preferredSession, duplicate_phone_detected: reasons.some(x => x.startsWith("Phone number is already")) }) }
        ]
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI assessment failed", response.status, detail.slice(0, 500));
      return reply({ error: "AI assessment is temporarily unavailable. Your application remains pending." }, 502);
    }
    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content || "{}";
    let assessment: { risk_score?: number; flags?: string[]; rationale?: string };
    try { assessment = JSON.parse(raw); } catch { return reply({ error: "AI returned an invalid assessment. Your application remains pending." }, 502); }

    const score = Math.max(0, Math.min(100, Number(assessment.risk_score) || 0));
    const flags = Array.isArray(assessment.flags) ? assessment.flags.filter(x => typeof x === "string").slice(0, 8) : [];
    const allReasons = [...reasons, ...flags];
    // Approve only low-risk, complete student registrations. Uncertain/high-risk cases are flagged.
    const approve = score < 35 && reasons.length === 0 && flags.length === 0;
    const decision = approve ? "approved" : "flagged";
    const newStatus = approve ? "approved" : "pending";

    const { error: updateError } = await admin.from("profiles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", user.id).eq("role", "student");
    if (updateError) throw updateError;

    const { error: auditError } = await admin.from("admission_ai_reviews").insert({
      user_id: user.id, decision, risk_score: score,
      reasons: [...allReasons, ...(assessment.rationale ? [assessment.rationale] : [])],
      model: payload.model || "gpt-4o-mini"
    });
    if (auditError) throw auditError;

    return reply({
      decision, status: newStatus, risk_score: score,
      reasons: allReasons,
      message: approve
        ? "Your student account has been approved. Welcome to URWA."
        : "Your registration has been flagged for a quick URWA team check. Your account is not rejected."
    });
  } catch (error) {
    console.error("URWA AI admissions error", error);
    return reply({ error: "Unable to complete the admission assessment. Your application remains pending." }, 500);
  }
});