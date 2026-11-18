import { ORGANIZER_WHATSAPP } from "./config";
import { formatPhone } from "./phone";

export function waLink(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function toOrganizer(message: string) {
  return waLink(ORGANIZER_WHATSAPP, message);
}

export function leaderMessage(p: { name: string; phone: string; team: string; code: string }) {
  return (
    `Bonjour, je suis ${p.name}, chef de l'équipe « ${p.team} » (code ${p.code}) ` +
    `pour le Hackathon ABIFA 2026. Merci de créer le groupe WhatsApp de notre équipe. ` +
    `Mon numéro : ${formatPhone(p.phone)}.`
  );
}

export function memberMessage(p: { name: string; phone: string; team: string; code: string }) {
  return (
    `Bonjour, je suis ${p.name}, membre de l'équipe « ${p.team} » (code ${p.code}) ` +
    `pour le Hackathon ABIFA 2026. Merci de m'ajouter au groupe WhatsApp de l'équipe. ` +
    `Mon numéro : ${formatPhone(p.phone)}.`
  );
}

export function soloMessage(p: { name: string; phone: string; skills: string[]; level: string }) {
  return (
    `Bonjour, je suis ${p.name}, inscrit(e) au Hackathon ABIFA 2026 sans équipe. ` +
    `Profil : ${p.skills.join(", ") || "non précisé"} (${p.level || "niveau non précisé"}). ` +
    `Merci de m'aider à trouver une équipe. Mon numéro : ${formatPhone(p.phone)}.`
  );
}

export function shareCodeMessage(team: string, code: string) {
  return (
    `Rejoins mon équipe « ${team} » pour le Hackathon ABIFA 2026 ! ` +
    `Inscris-toi et saisis le code d'équipe : ${code}`
  );
}
