import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const { teamId, whatsappGroupCreated } = (await req.json().catch(() => ({}))) as {
    teamId?: string;
    whatsappGroupCreated?: boolean;
  };
  if (!teamId || typeof whatsappGroupCreated !== "boolean") {
    return NextResponse.json({ ok: false, error: "Paramètres invalides" }, { status: 400 });
  }
  const { error } = await db().from("teams").update({ whatsapp_group_created: whatsappGroupCreated }).eq("id", teamId);
  if (error) return NextResponse.json({ ok: false, error: "Erreur base de données" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
