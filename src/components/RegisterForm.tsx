"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import PhoneField from "./PhoneField";
import { LEVELS, REGISTRATION_OPEN, SKILLS, TEAM_MAX_SIZE } from "@/lib/config";

type Mode = "team" | "solo" | null;
type TeamAction = "create" | "join" | null;

type Result = {
  participant: { isLeader: boolean; mode: "team" | "solo" };
  team: { name: string; code: string; members: number } | null;
};

export default function RegisterForm() {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("229");
  const [phone, setPhone] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsappCountry, setWhatsappCountry] = useState("229");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);

  const [mode, setMode] = useState<Mode>(null);
  const [teamAction, setTeamAction] = useState<TeamAction>(null);
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [level, setLevel] = useState("");
  const [idea, setIdea] = useState("");
  const [website, setWebsite] = useState(""); // honeypot

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  function nextFromStep1() {
    setError("");
    if (firstName.trim().length < 2 || lastName.trim().length < 2) return setError("Renseigne ton prénom et ton nom.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("E-mail invalide.");
    if (phone.replace(/\D/g, "").length < 6) return setError("Numéro de téléphone invalide.");
    if (!whatsappSame && whatsapp.replace(/\D/g, "").length < 6) return setError("Numéro WhatsApp invalide.");
    if (!consent) return setError("Le consentement est obligatoire.");
    setStep(2);
  }

  function toggleSkill(s: string) {
    setSkills((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "team" && !teamAction) return setError("Choisis : créer ou rejoindre une équipe.");
    if (mode === "team" && teamAction === "create" && teamName.trim().length < 3) return setError("Nom d'équipe : 3 caractères minimum.");
    if (mode === "team" && teamAction === "join" && teamCode.trim().length < 4) return setError("Saisis le code d'équipe.");
    if (mode === "solo" && skills.length === 0) return setError("Choisis au moins un profil.");

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName, lastName, email, phoneCountry, phone, whatsappSame,
          whatsappCountry, whatsapp, city, consent, mode,
          teamAction: mode === "team" ? teamAction : undefined,
          teamName: teamAction === "create" ? teamName : undefined,
          teamCode: teamAction === "join" ? teamCode : undefined,
          skills: mode === "solo" ? skills : [],
          level: mode === "solo" && level ? level : undefined,
          idea: mode === "solo" ? idea : "",
          website,
        }),
      });
      const data = await res.json();
      if (!data.ok) setError(data.error ?? "Erreur. Réessaie.");
      else setResult(data as Result);
    } catch {
      setError("Connexion impossible. Vérifie ta connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function reset() {
    setResult(null); setStep(1); setMode(null); setTeamAction(null);
    setFirstName(""); setLastName(""); setEmail(""); setPhone(""); setCity("");
    setTeamName(""); setTeamCode(""); setSkills([]); setLevel(""); setIdea("");
    setConsent(false); setError("");
  }

  return (
    <main className="app">
      <section className="panel">
        <div className="form-brand">
          <Image src="/image/logo.png" alt="ABIFA d'Agori" width={181} height={187} priority />
          <div>
            <p className="eyebrow">HACKATHON ABIFA 2026</p>
            <p className="brand-subtitle">Inscription des participants</p>
          </div>
        </div>
        {!REGISTRATION_OPEN ? (
          <div role="status">
            <h1>Inscriptions clôturées</h1>
            <p className="intro">Les inscriptions sont terminées. Merci à toutes et à tous pour votre participation et votre intérêt pour le Hackathon ABIFA 2026.</p>
          </div>
        ) : !result ? (
          <>
            <h1>Inscription</h1>
            <p className="intro">Inscris-toi avec ton équipe ou demande à en rejoindre une.</p>
            <ol className="form-progress" aria-label="Progression de l'inscription">
              {["Coordonnées", "Participation", "Profil"].map((label, index) => {
                const stepNumber = index + 1;
                const state = stepNumber === step ? "current" : stepNumber < step ? "complete" : "";
                return (
                  <li key={label} className={state} aria-current={stepNumber === step ? "step" : undefined}>
                    <span>{stepNumber < step ? "✓" : stepNumber}</span>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ol>

            {step === 1 && (
              <div>
                <div className="row">
                  <div>
                    <label htmlFor="firstName">Prénom</label>
                    <input id="firstName" type="text" autoComplete="given-name" maxLength={40} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="lastName">Nom</label>
                    <input id="lastName" type="text" autoComplete="family-name" maxLength={40} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>

                <label htmlFor="email">E-mail</label>
                <input id="email" type="email" autoComplete="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />

                <label htmlFor="phone">Téléphone</label>
                <PhoneField id="phone" country={phoneCountry} value={phone} onCountry={setPhoneCountry} onValue={setPhone} />

                <label className="check">
                  <input type="checkbox" checked={whatsappSame} onChange={(e) => setWhatsappSame(e.target.checked)} />
                  Ce numéro est sur WhatsApp
                </label>
                {!whatsappSame && (
                  <>
                    <label htmlFor="wa">Numéro WhatsApp à utiliser</label>
                    <PhoneField id="wa" country={whatsappCountry} value={whatsapp} onCountry={setWhatsappCountry} onValue={setWhatsapp} />
                  </>
                )}
                <p className="hint">WhatsApp sert à t'ajouter au groupe de ton équipe. Ton numéro et ton e-mail sont réservés aux organisateurs.</p>

                <label htmlFor="city">Ville, Pays</label>
                <input id="city" type="text" placeholder="Ville, Pays" maxLength={45} value={city} onChange={(e) => setCity(e.target.value)} />

                <label className="check">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  J'accepte que mes informations soient utilisées par les organisateurs pour la gestion du hackathon.
                </label>

                {error && <p className="error" role="alert">{error}</p>}
                <div className="actions">
                  <button type="button" className="primary" onClick={nextFromStep1}>Continuer</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="question">Comment participes-tu ?</p>
                <div className="choices">
                  <button type="button" className={"choice" + (mode === "team" ? " on" : "")} onClick={() => setMode("team")}>
                    <strong>En équipe</strong>
                    <span>J'ai déjà mon équipe</span>
                  </button>
                  <button type="button" className={"choice" + (mode === "solo" ? " on" : "")} onClick={() => setMode("solo")}>
                    <strong>Sans équipe</strong>
                    <span>Je veux qu'on m'aide à en trouver une</span>
                  </button>
                </div>
                {error && <p className="error" role="alert">{error}</p>}
                <div className="actions">
                  <button type="button" className="secondary" onClick={() => { setError(""); setStep(1); }}>Retour</button>
                  <button type="button" className="primary" disabled={!mode} onClick={() => { setError(""); setStep(3); }}>Continuer</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={submit}>
                <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />

                {mode === "team" ? (
                  <>
                    <p className="question">Ton équipe</p>
                    <div className="choices">
                      <button type="button" className={"choice" + (teamAction === "create" ? " on" : "")} onClick={() => setTeamAction("create")}>
                        <strong>Je crée l'équipe</strong>
                        <span>Je suis le chef d'équipe</span>
                      </button>
                      <button type="button" className={"choice" + (teamAction === "join" ? " on" : "")} onClick={() => setTeamAction("join")}>
                        <strong>Je rejoins une équipe</strong>
                        <span>J'ai le code de mon chef</span>
                      </button>
                    </div>

                    {teamAction === "create" && (
                      <>
                        <label htmlFor="teamName">Nom de l'équipe</label>
                        <input id="teamName" type="text" maxLength={30} value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                        <p className="hint">Tu recevras un code à donner à tes coéquipiers ({TEAM_MAX_SIZE} membres maximum, toi compris).</p>
                      </>
                    )}
                    {teamAction === "join" && (
                      <>
                        <label htmlFor="teamCode">Code d'équipe</label>
                        <input id="teamCode" type="text" placeholder="ABF-XXXX" maxLength={12} value={teamCode} onChange={(e) => setTeamCode(e.target.value.toUpperCase())} />
                        <p className="hint">Demande ce code à ton chef d'équipe.</p>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="question">Ton profil</p>
                    <div className="chips">
                      {SKILLS.map((s) => (
                        <button type="button" key={s} className={"chip" + (skills.includes(s) ? " on" : "")} onClick={() => toggleSkill(s)} aria-pressed={skills.includes(s)}>
                          {s}
                        </button>
                      ))}
                    </div>

                    <label htmlFor="level">Niveau</label>
                    <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                      <option value="">Choisir…</option>
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>

                    <label htmlFor="idea">Ce que tu aimerais construire (facultatif)</label>
                    <input id="idea" type="text" maxLength={200} value={idea} onChange={(e) => setIdea(e.target.value)} />
                  </>
                )}

                {error && <p className="error" role="alert">{error}</p>}
                <div className="actions">
                  <button type="button" className="secondary" onClick={() => { setError(""); setStep(2); }}>Retour</button>
                  <button type="submit" className="primary" disabled={loading}>{loading ? "Enregistrement…" : "Valider mon inscription"}</button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div>
            <div className="success-mark" aria-hidden="true">✓</div>
            <h1>Inscription confirmée</h1>
            <p className="intro">Merci {firstName} ! Ton inscription a bien été enregistrée.</p>

            {result.participant.mode === "team" && result.team && (
              <div className="box">
                <p className="box-title">Équipe « {result.team.name} » ({result.team.members}/{TEAM_MAX_SIZE})</p>

                {result.participant.isLeader ? (
                  <>
                    <p className="hint">Partage ce code avec les membres de ton équipe :</p>
                    <div className="code">{result.team.code}</div>
                    <div className="actions">
                      <button type="button" className="secondary" onClick={() => copyCode(result.team!.code)}>{copied ? "Copié" : "Copier le code"}</button>
                    </div>
                  </>
                ) : (
                  <p className="hint">Ton inscription dans cette équipe est enregistrée.</p>
                )}
              </div>
            )}

            {result.participant.mode === "solo" && (
              <div className="box">
                <p className="box-title">Tu es inscrit(e) sans équipe</p>
                <p className="hint">L'équipe organisatrice te recontactera pour t'aider à trouver une équipe.</p>
              </div>
            )}

            <div className="actions">
              <button type="button" className="secondary" onClick={reset}>Inscrire une autre personne</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
