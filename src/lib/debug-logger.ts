import fs from 'fs';
import path from 'path';

export function logToDebugFile(message: string) {
  try {
    const logPath = path.join(process.cwd(), 'public', 'debug-log.txt');
    const logLine = `[${new Date().toLocaleString('pt-BR')}] ${message}\n`;
    fs.appendFileSync(logPath, logLine, 'utf8');
  } catch (err) {
    console.error('Failed to write to debug log:', err);
  }
}

export function readDebugFile(): string {
  try {
    const logPath = path.join(process.cwd(), 'public', 'debug-log.txt');
    if (fs.existsSync(logPath)) {
      return fs.readFileSync(logPath, 'utf8');
    }
    return 'Nenhum log registrado ainda.';
  } catch (err: any) {
    return `Erro ao ler logs: ${err.message}`;
  }
}
