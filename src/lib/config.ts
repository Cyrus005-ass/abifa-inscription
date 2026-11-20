// Numéro WhatsApp de l'organisation (format international, sans + ni espaces).
// 0199871252 au Bénin => 229 + 0199871252
export const ORGANIZER_WHATSAPP = "2290199871252";

export const REGISTRATION_OPEN = false;

// Nombre maximum de membres par équipe (chef compris).
export const TEAM_MAX_SIZE = 6;
export const TEAM_MIN_SIZE = 2;

export const SKILLS = [
  "Développeur",
  "Designer UI/UX",
  "Data / IA",
  "Business / Marketing",
  "Autre",
] as const;

export const LEVELS = ["Débutant", "Intermédiaire", "Avancé"] as const;

export const COUNTRIES = [
  { code: "229", label: "Bénin (+229)" },
  { code: "228", label: "Togo (+228)" },
  { code: "225", label: "Côte d'Ivoire (+225)" },
  { code: "221", label: "Sénégal (+221)" },
  { code: "227", label: "Niger (+227)" },
  { code: "226", label: "Burkina Faso (+226)" },
  { code: "233", label: "Ghana (+233)" },
  { code: "234", label: "Nigeria (+234)" },
  { code: "237", label: "Cameroun (+237)" },
  { code: "33", label: "France (+33)" },
] as const;
