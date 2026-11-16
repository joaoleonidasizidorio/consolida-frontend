/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Modelos e Tipos de Autenticação e Usuários - Consolida Frontend
 * Em estrita conformidade com SCRUM-12 e SCRUM-10.
 */

export type UserRole = 'ADMIN' | 'FINANCE' | 'VIEWER' | 'MANAGER' | 'OPERATOR' | 'CUSTOM';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED' | 'INACTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  status: UserStatus;
  allowedCompanyIds?: string[];
  requiresPasswordChange?: boolean; // Flag para forçar alteração de senha provisória
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: User;
  requiresPasswordChange?: boolean;
  message?: string;
  lockoutRemainingSeconds?: number;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone?: string;
  roles: string[];
}

export interface CreateUserResponse {
  user: User;
  provisionalPassword?: string; // Exibida apenas uma vez
  message?: string;
}
