"use client";
import React from 'react';
import { motion } from 'framer-motion';

// Estados mantidos por compatibilidade com as chamadas existentes.
export type CollieState = 'idle' | 'guiding' | 'celebrating' | 'sleeping';

/**
 * Presença calma e neutra da marca (Nosso Passo).
 * Substitui o antigo mascote (cachorro/animais do hiperfoco): não é um
 * personagem, é a trilha de pedras respirando suavemente. Mantém a mesma
 * assinatura (state, size) para não quebrar nenhuma tela que ainda a use.
 */
export const BorderCollie: React.FC<{ state?: CollieState; size?: number }> = ({
  state = 'idle',
  size = 200,
}) => {
  const animate =
    state === 'celebrating'
      ? { scale: [1, 1.08, 1] }
      : state === 'sleeping'
      ? { scale: 0.97, opacity: 0.65 }
      : { scale: [1, 1.03, 1] };
  const transition =
    state === 'sleeping'
      ? { duration: 0.6 }
      : { duration: state === 'celebrating' ? 1.4 : 4.5, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 200 150"
        width={size * 0.92}
        height={size * 0.92 * 0.75}
        xmlns="http://www.w3.org/2000/svg"
        animate={animate}
        transition={transition}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <ellipse cx="34" cy="126" rx="26" ry="15.5" fill="var(--primary, #2f8f86)" />
        <ellipse cx="82" cy="98" rx="23" ry="13.5" fill="#246c65" />
        <ellipse cx="126" cy="70" rx="19" ry="11.5" fill="var(--primary, #2f8f86)" />
        <ellipse cx="166" cy="44" rx="16" ry="9.5" fill="#ef9d61" />
      </motion.svg>
    </div>
  );
};
