// As seções do painel do responsável, num lugar só.
//
// Elas eram uma fileira de abas DENTRO da pagina, empilhada sob outras tres
// navegacoes: barra de baixo (que navegava o site), cabecalho com seletor de
// crianca, abas do painel e ainda sub-abas. Quatro camadas para dizer onde
// voce esta.
//
// Agora sao a propria barra de baixo, e a fileira de abas deixou de existir.
// O estado mora na URL (`?p=`), o que traz de graca uma coisa que faltava: o
// **botao voltar do navegador funciona**. Antes ele saia do painel inteiro.

export type SecaoPainel = 'hoje' | 'tasks' | 'feedback' | 'tools';

export const SECOES: SecaoPainel[] = ['hoje', 'tasks', 'feedback', 'tools'];

/** O que vai na URL — legivel, e nao o nome interno do estado. */
const PARA_URL: Record<SecaoPainel, string> = {
  hoje: 'hoje',
  tasks: 'rotina',
  feedback: 'acompanhar',
  tools: 'ajustes',
};

const DA_URL: Record<string, SecaoPainel> = {
  hoje: 'hoje',
  rotina: 'tasks',
  acompanhar: 'feedback',
  ajustes: 'tools',
};

export const urlDaSecao = (s: SecaoPainel) => `/dashboard?p=${PARA_URL[s]}`;
export const paramDaSecao = (s: SecaoPainel) => PARA_URL[s];

/** Nunca falha: qualquer coisa estranha na URL cai em "hoje". */
export function secaoDoParam(p: string | null | undefined): SecaoPainel {
  return (p && DA_URL[p]) || 'hoje';
}

export function rotuloSecao(s: SecaoPainel, locale: string | undefined): string {
  const pt: Record<SecaoPainel, string> = {
    hoje: 'Hoje', tasks: 'Rotina', feedback: 'Acompanhar', tools: 'Ajustes',
  };
  const en: Record<SecaoPainel, string> = {
    hoje: 'Today', tasks: 'Routine', feedback: 'Follow-up', tools: 'Settings',
  };
  const es: Record<SecaoPainel, string> = {
    hoje: 'Hoy', tasks: 'Rutina', feedback: 'Seguimiento', tools: 'Ajustes',
  };
  return locale === 'en' ? en[s] : locale === 'es' ? es[s] : pt[s];
}
