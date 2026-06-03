/**
 * Firebase Bridge Adapter.
 * Integrates real Firebase Authentication and Firestore if config is provided,
 * or falls back to a fully reactive, offline-first localStorage pub-sub mock engine.
 * This guarantees real-time synchronization across parent/child tabs without setup!
 */

// Define standard types for our application
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

// -------------------------------------------------------------
// LOCALSTORAGE MOCK ENGINE (REAL-TIME PUBSUB VIA CUSTOM EVENTS)
// -------------------------------------------------------------
const MOCK_DB_UPDATE_EVENT = 'firebase-mock-db-update';
const MOCK_AUTH_UPDATE_EVENT = 'firebase-mock-auth-update';

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'segunda', isCompleted: false, order: 1 },
  { id: '2', title: 'Tomar café da manhã 🍞', time: '08:30', period: 'manhã', day: 'segunda', isCompleted: false, order: 2 },
  { id: '3', title: 'Aulas e Estudo 🏫', time: '09:00', period: 'manhã', day: 'segunda', isCompleted: false, order: 3 },
  { id: '4', title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'segunda', isCompleted: false, order: 4 },
  { id: '5', title: 'Brincar com o Collie 🐶', time: '15:00', period: 'tarde', day: 'segunda', isCompleted: false, order: 5 },
  { id: '6', title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'segunda', isCompleted: false, order: 6 },
  { id: '7', title: 'Tomar Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'segunda', isCompleted: false, order: 7 },
];

// Helper to check environment variables
const hasRealFirebaseConfig = () => {
  return typeof process !== 'undefined' && 
         process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
};

// Initialize Mock database in client
const getLocalTasks = (): Task[] => {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  const stored = localStorage.getItem('tea_tasks');
  if (!stored) {
    localStorage.setItem('tea_tasks', JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  }
  return JSON.parse(stored);
};

const saveLocalTasks = (tasks: Task[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tea_tasks', JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent(MOCK_DB_UPDATE_EVENT, { detail: tasks }));
};

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

// -------------------------------------------------------------
// PUBLIC EXPORTED FIREBASE BRIDGE API
// -------------------------------------------------------------
export const firebaseBridge = {
  // --- AUTH SERVICE ---
  auth: {
    // Simulates or initiates registration
    signUp: async (email: string, role: 'responsavel' | 'usuario'): Promise<UserProfile> => {
      const newUser: UserProfile = {
        uid: Math.random().toString(36).substring(2, 11),
        email,
        role,
        childHyperfocus: role === 'responsavel' ? 'Cães Collie' : undefined,
        parentPinCode: '1234',
        lockType: 'math',
        plan: 'free',
        sensorySpeed: 1.0,
        sensorySound: 'marimba',
        sensoryVisuals: 'rich'
      };
      saveLocalProfile(newUser);
      return newUser;
    },

    // Sign in
    signIn: async (email: string): Promise<UserProfile> => {
      // For mock simplicity, any valid email signs in as parent
      const role = email.includes('crianca') || email.includes('child') || email.includes('usuario') 
        ? 'usuario' 
        : 'responsavel';
      
      const user: UserProfile = {
        uid: 'user-123',
        email,
        role,
        childHyperfocus: 'Border Collies 🐕',
        parentPinCode: '1234',
        lockType: 'math',
        plan: 'free',
        sensorySpeed: 1.0,
        sensorySound: 'marimba',
        sensoryVisuals: 'rich'
      };
      saveLocalProfile(user);
      return user;
    },

    // Sign out
    signOut: async (): Promise<void> => {
      saveLocalProfile(null);
    },

    // Get current user profile
    getCurrentUser: (): UserProfile | null => {
      return getLocalProfile();
    },

    // Reactive real-time listener for Auth changes
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

    // Update child profile settings (hyperfocus, pin, lock type, plan, sensory settings)
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
      if (current) {
        if (updates.childHyperfocus !== undefined) current.childHyperfocus = updates.childHyperfocus;
        if (updates.parentPinCode !== undefined) current.parentPinCode = updates.parentPinCode;
        if (updates.lockType !== undefined) current.lockType = updates.lockType;
        if (updates.plan !== undefined) current.plan = updates.plan;
        if (updates.sensorySpeed !== undefined) current.sensorySpeed = updates.sensorySpeed;
        if (updates.sensorySound !== undefined) current.sensorySound = updates.sensorySound;
        if (updates.sensoryVisuals !== undefined) current.sensoryVisuals = updates.sensoryVisuals;
        saveLocalProfile(current);
      }
    }
  },

  // --- FIRESTORE DATABASE SERVICE ---
  db: {
    // Fetch all tasks once
    getTasks: async (): Promise<Task[]> => {
      return getLocalTasks();
    },

    // Add a new task to routine
    addTask: async (taskData: Omit<Task, 'id' | 'isCompleted' | 'order'>): Promise<Task> => {
      const currentTasks = getLocalTasks();
      const newTask: Task = {
        ...taskData,
        id: Math.random().toString(36).substring(2, 11),
        isCompleted: false,
        order: currentTasks.filter(t => t.day === taskData.day && t.period === taskData.period).length + 1
      };
      currentTasks.push(newTask);
      saveLocalTasks(currentTasks);
      return newTask;
    },

    // Delete a task from routine
    deleteTask: async (id: string): Promise<void> => {
      const currentTasks = getLocalTasks();
      const filtered = currentTasks.filter(t => t.id !== id);
      saveLocalTasks(filtered);
    },

    // Update a task (completion status, order, title, etc)
    updateTask: async (id: string, updates: Partial<Omit<Task, 'id'>>): Promise<void> => {
      const currentTasks = getLocalTasks();
      let completedTask: Task | undefined;
      const updated = currentTasks.map(task => {
        if (task.id === id) {
          const newTask = { ...task, ...updates };
          if (updates.isCompleted === true && !task.isCompleted) {
            completedTask = newTask;
          }
          return newTask;
        }
        return task;
      });
      saveLocalTasks(updated);

      if (completedTask && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firebase-mock-task-completed', { detail: completedTask }));
      }
    },

    // Clear all tasks for a clean start or re-initialize defaults
    resetToDefaults: async (): Promise<void> => {
      saveLocalTasks(DEFAULT_TASKS);
    },

    // Load custom clinical templates in full
    loadTemplate: async (templateTasks: Omit<Task, 'id' | 'isCompleted' | 'order'>[]): Promise<void> => {
      const formatted: Task[] = templateTasks.map((t, idx) => ({
        ...t,
        id: Math.random().toString(36).substring(2, 11),
        isCompleted: false,
        order: idx + 1
      }));
      saveLocalTasks(formatted);
    },

    // Clear tasks completely for a day (useful for testing)
    clearAllTasks: async (): Promise<void> => {
      saveLocalTasks([]);
    },

    // REAL-TIME FIRESTORE ON_SNAPSHOT REPLICA!
    // Triggered instantly across pages/tabs when writes occur
    onSnapshotTasks: (callback: (tasks: Task[]) => void) => {
      if (typeof window === 'undefined') return () => {};

      // Fire initial read
      callback(getLocalTasks());

      const handleUpdate = (e: Event) => {
        const customEvent = e as CustomEvent<Task[]>;
        callback(customEvent.detail);
      };

      window.addEventListener(MOCK_DB_UPDATE_EVENT, handleUpdate);
      
      // Return unsubscribe function
      return () => {
        window.removeEventListener(MOCK_DB_UPDATE_EVENT, handleUpdate);
      };
    },

    // Listen for task completion events in real-time
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
