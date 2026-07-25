'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Splash de abertura: o logo do Nosso Passo (as pedras do caminho) se formando
 * antes da tela aparecer. Momento de marca — nunca um obstaculo.
 *
 * Regras (combinadas com o usuario):
 *   - So no cold start, UMA VEZ por sessao (sessionStorage). Nao reaparece a
 *     cada navegacao interna.
 *   - NUNCA na tela do Paciente (/routine): ali espera e risco, entra direto.
 *   - Honra prefers-reduced-motion: quem pediu menos movimento nao ve animacao.
 *   - Nao bloqueia: pointer-events:none e auto-desmonta; se o app ja carregou
 *     atras, o toque passa direto.
 */
export default function PathSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // A tela da crianca entra direto, sem cerimonia.
    if (pathname?.startsWith('/routine')) return;
    // Uma vez por sessao.
    if (sessionStorage.getItem('np_splash_seen')) return;
    // Movimento reduzido: pula a animacao por completo.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('np_splash_seen', '1');
      return;
    }
    sessionStorage.setItem('np_splash_seen', '1');
    setShow(true);
    // Desmonta depois que a animacao (assentar ~1000ms + fade 360ms) termina.
    const t = setTimeout(() => setShow(false), 1450);
    return () => clearTimeout(t);
    // So decide na montagem (cold start). Navegacoes internas nao reavaliam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  return (
    <div className="np-splash" aria-hidden="true">
      <svg className="np-splash-tile" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        {/* As quatro pedras subindo da base-esquerda ao topo-direito. A ultima,
            laranja, e o proximo passo — a meta que se alcanca um passo por vez. */}
        <ellipse className="np-splash-stone" cx="150" cy="360" rx="52" ry="31" fill="#ffffff" />
        <ellipse className="np-splash-stone" cx="252" cy="298" rx="46" ry="27" fill="#eafbf7" />
        <ellipse className="np-splash-stone" cx="346" cy="234" rx="40" ry="24" fill="#ffffff" />
        <ellipse className="np-splash-stone" cx="432" cy="172" rx="33" ry="20" fill="#ef9d61" />
      </svg>
    </div>
  );
}
