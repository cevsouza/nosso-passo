import QRCode from 'qrcode';

// QR gerado NO SERVIDOR, de proposito: mantem a biblioteca fora do pacote que
// o navegador baixa e evita depender de polyfill de Buffer no cliente. Quem
// consome recebe uma string SVG pronta para injetar.

/**
 * Correcao de erro M (~15%): o codigo vai impresso e acaba na geladeira, onde
 * amassa, mancha e pega sol. L economizaria modulos mas nao sobrevive a isso.
 */
export async function qrSvg(data: string) {
  const svg = await QRCode.toString(data, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
  });
  // Sem width/height fixos: quem exibe decide o tamanho pelo CSS.
  return svg
    .replace(/\swidth="[^"]*"/, '')
    .replace(/\sheight="[^"]*"/, '')
    .replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');
}

/** A origem publica, para o QR nao apontar para localhost em producao. */
export function publicOrigin(req: Request) {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env.replace(/\/$/, '');
  try {
    const url = new URL(req.url);
    // Atras do proxy da Railway o host real vem no cabecalho.
    const host = req.headers.get('x-forwarded-host') || url.host;
    const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
    return `${proto}://${host}`;
  } catch {
    return 'https://nossopasso.com.br';
  }
}
