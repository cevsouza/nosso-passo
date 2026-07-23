import { prisma } from './prisma';
import { hashPassword } from './auth-utils';
import {
  DEMO_UID,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_PIN,
  DEMO_CODES,
  brtNow,
  buildTasks,
  buildTeoLogs,
  buildSimpleLogs,
  buildTeoCheckpoints,
  buildSimpleCheckpoints,
  BENTO_LOGS,
  NINA_LOGS,
  BENTO_CHECKPOINTS,
  NINA_CHECKPOINTS,
  TEO_BEHAVIORS,
  TEO_AAC,
  TEO_STORIES,
  BENTO_BEHAVIORS,
  NINA_BEHAVIORS,
  NINA_AAC,
} from './demo-seed-data';

// ---------------------------------------------------------------------------
// Gravacao da conta de demonstracao.
//
// Tudo vive sob um unico uid fixo (DEMO_UID). O reset apaga SO esse uid — o
// cascade do Prisma leva junto criancas, tarefas, registros, checkpoints e
// codigos de acesso. Nenhuma outra conta e tocada.
// ---------------------------------------------------------------------------

export { DEMO_UID, DEMO_EMAIL, DEMO_PASSWORD, DEMO_PIN, DEMO_CODES };

export type SeedSummary = {
  email: string;
  password: string;
  pin: string;
  children: { name: string; interfaceMode: string; tasks: number; logs: number }[];
  codes: typeof DEMO_CODES;
};

export async function resetDemoAccount(): Promise<SeedSummary> {
  // Apaga SO a conta de demonstracao. O cascade cuida do resto.
  await prisma.userProfile.deleteMany({ where: { uid: DEMO_UID } });
  // Garante que o e-mail nao ficou preso em outro uid de uma versao anterior.
  await prisma.userProfile.deleteMany({ where: { email: DEMO_EMAIL } });

  const year = brtNow().getUTCFullYear();

  await prisma.userProfile.create({
    data: {
      uid: DEMO_UID,
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      role: 'responsavel',
      childHyperfocus: 'Trens e metrô 🚇',
      parentPinCode: DEMO_PIN,
      lockType: 'math',
      plan: 'premium',
      sensorySpeed: 1.0,
      sensorySound: 'marimba',
      sensoryVisuals: 'rich',
      sensoryProfile: 'balanced',
      timerStyle: 'circle',
    },
  });

  const teo = await prisma.child.create({
    data: {
      name: 'Téo',
      birthDate: `${year - 8}-03-14`,
      gender: 'Masculino',
      diagnosis: 'TEA nível 1 · TDAH associado',
      childHyperfocus: 'Trens e metrô 🚇',
      parentPinCode: DEMO_PIN,
      lockType: 'math',
      sensorySpeed: 1.0,
      sensorySound: 'marimba',
      sensoryVisuals: 'rich',
      sensoryProfile: 'balanced',
      timerStyle: 'circle',
      interfaceMode: 'completo',
      rewardName: '20 minutos de vídeo de metrô',
      rewardCost: 12,
      tokens: 8,
      transitionMinutes: 5,
      emotionalBattery: 'green',
      behaviorDictionary: TEO_BEHAVIORS,
      aacCustomItems: TEO_AAC,
      customStories: TEO_STORIES,
      toyInventory: JSON.stringify({ owned: ['acc_hat', 'acc_glasses'], equipped: ['acc_glasses'] }),
      collectedParts: 3,
      unexpectedChange:
        'Sexta a professora vai faltar e outra professora entra na sala. A sala e a cadeira são as mesmas.',
      parentUid: DEMO_UID,
    },
  });

  const bento = await prisma.child.create({
    data: {
      name: 'Bento',
      birthDate: `${year - 6}-08-02`,
      gender: 'Masculino',
      diagnosis: 'TEA nível 1 · suporte leve',
      childHyperfocus: 'Dinossauros 🦖',
      parentPinCode: DEMO_PIN,
      lockType: 'math',
      sensorySpeed: 1.0,
      sensorySound: 'marimba',
      sensoryVisuals: 'rich',
      sensoryProfile: 'balanced',
      timerStyle: 'hourglass',
      interfaceMode: 'intermediario',
      rewardName: '1 dinossauro novo na coleção',
      rewardCost: 20,
      tokens: 14,
      transitionMinutes: 5,
      emotionalBattery: 'yellow',
      behaviorDictionary: BENTO_BEHAVIORS,
      parentUid: DEMO_UID,
    },
  });

  const nina = await prisma.child.create({
    data: {
      name: 'Nina',
      birthDate: `${year - 4}-11-27`,
      gender: 'Feminino',
      diagnosis: 'TEA nível 2 · em acompanhamento fonoaudiológico',
      childHyperfocus: 'Bolhas de sabão 🫧',
      parentPinCode: DEMO_PIN,
      lockType: 'pin',
      sensorySpeed: 0.8,
      sensorySound: 'marimba',
      sensoryVisuals: 'minimal',
      sensoryProfile: 'balanced',
      timerStyle: 'circle',
      interfaceMode: 'foco',
      rewardName: '3 músicas favoritas',
      rewardCost: 6,
      tokens: 4,
      transitionMinutes: 10,
      emotionalBattery: 'green',
      behaviorDictionary: NINA_BEHAVIORS,
      aacCustomItems: NINA_AAC,
      parentUid: DEMO_UID,
    },
  });

  const teoTasks = buildTasks('teo', teo.id, DEMO_UID, 101);
  const bentoTasks = buildTasks('bento', bento.id, DEMO_UID, 202);
  const ninaTasks = buildTasks('nina', nina.id, DEMO_UID, 303);
  await prisma.task.createMany({ data: [...teoTasks, ...bentoTasks, ...ninaTasks] });

  const teoLogs = buildTeoLogs(teo.id);
  const bentoLogs = buildSimpleLogs(bento.id, BENTO_LOGS);
  const ninaLogs = buildSimpleLogs(nina.id, NINA_LOGS);
  await prisma.sensoryLog.createMany({ data: [...teoLogs, ...bentoLogs, ...ninaLogs] });

  await prisma.checkpoint.createMany({
    data: [
      ...buildTeoCheckpoints(teo.id),
      ...buildSimpleCheckpoints(bento.id, 'Psicologia ABA', BENTO_CHECKPOINTS),
      ...buildSimpleCheckpoints(nina.id, 'Fonoaudiologia', NINA_CHECKPOINTS),
    ],
  });

  const in90Days = new Date(Date.now() + 90 * 86400000);
  await prisma.accessCode.createMany({
    data: [
      { code: DEMO_CODES.teoTherapist, role: 'therapist', label: 'Terapeuta (demonstração)', childId: teo.id, expiresAt: in90Days },
      { code: DEMO_CODES.teoSchool, role: 'school', label: 'Escola (demonstração)', childId: teo.id, expiresAt: in90Days },
      { code: DEMO_CODES.bentoTherapist, role: 'therapist', label: 'Terapeuta (demonstração)', childId: bento.id, expiresAt: in90Days },
      { code: DEMO_CODES.ninaTherapist, role: 'therapist', label: 'Terapeuta (demonstração)', childId: nina.id, expiresAt: in90Days },
    ],
  });

  return {
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    pin: DEMO_PIN,
    children: [
      { name: 'Téo', interfaceMode: 'completo', tasks: teoTasks.length, logs: teoLogs.length },
      { name: 'Bento', interfaceMode: 'intermediario', tasks: bentoTasks.length, logs: bentoLogs.length },
      { name: 'Nina', interfaceMode: 'foco', tasks: ninaTasks.length, logs: ninaLogs.length },
    ],
    codes: DEMO_CODES,
  };
}
