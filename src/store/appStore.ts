import { create } from "zustand";

export interface Patient {
  id: string;
  regNo: string;
  nationalId: string;
  name: string;
  phone: string;
  gender: "Male" | "Female";
  age: number;
  queueStatus: "WAITING" | "TRIAGE" | "CONSULTATION" | "LAB" | "PHARMACY" | "BILLING" | "COMPLETED";
  queueModuleId?: number;
  vitals?: {
    bp: string;
    temp: string;
    weight: string;
    pulse: string;
  };
  visitDate: string;
}

interface AppState {
  theme: "light" | "dark";
  facility: { id: string; name: string } | null;
  user: {
    name: string;
    role: string;
    email: string;
    facilityId?: string;
    tenantId?: string;
    moduleIds?: number[];
  } | null;
  facilitySettings: any | null;
  activeModuleCategory: string;
  toggleTheme: () => void;
  setFacility: (facility: any) => void;
  setFacilitySettings: (settings: any) => void;
  setUser: (user: any) => void;
  setActiveModuleCategory: (category: string) => void;
  primaryColor: string;
  activeLayout: "modern" | "classic";
  facilityLogo: string | null;
  setSettings: (settings: Partial<{ primaryColor: string; activeLayout: "modern" | "classic"; theme: "light" | "dark" }>) => void;
  setLogo: (logo: string | null) => void;
  
  // Clinical States
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  movePatient: (id: string, status: Patient["queueStatus"]) => void;
  removePatient: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "light",
  facility: { id: "1", name: "MediLink General Hospital" },
  facilitySettings: null,
  user: { name: "Dr. Almalick", role: "Super Admin", email: "admin@medilink.com" },
  activeModuleCategory: "All",
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === "light" ? "dark" : "light";
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    return { theme: newTheme };
  }),
  setFacility: (facility) => set({ facility }),
  setFacilitySettings: (facilitySettings) => set({ facilitySettings }),
  setUser: (user) => set({ user }),
  setActiveModuleCategory: (activeModuleCategory) => set({ activeModuleCategory }),
  primaryColor: "#3b82f6",
  activeLayout: "modern",
  facilityLogo: null,
  setSettings: (settings) => set((state) => ({ ...state, ...settings })),
  setLogo: (facilityLogo) => set({ facilityLogo }),

  patients: [],
  setPatients: (patients) => set({ patients }),
  addPatient: (patient) => set((state) => ({ patients: [...state.patients, patient] })),
  updatePatient: (id, updates) => set((state) => ({
    patients: state.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),
  movePatient: (id, status) => set((state) => ({
    patients: state.patients.map((p) => (p.id === id ? { ...p, queueStatus: status } : p)),
  })),
  removePatient: (id: string) => set((state) => ({
    patients: state.patients.filter((p) => p.id !== id),
  })),
}));
