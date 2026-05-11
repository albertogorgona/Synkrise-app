const ERROR_MAP: Array<[RegExp, string]> = [
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Demasiados intentos. Espera unos minutos antes de intentar de nuevo.'],
  [/invalid login credentials|invalid email or password|wrong password/i, 'Email o contraseña incorrectos.'],
  [/email not confirmed/i, 'Debes confirmar tu email antes de iniciar sesión.'],
  [/user already registered|email already|already registered/i, 'Este email ya está registrado. Intenta iniciar sesión.'],
  [/password.*6 char|password.*too short|weak password/i, 'La contraseña debe tener al menos 6 caracteres.'],
  [/invalid email/i, 'El formato del email no es válido.'],
  [/network|fetch|failed to fetch|connection/i, 'Error de conexión. Verifica tu internet e intenta de nuevo.'],
  [/signup.*disabled|signups.*disabled/i, 'El registro está deshabilitado temporalmente.'],
  [/token.*expired|otp.*expired|link.*expired/i, 'El enlace expiró. Solicita uno nuevo.'],
  [/token.*not found|invalid.*token|token.*invalid/i, 'Enlace inválido. Solicita uno nuevo.'],
  [/same password|new password.*different/i, 'La nueva contraseña debe ser diferente a la actual.'],
  [/user not found/i, 'No existe una cuenta con ese email.'],
  [/session.*expired|session.*missing/i, 'Tu sesión expiró. Inicia sesión de nuevo.'],
]

export function translateAuthError(raw: string): string {
  for (const [pattern, message] of ERROR_MAP) {
    if (pattern.test(raw)) return message
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
