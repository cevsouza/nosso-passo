export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  responsibleEmail: string;
  action: 'ADD_TASK' | 'DELETE_TASK' | 'COMPLETE_TASK' | 'RESET_ROUTINE' | 'UPDATE_PROFILE' | 'REGISTER_CHILD' | 'DELETE_CHILD';
  details: string; // Description of change
}

const MOCK_LOGS_UPDATE_EVENT = 'firebase-mock-logs-update';

// O uid identifica quem esta pedindo. A rota so devolve os registros DESTE
// responsavel e assina os novos com o e-mail que ela mesma busca no banco —
// o `responsibleEmail` que o cliente mandava era aceito sem conferencia.
const uid = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const bruto = localStorage.getItem('tea_user');
    return bruto ? (JSON.parse(bruto).uid || '') : '';
  } catch {
    return '';
  }
};

export const immutableLogger = {
  /**
   * Appends a new audit log to PostgreSQL.
   */
  logChange: async (
    action: AuditLog['action'],
    details: string,
    // Mantido na assinatura porque dezenas de chamadas o passam; o servidor
    // ignora e usa o e-mail do dono do uid.
    _responsibleEmail?: string
  ): Promise<AuditLog> => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-uid': uid() },
      body: JSON.stringify({ action, details })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Broadcast updated logs to local listeners
    immutableLogger.getLogs().then(logs => {
      window.dispatchEvent(new CustomEvent(MOCK_LOGS_UPDATE_EVENT, { detail: logs }));
    }).catch(() => {});

    return data;
  },

  /**
   * Fetches all logs sorted by newest first from PostgreSQL.
   */
  getLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/logs', { headers: { 'x-user-uid': uid() } });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  /**
   * Real-time subscription to logs (polling database fallback).
   */
  onSnapshotLogs: (callback: (logs: AuditLog[]) => void) => {
    if (typeof window === 'undefined') return () => {};

    // Initial load
    immutableLogger.getLogs().then(callback).catch(() => {});

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLog[]>;
      callback(customEvent.detail);
    };

    window.addEventListener(MOCK_LOGS_UPDATE_EVENT, handleUpdate);

    // Polling logs from PostgreSQL database
    let lastSerialized = '';
    const interval = setInterval(async () => {
      try {
        const fetched = await immutableLogger.getLogs();
        const serialized = JSON.stringify(fetched);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          window.dispatchEvent(new CustomEvent(MOCK_LOGS_UPDATE_EVENT, { detail: fetched }));
        }
      } catch (err) {
        // Silent catch
      }
    }, 4500);

    return () => {
      window.removeEventListener(MOCK_LOGS_UPDATE_EVENT, handleUpdate);
      clearInterval(interval);
    };
  }
};
