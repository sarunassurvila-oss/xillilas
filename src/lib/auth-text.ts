export const PASSWORD_MIN = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const normalizeEmail = (raw: string) => raw.trim().toLowerCase()
export const isValidEmail = (email: string) => EMAIL_RE.test(email) && email.length <= 254

/** Supabase klaidos kodas → tekstas naudotojui. */
export function authErrorText(code: string | undefined) {
  switch (code) {
    case 'invalid_credentials':
      return 'Neteisingas el. paštas arba slaptažodis.'
    case 'email_not_confirmed':
      return 'El. paštas dar nepatvirtintas. Paspauskite nuorodą laiške, kurį išsiuntėme registruojantis.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Šiuo el. paštu paskyra jau sukurta. Prisijunkite arba atkurkite slaptažodį.'
    case 'weak_password':
      return `Slaptažodis per silpnas: reikia bent ${PASSWORD_MIN} simbolių.`
    case 'same_password':
      return 'Naujas slaptažodis turi skirtis nuo dabartinio.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Patikrinkite el. pašto adresą.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Per daug bandymų. Palaukite kelias minutes ir bandykite vėl.'
    case 'reauthentication_needed':
    case 'session_not_found':
      return 'Prisijunkite iš naujo ir bandykite dar kartą.'
    case 'email_provider_disabled':
    case 'signup_disabled':
      return 'Prisijungimas el. paštu šiuo metu neveikia. Prisijunkite per Google.'
    default:
      return 'Nepavyko. Patikrinkite interneto ryšį ir bandykite dar kartą.'
  }
}
