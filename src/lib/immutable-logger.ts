export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  responsibleEmail: string;
  action: 'ADD_TASK' | 'DELETE_TASK' | 'COMPLETE_TASK' | 'RESET_ROUTINE' | 'UPDATE_PROFILE';
  details: string; // Description of change
}

const MOCK_LOGS_UPDATE_EVENT = 'firebase-mock-logs-update';

export const immutableLogger = {
  /**
   * Appends a new audit log to PostgreSQL.
   */
  logChange: async (
    action: AuditLog['action'], 
    details: string, 
    responsibleEmail: string = 'pai@exemplo.com'
  ): Promise<AuditLog> => {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, responsibleEmail })
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
    const res = await fetch('/api/logs');
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
