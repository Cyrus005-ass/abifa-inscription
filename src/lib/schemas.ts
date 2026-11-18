import { z } from "zod";
import { LEVELS, SKILLS } from "./config";

const text = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} requis` })
    .trim()
    .min(min, `${label} : ${min} caractères minimum`)
    .max(max, `${label} : ${max} caractères maximum`);

export const registerSchema = z
  .object({
    firstName: text(2, 40, "Prénom"),
    lastName: text(2, 40, "Nom"),
    email: z.string().trim().toLowerCase().email("E-mail invalide").max(120),
    phoneCountry: z.string().regex(/^\d{2,3}$/),
    phone: text(6, 20, "Téléphone"),
    whatsappSame: z.boolean(),
    whatsappCountry: z.string().regex(/^\d{2,3}$/).optional(),
    whatsapp: z.string().trim().max(20).optional(),
    city: z.string().trim().max(45).optional().default(""),
    consent: z.literal(true, { errorMap: () => ({ message: "Le consentement est obligatoire" }) }),
    mode: z.enum(["team", "solo"]),
    teamAction: z.enum(["create", "join"]).optional(),
    teamName: z.string().trim().max(30).optional(),
    teamCode: z.string().trim().max(12).optional(),
    skills: z.array(z.enum(SKILLS)).max(5).optional().default([]),
    level: z.enum(LEVELS).optional(),
    idea: z.string().trim().max(200).optional().default(""),
    website: z.string().max(0).optional(), // honeypot
  })
  .superRefine((v, ctx) => {
    if (!v.whatsappSame && !v.whatsapp) {
      ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Numéro WhatsApp requis" });
    }
    if (v.mode === "team") {
      if (!v.teamAction) {
        ctx.addIssue({ code: "custom", path: ["teamAction"], message: "Choisis : créer ou rejoindre une équipe" });
      } else if (v.teamAction === "create") {
        if (!v.teamName || v.teamName.length < 3) {
          ctx.addIssue({ code: "custom", path: ["teamName"], message: "Nom d'équipe : 3 caractères minimum" });
        }
      } else if (!v.teamCode || v.teamCode.length < 4) {
        ctx.addIssue({ code: "custom", path: ["teamCode"], message: "Code d'équipe requis" });
      }
    }
    if (v.mode === "solo" && (!v.skills || v.skills.length === 0)) {
      ctx.addIssue({ code: "custom", path: ["skills"], message: "Choisis au moins un profil" });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
