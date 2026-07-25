// Sugestoes dinamicas pelo ambiente INTERNO (estado da crianca).
//
// Fase 2 do "dinamico": alem do tempo la fora, o app olha o que ja sabe por
// dentro — a bateria emocional e a hora — e oferece um empurraozinho GENTIL
// antes da atividade. Ex.: sobrecarregado -> "vamos respirar fundo?".
//
// Linha vermelha: acolher, nunca diagnosticar nem tranquilizar. Nada de "voce
// esta em crise"; sempre uma acao calma e no controle da crianca. Verde = nada
// a dizer (nao poluir). So aparece quando ha o que ajudar.

export type InternalKind = 'overload' | 'tired' | 'night' | 'none';

export interface InternalHint {
  kind: InternalKind;
  emoji: string;
  pt: string;
  en: string;
  es: string;
}

export interface InternalState {
  battery?: string | null; // 'green' | 'yellow' | 'red'
  hour: number; // 0..23 (hora local)
}

/**
 * Deriva UM aviso do ambiente interno. Prioridade: sobrecarga > cansaco > noite.
 * 'none' quando esta tudo bem (verde e de dia). null so por seguranca de tipo.
 */
export function deriveInternalHint(state: InternalState): InternalHint {
  const b = state.battery;
  if (b === 'red') {
    return { kind: 'overload', emoji: '🫧', pt: 'Vamos respirar fundo antes de começar?', en: "Let's take a deep breath first?", es: '¿Respiramos hondo antes de empezar?' };
  }
  if (b === 'yellow') {
    return { kind: 'tired', emoji: '😌', pt: 'Um pouco cansado? Vá no seu tempo.', en: 'A little tired? Take your time.', es: '¿Un poco cansado? Ve a tu ritmo.' };
  }
  // Noite (com a bateria ok): lembrete suave de desacelerar. Nao substitui o
  // modo sono — e so um empurraozinho.
  if (state.hour >= 20 || state.hour < 5) {
    return { kind: 'night', emoji: '🌙', pt: 'Já é noite — vá com calma.', en: "It's night — take it easy.", es: 'Ya es de noche — con calma.' };
  }
  return { kind: 'none', emoji: '', pt: '', en: '', es: '' };
}

export function internalHintText(h: InternalHint, locale: string): string {
  return locale === 'en' ? h.en : locale === 'es' ? h.es : h.pt;
}
