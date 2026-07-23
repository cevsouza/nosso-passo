export interface Task {
  id: string;
  title: string;
  time: string; // "HH:MM"
  period: 'manhã' | 'tarde' | 'noite';
  day: string; // "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo"
  isCompleted: boolean;
  order: number;
  icon?: string;
  customIcon?: string;
  category?: 'AVD' | 'Aprendizado' | 'Lazer';
  duration?: number;
  description?: string;
  month?: number | null;
  year?: number | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'responsavel' | 'usuario';
  childHyperfocus?: string;
  parentPinCode?: string;
  lockType?: 'pin' | 'math' | 'none';
  plan?: 'free' | 'premium';
  sensorySpeed?: 0.7 | 1.0 | 1.2;
  sensorySound?: 'marimba' | 'bubble' | 'silent';
  sensoryVisuals?: 'rich' | 'minimal';
  sensoryProfile?: 'balanced' | 'hypersensitive' | 'hyposensitive';
  timerStyle?: 'circle' | 'hourglass' | 'droplets' | 'hyperfocus';
}

export interface Child {
  id: string;
  name: string;
  birthDate?: string;
  gender?: string;
  diagnosis?: string;
  childHyperfocus?: string;
  parentPinCode?: string;
  lockType?: 'pin' | 'math' | 'none';
  sensorySpeed?: number;
  sensorySound?: 'marimba' | 'bubble' | 'silent';
  sensoryVisuals?: 'rich' | 'minimal';
  sensoryProfile?: 'balanced' | 'hypersensitive' | 'hyposensitive';
  timerStyle?: 'circle' | 'hourglass' | 'droplets';
  interfaceMode?: 'foco' | 'intermediario' | 'completo';
  rewardName?: string;
  rewardCost?: number;
  tokens?: number;
  transitionMinutes?: number;
  parentUid: string;
  sharingCode?: string;
  collectedParts?: number;
  toyInventory?: string;
  emotionalBattery?: string;
  audioAlert10?: string;
  audioAlert5?: string;
  audioAlert2?: string;
  monthlyTemplate?: string | null;
  emergencyFirstThen?: boolean;
  behaviorDictionary?: string | null;
  unexpectedChange?: string | null;
  aacCustomItems?: string | null;
  customStories?: string | null;
}

export interface SensoryLog {
  id: string;
  timestamp: string;
  mood?: 'feliz' | 'calmo' | 'agitado' | 'triste';
  crisisOccurred: boolean;
  notes?: string;
  decibels?: number;
  lightLevel?: string;
  location?: string;
  trigger?: string;
  antecedent?: string;
  behavior?: string;
  consequence?: string;
  loggedBy?: 'parent' | 'child' | 'school';
  foodIntake?: string;
  schoolNoise?: string;
  latitude?: number;
  longitude?: number;
}

export interface Checkpoint {
  id: string;
  weekNum: number;
  status: 'pending' | 'completed';
  notes: string;
  feedback: string;
  professionalName: string;
  professionalRole: string;
  date: string;
  childId: string;
  createdAt?: string;
}

const MOCK_DB_UPDATE_EVENT = 'firebase-mock-db-update';
const MOCK_AUTH_UPDATE_EVENT = 'firebase-mock-auth-update';

const getTargetMonthYear = (monthParam?: number, yearParam?: number) => {
  if (monthParam !== undefined && yearParam !== undefined) {
    return { month: monthParam, year: yearParam };
  }
  const isRoutine = typeof window !== 'undefined' && window.location.pathname.includes('/routine');
  if (isRoutine) {
    const now = new Date();
    return {
      month: monthParam !== undefined ? monthParam : now.getMonth() + 1,
      year: yearParam !== undefined ? yearParam : now.getFullYear()
    };
  } else {
    const now = new Date();
    let m = monthParam;
    let y = yearParam;
    if (m === undefined && typeof window !== 'undefined') {
      const storedM = sessionStorage.getItem('tea_active_month');
      m = storedM ? parseInt(storedM, 10) : now.getMonth() + 1;
    } else if (m === undefined) {
      m = now.getMonth() + 1;
    }
    if (y === undefined && typeof window !== 'undefined') {
      const storedY = sessionStorage.getItem('tea_active_year');
      y = storedY ? parseInt(storedY, 10) : now.getFullYear();
    } else if (y === undefined) {
      y = now.getFullYear();
    }
    return { month: m, year: y };
  }
};

const dispatchDbUpdate = (tasks: Task[], month: number, year: number) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { 
    detail: { tasks, month, year } 
  }));
};


export interface OfflineAction {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export const getOfflineQueue = (): OfflineAction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('offline_actions_queue');
  return stored ? JSON.parse(stored) : [];
};

const saveOfflineQueue = (queue: OfflineAction[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('offline_actions_queue', JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('app-offline-status-changed', { 
    detail: { 
      isOffline: !navigator.onLine, 
      queueLength: queue.length 
    } 
  }));
};

const enqueueOfflineAction = (url: string, method: string, headers: Record<string, string>, body?: string) => {
  const queue = getOfflineQueue();
  const action: OfflineAction = {
    id: Math.random().toString(36).substring(2, 11),
    url,
    method,
    headers,
    body,
    timestamp: Date.now()
  };
  queue.push(action);
  saveOfflineQueue(queue);
};

export const syncOfflineActions = async () => {
  if (typeof window === 'undefined' || !navigator.onLine) return;
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const remaining: OfflineAction[] = [];
  for (const action of queue) {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
      });
      if (!res.ok) {
        if (res.status >= 500) {
          remaining.push(action);
        }
      }
    } catch (err) {
      remaining.push(action);
    }
  }
  saveOfflineQueue(remaining);

  // Broadcast updates
  const { month, year } = getTargetMonthYear();
  firebaseBridge.db.getTasks(month, year).then(tasks => {
    dispatchDbUpdate(tasks, month, year);
  }).catch(() => {});

};

const safeFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = options.method || 'GET';
  const headers = (options.headers || {}) as Record<string, string>;
  const body = options.body as string | undefined;

  if (typeof window !== 'undefined' && !navigator.onLine) {
    if (method !== 'GET') {
      enqueueOfflineAction(url, method, headers, body);
    }
    return {
      ok: true,
      status: 200,
      json: async () => {
        if (url.includes('/api/tasks')) {
          if (method === 'POST') {
            const data = JSON.parse(body || '{}');
            return { id: 'temp-' + Math.random().toString(36).substring(2, 7), isCompleted: false, order: 1, ...data };
          }
          if (method === 'PUT') {
            const data = JSON.parse(body || '{}');
            return data.updates || data;
          }
          return [];
        }
        if (url.includes('/api/sensory-logs')) {
          const data = JSON.parse(body || '{}');
          return { id: 'temp-' + Math.random().toString(36).substring(2, 7), timestamp: new Date().toISOString(), ...data };
        }
        return { success: true };
      }
    } as Response;
  }

  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    if (typeof window !== 'undefined' && method !== 'GET') {
      enqueueOfflineAction(url, method, headers, body);
      return {
        ok: true,
        status: 200,
        json: async () => {
          if (url.includes('/api/tasks')) {
            if (method === 'POST') {
              const data = JSON.parse(body || '{}');
              return { id: 'temp-' + Math.random().toString(36).substring(2, 7), isCompleted: false, order: 1, ...data };
            }
            if (method === 'PUT') {
              const data = JSON.parse(body || '{}');
              return data.updates || data;
            }
            return [];
          }
          if (url.includes('/api/sensory-logs')) {
            const data = JSON.parse(body || '{}');
            return { id: 'temp-' + Math.random().toString(36).substring(2, 7), timestamp: new Date().toISOString(), ...data };
          }
          return { success: true };
        }
      } as Response;
    }
    throw err;
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineActions();
  });
  window.addEventListener('offline', () => {
    window.dispatchEvent(new CustomEvent('app-offline-status-changed', { 
      detail: { 
        isOffline: true, 
        queueLength: getOfflineQueue().length 
      } 
    }));
  });
}

const getLocalProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('tea_user');
  return stored ? JSON.parse(stored) : null;
};

const saveLocalProfile = (profile: UserProfile | null) => {
  if (typeof window === 'undefined') return;
  if (profile) {
    localStorage.setItem('tea_user', JSON.stringify(profile));
  } else {
    localStorage.removeItem('tea_user');
  }
  window.dispatchEvent(new CustomEvent(MOCK_AUTH_UPDATE_EVENT, { detail: profile }));
};

export const firebaseBridge = {
  // --- AUTH SERVICE ---
  auth: {
    signUp: async (
      email: string,
      password?: string,
      growth?: { referralSource?: string; referralDetail?: string; referralCode?: string }
    ): Promise<UserProfile> => {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '123456', ...(growth || {}) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      saveLocalProfile(data);
      return data;
    },

    signIn: async (email: string, password?: string): Promise<UserProfile> => {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '123456' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      saveLocalProfile(data);
      return data;
    },

    signOut: async (): Promise<void> => {
      saveLocalProfile(null);
      firebaseBridge.auth.setActiveChild(null);
    },

    getCurrentUser: (): UserProfile | null => {
      return getLocalProfile();
    },

    syncProfile: async (): Promise<UserProfile | null> => {
      const current = getLocalProfile();
      if (!current) return null;
      const res = await safeFetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: current.email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      saveLocalProfile(data);
      return data;
    },

    onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
      if (typeof window === 'undefined') return () => {};
      
      // Fire initial state
      callback(getLocalProfile());

      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<UserProfile | null>;
        callback(customEvent.detail);
      };

      window.addEventListener(MOCK_AUTH_UPDATE_EVENT, handleUpdate);
      return () => {
        window.removeEventListener(MOCK_AUTH_UPDATE_EVENT, handleUpdate);
      };
    },

    updateProfileSettings: async (updates: { 
      childHyperfocus?: string; 
      parentPinCode?: string; 
      lockType?: 'pin' | 'math' | 'none'; 
      plan?: 'free' | 'premium';
      sensorySpeed?: 0.7 | 1.0 | 1.2;
      sensorySound?: 'marimba' | 'bubble' | 'silent';
      sensoryVisuals?: 'rich' | 'minimal';
      sensoryProfile?: 'balanced' | 'hypersensitive' | 'hyposensitive';
      timerStyle?: 'circle' | 'hourglass' | 'droplets';
      password?: string;
    }): Promise<void> => {
      const current = getLocalProfile();
      if (!current) return;

      const res = await safeFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: current.uid, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      saveLocalProfile(data);
    },

    getReferralStatus: async (): Promise<{
      code: string;
      total: number;
      diasGanhos: number;
      diasPorIndicacao: number;
      restantes: number;
      premiumUntil: string | null;
      premiumAtivo: boolean;
      assinaturaPaga: boolean;
    } | null> => {
      const current = getLocalProfile();
      if (!current) return null;
      const res = await safeFetch('/api/referral', { headers: { 'x-user-uid': current.uid } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    // --- MULTI-CHILD MANAGEMENT API ---
    getChildren: async (): Promise<Child[]> => {
      const current = getLocalProfile();
      if (!current) return [];

      const res = await safeFetch('/api/children', {
        headers: { 'x-user-uid': current.uid }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addChild: async (childData: { name: string; birthDate?: string; gender?: string; diagnosis?: string }): Promise<Child> => {
      const current = getLocalProfile();
      if (!current) throw new Error('Usuário não está logado');

      const res = await safeFetch('/api/children', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': current.uid
        },
        body: JSON.stringify(childData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    updateChildSettings: async (childId: string, updates: Partial<Omit<Child, 'id' | 'parentUid'>>): Promise<Child> => {
      const res = await safeFetch('/api/children', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: childId, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // If we are updating the active child, sync local storage
      const activeChild = firebaseBridge.auth.getActiveChild();
      if (activeChild && activeChild.id === childId) {
        const merged = { ...activeChild, ...data };
        localStorage.setItem('tea_active_child', JSON.stringify(merged));
      }

      return data;
    },

    deleteChild: async (childId: string): Promise<void> => {
      const res = await safeFetch(`/api/children?id=${childId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const activeChild = firebaseBridge.auth.getActiveChild();
      if (activeChild && activeChild.id === childId) {
        firebaseBridge.auth.setActiveChild(null);
      }
    },

    // ---- Role-scoped access codes (support network) ----
    listAccessCodes: async (childId: string): Promise<any[]> => {
      const current = getLocalProfile();
      if (!current) return [];
      const res = await safeFetch(`/api/share?childId=${childId}`, {
        headers: { 'x-user-uid': current.uid }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    createAccessCode: async (childId: string, role: string, label?: string, expiresInDays?: number): Promise<any> => {
      const current = getLocalProfile();
      if (!current) throw new Error('Usuário não está logado');
      const res = await safeFetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': current.uid },
        body: JSON.stringify({ childId, role, label, expiresInDays })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    revokeAccessCode: async (id: string): Promise<any> => {
      const current = getLocalProfile();
      if (!current) throw new Error('Usuário não está logado');
      const res = await safeFetch('/api/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': current.uid },
        body: JSON.stringify({ id, revoked: true })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    getActiveChild: (): Child | null => {
      if (typeof window === 'undefined') return null;
      const stored = localStorage.getItem('tea_active_child');
      return stored ? JSON.parse(stored) : null;
    },

    setActiveChild: (child: Child | null) => {
      if (typeof window === 'undefined') return;
      if (child) {
        localStorage.setItem('tea_active_child', JSON.stringify(child));
        localStorage.setItem('tea_active_child_id', child.id);
      } else {
        localStorage.removeItem('tea_active_child');
        localStorage.removeItem('tea_active_child_id');
      }
      
      const { month, year } = getTargetMonthYear();
      // Broadcast update to sync local tasks
      firebaseBridge.db.getTasks(month, year).then(tasks => {
        dispatchDbUpdate(tasks, month, year);
      }).catch(() => {});
    },

    addTokens: async (childId: string, amount: number): Promise<Child> => {
      const activeChild = firebaseBridge.auth.getActiveChild();
      const currentTokens = activeChild?.tokens || 0;
      const updated = await firebaseBridge.auth.updateChildSettings(childId, {
        tokens: Math.max(0, currentTokens + amount)
      });
      return updated;
    }
  },

  // --- FIRESTORE DATABASE SERVICE ---
  db: {
    getSensoryLogs: async (childId: string): Promise<SensoryLog[]> => {
      const res = await safeFetch(`/api/sensory-logs?childId=${childId}`, {
        headers: { 'x-user-uid': getLocalProfile()?.uid || '' }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addSensoryLog: async (logData: { 
      childId: string; 
      mood?: string; 
      crisisOccurred?: boolean; 
      notes?: string;
      decibels?: number;
      lightLevel?: string;
      location?: string;
      trigger?: string;
      antecedent?: string;
      behavior?: string;
      consequence?: string;
      loggedBy?: string;
      foodIntake?: string;
      schoolNoise?: string;
      latitude?: number;
      longitude?: number;
    }): Promise<SensoryLog> => {
      const res = await safeFetch('/api/sensory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': getLocalProfile()?.uid || '' },
        body: JSON.stringify(logData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    getTasks: async (month?: number, year?: number): Promise<Task[]> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const { month: m, year: y } = getTargetMonthYear(month, year);

      const headers: Record<string, string> = { 'x-user-uid': userUid };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      let url = '/api/tasks';
      if (m !== undefined && y !== undefined) {
        url += `?month=${m}&year=${y}`;
      }

      const res = await safeFetch(url, { headers });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addTask: async (taskData: Omit<Task, 'id' | 'isCompleted' | 'order'> | Omit<Task, 'id' | 'isCompleted' | 'order'>[], month?: number, year?: number): Promise<any> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);

      const payload = Array.isArray(taskData)
        ? taskData.map(t => ({ month: targetMonth, year: targetYear, ...t }))
        : { month: targetMonth, year: targetYear, ...taskData };

      const res = await safeFetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trigger a sync check locally
      firebaseBridge.db.getTasks(targetMonth, targetYear).then(tasks => {
        dispatchDbUpdate(tasks, targetMonth, targetYear);
      }).catch(() => {});

      return data;
    },

    deleteTask: async (id: string, month?: number, year?: number): Promise<void> => {
      const res = await safeFetch(`/api/tasks?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);
      // Trigger a sync check locally
      firebaseBridge.db.getTasks(targetMonth, targetYear).then(tasks => {
        dispatchDbUpdate(tasks, targetMonth, targetYear);
      }).catch(() => {});
    },

    deleteTasksByDay: async (day: string, month?: number, year?: number): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);

      const res = await safeFetch(`/api/tasks?day=${day}&month=${targetMonth}&year=${targetYear}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trigger a sync check locally
      firebaseBridge.db.getTasks(targetMonth, targetYear).then(tasks => {
        dispatchDbUpdate(tasks, targetMonth, targetYear);
      }).catch(() => {});
    },

    updateTask: async (id: string, updates: Partial<Omit<Task, 'id'>>, month?: number, year?: number): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const res = await safeFetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);
      // Fetch new task list
      const tasks = await firebaseBridge.db.getTasks(targetMonth, targetYear);
      dispatchDbUpdate(tasks, targetMonth, targetYear);

      // If completing, fire completed event
      if (updates.isCompleted === true) {
        const completedTask = tasks.find(t => t.id === id);
        if (completedTask && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firebase-mock-task-completed', { detail: completedTask }));
        }
      }
    },    resetToDefaults: async (): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const DEFAULT_TASKS = [
        // Segunda-feira
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'segunda' },
        { title: 'Café da manhã 🍞', time: '08:30', period: 'manhã', day: 'segunda' },
        { title: 'Terapia Ocupacional 🧠', time: '09:30', period: 'manhã', day: 'segunda' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'segunda' },
        { title: 'Montar quebra-cabeca 🧩', time: '15:00', period: 'tarde', day: 'segunda' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'segunda' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'segunda' },

        // Terça-feira
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'terca' },
        { title: 'Café da manhã 🍞', time: '08:30', period: 'manhã', day: 'terca' },
        { title: 'Fonoaudiologia 🗣️', time: '10:00', period: 'manhã', day: 'terca' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'terca' },
        { title: 'Atividade de Desenho 🎨', time: '16:00', period: 'tarde', day: 'terca' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'terca' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'terca' },

        // Quarta-feira
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'quarta' },
        { title: 'Café da manhã 🍞', time: '08:30', period: 'manhã', day: 'quarta' },
        { title: 'Psicopedagogia 🧠', time: '10:30', period: 'manhã', day: 'quarta' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'quarta' },
        { title: 'Natação Adaptada 🏊‍♂️', time: '15:30', period: 'tarde', day: 'quarta' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'quarta' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'quarta' },

        // Quinta-feira
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'quinta' },
        { title: 'Café da manhã 🍞', time: '08:30', period: 'manhã', day: 'quinta' },
        { title: 'Integração Sensorial 🤸‍♂️', time: '09:00', period: 'manhã', day: 'quinta' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'quinta' },
        { title: 'Montar Lego/Blocos 🧱', time: '15:00', period: 'tarde', day: 'quinta' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'quinta' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'quinta' },

        // Sexta-feira
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'sexta' },
        { title: 'Café da manhã 🍞', time: '08:30', period: 'manhã', day: 'sexta' },
        { title: 'Musicoterapia 🎵', time: '10:00', period: 'manhã', day: 'sexta' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'sexta' },
        { title: 'Parquinho ao Ar Livre 🛝', time: '16:00', period: 'tarde', day: 'sexta' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'sexta' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'sexta' },

        // Sábado
        { title: 'Escovar os dentes 🪥', time: '09:00', period: 'manhã', day: 'sabado' },
        { title: 'Café Especial 🥞', time: '09:30', period: 'manhã', day: 'sabado' },
        { title: 'Parque e Natureza 🌳', time: '10:30', period: 'manhã', day: 'sabado' },
        { title: 'Almoço em Família 🍲', time: '13:00', period: 'tarde', day: 'sabado' },
        { title: 'Tempo de Hiperfoco 🧸', time: '15:30', period: 'tarde', day: 'sabado' },
        { title: 'Jantar em Família 🍽️', time: '19:30', period: 'noite', day: 'sabado' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'sabado' },

        // Domingo
        { title: 'Escovar os dentes 🪥', time: '09:00', period: 'manhã', day: 'domingo' },
        { title: 'Café Especial 🥞', time: '09:30', period: 'manhã', day: 'domingo' },
        { title: 'Organizar Brinquedos 🧸', time: '11:00', period: 'manhã', day: 'domingo' },
        { title: 'Almoço em Família 🍲', time: '13:00', period: 'tarde', day: 'domingo' },
        { title: 'Atividade Livre 🏃‍♂️', time: '15:30', period: 'tarde', day: 'domingo' },
        { title: 'Jantar em Família 🍽️', time: '19:30', period: 'noite', day: 'domingo' },
        { title: 'Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'domingo' }
      ];

      // Map DEFAULT_TASKS to the actual days of the current month based on calendar weekday
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const numDays = new Date(year, month + 1, 0).getDate();
      const WEEKDAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

      const monthTasks: any[] = [];
      for (let dayNum = 1; dayNum <= numDays; dayNum++) {
        const date = new Date(year, month, dayNum);
        const weekdayKey = WEEKDAY_KEYS[date.getDay()];
        
        const daySeedTasks = DEFAULT_TASKS.filter(t => t.day === weekdayKey);
        daySeedTasks.forEach(t => {
          monthTasks.push({
            title: t.title,
            time: t.time,
            period: t.period,
            day: String(dayNum)
          });
        });
      }

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const res = await safeFetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, tasks: monthTasks })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      dispatchDbUpdate(data, month + 1, year);
    },

    resetCompletions: async (month?: number, year?: number): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);

      const res = await safeFetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ resetCompletions: true, month: targetMonth, year: targetYear })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Fetch new task list
      const tasks = await firebaseBridge.db.getTasks(targetMonth, targetYear);
      dispatchDbUpdate(tasks, targetMonth, targetYear);
    },

    loadTemplate: async (templateTasks: Omit<Task, 'id' | 'isCompleted' | 'order'>[], targetMonth?: number, targetYear?: number): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const { month: tMonth, year: tYear } = getTargetMonthYear(targetMonth, targetYear);

      const res = await safeFetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, month: tMonth, year: tYear, tasks: templateTasks })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      dispatchDbUpdate(data, tMonth, tYear);
    },

    clearAllTasks: async (targetMonth?: number, targetYear?: number): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const { month: tMonth, year: tYear } = getTargetMonthYear(targetMonth, targetYear);

      const res = await safeFetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, month: tMonth, year: tYear, tasks: [] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      dispatchDbUpdate(data, tMonth, tYear);
    },

    onSnapshotTasks: (callback: (tasks: Task[]) => void, month?: number, year?: number) => {
      if (typeof window === 'undefined') return () => {};

      const { month: targetMonth, year: targetYear } = getTargetMonthYear(month, year);

      // Initial read
      firebaseBridge.db.getTasks(targetMonth, targetYear).then(callback).catch(() => {});

      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<any>;
        if (customEvent.detail) {
          let eventTasks: Task[] = [];
          let eventMonth: number | undefined;
          let eventYear: number | undefined;

          if (Array.isArray(customEvent.detail)) {
            eventTasks = customEvent.detail;
          } else if (customEvent.detail.tasks && Array.isArray(customEvent.detail.tasks)) {
            eventTasks = customEvent.detail.tasks;
            eventMonth = customEvent.detail.month;
            eventYear = customEvent.detail.year;
          }

          if (eventMonth !== undefined && eventMonth !== targetMonth) return;
          if (eventYear !== undefined && eventYear !== targetYear) return;

          let filtered = eventTasks;
          filtered = eventTasks.filter(t => {
            const tm = t.month !== undefined && t.month !== null ? t.month : new Date().getMonth() + 1;
            const ty = t.year !== undefined && t.year !== null ? t.year : new Date().getFullYear();
            
            if (targetMonth !== undefined && tm !== targetMonth) return false;
            if (targetYear !== undefined && ty !== targetYear) return false;
            return true;
          });
          callback(filtered);
        }
      };

      window.addEventListener(MOCK_DB_UPDATE_EVENT, handleUpdate);

      // Background polling to sync across different devices/browsers (SaaS multi-tab/device sync)
      let lastSerialized = '';
      const interval = setInterval(async () => {
        try {
          const fetched = await firebaseBridge.db.getTasks(targetMonth, targetYear);
          const serialized = JSON.stringify(fetched);
          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            dispatchDbUpdate(fetched, targetMonth, targetYear);
          }
        } catch (err) {
          // Silent catch
        }
      }, 4000);

      return () => {
        window.removeEventListener(MOCK_DB_UPDATE_EVENT, handleUpdate);
        clearInterval(interval);
      };
    },

    onSnapshotTaskCompleted: (callback: (task: Task) => void) => {
      if (typeof window === 'undefined') return () => {};
      
      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<Task>;
        if (customEvent.detail) {
          callback(customEvent.detail);
        }
      };
      
      window.addEventListener('firebase-mock-task-completed', handleUpdate);
      return () => {
        window.removeEventListener('firebase-mock-task-completed', handleUpdate);
      };
    },

    getCheckpoints: async (childId: string): Promise<Checkpoint[]> => {
      const res = await safeFetch(`/api/checkpoints?childId=${childId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    saveCheckpoint: async (id: string, updates: Partial<Checkpoint>): Promise<Checkpoint> => {
      const res = await safeFetch('/api/checkpoints', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addDailyCheckpoint: async (checkpointData: { childId: string; date: string; feedback: string; professionalName: string; professionalRole: string; notes?: string; status?: string; weekNum?: number }): Promise<Checkpoint> => {
      const res = await safeFetch('/api/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkpointData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    }
  }
};
