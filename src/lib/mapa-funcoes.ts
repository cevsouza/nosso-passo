// O mapa das funcoes do painel — para o Assistente responder "onde fica X?".
//
// A ideia do produto: a tela do responsavel mostra so o BASICO (o dia, a
// rotina, o proximo passo). Tudo que nao se usa todo dia — codigo do terapeuta,
// nivel de interface, PIN, relatorio, plano — sai da tela e passa a ser
// ENCONTRADO: o pai pergunta ao assistente e ele leva ate la.
//
// Sem isso, esconder funcao seria escondê-la de verdade. Com isso, esconder e
// so tirar do caminho: a funcao continua a uma pergunta de distancia.
//
// O casamento e por palavra, com sinonimos — o mesmo metodo dos pictogramas.
// Nao e busca semantica; e uma lista honesta de como as pessoas chamam cada
// coisa. Se alguem procura por um termo que nao esta aqui, e sinal de que falta
// um sinonimo, nao de que precisa de IA.

export type DestinoTipo = 'secao' | 'conta' | 'crianca' | 'popover';

export interface Funcao {
  id: string;
  nome: Record<'pt' | 'en' | 'es', string>;
  sinonimos: string[];          // sempre em minusculo, sem acento
  destino: DestinoTipo;
  // para 'secao': 'hoje' | 'tasks' | 'feedback' | 'tools'
  // para 'popover': um id que o painel sabe abrir (ex.: 'registrar-dia')
  alvo?: string;
  dica: Record<'pt' | 'en' | 'es', string>;
}

export const FUNCOES: Funcao[] = [
  {
    id: 'registrar-dia',
    nome: { pt: 'Registrar o dia', en: 'Log the day', es: 'Registrar el día' },
    sinonimos: ['registrar', 'humor', 'como foi o dia', 'bateria', 'estado', 'crise', 'anotar o dia', 'diario'],
    destino: 'popover', alvo: 'registrar-dia',
    dica: { pt: 'Humor e ocorrências do dia, na tela Hoje.', en: 'Mood and events of the day, on the Today screen.', es: 'Ánimo y ocurrencias del día, en la pantalla Hoy.' },
  },
  {
    id: 'codigo-terapeuta',
    nome: { pt: 'Código do terapeuta', en: 'Therapist code', es: 'Código del terapeuta' },
    sinonimos: ['codigo', 'terapeuta', 'compartilhar', 'acesso', 'profissional', 'convidar terapeuta', 'gerar codigo', 'psicologa', 'fono'],
    destino: 'secao', alvo: 'feedback',
    dica: { pt: 'Em Acompanhar, gere um código de acesso para o profissional.', en: 'In Follow-up, generate an access code for the professional.', es: 'En Seguimiento, genere un código de acceso para el profesional.' },
  },
  {
    id: 'codigo-escola',
    nome: { pt: 'Código da escola', en: 'School code', es: 'Código de la escuela' },
    sinonimos: ['escola', 'professora', 'mediador', 'codigo da escola', 'acesso da escola'],
    destino: 'secao', alvo: 'feedback',
    dica: { pt: 'Em Acompanhar, gere um código de escola (só registro).', en: 'In Follow-up, generate a school code (log-only).', es: 'En Seguimiento, genere un código de escuela (solo registro).' },
  },
  {
    id: 'devolutiva',
    nome: { pt: 'Devolutiva do terapeuta', en: "Therapist's notes", es: 'Devolución del terapeuta' },
    sinonimos: ['devolutiva', 'checkpoint', 'orientacao', 'recado do terapeuta', 'sessao', 'relato'],
    destino: 'secao', alvo: 'feedback',
    dica: { pt: 'As devolutivas das sessões ficam em Acompanhar.', en: 'Session notes live under Follow-up.', es: 'Las devoluciones de las sesiones están en Seguimiento.' },
  },
  {
    id: 'relatorio',
    nome: { pt: 'Relatório de evolução', en: 'Progress report', es: 'Informe de evolución' },
    sinonimos: ['relatorio', 'evolucao', 'antes e depois', 'pdf', 'imprimir relatorio', 'grafico', 'progresso'],
    destino: 'secao', alvo: 'feedback',
    dica: { pt: 'O relatório de antes/depois fica em Acompanhar.', en: 'The before/after report is in Follow-up.', es: 'El informe antes/después está en Seguimiento.' },
  },
  {
    id: 'imprimir-pecs',
    nome: { pt: 'Imprimir cartões (PECS)', en: 'Print cards (PECS)', es: 'Imprimir tarjetas (PECS)' },
    sinonimos: ['imprimir', 'pecs', 'cartoes', 'cartao', 'geladeira', 'papel', 'figuras'],
    destino: 'secao', alvo: 'tasks',
    dica: { pt: 'Em Rotina, o botão Imprimir gera os cartões da geladeira.', en: 'In Routine, the Print button makes the fridge cards.', es: 'En Rutina, el botón Imprimir genera las tarjetas.' },
  },
  {
    id: 'nivel-interface',
    nome: { pt: 'Nível de interface', en: 'Interface level', es: 'Nivel de interfaz' },
    sinonimos: ['nivel', 'foco', 'intermediario', 'completo', 'simplificar a tela', 'complexidade', 'interface'],
    destino: 'secao', alvo: 'tools',
    dica: { pt: 'Em Ajustes, escolha Foco, Intermediário ou Completo.', en: 'In Settings, choose Focus, Intermediate or Complete.', es: 'En Ajustes, elija Enfoque, Intermedio o Completo.' },
  },
  {
    id: 'perfil-sensorial',
    nome: { pt: 'Perfil sensorial', en: 'Sensory profile', es: 'Perfil sensorial' },
    sinonimos: ['sensorial', 'velocidade da fala', 'som', 'visual', 'estimulo', 'voz', 'efeito sonoro'],
    destino: 'secao', alvo: 'tools',
    dica: { pt: 'Em Ajustes, sob "Tela e sentidos".', en: 'In Settings, under "Screen & senses".', es: 'En Ajustes, en "Pantalla y sentidos".' },
  },
  {
    id: 'pin',
    nome: { pt: 'PIN / bloqueio infantil', en: 'PIN / child lock', es: 'PIN / bloqueo infantil' },
    sinonimos: ['pin', 'bloqueio', 'senha da crianca', 'travar', 'desafio', 'sair da tela', 'quiosque', 'kiosk'],
    destino: 'secao', alvo: 'tools',
    dica: { pt: 'Em Ajustes: o PIN e o modo de saída da tela da criança.', en: 'In Settings: the PIN and how to exit the child screen.', es: 'En Ajustes: el PIN y cómo salir de la pantalla del niño.' },
  },
  {
    id: 'premio',
    nome: { pt: 'Prêmio por estrelas', en: 'Star reward', es: 'Premio por estrellas' },
    sinonimos: ['premio', 'estrelas', 'recompensa', 'ficha', 'reforco', 'tablet', 'meta'],
    destino: 'secao', alvo: 'tools',
    dica: { pt: 'Em Ajustes, o prêmio e o custo em estrelas.', en: 'In Settings, the reward and its star cost.', es: 'En Ajustes, el premio y su costo en estrellas.' },
  },
  {
    id: 'mudanca-inesperada',
    nome: { pt: 'Mudança inesperada', en: 'Unexpected change', es: 'Cambio inesperado' },
    sinonimos: ['mudanca', 'imprevisto', 'quebra de rotina', 'cancelou', 'avisar a crianca', 'preparar para mudanca'],
    destino: 'secao', alvo: 'tasks',
    dica: { pt: 'Em Rotina, avise a criança sobre uma quebra na rotina.', en: 'In Routine, warn the child about a break in the routine.', es: 'En Rutina, avise al niño sobre un cambio en la rutina.' },
  },
  {
    id: 'modelo-agenda',
    nome: { pt: 'Modelo de agenda', en: 'Schedule template', es: 'Modelo de agenda' },
    sinonimos: ['modelo', 'template', 'salvar rotina', 'reaplicar', 'copiar semana', 'repetir'],
    destino: 'secao', alvo: 'tasks',
    dica: { pt: 'Em Rotina, salve e reaplique a agenda em vários dias.', en: 'In Routine, save and reapply the schedule across days.', es: 'En Rutina, guarde y reaplique la agenda en varios días.' },
  },
  {
    id: 'semana-mes',
    nome: { pt: 'Visão semanal / mensal', en: 'Weekly / monthly view', es: 'Vista semanal / mensual' },
    sinonimos: ['semana', 'mes', 'calendario', 'planejar', 'visao geral', 'panorama'],
    destino: 'secao', alvo: 'tasks',
    dica: { pt: 'Em Rotina, troque para a visão Semanal ou Mensal.', en: 'In Routine, switch to the Weekly or Monthly view.', es: 'En Rutina, cambie a la vista Semanal o Mensual.' },
  },
  {
    id: 'cadastrar-crianca',
    nome: { pt: 'Cadastrar criança', en: 'Add a child', es: 'Registrar niño' },
    sinonimos: ['cadastrar', 'nova crianca', 'adicionar filho', 'outro filho', 'segundo filho', 'irmao'],
    destino: 'secao', alvo: 'tools',
    dica: { pt: 'Cadastre outra criança no topo do painel.', en: 'Add another child at the top of the panel.', es: 'Registre otro niño en la parte superior del panel.' },
  },
  {
    id: 'plano',
    nome: { pt: 'Plano / assinatura', en: 'Plan / subscription', es: 'Plan / suscripción' },
    sinonimos: ['plano', 'assinatura', 'premium', 'pagar', 'preco', 'limite', 'upgrade'],
    destino: 'conta',
    dica: { pt: 'Em Minha conta → Plano.', en: 'In My account → Plan.', es: 'En Mi cuenta → Plan.' },
  },
  {
    id: 'senha',
    nome: { pt: 'Trocar minha senha', en: 'Change my password', es: 'Cambiar mi contraseña' },
    sinonimos: ['senha', 'trocar senha', 'alterar senha', 'esqueci a senha', 'seguranca da conta'],
    destino: 'conta',
    dica: { pt: 'Em Minha conta → Conta.', en: 'In My account → Account.', es: 'En Mi cuenta → Cuenta.' },
  },
  {
    id: 'tema-idioma',
    nome: { pt: 'Tema e idioma', en: 'Theme & language', es: 'Tema e idioma' },
    sinonimos: ['tema', 'escuro', 'claro', 'idioma', 'lingua', 'ingles', 'espanhol', 'dark mode'],
    destino: 'conta',
    dica: { pt: 'Em Minha conta: tema claro/escuro e idioma.', en: 'In My account: light/dark theme and language.', es: 'En Mi cuenta: tema claro/oscuro e idioma.' },
  },
  {
    id: 'abrir-crianca',
    nome: { pt: 'Abrir a tela da criança', en: "Open the child's screen", es: 'Abrir la pantalla del niño' },
    sinonimos: ['tela da crianca', 'modo crianca', 'entregar o aparelho', 'rotina dela', 'ir para a tela'],
    destino: 'crianca',
    dica: { pt: 'Abre a rotina na visão da criança, para dar o aparelho.', en: "Opens the routine in the child's view.", es: 'Abre la rutina en la vista del niño.' },
  },
];

function normaliza(s: string): string {
  return (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ').trim();
}

// Palavras que nao ajudam a distinguir nada — tirar antes de casar.
const VAZIAS = new Set(['o', 'a', 'os', 'as', 'de', 'do', 'da', 'onde', 'fica', 'ficam', 'como', 'que', 'e', 'para', 'pra', 'quero', 'preciso', 'achar', 'encontrar', 'meu', 'minha', 'the', 'where', 'is', 'how', 'to', 'i', 'want', 'find', 'my']);

/**
 * Ate 4 funcoes que melhor casam com a pergunta, mais relevantes primeiro.
 * Pontua por sinonimo contido + palavra em comum; zero = nao aparece.
 */
export function buscarFuncoes(consulta: string, limite = 4): Funcao[] {
  const q = normaliza(consulta);
  if (q.length < 2) return [];
  const termos = q.split(' ').filter((t) => t.length >= 2 && !VAZIAS.has(t));
  if (termos.length === 0) return [];

  const pontuada = FUNCOES.map((f) => {
    const alvo = normaliza(
      [f.nome.pt, f.nome.en, f.nome.es, ...f.sinonimos].join(' ')
    );
    let pts = 0;
    for (const s of f.sinonimos) {
      const sn = normaliza(s);
      // Pesos por forca do casamento, do mais forte ao mais fraco:
      //   exato ("imprimir" == sinonimo "imprimir")      -> 5
      //   a consulta CONTEM o sinonimo inteiro           -> 3
      //   o sinonimo contem a consulta (prefixo/pedaco)  -> 2
      // Sem isso, "imprimir" empatava "imprimir cartoes" com "imprimir
      // relatorio" e a ordem da lista decidia — o mais literal tem de vencer.
      if (sn === q) pts += 5;
      else if (q.includes(sn)) pts += 3;
      else if (sn.includes(q)) pts += 2;
    }
    for (const t of termos) {
      if (alvo.includes(t)) pts += 1;
    }
    return { f, pts };
  }).filter((x) => x.pts > 0);

  pontuada.sort((a, b) => b.pts - a.pts);
  return pontuada.slice(0, limite).map((x) => x.f);
}
