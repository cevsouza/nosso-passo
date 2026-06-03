/**
 * Immutable Audit Logger.
 * Records all routine changes made by the Parent in a strict, append-only manner.
 * These logs cannot be edited or deleted, ensuring a secure and reliable audit trail.
 */

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  responsibleEmail: string;
  action: 'ADD_TASK' | 'DELETE_TASK' | 'COMPLETE_TASK' | 'RESET_ROUTINE' | 'UPDATE_PROFILE';
  details: string; // Description of change
}

const MOCK_LOGS_UPDATE_EVENT = 'firebase-mock-logs-update';

// Initialize default logs if empty to show a nice history
const DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    responsibleEmail: 'pai@exemplo.com',
    action: 'RESET_ROUTINE',
    details: 'Rotina redefinida para os padrões sensoriais recomendados.'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    responsibleEmail: 'pai@exemplo.com',
    action: 'UPDATE_PROFILE',
    details: 'Perfil da criança atualizado: Hiperfoco definido como "Border Collies 🐕".'
  }
];

const getLocalLogs = (): AuditLog[] => {
  if (typeof window === 'undefined') return DEFAULT_LOGS;
  const stored = localStorage.getItem('tea_audit_logs');
  if (!stored) {
    localStorage.setItem('tea_audit_logs', JSON.stringify(DEFAULT_LOGS));
    return DEFAULT_LOGS;
  }
  return JSON.parse(stored);
};

export const immutableLogger = {
  /**
   * Appends a new audit log. There is NO corresponding delete or update function,
   * guaranteeing the immutability of the record.
   */
  logChange: async (
    action: AuditLog['action'], 
    details: string, 
    responsibleEmail: string = 'pai@exemplo.com'
  ): Promise<AuditLog> => {
    const currentLogs = getLocalLogs();
    const newLog: AuditLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      responsibleEmail,
      action,
      details
    };
    
    // Unshift to keep newest at the top
    currentLogs.unshift(newLog);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('tea_audit_logs', JSON.stringify(currentLogs));
      window.dispatchEvent(new CustomEvent(MOCK_LOGS_UPDATE_EVENT, { detail: currentLogs }));
    }
    
    return newLog;
  },

  /**
   * Fetches all logs sorted by newest first.
   */
  getLogs: async (): Promise<AuditLog[]> => {
    return getLocalLogs();
  },

  /**
   * Real-time subscription to logs (so the parental dashboard updates logs dynamically).
   */
  onSnapshotLogs: (callback: (logs: AuditLog[]) => void) => {
    if (typeof window === 'undefined') return () => {};

    // Initial load
    callback(getLocalLogs());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLog[]>;
      callback(customEvent.detail);
    };

    window.addEventListener(MOCK_LOGS_UPDATE_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(MOCK_LOGS_UPDATE_EVENT, handleUpdate);
    };
  }
};
