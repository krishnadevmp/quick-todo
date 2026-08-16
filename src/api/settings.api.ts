import { apiFetch } from './client';
import type { AppSettings } from '@/types';

export function getSettings(): Promise<AppSettings> {
  return apiFetch('/settings');
}

export function updateSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
  return apiFetch('/settings', { method: 'PATCH', body: changes });
}
