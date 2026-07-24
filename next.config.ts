import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
