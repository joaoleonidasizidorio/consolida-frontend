/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Serviço de Autenticação Real - Consolida Frontend
 * Em conformidade com SCRUM-12 e SCRUM-10.
 */

import { request, setAuthToken } from './apiClient';
import {
  LoginCredentials,
  LoginResult,
  User,
  ChangePasswordPayload,
} from '../types/auth';

export const authService = {
  /**
   * Autentica o usuário com email e senha.
   * Não grava senhas em texto puro nem em logs.
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const response = await request<LoginResult>('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (response.token) {
        setAuthToken(response.token);
      }

      return response;
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          'BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint POST /api/v1/auth/login não foi encontrado no backend (HTTP 404). Aguardando implantação pelo Back End.'
        );
      }
      if (err.status === 401) {
        throw new Error('E-mail ou senha incorretos');
      }
      if (err.status === 429 || err.status === 423) {
        const seconds = err.data?.lockoutRemainingSeconds || 300;
        const minutes = Math.ceil(seconds / 60);
        throw new Error(`Conta temporariamente bloqueada. Tente novamente em ${minutes} minuto(s).`);
      }
      throw err;
    }
  },

  /**
   * Obtém os dados do usuário autenticado a partir do token de sessão.
   */
  async getMe(): Promise<User> {
    try {
      return await request<User>('/api/v1/auth/me', {
        method: 'GET',
      });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          'BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint GET /api/v1/auth/me não foi encontrado no backend (HTTP 404).'
        );
      }
      throw err;
    }
  },

  /**
   * Realiza a alteração de senha (obrigatória para senha provisória ou voluntária).
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean; message?: string }> {
    try {
      return await request<{ success: boolean; message?: string }>('/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          'BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint POST /api/v1/auth/change-password não foi encontrado no backend (HTTP 404).'
        );
      }
      if (err.status === 400 || err.status === 422) {
        throw new Error(err.message || 'A nova senha não atende aos requisitos mínimos de segurança.');
      }
      if (err.status === 401) {
        throw new Error('Senha atual incorreta.');
      }
      throw err;
    }
  },

  /**
   * Encerra a sessão ativa.
   */
  async logout(): Promise<void> {
    try {
      await request('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Falha no logout remoto não impede limpeza local do token
    } finally {
      setAuthToken(null);
    }
  },
};
