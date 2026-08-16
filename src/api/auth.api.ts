import { apiFetch } from './client';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

export function signup(name: string, email: string, password: string): Promise<AuthResult> {
  return apiFetch('/auth/signup', { method: 'POST', body: { name, email, password } });
}

export function login(email: string, password: string): Promise<AuthResult> {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export function me(): Promise<{ user: PublicUser }> {
  return apiFetch('/auth/me');
}

export function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  return apiFetch('/auth/password', { method: 'PATCH', body: { currentPassword, newPassword } });
}
