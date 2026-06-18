import { prisma } from '@/lib/prisma';
import { readDebugFile } from '../../lib/debug-logger';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default async function DebugDbPage({ searchParams }: { searchParams: any }) {
  const params = await searchParams;
  const clear = typeof params === 'object' && params !== null ? params.clear : undefined;
  if (clear === 'true') {
    try {
      const logPath = path.join(process.cwd(), 'public', 'debug-log.txt');
      if (fs.existsSync(logPath)) {
        fs.writeFileSync(logPath, '', 'utf8');
      }
    } catch (e) {}
  }
  let errorMsg = null;
  let users: any[] = [];
  let children: any[] = [];
  let tasks: any[] = [];

  try {
    users = await prisma.userProfile.findMany();
    children = await prisma.child.findMany();
    tasks = await prisma.task.findMany({
      orderBy: [{ createdAt: 'desc' }]
    });
  } catch (err: any) {
    errorMsg = err.message;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'monospace', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <h1>Painel de Diagnóstico do Banco de Dados</h1>
      
      {errorMsg && (
        <div style={{ padding: 15, backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: 20, borderRadius: 8 }}>
          <strong>Erro de Conexão:</strong> {errorMsg}
        </div>
      )}

      <h2>Resumo</h2>
      <ul>
        <li>Usuários cadastrados: {users.length}</li>
        <li>Crianças cadastradas: {children.length}</li>
        <li>Tarefas cadastradas: {tasks.length}</li>
      </ul>

      <h2>Tarefas no Banco de Dados (Mais recentes primeiro)</h2>
      {tasks.length === 0 ? (
        <p>Nenhuma tarefa encontrada no banco de dados.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th>ID da Tarefa</th>
              <th>Título</th>
              <th>Dia</th>
              <th>Horário</th>
              <th>Concluída?</th>
              <th>ID da Criança</th>
              <th>UID do Usuário</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t: any) => (
              <tr key={t.id}>
                <td><code>{t.id}</code></td>
                <td>{t.title}</td>
                <td>{t.day}</td>
                <td>{t.time}</td>
                <td>{t.isCompleted ? '✅ Sim' : '❌ Não'}</td>
                <td><code>{t.childId || 'null'}</code></td>
                <td><code>{t.userUid}</code></td>
                <td>{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Crianças no Banco de Dados</h2>
      {children.length === 0 ? (
        <p>Nenhuma criança cadastrada.</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: 10 }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th>ID da Criança</th>
              <th>Nome</th>
              <th>UID do Responsável</th>
              <th>Tokens</th>
            </tr>
          </thead>
          <tbody>
            {children.map((c: any) => (
              <tr key={c.id}>
                <td><code>{c.id}</code></td>
                <td>{c.name}</td>
                <td><code>{c.parentUid}</code></td>
                <td>{c.tokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Logs de Execução (public/debug-log.txt)</h2>
      <div style={{ marginBottom: 15 }}>
        <a href="/debug-db?clear=true" style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', textDecoration: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: '12px' }}>
          Limpar Logs
        </a>
        <a href="/debug-db" style={{ padding: '8px 12px', backgroundColor: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: 4, fontWeight: 'bold', marginLeft: 10, fontSize: '12px' }}>
          Atualizar Página
        </a>
      </div>
      <pre style={{ 
        padding: 15, 
        backgroundColor: '#0f172a', 
        color: '#38bdf8', 
        borderRadius: 8, 
        overflowX: 'auto',
        maxHeight: '400px',
        overflowY: 'auto',
        fontSize: '12px'
      }}>
        {readDebugFile()}
      </pre>
    </div>
  );
}
