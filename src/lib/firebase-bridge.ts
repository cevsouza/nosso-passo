export interface Task {
  id: string;
  title: string;
  time: string; // "HH:MM"
  period: 'manhã' | 'tarde' | 'noite';
  day: string; // "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo"
  isCompleted: boolean;
  order: number;
  icon?: string;
  category?: 'AVD' | 'Aprendizado' | 'Lazer';
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
  rewardName?: string;
  rewardCost?: number;
  tokens?: number;
  transitionMinutes?: number;
  parentUid: string;
}

export interface SensoryLog {
  id: string;
  timestamp: string;
  mood?: 'feliz' | 'calmo' | 'agitado' | 'triste';
  crisisOccurred: boolean;
  notes?: string;
}

const MOCK_DB_UPDATE_EVENT = 'firebase-mock-db-update';
const MOCK_AUTH_UPDATE_EVENT = 'firebase-mock-auth-update';

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
    signUp: async (email: string, password?: string): Promise<UserProfile> => {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '123456' })
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
    }): Promise<void> => {
      const current = getLocalProfile();
      if (!current) return;

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: current.uid, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      saveLocalProfile(data);
    },

    // --- MULTI-CHILD MANAGEMENT API ---
    getChildren: async (): Promise<Child[]> => {
      const current = getLocalProfile();
      if (!current) return [];

      const res = await fetch('/api/children', {
        headers: { 'x-user-uid': current.uid }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addChild: async (childData: { name: string; birthDate?: string; gender?: string; diagnosis?: string }): Promise<Child> => {
      const current = getLocalProfile();
      if (!current) throw new Error('Usuário não está logado');

      const res = await fetch('/api/children', {
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
      const res = await fetch('/api/children', {
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
      const res = await fetch(`/api/children?id=${childId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const activeChild = firebaseBridge.auth.getActiveChild();
      if (activeChild && activeChild.id === childId) {
        firebaseBridge.auth.setActiveChild(null);
      }
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
      
      // Broadcast update to sync local tasks
      firebaseBridge.db.getTasks().then(tasks => {
        window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: tasks }));
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
      const res = await fetch(`/api/sensory-logs?childId=${childId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addSensoryLog: async (logData: { childId: string; mood?: string; crisisOccurred?: boolean; notes?: string }): Promise<SensoryLog> => {
      const res = await fetch('/api/sensory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    getTasks: async (): Promise<Task[]> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const headers: Record<string, string> = { 'x-user-uid': userUid };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const res = await fetch('/api/tasks', { headers });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addTask: async (taskData: Omit<Task, 'id' | 'isCompleted' | 'order'>): Promise<Task> => {
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

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trigger a sync check locally
      firebaseBridge.db.getTasks().then(tasks => {
        window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: tasks }));
      }).catch(() => {});

      return data;
    },

    deleteTask: async (id: string): Promise<void> => {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Trigger a sync check locally
      firebaseBridge.db.getTasks().then(tasks => {
        window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: tasks }));
      }).catch(() => {});
    },

    updateTask: async (id: string, updates: Partial<Omit<Task, 'id'>>): Promise<void> => {
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

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, updates })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Fetch new task list
      const tasks = await firebaseBridge.db.getTasks();
      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: tasks }));

      // If completing, fire completed event
      if (updates.isCompleted === true) {
        const completedTask = tasks.find(t => t.id === id);
        if (completedTask && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('firebase-mock-task-completed', { detail: completedTask }));
        }
      }
    },

    resetToDefaults: async (): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';
      const childId = typeof window !== 'undefined' ? localStorage.getItem('tea_active_child_id') : null;

      const DEFAULT_TASKS = [
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'segunda' },
        { title: 'Tomar café da manhã 🍞', time: '08:30', period: 'manhã', day: 'segunda' },
        { title: 'Aulas e Estudo 🏫', time: '09:00', period: 'manhã', day: 'segunda' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'segunda' },
        { title: 'Brincar com o Collie 🐶', time: '15:00', period: 'tarde', day: 'segunda' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'segunda' },
        { title: 'Tomar Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'segunda' },
      ];

      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'x-user-uid': userUid
      };
      if (childId) {
        headers['x-child-id'] = childId;
      }

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, tasks: DEFAULT_TASKS })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: data }));
    },

    loadTemplate: async (templateTasks: Omit<Task, 'id' | 'isCompleted' | 'order'>[]): Promise<void> => {
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

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, tasks: templateTasks })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: data }));
    },

    clearAllTasks: async (): Promise<void> => {
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

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ overwrite: true, tasks: [] })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: data }));
    },

    onSnapshotTasks: (callback: (tasks: Task[]) => void) => {
      if (typeof window === 'undefined') return () => {};

      // Initial read
      firebaseBridge.db.getTasks().then(callback).catch(() => {});

      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<Task[]>;
        callback(customEvent.detail);
      };

      window.addEventListener(MOCK_DB_UPDATE_EVENT, handleUpdate);

      // Background polling to sync across different devices/browsers (SaaS multi-tab/device sync)
      let lastSerialized = '';
      const interval = setInterval(async () => {
        try {
          const fetched = await firebaseBridge.db.getTasks();
          const serialized = JSON.stringify(fetched);
          if (serialized !== lastSerialized) {
            lastSerialized = serialized;
            window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: fetched }));
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
        callback(customEvent.detail);
      };
      
      window.addEventListener('firebase-mock-task-completed', handleUpdate);
      return () => {
        window.removeEventListener('firebase-mock-task-completed', handleUpdate);
      };
    }
  }
};
