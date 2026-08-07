import type { NextConfig } from "next";

// Cabecalhos de seguranca HTTP (defesa em profundidade), aplicados a todas as rotas.
const securityHeaders = [
  // Forca HTTPS por 2 anos, incluindo subdominios (o Railway ja serve TLS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Anti-clickjacking, permitindo o mesmo-origem (nao afeta a TWA da Play, que usa Custom Tabs).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  // Nao deixa o navegador "adivinhar" o tipo do conteudo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nao vaza caminho/query como referer para outros sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self): o chip de tempo usa GPS NA PROPRIA origem (as coords nunca sao guardadas).
  // camera/microfone desligados (o app nao usa).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  // Nao anuncia "X-Powered-By: Next.js" (nao entrega a stack a um atacante).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      // O Chrome exige o arquivo exatamente em /.well-known/assetlinks.json.
      // Servido por rewrite, e nao por arquivo em public/, porque a impressao
      // digital do certificado vem de variavel de ambiente: ela so existe
      // depois que a chave de assinatura e criada, e muda se a Play assinar o
      // app por voce.
      { source: '/.well-known/assetlinks.json', destination: '/api/assetlinks' },
    ];
  },
};

export default nextConfig;
