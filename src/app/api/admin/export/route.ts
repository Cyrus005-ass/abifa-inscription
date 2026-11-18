import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const supa = db();
  const [{ data: teams }, { data: people }] = await Promise.all([
    supa.from("teams").select("id, name, code, whatsapp_group_created"),
    supa.from("participants").select("*").order("created_at", { ascending: true }),
  ]);
  const byId = new Map((teams ?? []).map((t) => [t.id, t]));
  const header = ["Prénom", "Nom", "E-mail", "Téléphone", "WhatsApp", "Ville", "Statut", "Équipe", "Code équipe", "Chef", "Groupe WhatsApp créé", "Profils", "Niveau", "Idée", "Inscrit le"];
  const rows = (people ?? []).map((p) => {
    const t = p.team_id ? byId.get(p.team_id) : null;
    return [
      p.first_name, p.last_name, p.email, "+" + p.phone_e164, "+" + p.whatsapp_e164, p.city,
      t ? "En équipe" : "Sans équipe", t?.name, t?.code, p.is_leader ? "Oui" : "",
      t ? (t.whatsapp_group_created ? "Oui" : "Non") : "", (p.skills ?? []).join(" / "), p.level, p.idea, p.created_at,
    ].map(esc).join(";");
  });
  const csv = "\uFEFF" + [header.join(";"), ...rows].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="abifa_inscriptions.csv"',
    },
  });
}
