import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

interface SettingsState extends AppSettings {
  updateSettings: (partial: Partial<AppSettings>) => void;
  applyTheme: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (partial) => {
        set((s) => ({ ...s, ...partial }));
        // Re-apply theme whenever it changes
        get().applyTheme();
      },

      applyTheme: () => {
        const { theme } = get();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      },
    }),
    {
      name: 'quick-todo-settings',
      // Only persist the settings fields, not the actions
      partialize: (s) => ({
        theme: s.theme,
        notificationsEnabled: s.notificationsEnabled,
        defaultReminderOffset: s.defaultReminderOffset,
        defaultPriority: s.defaultPriority,
        showCompleted: s.showCompleted,
      }),
    }
  )
);
