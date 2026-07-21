// Credenciais da conta de demonstracao de vendas.
//
// Arquivo separado de proposito: e o unico pedaco da demo que o navegador
// precisa conhecer (o botao "Ver demonstracao" na tela de login). Importar o
// `demo-seed-data` no cliente arrastaria toda a rotina ficticia para o bundle.
//
// Nao ha segredo aqui: a conta e publica por natureza e existe para ser
// mostrada. Os dados sao ficticios e podem ser recriados a qualquer momento
// pelo endpoint /api/demo/reset.

export const DEMO_UID = 'demo-teacolher';
export const DEMO_EMAIL = 'demo@teacolher.online';
export const DEMO_PASSWORD = 'demo2026';
export const DEMO_PIN = '1234';

// Codigos de acesso fixos, para poderem ser impressos nos materiais de venda.
export const DEMO_CODES = {
  teoTherapist: 'DEMOTEA7',
  teoSchool: 'DEMOESC7',
  bentoTherapist: 'DEMOBEN7',
  ninaTherapist: 'DEMONIN7',
};
