import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TemaState {
  modoOscuro: boolean;
  toggleModo: () => void;
}

export const useTema = create<TemaState>()(
  persist(
    (set) => ({
      modoOscuro: false,
      toggleModo: () => set((state) => {
        const nuevoModo = !state.modoOscuro;
        if (nuevoModo) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { modoOscuro: nuevoModo };
      }),
    }),
    {
      name: 'tema-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.modoOscuro) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  )
);
