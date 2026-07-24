"use client";
import React from 'react';
import { ActivityPictogram } from './ActivityPictogram';

/**
 * A ilustracao grande da atividade atual, na tela da crianca.
 *
 * ANTES: cenas montadas EM VOLTA de um mascote — o cachorro na banheira, o
 * cachorro comendo, o cachorro dormindo no cesto. Quando o mascote saiu do
 * produto, sobrou o cenario sem ninguem dentro: uma banheira vazia, uma tigela
 * de sopa sozinha, um cesto com um cobertor. Cenario sem personagem nao
 * comunica nada, e a tela ficou estranha exatamente por isso.
 *
 * AGORA: pictograma do que a atividade E, tirado do texto que o responsavel
 * digitou — escova para "Escovar os dentes", onibus para "Ir para a escola".
 * E a convencao que a crianca ja conhece da terapia (PECS/ARASAAC), e a
 * ilustracao passou a ser informacao em vez de enfeite.
 *
 * `category` guarda o nome antigo da prop: ela sempre recebeu o TITULO da
 * tarefa, nunca a categoria. Mantido para nao mexer nas chamadas.
 */
interface RoutineIllustrationProps {
  category: string;
  size?: number;
  /** Aposentada junto com o mascote; aceita para nao quebrar chamadas antigas. */
  hyperfocus?: string;
  /** Foto PECS da propria familia, quando existir — ver nota abaixo. */
  customIcon?: string | null;
}

export const RoutineIllustration: React.FC<RoutineIllustrationProps> = ({
  category,
  size = 150,
  customIcon,
}) => {
  // A foto da familia ganha do nosso desenho, sempre: a escova de dente DELA,
  // no banheiro DELA, e mais reconhecivel do que qualquer pictograma generico.
  if (customIcon) {
    return (
      <div
        className="select-none pointer-events-none overflow-hidden rounded-[26px] border-4 border-white shadow-sm bg-white"
        style={{ width: size, height: size }}
      >
        <img src={customIcon} alt={category} className="w-full h-full object-cover" />
      </div>
    );
  }

  return <ActivityPictogram title={category} size={size} />;
};
