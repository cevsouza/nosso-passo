// O Assistente do Dia: qual e o UNICO proximo passo do responsavel agora.
//
// A ideia e que o pai nunca fique olhando para a tela sem saber o que fazer —
// nem no primeiro uso, nem numa terca-feira qualquer. O assistente le o estado
// do dia e devolve um passo so, o mais relevante. Nada de lista de opcoes:
// uma acao clara de cada vez.
//
// A sequencia natural do primeiro uso CAI SOZINHA da mesma logica do dia a dia
// — montar rotina -> abrir a tela da crianca -> ela usa -> registrar como foi.
// Nao existe "modo tutorial" separado que um dia acaba; o assistente e o mesmo
// todo dia, e por isso ele ensina sem parecer que esta ensinando.
//
// Funcao pura: recebe o estado, devolve um id. Os textos (traduzidos) e os
// botoes moram no componente. Assim a regra fica testavel e o i18n separado.

export interface EstadoDia {
  temCrianca: boolean;
  totalHoje: number;    // tarefas previstas para hoje
  feitasHoje: number;   // quantas ja concluidas
  hora: number;         // 0..23, para nao mandar "abra a tela" as 23h
  abriuTelaHoje: boolean; // a crianca abriu a propria tela hoje (lastActiveAt)
}

export type PassoId =
  | 'cadastrar'   // ainda nao ha crianca (raro: o cadastro ja pede o nome)
  | 'montar'      // ha crianca, mas o dia esta vazio
  | 'abrir'       // a rotina existe e ninguem comecou: hora de dar o aparelho
  | 'progresso'   // a crianca esta seguindo a rotina agora
  | 'registrar'   // o dia acabou (ou tudo feito): registrar como foi
  | 'em-dia';     // nada pendente

export function proximoPasso(e: EstadoDia): PassoId {
  if (!e.temCrianca) return 'cadastrar';

  // O dia vazio e sempre o passo mais urgente: sem rotina, o app nao faz nada.
  if (e.totalHoje === 0) return 'montar';

  const tudoFeito = e.feitasHoje >= e.totalHoje;

  if (tudoFeito) {
    // De noite, tudo feito: o gesto de fechamento e registrar como foi o dia.
    // De dia, tudo feito cedo: esta em dia, sem pressao.
    return e.hora >= 18 ? 'registrar' : 'em-dia';
  }

  if (e.feitasHoje === 0) {
    // Ninguem comecou. De dia, o passo e entregar a tela para a crianca; de
    // madrugada/noite, nao faz sentido empurrar — esta so montada, tudo bem.
    if (e.hora >= 6 && e.hora < 21) return 'abrir';
    return 'em-dia';
  }

  // Comecou e nao terminou: a crianca esta no meio da rotina. O papel do adulto
  // aqui e so acompanhar — o passo e informativo, sem cobranca.
  return 'progresso';
}
