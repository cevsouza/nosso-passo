// Maquina de estados anti-spam do vigia interno.
//
// Regra de ouro: alertar UMA vez na virada, nunca repetir. Um alerta que chega
// a cada 5 min vira ruido e o dono para de ler — ai o proximo problema de
// verdade passa batido. So notifica na transicao (saude -> problema, ou
// problema -> recuperado).

export type HealthState = 'healthy' | 'unhealthy';
export type NotifyKind = 'none' | 'down' | 'recovery';

export interface Transition {
  state: HealthState;
  notify: NotifyKind;
}

/**
 * Decide o proximo estado e se deve notificar, a partir do estado anterior
 * (null = primeira vez) e do resultado do check agora.
 */
export function nextTransition(prev: HealthState | null | undefined, isHealthy: boolean): Transition {
  const next: HealthState = isHealthy ? 'healthy' : 'unhealthy';
  // Primeira vez: so grita se ja nasce com problema (nada de "tudo ok" inicial).
  if (prev === null || prev === undefined) {
    return { state: next, notify: isHealthy ? 'none' : 'down' };
  }
  // Mesmo estado: silencio (anti-spam).
  if (prev === next) return { state: next, notify: 'none' };
  // Virada.
  return { state: next, notify: isHealthy ? 'recovery' : 'down' };
}
