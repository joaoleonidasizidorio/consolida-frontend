import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { UsersManagementView } from '../components/Admin/UsersManagementView';
import { userService } from '../services/userService';
import { User } from '../types/auth';

vi.mock('../services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

const mockAdminUser: User = {
  id: 'usr-admin-1',
  name: 'Admin Master',
  email: 'admin@consolida.com',
  roles: ['ADMIN'],
  status: 'ACTIVE',
};

const mockViewerUser: User = {
  id: 'usr-viewer-1',
  name: 'Visualizador',
  email: 'viewer@consolida.com',
  roles: ['VIEWER'],
  status: 'ACTIVE',
};

const sampleUsers: User[] = [
  mockAdminUser,
  {
    id: 'usr-fin-2',
    name: 'Carlos Financeiro',
    email: 'carlos@consolida.com',
    roles: ['FINANCE'],
    status: 'ACTIVE',
  },
  {
    id: 'usr-inact-3',
    name: 'Beatriz Inativa',
    email: 'beatriz@consolida.com',
    roles: ['VIEWER'],
    status: 'INACTIVE',
  },
];

describe('Gestão Administrativa de Usuários (SCRUM-12)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve bloquear acesso e exibir mensagem de restrição para usuários não administradores', () => {
    render(
      <AuthProvider initialUser={mockViewerUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    expect(screen.getByText('Acesso Restrito ao Administrador')).toBeInTheDocument();
    expect(
      screen.getByText(/A gestão de usuários e concessão de privilégios é exclusiva de Administradores/i)
    ).toBeInTheDocument();
  });

  it('deve listar usuários do sistema para o administrador', async () => {
    vi.mocked(userService.getUsers).mockResolvedValueOnce(sampleUsers);

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
      expect(screen.getByText('Carlos Financeiro')).toBeInTheDocument();
      expect(screen.getByText('Beatriz Inativa')).toBeInTheDocument();
    });
  });

  it('deve exibir senha provisória de uso único com botão de cópia após cadastro', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue(sampleUsers);
    vi.mocked(userService.createUser).mockResolvedValueOnce({
      user: {
        id: 'usr-new-4',
        name: 'Novo Funcionário',
        email: 'novo@consolida.com',
        roles: ['FINANCE'],
        status: 'ACTIVE',
      },
      provisionalPassword: 'TempPassword123#',
    });

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Novo Usuário')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Novo Usuário'));

    expect(screen.getByText('Cadastrar Novo Usuário')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Nome do usuário'), {
      target: { value: 'Novo Funcionário' },
    });
    fireEvent.change(screen.getByPlaceholderText('usuario@empresa.com'), {
      target: { value: 'novo@consolida.com' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar Usuário/i }));

    await waitFor(() => {
      expect(userService.createUser).toHaveBeenCalled();
      expect(screen.getByText('Usuário Cadastrado com Sucesso')).toBeInTheDocument();
      expect(screen.getByText('TempPassword123#')).toBeInTheDocument();
      expect(screen.getByText('Copiar')).toBeInTheDocument();
      expect(screen.getByText(/Esta senha provisória será exibida apenas esta vez/i)).toBeInTheDocument();
    });
  });

  it('deve bloquear a inativação do último administrador ativo com aviso explícito', async () => {
    // Apenas 1 administrador ativo na lista
    vi.mocked(userService.getUsers).mockResolvedValueOnce(sampleUsers);
    vi.mocked(userService.updateUserStatus).mockRejectedValueOnce(
      new Error('Operação não permitida: não é possível inativar o único Administrador ativo do sistema.')
    );

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    // Clica no botão Inativar da linha do Admin Master
    const inactivateButtons = screen.getAllByTitle('Inativar usuário');
    fireEvent.click(inactivateButtons[0]);

    expect(screen.getByText('Confirmar Inativação de Usuário')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar Inativação/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Operação não permitida: não é possível inativar o único Administrador ativo do sistema.')
      ).toBeInTheDocument();
    });
  });

  it('NÃO deve conter botão ou funcionalidade de exclusão física de usuários', async () => {
    vi.mocked(userService.getUsers).mockResolvedValueOnce(sampleUsers);

    render(
      <AuthProvider initialUser={mockAdminUser}>
        <UsersManagementView />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    // Verifica que "Excluir" ou "Remover" não existe na tabela nem no documento
    expect(screen.queryByText(/Excluir/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Remover/i)).not.toBeInTheDocument();
  });
});
