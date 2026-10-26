// Prisijungimas slapyvardžiu: Supabase paskyra su slaptažodžiu ir techniniu el. pašto adresu
// <slapyvardis>@slapyvardis.invalid. Domenas .invalid rezervuotas (RFC 2606), todėl adresas niekam
// nepriklauso ir laiškai juo niekada nepasiekia žmonių. Tas pats domenas įrašytas 0003 migracijoje.
export const USERNAME_DOMAIN = 'slapyvardis.invalid'
export const USERNAME_RULE = '3–24 simboliai: raidės be lietuviškų ženklų, skaičiai, taškas, brūkšnelis'
export const PASSWORD_MIN = 8

const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,23}$/

export const normalizeUsername = (raw: string) => raw.trim().toLowerCase()
export const isValidUsername = (u: string) => USERNAME_RE.test(u)
export const usernameEmail = (u: string) => `${u}@${USERNAME_DOMAIN}`

/** Slapyvardis iš techninio adreso arba tuščia eilutė, jei tai tikras el. paštas (Google). */
export function usernameFromEmail(email: string) {
  const suffix = `@${USERNAME_DOMAIN}`
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : ''
}

/** Supabase klaidos kodas → tekstas naudotojui. */
export function authErrorText(code: string | undefined) {
  switch (code) {
    case 'invalid_credentials':
      return 'Neteisingas slapyvardis arba slaptažodis.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Toks slapyvardis jau užimtas. Pasirinkite kitą.'
    case 'weak_password':
      return `Slaptažodis per silpnas: reikia bent ${PASSWORD_MIN} simbolių.`
    case 'same_password':
      return 'Naujas slaptažodis turi skirtis nuo dabartinio.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Per daug bandymų. Palaukite kelias minutes ir bandykite vėl.'
    case 'reauthentication_needed':
    case 'session_not_found':
      return 'Prisijunkite iš naujo ir bandykite dar kartą.'
    case 'email_provider_disabled':
    case 'signup_disabled':
      return 'Prisijungimas slapyvardžiu šiuo metu neveikia. Prisijunkite per Google.'
    default:
      return 'Nepavyko. Patikrinkite interneto ryšį ir bandykite dar kartą.'
  }
}
