import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { cancelAllNotifications } from '@/utils/notificationScheduler';
import { useAuthStore } from './authStore';
import * as outbox from '@/sync/outbox';
import { flushOutbox } from '@/sync/syncEngine';

/** Settings are a single row server-side — one fixed outbox entity id. */
function syncSettings() {
  if (useAuthStore.getState().mode !== 'account') return;
  outbox.enqueue('settings', 'settings', 'upsert').then(() => flushOutbox()).catch(() => {});
}

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

function readBrowserPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

interface SettingsState extends AppSettings {
  /** Runtime browser notification permission — NOT persisted */
  notificationPermission: PermissionState;

  updateSettings: (partial: Partial<AppSettings>) => void;
  applyTheme: () => void;

  /** Sync the store's permission state with the current browser value */
  refreshPermissionState: () => void;

  /**
   * Trigger the browser permission dialog.
   * Returns the resulting permission state.
   */
  requestNotificationPermission: () => Promise<PermissionState>;

  /** Disable notifications and cancel all scheduled timers */
  disableNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      notificationPermission: readBrowserPermission(),

      updateSettings: (partial) => {
        set((s) => ({ ...s, ...partial }));
        get().applyTheme();
        syncSettings();
      },

      applyTheme: () => {
        const { theme } = get();
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      },

      refreshPermissionState: () => {
        set({ notificationPermission: readBrowserPermission() });
      },

      requestNotificationPermission: async () => {
        if (typeof Notification === 'undefined') {
          set({ notificationPermission: 'unsupported' });
          return 'unsupported';
        }
        const result = await Notification.requestPermission();
        const perm = result as PermissionState;
        set({ notificationPermission: perm });
        if (perm === 'granted') {
          set({ notificationsEnabled: true });
          syncSettings();
        }
        return perm;
      },

      disableNotifications: () => {
        set({ notificationsEnabled: false });
        cancelAllNotifications();
        syncSettings();
      },
    }),
    {
      name: 'quick-todo-settings',
      // notificationPermission is runtime-only — never persist it
      partialize: (s) => ({
        theme:                  s.theme,
        notificationsEnabled:   s.notificationsEnabled,
        defaultReminderOffset:  s.defaultReminderOffset,
        defaultPriority:        s.defaultPriority,
        showCompleted:          s.showCompleted,
        currency:               s.currency,
      }),
    }
  )
);
