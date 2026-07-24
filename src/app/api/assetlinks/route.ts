import { NextResponse } from 'next/server';

// Digital Asset Links — o que faz o app da Play Store abrir SEM a barra do
// navegador aparecendo em cima.
//
// O Chrome busca https://nossopasso.com.br/.well-known/assetlinks.json quando o
// app abre e confere se a impressao digital do certificado que assinou o APK
// esta listada aqui. Se nao bater, o app ainda funciona — mas com a barra de
// endereco a mostra, e ai nao e um aplicativo, e um site dentro de uma moldura.
// E o tipo de coisa que so aparece depois de publicado.
//
// A impressao digital vem de uma variavel de ambiente, e nao do codigo, por
// dois motivos: ela so existe DEPOIS que a chave de assinatura e criada, e ela
// muda se a Play Store assinar o app por voce (App Signing) — nesse caso vale a
// impressao que a Play mostra, nao a da sua chave local.
//
// TWA_SHA256_FINGERPRINT aceita uma ou varias impressoes separadas por virgula
// (voce vai precisar de duas: a da sua chave de upload e a da chave da Play).
// Formato: 64 pares hexadecimais separados por dois-pontos.
//
//   AA:BB:CC:...:FF
//
// Onde achar: Play Console → Versão → Configuração → Integridade do app →
// "Certificado da chave de assinatura do app" e "Certificado da chave de upload".

export const dynamic = 'force-dynamic';

// ATENCAO: o nome do pacote e PERMANENTE. Depois do primeiro envio a Play nao
// deixa trocar — mudar significa publicar outro app, do zero, sem os usuarios
// nem as avaliacoes do primeiro. Este e o valor definitivo.
const PACKAGE_NAME = process.env.TWA_PACKAGE_NAME || 'br.com.nossopasso.app';

function fingerprints(): string[] {
  return (process.env.TWA_SHA256_FINGERPRINT || '')
    .split(',')
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
}

export async function GET() {
  const certs = fingerprints();

  // Sem impressao digital valida, devolver uma lista vazia seria pior do que
  // 404: o Chrome guardaria em cache a resposta de que o site NAO confia no
  // app, e a verificacao passaria a falhar em silencio.
  if (certs.length === 0) {
    return NextResponse.json(
      { error: 'TWA_SHA256_FINGERPRINT não configurada.' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: certs,
        },
      },
    ],
    {
      headers: {
        'Content-Type': 'application/json',
        // O Chrome revalida de tempos em tempos; uma hora e curto o bastante
        // para consertar um erro no mesmo dia e longo o bastante para nao
        // bater no servidor a cada abertura do app.
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
}
