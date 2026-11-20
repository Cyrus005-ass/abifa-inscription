import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { registerSchema } from "@/lib/schemas";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/ratelimit";
import { REGISTRATION_OPEN, TEAM_MAX_SIZE } from "@/lib/config";

export const runtime = "nodejs";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  let s = "";
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return "ABF-" + s;
}
function normalizeCode(raw: string) {
  const c = raw.trim().toUpperCase().replace(/\s+/g, "");
  return c.includes("-") ? c : c.length === 4 ? "ABF-" + c : c;
}
const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  if (!REGISTRATION_OPEN) {
    return fail("Les inscriptions sont terminées. Merci à toutes et à tous pour votre participation et votre intérêt.", 403);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) return fail("Trop de tentatives. Réessaie dans quelques minutes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Requête invalide.");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Données invalides.");
  const v = parsed.data;

  const phone = normalizePhone(v.phoneCountry, v.phone);
  if (!phone) return fail("Numéro de téléphone invalide (Bénin : 10 chiffres commençant par 01).");

  let whatsapp = phone;
  if (!v.whatsappSame) {
    const w = normalizePhone(v.whatsappCountry ?? v.phoneCountry, v.whatsapp ?? "");
    if (!w) return fail("Numéro WhatsApp invalide.");
    whatsapp = w;
  }

  const supa = db();

  // E-mail déjà inscrit ?
  const { data: existing } = await supa.from("participants").select("id").ilike("email", v.email).maybeSingle();
  if (existing) return fail("Cet e-mail est déjà inscrit. Contacte l'organisation si tu as besoin d'aide.", 409);

  let teamId: string | null = null;
  let teamName: string | null = null;
  let teamCode: string | null = null;
  let createdTeam = false;

  if (v.mode === "team" && v.teamAction === "create") {
    const name = v.teamName!.trim();
    const { data: dup } = await supa.from("teams").select("id").ilike("name", name).maybeSingle();
    if (dup) return fail("Ce nom d'équipe est déjà pris. Choisis-en un autre.", 409);

    for (let i = 0; i < 6 && !teamId; i++) {
      const code = makeCode();
      const { data, error } = await supa.from("teams").insert({ name, code }).select("id, name, code").single();
      if (!error && data) {
        teamId = data.id as string;
        teamName = data.name as string;
        teamCode = data.code as string;
        createdTeam = true;
      } else if (error && error.code !== "23505") {
        return fail("Erreur lors de la création de l'équipe.", 500);
      } else if (error && /name/i.test(error.message)) {
        return fail("Ce nom d'équipe est déjà pris. Choisis-en un autre.", 409);
      }
    }
    if (!teamId) return fail("Impossible de créer l'équipe, réessaie.", 500);
  }

  if (v.mode === "team" && v.teamAction === "join") {
    const code = normalizeCode(v.teamCode!);
    const { data: team } = await supa.from("teams").select("id, name, code").eq("code", code).maybeSingle();
    if (!team) return fail("Code d'équipe introuvable. Vérifie auprès de ton chef d'équipe.", 404);
    const { count } = await supa
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("team_id", team.id as string);
    if ((count ?? 0) >= TEAM_MAX_SIZE) return fail(`Cette équipe est complète (${TEAM_MAX_SIZE} membres maximum).`, 409);
    teamId = team.id as string;
    teamName = team.name as string;
    teamCode = team.code as string;
  }

  const { error: insErr } = await supa.from("participants").insert({
    first_name: v.firstName,
    last_name: v.lastName,
    email: v.email,
    phone_e164: phone,
    whatsapp_e164: whatsapp,
    city: v.city || null,
    mode: v.mode,
    team_id: teamId,
    is_leader: createdTeam,
    skills: v.mode === "solo" ? v.skills : [],
    level: v.mode === "solo" ? v.level ?? null : null,
    idea: v.mode === "solo" ? v.idea || null : null,
    consent: true,
  });

  if (insErr) {
    if (createdTeam && teamId) await supa.from("teams").delete().eq("id", teamId); // rollback
    if (insErr.code === "23505") return fail("Cet e-mail est déjà inscrit.", 409);
    return fail("Erreur lors de l'inscription. Réessaie.", 500);
  }

  let members = 0;
  if (teamId) {
    const { count } = await supa.from("participants").select("id", { count: "exact", head: true }).eq("team_id", teamId);
    members = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    participant: { name: `${v.firstName} ${v.lastName}`, phone: whatsapp, isLeader: createdTeam, mode: v.mode, skills: v.skills ?? [], level: v.level ?? "" },
    team: teamId ? { name: teamName, code: teamCode, members } : null,
  });
}
