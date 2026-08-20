import api from './api';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/Auth';

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', payload);

  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', payload);

  return data;
}

export async function logout(): Promise<void> {
  await api.post('/logout');
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/me');

  return data.user;
}
