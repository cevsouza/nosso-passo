"use client";
import React from 'react';
import { BorderCollie, CollieState } from './BorderCollie';

/**
 * Antigo seletor de mascote por hiperfoco (cachorro, dinossauro, trem, gato,
 * astronauta, robô, etc.). APOSENTADO: o produto não usa mais um personagem
 * de mascote — ele prendia o app ao interesse de uma criança só. Agora
 * renderiza a presença neutra e calma da marca (Nosso Passo). As props são
 * mantidas para não quebrar as telas que ainda chamam este componente.
 */
export const HyperfocusMascot: React.FC<{
  hyperfocus?: string;
  state?: CollieState;
  size?: number;
}> = ({ state = 'idle', size = 200 }) => <BorderCollie state={state} size={size} />;
