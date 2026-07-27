// Envio de alerta por e-mail via Resend (REST, sem dependencia nova).
//
// Config por env (mesma conta Resend da Vera/Anfitria):
//   RESEND_API_KEY  — chave da Resend
//   ALERT_EMAIL     — para onde vao os alertas (o dono)
//   ALERT_FROM      — remetente verificado na Resend (default: onboarding@resend.dev,
//                     que a Resend so entrega para o e-mail dono da conta — ok p/ alerta)
//
// Sem RESEND_API_KEY ou ALERT_EMAIL, nao envia (degrada em silencio; o codigo
// de quem chama trata o retorno false).

export async function sendAlertEmail(subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL;
  const from = process.env.ALERT_FROM || 'onboarding@resend.dev';
  if (!key || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
