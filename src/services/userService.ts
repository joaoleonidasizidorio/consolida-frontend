/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Serviço de Gerenciamento de Usuários (Administração) - Consolida Frontend
 * Em conformidade com SCRUM-12 e SCRUM-10.
 */

import { request } from './apiClient';
import {
  User,
  UserStatus,
  CreateUserPayload,
  CreateUserResponse,
} from '../types/auth';

export const userService = {
  /**
   * Lista todos os usuários do sistema.
   * Apenas administradores têm autorização.
   */
  async getUsers(): Promise<User[]> {
    try {
      return await request<User[]>('/api/v1/users', {
        method: 'GET',
      });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          'BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint GET /api/v1/users não foi encontrado no backend (HTTP 404). Aguardando implantação pelo Back End.'
        );
      }
      if (err.status === 403) {
        throw new Error('Acesso negado: apenas administradores podem visualizar a lista de usuários.');
      }
      throw err;
    }
  },

  /**
   * Cadastra um novo usuário e retorna a senha provisória de uso único gerada pela API.
   */
  async createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
    if (!payload.name?.trim()) {
      throw new Error('O nome do usuário é obrigatório.');
    }
    if (!payload.email?.trim() || !payload.email.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }
    if (!payload.roles || payload.roles.length === 0) {
      throw new Error('O usuário precisa possuir pelo menos um perfil associado.');
    }

    try {
      return await request<CreateUserResponse>('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          'BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint POST /api/v1/users não foi encontrado no backend (HTTP 404).'
        );
      }
      if (err.status === 409) {
        throw new Error('Este endereço de e-mail já está cadastrado no sistema.');
      }
      if (err.status === 403) {
        throw new Error('Acesso negado: apenas administradores podem cadastrar usuários.');
      }
      throw err;
    }
  },

  /**
   * Altera a situação de um usuário (ex: ACTIVE, INACTIVE, BLOCKED).
   * Contém proteção mandatória contra inativação do último administrador.
   */
  async updateUserStatus(
    userId: string,
    newStatus: UserStatus,
    reason?: string,
    existingUsers: User[] = []
  ): Promise<User> {
    // Validação de segurança: Proteção do último administrador
    if (newStatus === 'INACTIVE' || newStatus === 'BLOCKED') {
      const targetUser = existingUsers.find((u) => u.id === userId);
      const isTargetAdmin = targetUser?.roles?.includes('ADMIN');

      if (isTargetAdmin) {
        const activeAdmins = existingUsers.filter(
          (u) => u.roles?.includes('ADMIN') && u.status === 'ACTIVE'
        );

        if (activeAdmins.length <= 1 && activeAdmins.some((a) => a.id === userId)) {
          throw new Error(
            'Operação não permitida: não é possível inativar o único Administrador ativo do sistema.'
          );
        }
      }
    }

    try {
      return await request<User>(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
      });
    } catch (err: any) {
      if (err.status === 404) {
        throw new Error(
          `BLOQUEADO POR DEPENDÊNCIA DA API: O endpoint PATCH /api/v1/users/${userId}/status não foi encontrado no backend (HTTP 404).`
        );
      }
      if (err.status === 403) {
        throw new Error('Acesso negado: você não tem permissão para alterar o status deste usuário.');
      }
      throw err;
    }
  },
};
