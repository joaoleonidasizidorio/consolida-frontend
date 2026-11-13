import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '../App';
import * as systemService from '../services/systemService';

vi.mock('../services/systemService', () => ({
  getRootMessage: vi.fn(),
  getHealthCheck: vi.fn(),
}));

describe('Consolida Frontend - Base de Produção', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o cabeçalho com o nome Consolida e status inicial', async () => {
    vi.mocked(systemService.getRootMessage).mockResolvedValueOnce({
      message: 'Hello World - Consolida',
    });
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: { status: 'UP', groups: ['liveness', 'readiness'] },
      latencyMs: 85,
      checkedAt: '12:00:00',
    });

    render(<App />);

    expect(screen.getAllByText(/Consolida/)[0]).toBeInTheDocument();
    expect(screen.getByText('Produção FE')).toBeInTheDocument();
    expect(screen.getByText('Gestão Financeira Multinegócio')).toBeInTheDocument();
  });

  it('deve exibir a mensagem recebida de GET / da API com sucesso', async () => {
    vi.mocked(systemService.getRootMessage).mockResolvedValueOnce({
      message: 'Hello World - Consolida',
    });
    vi.mocked(systemService.getHealthCheck).mockResolvedValueOnce({
      data: { status: 'UP', groups: ['liveness', 'readiness'] },
      latencyMs: 90,
      checkedAt: '12:00:00',
    });

    render(<App />);

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

    render(<App />);

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

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao consultar GET \//)).toBeInTheDocument();
      expect(screen.getByText(/Servidor Indisponível ou com Falha/)).toBeInTheDocument();
    });
  });
});
