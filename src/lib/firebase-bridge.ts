export interface Task {
  id: string;
  title: string;
  time: string; // "HH:MM"
  period: 'manhã' | 'tarde' | 'noite';
  day: string; // "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo"
  isCompleted: boolean;
  order: number;
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
    signUp: async (email: string, role: 'responsavel' | 'usuario'): Promise<UserProfile> => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      saveLocalProfile(data);
      return data;
    },

    signIn: async (email: string): Promise<UserProfile> => {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      saveLocalProfile(data);
      return data;
    },

    signOut: async (): Promise<void> => {
      saveLocalProfile(null);
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
    }
  },

  // --- FIRESTORE DATABASE SERVICE ---
  db: {
    getTasks: async (): Promise<Task[]> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';

      const res = await fetch('/api/tasks', {
        headers: { 'x-user-uid': userUid }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    },

    addTask: async (taskData: Omit<Task, 'id' | 'isCompleted' | 'order'>): Promise<Task> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userUid
        },
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

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userUid
        },
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

      const DEFAULT_TASKS = [
        { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'segunda' },
        { title: 'Tomar café da manhã 🍞', time: '08:30', period: 'manhã', day: 'segunda' },
        { title: 'Aulas e Estudo 🏫', time: '09:00', period: 'manhã', day: 'segunda' },
        { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'segunda' },
        { title: 'Brincar com o Collie 🐶', time: '15:00', period: 'tarde', day: 'segunda' },
        { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'segunda' },
        { title: 'Tomar Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'segunda' },
      ];

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userUid
        },
        body: JSON.stringify({ overwrite: true, tasks: DEFAULT_TASKS })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: data }));
    },

    loadTemplate: async (templateTasks: Omit<Task, 'id' | 'isCompleted' | 'order'>[]): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userUid
        },
        body: JSON.stringify({ overwrite: true, tasks: templateTasks })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: data }));
    },

    clearAllTasks: async (): Promise<void> => {
      const current = getLocalProfile();
      const userUid = current?.uid || 'user-123';

      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-uid': userUid
        },
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
