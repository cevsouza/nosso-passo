import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso — Nosso Passo',
  description: 'Condições de uso do Nosso Passo, aplicativo de rotina visual para crianças autistas.',
};

const CONTATO = 'contato@teacolher.online';
const ATUALIZADO = '19 de julho de 2026';

export default function TermosPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p className="legal-meta">Última atualização: {ATUALIZADO}</p>

      <p>
        Estes termos regem o uso do Nosso Passo, disponível em teacolher.online. Ao criar uma conta,
        você concorda com eles. Leia com atenção — especialmente os itens 2 e 7.
      </p>

      <h2>1. O que o Nosso Passo é</h2>
      <p>
        Um aplicativo de <strong>rotina visual e previsibilidade</strong> para crianças e adolescentes
        autistas, com painéis para a família, para terapeutas e para a escola. Ele organiza o dia,
        registra o que aconteceu e ajuda a compartilhar essa informação com quem cuida.
      </p>

      <h2>2. O que o Nosso Passo não é</h2>
      <div className="legal-callout">
        <p>
          <strong>O Nosso Passo não é um dispositivo médico e não faz diagnóstico, tratamento ou
          prescrição.</strong> Não substitui avaliação, terapia ou acompanhamento de profissional de
          saúde qualificado. Os relatórios são um apoio à observação clínica, não um laudo. Nenhuma
          decisão sobre a saúde da criança deve ser tomada com base apenas no que o aplicativo
          mostra. Em emergência, procure atendimento médico.
        </p>
      </div>

      <h2>3. Quem pode usar</h2>
      <p>
        A conta deve ser criada por <strong>maior de 18 anos que seja pai, mãe ou responsável legal</strong>{' '}
        pela criança cadastrada. Ao cadastrar uma criança, você declara ter autoridade legal para
        consentir com o tratamento dos dados dela. A criança usa apenas a Área do Paciente, sob
        supervisão do responsável.
      </p>

      <h2>4. Sua conta</h2>
      <ul>
        <li>Você é responsável por manter a senha e o PIN do painel adulto em sigilo.</li>
        <li>Você responde pelo que é feito na sua conta.</li>
        <li>Avise-nos imediatamente se suspeitar de acesso indevido.</li>
        <li>Você é responsável pela veracidade das informações que cadastra.</li>
      </ul>

      <h2>5. Códigos de acesso de profissionais</h2>
      <p>
        Você pode gerar códigos para que terapeutas ou a escola acompanhem a criança. Ao gerar um
        código, você autoriza aquela pessoa a ver os dados no escopo do papel escolhido. A
        responsabilidade por a quem entregar o código é sua — e você pode revogá-lo a qualquer
        momento no painel.
      </p>

      <h2>6. Planos, pagamento e cancelamento</h2>
      <ul>
        <li>
          Existe um <strong>plano gratuito</strong>, com limite de tarefas por dia e sem os recursos
          exclusivos. Ele não expira.
        </li>
        <li>
          Os planos pagos são cobrados <strong>mensal ou anualmente</strong>, com renovação
          automática, pelo valor exibido no momento da contratação. O pagamento é processado pela
          Stripe.
        </li>
        <li>
          <strong>Cancelamento a qualquer momento</strong>, direto no painel. O acesso pago continua
          até o fim do período já pago; não há multa nem fidelidade.
        </li>
        <li>
          <strong>Arrependimento:</strong> conforme o art. 49 do Código de Defesa do Consumidor, você
          pode desistir da contratação em até <strong>7 dias</strong> e receber a devolução integral.
          Basta escrever para <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
        </li>
        <li>
          Mudanças de preço só valem para períodos futuros e serão avisadas com pelo menos 30 dias de
          antecedência.
        </li>
      </ul>

      <h2>7. Disponibilidade e limitação de responsabilidade</h2>
      <p>
        O serviço é oferecido &quot;como está&quot;. Fazemos o possível para mantê-lo no ar, mas não
        garantimos funcionamento ininterrupto ou livre de falhas — pode haver manutenção, indisponibilidade
        do provedor ou perda de conexão do aparelho.
      </p>
      <p>
        Na máxima extensão permitida pela lei, nossa responsabilidade por danos decorrentes do uso do
        serviço fica limitada ao valor pago por você nos 12 meses anteriores ao evento. Nada nestes
        termos afasta direitos que o Código de Defesa do Consumidor garante a você.
      </p>

      <h2>8. Uso adequado</h2>
      <p>Você concorda em não:</p>
      <ul>
        <li>Cadastrar criança sobre a qual não tenha responsabilidade legal.</li>
        <li>Tentar burlar limites de plano, acessar contas de terceiros ou explorar falhas.</li>
        <li>Copiar, revender ou redistribuir o serviço sem autorização.</li>
        <li>Usar o serviço para qualquer finalidade ilícita.</li>
      </ul>

      <h2>9. Propriedade intelectual</h2>
      <p>
        O software, a marca e o design do Nosso Passo pertencem ao seu criador.{' '}
        <strong>O conteúdo que você cadastra — rotinas, registros e anotações — continua sendo seu.</strong>{' '}
        Você nos concede apenas a licença necessária para armazenar e exibir esse conteúdo dentro do
        serviço, e pode exportá-lo ou apagá-lo quando quiser.
      </p>

      <h2>10. Encerramento</h2>
      <p>
        Você pode encerrar sua conta quando quiser. Podemos encerrar contas que violem estes termos,
        com aviso prévio sempre que possível. Em qualquer caso, você tem direito a exportar seus dados
        antes da exclusão — veja a{' '}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>11. Lei aplicável</h2>
      <p>
        Estes termos são regidos pela lei brasileira. Fica eleito o foro do domicílio do consumidor
        para dirimir eventuais conflitos.
      </p>

      <h2>12. Contato</h2>
      <p>
        Qualquer dúvida sobre estes termos: <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>
    </>
  );
}
