// Onde o app esta rodando — e o que ele pode oferecer ali.
//
// A regra da Google Play: app distribuido na loja que vende assinatura de
// funcionalidade digital tem de cobrar pelo Play Billing. Stripe nao vale, e —
// a parte que pega mais gente — **nem link, nem botao, nem frase** mandando o
// usuario pagar fora. "Assine em nossopasso.com.br" dentro do app Android e
// violacao, mesmo sem link clicavel.
//
// Entao dentro do involucro Android o produto simplesmente NAO vende. O limite
// do plano gratuito continua existindo e e dito com todas as letras; o que some
// e a oferta. Quem quiser assinar assina pelo site, por conta propria, como
// sempre pode ter feito.
//
// Detecção:
//   · `document.referrer` comeca com `android-app://` na primeira navegacao
//     vinda de uma Trusted Web Activity. E o sinal oficial, mas so existe no
//     primeiro carregamento — por isso fica guardado na sessao.
//   · `?src=twa` no start url, configurado no twa-manifest, como reforco: se o
//     Chrome mudar o comportamento do referrer, o parametro segura.
//
// NAO serve `display-mode: standalone`: um PWA instalado pelo navegador tambem
// e standalone, e esse usuario esta na web — pode e deve poder assinar.

const CHAVE = 'np_android_app';

/** Roda uma vez, cedo, no cliente. Idempotente. */
export function detectAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(CHAVE) === '1') return true;

    const porReferrer = document.referrer.startsWith('android-app://');
    const porParametro = new URLSearchParams(window.location.search).get('src') === 'twa';

    if (porReferrer || porParametro) {
      sessionStorage.setItem(CHAVE, '1');
      return true;
    }
  } catch {
    // navegacao privada com storage bloqueado: trata como web, que e o padrao
    // mais permissivo e nao quebra ninguem
  }
  return false;
}

/** Leitura barata depois que `detectAndroidApp` ja rodou. */
export function isAndroidApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
}
