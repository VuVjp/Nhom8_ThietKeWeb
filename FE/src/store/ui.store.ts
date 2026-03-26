import { create } from 'zustand';

interface UiState {
    isDarkMode: boolean;
    toggleDarkMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
