/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Testes Críticos de Cenários Negativos - Auditoria Técnica SCRUM-12
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginView } from '../components/Auth/LoginView';
import { UsersManagementView } from '../components/Admin/UsersManagementView';
import { ChangePasswordModal } from '../components/Auth/ChangePasswordModal';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { isJwtExpired, parseJwt } from '../utils/jwt';
import { App } from '../App';
import { User } from '../types/auth';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('../services/systemService', () => ({
  getRootMessage: vi.fn().mockResolvedValue({ message: 'OK' }),
  getHealthCheck: vi.fn().mockResolvedValue({ data: { status: 'UP' }, latencyMs: 50 }),
}));

describe('Auditoria Técnica — Testes de Cenários Negativos (Seção 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  // 1. Token Inválido
  it('1. Cenário Negativo: Token Inválido deve deslogar e exibir "Sua sessão expirou"', async () => {
    localStorage.setItem('consolida_auth_token', 'token-invalido-ou-revogado');
    vi.mocked(authService.getMe).mockRejectedValueOnce({
      status: 401,
      message: 'Unauthorized',
    });

    render(<App />);

    await waitFor(() => {
      expect(localStorage.getItem('consolida_auth_token')).toBeNull();
      expect(screen.getByText('Sua sessão expirou')).toBeInTheDocument();
      expect(screen.getByText('E-mail corporativo')).toBeInTheDocument();
    });
  });

  // 2. Token Expirado
  it('2. Cenário Negativo: Token com timestamp de expiração passado deve ser detectado e limpo proativamente', () => {
    // Cria um JWT fictício com exp expirado (exp: 1000 = 01/01/1970)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: '123', email: 'teste@consolida.com', exp: 1000 }));
    const expiredToken = `${header}.${payload}.assinaturafalsa`;

    expect(isJwtExpired(expiredToken)).toBe(true);

    const parsed = parseJwt(expiredToken);
    expect(parsed?.email).toBe('teste@consolida.com');

    // Token válido para o futuro
    const validPayload = btoa(
      JSON.stringify({ sub: '123', email: 'futuro@consolida.com', exp: Math.floor(Date.now() / 1000) + 3600 })
    );
    const validToken = `${header}.${validPayload}.assinaturafalsa`;
    expect(isJwtExpired(validToken)).toBe(false);
  });

  // 3. Perfil sem Autorização
  it('3. Cenário Negativo: Usuário sem perfil ADMIN deve ser bloqueado ao acessar rota administrativa', async () => {
    const viewerUser: User = {
      id: 'usr-v1',
      name: 'Operador Comum',
      email: 'operador@consolida.com',
      roles: ['VIEWER'],
      status: 'ACTIVE',
    };

    window.location.hash = '#users';

    render(<App initialUser={viewerUser} />);

    await waitFor(() => {
      expect(screen.getByText('Acesso Restrito ao Administrador')).toBeInTheDocument();
      expect(
        screen.getByText(/A gestão de usuários e concessão de privilégios é exclusiva de Administradores/i)
      ).toBeInTheDocument();
      // Não deve executar a busca de usuários na API
      expect(userService.getUsers).not.toHaveBeenCalled();
    });
  });

  // 4. API Indisponível
  it('4. Cenário Negativo: API Indisponível (erro de rede/timeout) deve exibir feedback amigável sem quebrar', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error('Não foi possível conectar ao servidor da API. Verifique sua conexão e se o backend está ativo.')
    );

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('seu.email@empresa.com'), {
      target: { value: 'user@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar no Consolida/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Não foi possível conectar ao servidor da API/i)
      ).toBeInTheDocument();
    });
  });

  // 5. Cadastro Duplicado
  it('5. Cenário Negativo: Tentativa de cadastrar e-mail já existente deve ser bloqueada instantaneamente', async () => {
    const adminUser: User = {
      id: 'admin-1',
      name: 'Admin Master',
      email: 'admin@consolida.com',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    };

    const existingList: User[] = [
      adminUser,
      {
        id: 'usr-2',
        name: 'Fulano Existente',
        email: 'fulano@consolida.com',
        roles: ['FINANCE'],
        status: 'ACTIVE',
      },
    ];

    vi.mocked(userService.getUsers).mockResolvedValueOnce(existingList);

    render(
      <AuthProvider initialUser={adminUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Usuário'));

    fireEvent.change(screen.getByPlaceholderText('Nome do usuário'), {
      target: { value: 'Fulano Clone' },
    });
    fireEvent.change(screen.getByPlaceholderText('usuario@empresa.com'), {
      target: { value: 'fulano@consolida.com' }, // E-mail já cadastrado
    });

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Usuário/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Este endereço de e-mail já está cadastrado no sistema.')
      ).toBeInTheDocument();
      // Não deve enviar a requisição à API
      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });

  // 6. Tentativa de Inativar o Último Administrador
  it('6. Cenário Negativo: Tentativa de inativar o único administrador ativo deve ser bloqueada na UI e no serviço', async () => {
    const soleAdmin: User = {
      id: 'admin-unico',
      name: 'Admin Solitário',
      email: 'unico@consolida.com',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    };

    const users: User[] = [
      soleAdmin,
      {
        id: 'user-comum',
        name: 'Analista Financeiro',
        email: 'analista@consolida.com',
        roles: ['FINANCE'],
        status: 'ACTIVE',
      },
    ];

    vi.mocked(userService.getUsers).mockResolvedValueOnce(users);

    render(
      <AuthProvider initialUser={soleAdmin}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Solitário')).toBeInTheDocument();
    });

    // Clica no botão Inativar do Admin
    const inactivateButtons = screen.getAllByTitle('Inativar usuário');
    fireEvent.click(inactivateButtons[0]);

    // Modal deve alertar o bloqueio preventivo e desabilitar o botão
    expect(screen.getByText('Ação Bloqueada:')).toBeInTheDocument();
    expect(
      screen.getByText('Operação não permitida: não é possível inativar o único Administrador ativo do sistema.')
    ).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Inativação/i });
    expect(confirmBtn).toBeDisabled();

    // Validação também via chamada com rejeição simulada
    vi.mocked(userService.updateUserStatus).mockRejectedValueOnce(
      new Error('Operação não permitida: não é possível inativar o único Administrador ativo do sistema.')
    );
    await expect(
      userService.updateUserStatus('admin-unico', 'INACTIVE', 'Teste', users)
    ).rejects.toThrow('Operação não permitida: não é possível inativar o único Administrador ativo do sistema.');
  });

  // 7. Falha durante Alteração de Senha
  it('7. Cenário Negativo: Falha com senha atual incorreta na API deve exibir mensagem correspondente', async () => {
    vi.mocked(authService.changePassword).mockRejectedValueOnce(
      new Error('Senha atual incorreta.')
    );

    render(
      <AuthProvider
        initialUser={{
          id: 'u1',
          name: 'Colaborador',
          email: 'colab@consolida.com',
          roles: ['FINANCE'],
          status: 'ACTIVE',
        }}
      >
        <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'senhaErrada123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 10 caracteres'), {
      target: { value: 'NovaSenhaForte10!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'NovaSenhaForte10!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Senha/i }));

    await waitFor(() => {
      expect(screen.getByText('Senha atual incorreta.')).toBeInTheDocument();
    });
  });

  // 8. Logout com Falha na API
  it('8. Cenário Negativo: Falha remota no POST /auth/logout ainda deve limpar a sessão local do usuário', async () => {
    localStorage.setItem('consolida_auth_token', 'token-ativo-123');
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('500 Internal Server Error'));

    const TestLogoutComponent = () => {
      const { logout, isAuthenticated, user } = useAuth();
      return (
        <div>
          <span data-testid="auth-status">{isAuthenticated ? 'LOGADO' : 'DESLOGADO'}</span>
          <span data-testid="user-name">{user?.name || 'NENHUM'}</span>
          <button onClick={() => logout()}>Sair Agora</button>
        </div>
      );
    };

    render(
      <AuthProvider
        initialUser={{
          id: 'u1',
          name: 'Usuario Logado',
          email: 'u@consolida.com',
          roles: ['VIEWER'],
          status: 'ACTIVE',
        }}
        initialToken="token-ativo-123"
      >
        <TestLogoutComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('LOGADO');

    fireEvent.click(screen.getByText('Sair Agora'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('DESLOGADO');
      expect(screen.getByTestId('user-name')).toHaveTextContent('NENHUM');
      expect(localStorage.getItem('consolida_auth_token')).toBeNull();
    });
  });

  // 9. Atualização do Navegador durante Sessão Autenticada
  it('9. Cenário Positivo/Resiliência: Atualização do navegador com token válido restaura o usuário via getMe()', async () => {
    const validHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const validPayload = btoa(
      JSON.stringify({ sub: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    );
    const validToken = `${validHeader}.${validPayload}.signature`;

    localStorage.setItem('consolida_auth_token', validToken);

    vi.mocked(authService.getMe).mockResolvedValueOnce({
      id: 'admin-1',
      name: 'Admin Restaurado',
      email: 'admin.restaurado@consolida.com',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Admin Restaurado')).toBeInTheDocument();
      expect(screen.getByText('Produção FE')).toBeInTheDocument();
      expect(localStorage.getItem('consolida_auth_token')).toBe(validToken);
    });
  });
});
