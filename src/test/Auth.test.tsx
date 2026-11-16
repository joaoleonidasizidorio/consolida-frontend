import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { LoginView } from '../components/Auth/LoginView';
import { authService } from '../services/authService';
import { App } from '../App';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../services/systemService', () => ({
  getRootMessage: vi.fn().mockResolvedValue({ message: 'OK' }),
  getHealthCheck: vi.fn().mockResolvedValue({ data: { status: 'UP' }, latencyMs: 50 }),
}));

describe('Módulo de Autenticação e Sessão (SCRUM-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve alternar a visibilidade da senha entre oculta e visível', () => {
    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••••••');
    const toggleButton = screen.getByLabelText('Exibir senha');

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Ocultar senha')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Ocultar senha'));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('deve chamar o authService.login com as credenciais informadas', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce({
      success: true,
      token: 'jwt-token-123',
      user: {
        id: 'usr-1',
        name: 'Maria Analista',
        email: 'maria@empresa.com',
        roles: ['FINANCE'],
        status: 'ACTIVE',
      },
    });

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('seu.email@empresa.com'), {
      target: { value: 'maria@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'senha123456' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar no Consolida/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'maria@empresa.com',
        password: 'senha123456',
      });
    });
  });

  it('deve exibir "E-mail ou senha incorretos" para credenciais inválidas', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error('E-mail ou senha incorretos')
    );

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('seu.email@empresa.com'), {
      target: { value: 'errado@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'senhaerrada' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar no Consolida/i }));

    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de conta bloqueada informando tempo restante', async () => {
    vi.mocked(authService.login).mockRejectedValueOnce(
      new Error('Conta temporariamente bloqueada. Tente novamente em 5 minuto(s).')
    );

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('seu.email@empresa.com'), {
      target: { value: 'bloqueado@empresa.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••••••'), {
      target: { value: 'qualquer' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Entrar no Consolida/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Conta temporariamente bloqueada\. Tente novamente em 5 minuto\(s\)\./)
      ).toBeInTheDocument();
    });
  });

  it('deve forçar a alteração de senha quando o usuário possuir senha provisória', async () => {
    render(
      <App
        initialUser={{
          id: 'usr-prov-1',
          name: 'Novo Colaborador',
          email: 'novo@empresa.com',
          roles: ['VIEWER'],
          status: 'ACTIVE',
          requiresPasswordChange: true,
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alteração Obrigatória de Senha')).toBeInTheDocument();
      expect(
        screen.getByText(/Você está utilizando uma senha provisória/i)
      ).toBeInTheDocument();
    });
  });
});
