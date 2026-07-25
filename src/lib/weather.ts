// Sugestoes dinamicas pelo ambiente EXTERNO (tempo).
//
// Ideia: em atividades de sair (escola, passeio, vestir), o app avisa a crianca
// a se preparar — frio -> casaco, chuva -> guarda-chuva, sol forte -> bone/agua.
// Menos imprevisto la fora = menos frustracao e menos meltdown.
//
// Privacidade: a localizacao (GPS) so serve para consultar a Open-Meteo. As
// coordenadas NUNCA sao guardadas nem enviadas a outro lugar — o cache guarda
// apenas a previsao derivada. Offline/negado: os passos aparecem normais, sem o
// aviso (o tempo e reforco, nunca requisito).

export type WeatherKind = 'rain' | 'cold' | 'hot' | 'none';

export interface WeatherReading {
  tempC: number;
  precipProb: number; // 0..100
  code: number; // Open-Meteo weather_code
}

export interface WeatherHint {
  kind: WeatherKind;
  emoji: string;
  pt: string;
  en: string;
  es: string;
}

// Codigos Open-Meteo: 51-67 chuvisco/chuva, 71-77 neve, 80-82 pancadas,
// 95-99 trovoada. Todos justificam guarda-chuva/abrigo.
export function isRainyCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 71 && code <= 77) || (code >= 80 && code <= 99);
}

/**
 * Deriva UM aviso do tempo. Prioridade: chuva (mais acionavel) > frio > sol
 * forte. Retorna kind 'none' quando o tempo esta ameno (sem aviso). null quando
 * nao ha leitura.
 */
export function deriveHint(r: WeatherReading | null | undefined): WeatherHint | null {
  if (!r) return null;
  if (r.precipProb >= 50 || isRainyCode(r.code)) {
    return { kind: 'rain', emoji: '☔', pt: 'Vai chover — leve o guarda-chuva', en: 'Rain expected — take an umbrella', es: 'Va a llover — lleva el paraguas' };
  }
  if (r.tempC <= 15) {
    return { kind: 'cold', emoji: '🧥', pt: 'Está frio — leve um casaco', en: "It's cold — take a coat", es: 'Hace frío — lleva un abrigo' };
  }
  if (r.tempC >= 30) {
    return { kind: 'hot', emoji: '🧢', pt: 'Muito sol — boné e água', en: 'Very sunny — cap and water', es: 'Mucho sol — gorra y agua' };
  }
  return { kind: 'none', emoji: '', pt: '', en: '', es: '' };
}

export function hintText(h: WeatherHint, locale: string): string {
  return locale === 'en' ? h.en : locale === 'es' ? h.es : h.pt;
}

const norm = (s: string) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Atividades que se beneficiam do aviso do tempo (sair de casa, deslocar-se,
// se vestir). Casamento por inicio de palavra, como no resto do app.
const WEATHER_ACTIVITIES = [
  'sair', 'sair de casa', 'ir para a escola', 'escola', 'ir para',
  'passeio', 'parque', 'caminhada', 'brincar la fora', 'ir ao',
  'vestir', 'roupa', 'uniforme', 'trocar de roupa', 'transporte', 'onibus',
];

export function activityWantsWeather(title: string): boolean {
  const words = norm(title).split(/[^a-z0-9]+/).filter(Boolean);
  if (words.length === 0) return false;
  for (const kw of WEATHER_ACTIVITIES) {
    const parts = norm(kw).split(' ');
    if (parts.length === 1) {
      if (words.some((w) => w.startsWith(parts[0]))) return true;
    } else {
      for (let i = 0; i + parts.length <= words.length; i++) {
        if (parts.every((p, j) => words[i + j].startsWith(p))) return true;
      }
    }
  }
  return false;
}
