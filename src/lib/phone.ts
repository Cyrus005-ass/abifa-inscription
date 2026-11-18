/**
 * Normalise un numéro saisi en chiffres internationaux (sans "+").
 * Bénin : 10 chiffres commençant par 01 (ex. 0199871252 -> 2290199871252).
 * Les anciens numéros à 8 chiffres sont complétés avec le préfixe 01.
 * Retourne null si le numéro est invalide.
 */
export function normalizePhone(countryCode: string, raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;

  if (digits.startsWith("00" + countryCode)) digits = digits.slice(2 + countryCode.length);
  else if (digits.startsWith(countryCode) && digits.length > 10) digits = digits.slice(countryCode.length);

  if (countryCode === "229") {
    if (digits.length === 8) digits = "01" + digits;
    if (!/^01\d{8}$/.test(digits)) return null;
    return countryCode + digits;
  }

  digits = digits.replace(/^0+/, "");
  if (digits.length < 6 || digits.length > 12) return null;
  return countryCode + digits;
}

/** Affichage lisible : 2290199871252 -> +229 01 99 87 12 52 */
export function formatPhone(e164: string): string {
  if (e164.startsWith("229") && e164.length === 13) {
    const n = e164.slice(3);
    return "+229 " + n.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return "+" + e164;
}
