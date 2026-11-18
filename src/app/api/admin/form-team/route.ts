import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { TEAM_MAX_SIZE, TEAM_MIN_SIZE } from "@/lib/config";

export const runtime = "nodejs";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  "ABF-" + Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

// Regroupe des participants sans équipe dans une nouvelle équipe (le premier devient chef).
export async function POST(req: Request) {
  if (!isAdmin()) return fail("Non autorisé", 401);
  const { name, participantIds } = (await req.json().catch(() => ({}))) as { name?: string; participantIds?: string[] };
  const teamName = name?.trim();
  if (!teamName || teamName.length < 3 || teamName.length > 30) return fail("Nom d'équipe : 3 à 30 caractères.");
  if (!participantIds || participantIds.length < TEAM_MIN_SIZE || participantIds.length > TEAM_MAX_SIZE) {
    return fail(`Une équipe compte entre ${TEAM_MIN_SIZE} et ${TEAM_MAX_SIZE} membres.`);
  }

  const supa = db();
  const { data: members } = await supa.from("participants").select("id, team_id").in("id", participantIds);
  if (!members || members.length !== participantIds.length || members.some((m) => m.team_id)) {
    return fail("Certains participants ont déjà une équipe. Recharge la page.", 409);
  }
  const { data: dup } = await supa.from("teams").select("id").ilike("name", teamName).maybeSingle();
  if (dup) return fail("Ce nom d'équipe existe déjà.", 409);

  let team: { id: string; code: string } | null = null;
  for (let i = 0; i < 6 && !team; i++) {
    const { data, error } = await supa.from("teams").insert({ name: teamName, code: makeCode() }).select("id, code").single();
    if (!error && data) team = { id: data.id as string, code: data.code as string };
    else if (error && error.code !== "23505") return fail("Erreur lors de la création.", 500);
  }
  if (!team) return fail("Impossible de créer l'équipe.", 500);

  await supa.from("participants").update({ mode: "team", team_id: team.id, is_leader: false }).in("id", participantIds);
  await supa.from("participants").update({ is_leader: true }).eq("id", participantIds[0]);
  return NextResponse.json({ ok: true, code: team.code });
}
