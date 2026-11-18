"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { TEAM_MAX_SIZE } from "@/lib/config";
import { formatPhone } from "@/lib/phone";
import { waLink } from "@/lib/whatsapp";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_e164: string;
  whatsapp_e164: string;
  city: string | null;
  is_leader: boolean;
  skills: string[];
  level: string | null;
  idea: string | null;
};
type Team = { id: string; name: string; code: string; whatsapp_group_created: boolean; members: Person[] };
type Data = { stats: { total: number; teams: number; solos: number }; teams: Team[]; solos: Person[] };

const PRIORITY = ["Développeur", "Data / IA", "Designer UI/UX", "Business / Marketing", "Autre"];
const fullName = (p: Person) => `${p.first_name} ${p.last_name}`;

function suggest(solos: Person[]): Person[][] {
  if (solos.length < 2) return [];
  const rank = (p: Person) => {
    const r = p.skills.map((s) => PRIORITY.indexOf(s)).filter((i) => i >= 0);
    return r.length ? Math.min(...r) : PRIORITY.length;
  };
  const sorted = [...solos].sort((a, b) => rank(a) - rank(b));
  const k = Math.ceil(sorted.length / 5);
  const teams: Person[][] = Array.from({ length: k }, () => []);
  sorted.forEach((p, i) => teams[i % k].push(p));
  return teams;
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"teams" | "solos">("teams");
  const [q, setQ] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [proposals, setProposals] = useState<Person[][]>([]);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    const json = await res.json();
    setData(json);
    setAuthed(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function login(e: FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!json.ok) return setLoginError(json.error ?? "Erreur");
    setPassword("");
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setData(null);
    setAuthed(false);
  }

  async function toggleGroup(t: Team) {
    await fetch("/api/admin/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: t.id, whatsappGroupCreated: !t.whatsapp_group_created }),
    });
    load();
  }

  async function createTeam(members: Person[]) {
    const name = window.prompt(`Nom de la nouvelle équipe (${members.map(fullName).join(", ")}) :`);
    if (!name) return;
    const res = await fetch("/api/admin/form-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, participantIds: members.map((m) => m.id) }),
    });
    const json = await res.json();
    if (!json.ok) return window.alert(json.error ?? "Erreur");
    setNotice(`Équipe « ${name} » créée (code ${json.code}).`);
    setSelected([]);
    setProposals([]);
    load();
  }

  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(msg);
    } catch {
      window.prompt("Copie ce texte :", text);
    }
  }

  const needle = q.trim().toLowerCase();
  const matches = (p: Person) =>
    !needle || `${fullName(p)} ${p.email} ${p.phone_e164} ${p.city ?? ""}`.toLowerCase().includes(needle);

  const teams = useMemo(() => {
    if (!data) return [];
    return data.teams.filter((t) => {
      if (onlyIncomplete && t.members.length >= TEAM_MAX_SIZE) return false;
      return !needle || t.name.toLowerCase().includes(needle) || t.code.toLowerCase().includes(needle) || t.members.some(matches);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, needle, onlyIncomplete]);

  const solos = useMemo(() => (data ? data.solos.filter(matches) : []), [data, needle]); // eslint-disable-line react-hooks/exhaustive-deps

  if (authed === null) return <main className="admin"><p>Chargement…</p></main>;

  if (!authed) {
    return (
      <main className="admin login">
        <form className="panel" onSubmit={login}>
          <h1>Espace organisateur</h1>
          <label htmlFor="pw">Mot de passe</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {loginError && <p className="error" role="alert">{loginError}</p>}
          <div className="actions">
            <button className="primary" type="submit">Se connecter</button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="admin">
      <header className="admin-head">
        <h1>Inscriptions ABIFA 2026</h1>
        <div className="actions">
          <a className="btn secondary" href="/api/admin/export">Exporter en CSV</a>
          <button className="secondary" onClick={load}>Actualiser</button>
          <button className="secondary" onClick={logout}>Se déconnecter</button>
        </div>
      </header>

      {data && (
        <div className="stats">
          <div><strong>{data.stats.total}</strong><span>inscrits</span></div>
          <div><strong>{data.stats.teams}</strong><span>équipes</span></div>
          <div><strong>{data.stats.solos}</strong><span>sans équipe</span></div>
        </div>
      )}

      {notice && <p className="notice" role="status">{notice}</p>}

      <div className="toolbar">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === "teams"} className={tab === "teams" ? "tab on" : "tab"} onClick={() => setTab("teams")}>Équipes</button>
          <button role="tab" aria-selected={tab === "solos"} className={tab === "solos" ? "tab on" : "tab"} onClick={() => setTab("solos")}>Sans équipe</button>
        </div>
        <input className="search" type="search" placeholder="Rechercher un nom, e-mail, équipe, code…" value={q} onChange={(e) => setQ(e.target.value)} />
        {tab === "teams" && (
          <label className="check inline">
            <input type="checkbox" checked={onlyIncomplete} onChange={(e) => setOnlyIncomplete(e.target.checked)} />
            Équipes incomplètes
          </label>
        )}
      </div>

      {tab === "teams" && (
        <div className="list">
          {teams.length === 0 && <p className="empty">Aucune équipe pour le moment.</p>}
          {teams.map((t) => {
            const leader = t.members.find((m) => m.is_leader) ?? t.members[0];
            const numbers = t.members.map((m) => `${fullName(m)} : ${formatPhone(m.whatsapp_e164)}`).join("\n");
            return (
              <article className="card" key={t.id}>
                <div className="card-head">
                  <div>
                    <h2>{t.name}</h2>
                    <p className="hint">Code {t.code} · {t.members.length}/{TEAM_MAX_SIZE} membres</p>
                  </div>
                  <label className="check inline">
                    <input type="checkbox" checked={t.whatsapp_group_created} onChange={() => toggleGroup(t)} />
                    Groupe WhatsApp créé
                  </label>
                </div>
                <ul className="members">
                  {t.members.map((m) => (
                    <li key={m.id}>
                      <span>{fullName(m)}{m.is_leader && <em> · chef</em>}</span>
                      <span className="muted">{formatPhone(m.whatsapp_e164)} · {m.email}</span>
                    </li>
                  ))}
                </ul>
                <div className="actions">
                  {leader && (
                    <a className="btn wa" target="_blank" rel="noreferrer"
                      href={waLink(leader.whatsapp_e164, `Bonjour ${leader.first_name}, ici l'organisation du Hackathon ABIFA 2026 au sujet de l'équipe « ${t.name} ».`)}>
                      Contacter le chef
                    </a>
                  )}
                  <button className="secondary" onClick={() => copy(numbers, "Numéros copiés : colle-les pour créer le groupe.")}>Copier les numéros</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === "solos" && (
        <>
          <div className="actions bar">
            <button className="primary" disabled={selected.length < 2 || selected.length > TEAM_MAX_SIZE}
              onClick={() => createTeam(selected.map((id) => data!.solos.find((s) => s.id === id)!).filter(Boolean))}>
              Former une équipe avec la sélection ({selected.length})
            </button>
            <button className="secondary" onClick={() => setProposals(suggest(data?.solos ?? []))}>Proposer des équipes</button>
          </div>

          {proposals.length > 0 && (
            <div className="list">
              {proposals.map((team, i) => (
                <article className="card" key={i}>
                  <div className="card-head">
                    <h2>Proposition {i + 1}</h2>
                    <button className="primary" onClick={() => createTeam(team)}>Créer cette équipe</button>
                  </div>
                  <ul className="members">
                    {team.map((m) => (
                      <li key={m.id}><span>{fullName(m)}</span><span className="muted">{m.skills.join(", ")} · {m.level ?? "—"}</span></li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}

          <div className="list">
            {solos.length === 0 && <p className="empty">Personne sans équipe pour le moment.</p>}
            {solos.map((p) => (
              <article className="card solo" key={p.id}>
                <label className="check inline">
                  <input type="checkbox" checked={selected.includes(p.id)}
                    onChange={(e) => setSelected((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id)))} />
                  <strong>{fullName(p)}</strong>
                </label>
                <p className="hint">{p.skills.join(", ")} · {p.level ?? "niveau non précisé"} · {p.city ?? "ville non précisée"}</p>
                {p.idea && <p className="idea">« {p.idea} »</p>}
                <p className="muted">{formatPhone(p.whatsapp_e164)} · {p.email}</p>
                <div className="actions">
                  <a className="btn wa" target="_blank" rel="noreferrer"
                    href={waLink(p.whatsapp_e164, `Bonjour ${p.first_name}, ici l'organisation du Hackathon ABIFA 2026. Nous avons une proposition d'équipe pour toi.`)}>
                    Contacter sur WhatsApp
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
