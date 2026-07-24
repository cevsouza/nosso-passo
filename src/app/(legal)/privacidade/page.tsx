import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Nosso Passo',
  description:
    'Como o Nosso Passo trata dados pessoais de crianças e adolescentes, em conformidade com a LGPD (Lei 13.709/2018).',
};

const CONTATO = 'contato@nossopasso.com.br';
const ATUALIZADO = '19 de julho de 2026';

export default function PrivacidadePage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p className="legal-meta">Última atualização: {ATUALIZADO}</p>

      <p>
        O Nosso Passo é um aplicativo de rotina visual para crianças e adolescentes autistas. Ele foi
        criado por um pai, para o próprio filho, e trata a informação da sua família com esse mesmo
        cuidado.
      </p>

      <div className="legal-callout">
        <p>
          <strong>Em uma frase:</strong> coletamos apenas o necessário para a rotina funcionar, não
          vendemos nem cedemos dados a ninguém, não usamos publicidade, não fazemos perfilamento
          comercial da criança, e você pode pedir a exclusão de tudo a qualquer momento pelo e-mail{' '}
          <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
        </p>
      </div>

      <h2>1. Quem é o controlador dos dados</h2>
      <p>
        O controlador é o responsável pela operação do Nosso Passo, disponível em nossopasso.com.br.
        Contato do encarregado pelo tratamento de dados (DPO), para qualquer solicitação prevista
        nesta política: <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <p>
        <strong>Da pessoa responsável (quem cria a conta):</strong>
      </p>
      <ul>
        <li>E-mail e senha (a senha é guardada apenas como hash, nunca em texto legível).</li>
        <li>Preferências da conta e PIN de proteção do painel adulto.</li>
        <li>
          Dados de cobrança, quando há assinatura paga — processados <strong>integralmente pela
          Stripe</strong>. O Nosso Passo não recebe, não vê e não armazena número de cartão.
        </li>
      </ul>

      <p>
        <strong>Da criança ou adolescente:</strong>
      </p>
      <ul>
        <li>Nome ou apelido, data de nascimento e gênero (todos opcionais, exceto o nome).</li>
        <li>
          <strong>Diagnóstico informado</strong> (ex.: TEA Nível 1).
        </li>
        <li>Tarefas, horários, rotina, conclusões e recompensas.</li>
        <li>
          <strong>Registros sensoriais e de comportamento:</strong> humor, ocorrência de crise,
          anotações livres, gatilhos, antecedente/comportamento/consequência, alimentação, nível de
          ruído e de luz.
        </li>
        <li>
          <strong>Localização (latitude e longitude)</strong>, quando e somente quando um registro
          sensorial é gravado com essa opção ativada pelo responsável, para ajudar a identificar em
          quais ambientes as crises acontecem. O aplicativo não faz rastreamento contínuo.
        </li>
        <li>Observações e devoluções escritas por terapeutas ou pela escola nos acompanhamentos.</li>
      </ul>

      <h2>3. Esses são dados sensíveis — e tratamos como tal</h2>
      <p>
        Informação sobre saúde, diagnóstico e comportamento de uma criança é{' '}
        <strong>dado pessoal sensível</strong> nos termos do art. 11 da LGPD, e dado de criança e
        adolescente nos termos do art. 14. Isso significa, na prática:
      </p>
      <ul>
        <li>
          O tratamento acontece com base no <strong>consentimento específico e destacado do pai,
          mãe ou responsável legal</strong>, dado no momento do cadastro e revogável a qualquer
          momento.
        </li>
        <li>
          Os dados são usados <strong>no melhor interesse da criança</strong> — organizar a rotina e
          apoiar o acompanhamento terapêutico — e para nenhuma outra finalidade.
        </li>
        <li>
          <strong>Nunca</strong> usamos esses dados para publicidade, para treinar modelos de
          inteligência artificial, nem os repassamos a corretores de dados, seguradoras, planos de
          saúde ou empregadores.
        </li>
      </ul>

      <h2>4. Para que usamos</h2>
      <ul>
        <li>Exibir e operar a rotina diária da criança no aparelho.</li>
        <li>Gerar relatórios de aderência e evolução para a família e para os profissionais.</li>
        <li>Permitir que terapeuta e escola acompanhem, quando a família autoriza.</li>
        <li>Autenticar o acesso, manter a segurança da conta e cobrar a assinatura.</li>
      </ul>
      <p>
        Não há decisão automatizada que produza efeito jurídico ou que afete de forma significativa
        os interesses da criança.
      </p>

      <h2>5. Com quem compartilhamos</h2>
      <p>Apenas com quem é indispensável para o serviço existir:</p>
      <ul>
        <li>
          <strong>Terapeutas e escolas indicados por você:</strong> o acesso só existe quando o
          responsável gera um código de acesso. Esse código tem papel definido (terapeuta, escola ou
          somente leitura), pode ter validade e{' '}
          <strong>pode ser revogado a qualquer momento</strong> no painel — o acesso cai na hora.
        </li>
        <li>
          <strong>Provedores de infraestrutura:</strong> hospedagem e banco de dados (Railway) e
          pagamentos (Stripe). Eles atuam como operadores, sob contrato, e não podem usar os dados
          para finalidade própria.
        </li>
        <li>
          <strong>Autoridades</strong>, apenas mediante ordem judicial ou requisição legal válida.
        </li>
      </ul>
      <p>
        <strong>Não vendemos, não alugamos e não cedemos dados pessoais para terceiros.</strong>{' '}
        Parte da infraestrutura pode estar localizada fora do Brasil; nesse caso a transferência
        internacional observa os requisitos dos arts. 33 e seguintes da LGPD.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Enquanto a conta estiver ativa. Se você excluir a conta ou solicitar a exclusão, os dados
        pessoais são apagados em até <strong>30 dias</strong>, salvo o que a lei obrigue a reter (por
        exemplo, registros fiscais de pagamento e os registros de acesso exigidos pelo Marco Civil da
        Internet). Registros de auditoria de segurança podem ser mantidos de forma anonimizada.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        A LGPD garante a você, como responsável legal pelo titular, o direito de: confirmar que existe
        tratamento; acessar os dados; corrigir dados incompletos ou desatualizados; solicitar
        anonimização, bloqueio ou eliminação; solicitar a portabilidade; obter informação sobre
        compartilhamento; e <strong>revogar o consentimento</strong>.
      </p>
      <p>
        Para exercer qualquer um deles, escreva para{' '}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>. Respondemos em até 15 dias. O pedido é gratuito.
      </p>

      <h2>8. Segurança</h2>
      <p>
        O tráfego é criptografado em HTTPS, as senhas são guardadas como hash, o painel adulto é
        protegido por PIN ou desafio, e o acesso de profissionais é limitado por papel, com validade e
        revogação. Nenhum sistema é infalível: em caso de incidente de segurança com risco relevante,
        comunicaremos você e a ANPD, conforme o art. 48 da LGPD.
      </p>

      <h2>9. Cookies</h2>
      <p>
        O Nosso Passo não usa cookies de publicidade nem de rastreamento de terceiros. Utilizamos apenas
        armazenamento local no navegador para manter sua sessão iniciada e lembrar preferências como
        idioma e tema.
      </p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Se esta política mudar de forma relevante, avisaremos pelo e-mail cadastrado antes da mudança
        entrar em vigor. A data no topo indica a versão vigente.
      </p>

      <h2>11. Fale conosco</h2>
      <p>
        Dúvida, pedido ou reclamação sobre privacidade:{' '}
        <a href={`mailto:${CONTATO}`}>{CONTATO}</a>. Você também pode apresentar reclamação à
        Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
    </>
  );
}
