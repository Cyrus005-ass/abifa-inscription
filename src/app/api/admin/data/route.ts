import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const supa = db();
  const [{ data: teams }, { data: people }] = await Promise.all([
    supa.from("teams").select("*").order("created_at", { ascending: false }),
    supa.from("participants").select("*").order("created_at", { ascending: true }),
  ]);
  const all = people ?? [];
  const solos = all.filter((p) => p.mode === "solo" && !p.team_id);
  const teamList = (teams ?? []).map((t) => ({
    ...t,
    members: all.filter((p) => p.team_id === t.id),
  }));
  return NextResponse.json({
    ok: true,
    stats: { total: all.length, teams: teamList.length, solos: solos.length },
    teams: teamList,
    solos,
  });
}
