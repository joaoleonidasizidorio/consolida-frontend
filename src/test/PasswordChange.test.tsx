import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { ChangePasswordModal } from '../components/Auth/ChangePasswordModal';
import { authService } from '../services/authService';

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    changePassword: vi.fn(),
  },
}));

describe('Módulo de Alteração de Senha (SCRUM-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve validar requisitos de mínimo de 10 caracteres e igualdade antes de habilitar o salvamento', () => {
    render(
      <AuthProvider
        initialUser={{
          id: 'u1',
          name: 'Teste',
          email: 't@t.com',
          roles: ['FINANCE'],
          status: 'ACTIVE',
        }}
      >
        <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /Atualizar Senha/i });
    expect(submitBtn).toBeDisabled();

    // Informa senha atual e nova senha menor que 10 caracteres (ex: "12345")
    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'senhaAtual123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 10 caracteres'), {
      target: { value: 'curta' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'curta' },
    });

    expect(submitBtn).toBeDisabled();

    // Altera para senha com >= 10 caracteres mas divergente da confirmação
    fireEvent.change(screen.getByPlaceholderText('Mínimo 10 caracteres'), {
      target: { value: 'NovaSenhaSegura123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'Divergente123456' },
    });

    expect(
      screen.getByText('As senhas informadas não coincidem.')
    ).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Corrige confirmação para ser idêntica
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'NovaSenhaSegura123' },
    });

    expect(submitBtn).not.toBeDisabled();
  });

  it('deve chamar o authService.changePassword e exibir sucesso após envio válido', async () => {
    vi.mocked(authService.changePassword).mockResolvedValueOnce({
      success: true,
      message: 'Senha atualizada com sucesso!',
    });

    const onCloseMock = vi.fn();

    render(
      <AuthProvider
        initialUser={{
          id: 'u1',
          name: 'Teste',
          email: 't@t.com',
          roles: ['FINANCE'],
          status: 'ACTIVE',
        }}
      >
        <ChangePasswordModal isOpen={true} onClose={onCloseMock} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText('Informe sua senha atual'), {
      target: { value: 'senhaAtual123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Mínimo 10 caracteres'), {
      target: { value: 'NovaSenhaForte10!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repita a nova senha'), {
      target: { value: 'NovaSenhaForte10!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Atualizar Senha/i }));

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'senhaAtual123',
        newPassword: 'NovaSenhaForte10!',
        confirmPassword: 'NovaSenhaForte10!',
      });
      expect(screen.getByText('Senha atualizada com sucesso!')).toBeInTheDocument();
    });
  });
});
