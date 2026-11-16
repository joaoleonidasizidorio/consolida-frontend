import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
import * as systemService from '../services/systemService';
import { User } from '../types/auth';

vi.mock('../services/systemService', () => ({
  getRootMessage: vi.fn(),
  getHealthCheck: vi.fn(),
}));

const mockAdminUser: User = {
  id: 'usr-admin-1',
  name: 'Administrador Oficial',
  email: 'admin@consolida.com',
  roles: ['ADMIN'],
  status: 'ACTIVE',
};

describe('Consolida Frontend - Base de Produção & Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a tela de login quando o usuário não estiver autenticado', async () => {
    render(<App />);

    expect(screen.getAllByText(/Consolida/)[0]).toBeInTheDocument();
    expect(screen.getByText('E-mail corporativo')).toBeInTheDocument();
    expect(screen.getByText('Senha de acesso')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no Consolida/i })).toBeInTheDocument();
  });

  it('deve renderizar o cabeçalho e dashboard quando autenticado', async () => {
    vi.mocked(systemService.getRootMessage).mockResolvedValueOnce({
      message: 'Hello World - Consolida',
    });
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: { status: 'UP', groups: ['liveness', 'readiness'] },
      latencyMs: 85,
      checkedAt: '12:00:00',
    });

    render(<App initialUser={mockAdminUser} />);

    expect(screen.getAllByText(/Consolida/)[0]).toBeInTheDocument();
    expect(screen.getByText('Produção FE')).toBeInTheDocument();
    expect(screen.getByText('Administrador Oficial')).toBeInTheDocument();
  });

  it('deve exibir a mensagem recebida de GET / da API com sucesso no dashboard autenticado', async () => {
    vi.mocked(systemService.getRootMessage).mockResolvedValueOnce({
      message: 'Hello World - Consolida',
    });
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: { status: 'UP', groups: ['liveness', 'readiness'] },
      latencyMs: 90,
      checkedAt: '12:00:00',
    });

    render(<App initialUser={mockAdminUser} />);

    await waitFor(() => {
      expect(screen.getByText('Hello World - Consolida')).toBeInTheDocument();
    });
  });

  it('deve exibir o status UP do Spring Boot Actuator e latência', async () => {
    vi.mocked(systemService.getRootMessage).mockResolvedValueOnce({
      message: 'Hello World - Consolida',
    });
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: { status: 'UP', groups: ['liveness', 'readiness'] },
      latencyMs: 45,
      checkedAt: '12:00:00',
    });

    render(<App initialUser={mockAdminUser} />);

    await waitFor(() => {
      expect(screen.getByText('UP')).toBeInTheDocument();
      expect(screen.getByText(/45 ms/)).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem amigável e sem tela branca quando a API falhar', async () => {
    vi.mocked(systemService.getRootMessage).mockRejectedValueOnce(
      new Error('Não foi possível conectar ao servidor da API.')
    );
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: null,
      latencyMs: 120,
      checkedAt: '12:00:00',
      error: 'Servidor indisponível ou fora do ar.',
    });

    render(<App initialUser={mockAdminUser} />);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao consultar GET \//)).toBeInTheDocument();
      expect(screen.getByText(/Servidor Indisponível ou com Falha/)).toBeInTheDocument();
    });
  });
});
