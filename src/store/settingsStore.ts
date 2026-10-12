import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  sound: boolean;
  vibration: boolean;
  setSound: (on: boolean) => void;
  setVibration: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      sound: true,
      vibration: true,
      setSound: (sound) => set({ sound }),
      setVibration: (vibration) => set({ vibration }),
    }),
    { name: 'blindr-settings', version: 1 }
  )
);
