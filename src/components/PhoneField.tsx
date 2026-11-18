"use client";

import { COUNTRIES } from "@/lib/config";

type Props = {
  id: string;
  country: string;
  value: string;
  onCountry: (c: string) => void;
  onValue: (v: string) => void;
  placeholder?: string;
};

export default function PhoneField({ id, country, value, onCountry, onValue, placeholder }: Props) {
  return (
    <div className="phone-field">
      <select aria-label="Indicatif" value={country} onChange={(e) => onCountry(e.target.value)}>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={placeholder ?? (country === "229" ? "01 99 87 12 52" : "Numéro")}
        value={value}
        onChange={(e) => onValue(e.target.value)}
      />
    </div>
  );
}
