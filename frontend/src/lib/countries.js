import { getCountries, getCountryCallingCode } from 'libphonenumber-js'

/**
 * Every country/region known to libphonenumber (about 245), with its English name
 * (from the browser's Intl API) and international dialling code, sorted by name.
 */
const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })

export const COUNTRIES = getCountries()
  .map((code) => ({ code, name: displayNames.of(code) ?? code, dialCode: getCountryCallingCode(code) }))
  .sort((a, b) => a.name.localeCompare(b.name))

const byCode = new Map(COUNTRIES.map((c) => [c.code, c]))
const byName = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c]))

export const countryByCode = (code) => byCode.get(code)

/** Addresses store the country name, so the phone field looks the country up by name. */
export const countryByName = (name) => (name ? byName.get(name.trim().toLowerCase()) : undefined)

/** Best guess of the shopper's country from the browser language (e.g. "sr-RS" → RS), falling back to the US. */
export function detectCountry() {
  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    if (region && byCode.has(region)) return byCode.get(region)
  } catch {
    /* Older browsers without Intl.Locale: use the fallback below. */
  }
  return byCode.get('US')
}
