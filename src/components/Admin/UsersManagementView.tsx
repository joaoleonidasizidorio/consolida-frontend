/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gestão Administrativa de Usuários - Consolida Frontend
 * Em conformidade com SCRUM-12 (listagem, cadastro com senha provisória única,
 * inativação/reativação, proteção do último admin e ausência de exclusão).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User, UserStatus, CreateUserPayload } from '../../types/auth';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  Ban,
  Copy,
  Check,
  AlertTriangle,
  X,
  Lock,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

const AVAILABLE_ROLES = [
  { id: 'ADMIN', name: 'Administrador', desc: 'Acesso irrestrito a configurações e módulos' },
  { id: 'FINANCE', name: 'Financeiro', desc: 'Gestão de lançamentos, fechamentos e contas' },
  { id: 'MANAGER', name: 'Gestor', desc: 'Aprovação de transferências e visualização gerencial' },
  { id: 'VIEWER', name: 'Visualizador', desc: 'Apenas consulta a relatórios e dashboards' },
];

export const UsersManagementView: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal de Criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoles, setFormRoles] = useState<string[]>(['FINANCE']);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Modal de Exibição Única da Senha Provisória
  const [provisionalPasswordModal, setProvisionalPasswordModal] = useState<{
    user: User;
    provisionalPassword: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Modal de Confirmação de Mudança de Situação (Inativar / Reativar)
  const [statusActionModal, setStatusActionModal] = useState<{
    user: User;
    targetStatus: UserStatus;
    reason: string;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await userService.getUsers();
      setUsersList(data);
    } catch (err: any) {
      setApiError(err.message || 'Falha ao carregar lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Se não for administrador, barra o acesso conforme SCRUM-12 (RF01 / RBAC)
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-1" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Acesso Restrito ao Administrador</h2>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              Você está autenticado com o perfil <strong>{currentUser?.roles?.join(', ')}</strong>. A gestão de
              usuários e concessão de privilégios é exclusiva de Administradores (ADMIN).
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Filtragem dos usuários
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || (u.roles && u.roles.includes(roleFilter));

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [usersList, searchTerm, statusFilter, roleFilter]);

  // Métricas
  const stats = useMemo(() => {
    return {
      total: usersList.length,
      active: usersList.filter((u) => u.status === 'ACTIVE').length,
      inactive: usersList.filter((u) => u.status === 'INACTIVE').length,
      blocked: usersList.filter((u) => u.status === 'BLOCKED').length,
      pending: usersList.filter((u) => u.status === 'PENDING').length,
    };
  }, [usersList]);

  // Contagem de administradores ativos para prevenção de inativação
  const activeAdminsCount = useMemo(() => {
    return usersList.filter((u) => u.roles?.includes('ADMIN') && u.status === 'ACTIVE').length;
  }, [usersList]);

  // Proteção contra perda de dados em formulário não salvo ao recarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCreateModalOpen && (formName.trim() || formEmail.trim())) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCreateModalOpen, formName, formEmail]);

  // Submissão do Cadastro
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Informe o nome do usuário.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Informe um e-mail corporativo válido.');
      return;
    }
    if (usersList.some((u) => u.email.toLowerCase() === formEmail.trim().toLowerCase())) {
      setFormError('Este endereço de e-mail já está cadastrado no sistema.');
      return;
    }
    if (formRoles.length === 0) {
      setFormError('Selecione pelo menos um perfil de acesso.');
      return;
    }

    setIsSubmittingUser(true);

    try {
      const payload: CreateUserPayload = {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim() || undefined,
        roles: formRoles,
      };

      const result = await userService.createUser(payload);

      // Fecha o formulário
      setIsCreateModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormRoles(['FINANCE']);

      // Se a API gerou senha provisória, abre o modal de exibição única
      if (result.provisionalPassword) {
        setProvisionalPasswordModal({
          user: result.user,
          provisionalPassword: result.provisionalPassword,
        });
      }

      await fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao cadastrar usuário.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Executa Inativação / Reativação
  const handleConfirmStatusChange = async () => {
    if (!statusActionModal) return;
    setActionError(null);
    setIsUpdatingStatus(true);

    try {
      await userService.updateUserStatus(
        statusActionModal.user.id,
        statusActionModal.targetStatus,
        statusActionModal.reason,
        usersList
      );
      setStatusActionModal(null);
      await fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Falha ao alterar situação do usuário.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Gestão Administrativa de Usuários
          </h2>
          <p className="text-xs text-slate-400">
            Controle de contas, perfis de autorização e senhas provisórias de acesso ao Consolida.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium">Total de Contas</span>
          <p className="text-lg font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <span className="text-[11px] text-emerald-400 font-medium">Contas Ativas</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <span className="text-[11px] text-slate-500 font-medium">Inativas</span>
          <p className="text-lg font-bold text-slate-400 mt-1">{stats.inactive}</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <span className="text-[11px] text-rose-400 font-medium">Bloqueadas</span>
          <p className="text-lg font-bold text-rose-400 mt-1">{stats.blocked}</p>
        </div>
      </div>

      {/* Alerta de Dependência de API se houver erro */}
      {apiError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-white">Status da Comunicação com a API</span>
            <p className="leading-relaxed">{apiError}</p>
            {apiError.includes('BLOQUEADO POR DEPENDÊNCIA DA API') && (
              <p className="text-[11px] text-amber-400/80">
                O Front End consumiu o endpoint oficial <code>GET /api/v1/users</code>, aguardando que o backend
                disponibilize a rota em produção.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Todas as Situações</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="BLOCKED">Bloqueado</option>
            <option value="PENDING">Pendente</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="ADMIN">ADMIN</option>
            <option value="FINANCE">FINANCE</option>
            <option value="MANAGER">MANAGER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">E-mail</th>
                <th className="py-3 px-4">Perfis</th>
                <th className="py-3 px-4">Situação</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Carregando usuários do sistema...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">Nenhum usuário encontrado</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {apiError ? 'Verifique o status do backend da API.' : 'Ajuste os filtros de pesquisa.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentLogged = u.id === currentUser?.id;
                  const isActive = u.status === 'ACTIVE';

                  return (
                    <tr key={u.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.substring(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{u.name}</span>
                            {isCurrentLogged && (
                              <span className="text-[10px] text-blue-400 font-medium">
                                (Você)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                r === 'ADMIN'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : r === 'FINANCE'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : u.status === 'INACTIVE'
                              ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                              : u.status === 'BLOCKED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-400'
                                : u.status === 'INACTIVE'
                                ? 'bg-slate-500'
                                : u.status === 'BLOCKED'
                                ? 'bg-rose-400'
                                : 'bg-amber-400'
                            }`}
                          />
                          {u.status === 'ACTIVE'
                            ? 'Ativo'
                            : u.status === 'INACTIVE'
                            ? 'Inativo'
                            : u.status === 'BLOCKED'
                            ? 'Bloqueado'
                            : 'Pendente'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {/* Ações: Inativar ou Reativar. ATENÇÃO: NUNCA EXCLUIR */}
                        {isActive ? (
                          <button
                            onClick={() =>
                              setStatusActionModal({
                                user: u,
                                targetStatus: 'INACTIVE',
                                reason: '',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Inativar usuário"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Inativar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setStatusActionModal({
                                user: u,
                                targetStatus: 'ACTIVE',
                                reason: '',
                              })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="Reativar usuário"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reativar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Cadastro de Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-0">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Cadastrar Novo Usuário</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4" noValidate>
              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Nome completo *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome do usuário"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">E-mail corporativo *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  required
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Telefone (opcional)</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Perfis de Acesso (selecione pelo menos um) *
                </label>
                <div className="space-y-2 pt-1">
                  {AVAILABLE_ROLES.map((role) => {
                    const isChecked = formRoles.includes(role.id);
                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-600/10 border-blue-500/30 text-white'
                            : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormRoles([...formRoles, role.id]);
                            } else {
                              setFormRoles(formRoles.filter((r) => r !== role.id));
                            }
                          }}
                          className="mt-0.5 rounded-sm border-slate-700 text-blue-600 focus:ring-0"
                        />
                        <div className="text-xs">
                          <span className="font-semibold block">{role.name}</span>
                          <span className="text-[11px] text-slate-400">{role.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Geração Segura de Credenciais:
                </span>
                <p>
                  A senha provisória será gerada pela API e exibida na tela seguinte para cópia única. O usuário será
                  obrigado a trocá-la no primeiro acesso.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmittingUser}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Cadastrar Usuário</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Exibição ÚNICA da Senha Provisória */}
      {provisionalPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Usuário Cadastrado com Sucesso</h3>
                <p className="text-xs text-slate-400">
                  Conta criada para <strong>{provisionalPasswordModal.user.name}</strong>
                </p>
              </div>
            </div>

            {/* Caixa de destaque da Senha Provisória */}
            <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Senha Provisória Gerada:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                  Uso Único
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                <code className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                  {provisionalPasswordModal.provisionalPassword}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(provisionalPasswordModal.provisionalPassword)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copiedPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso Obrigatório SCRUM-12: Exibição Única */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Aviso Importante:</span>
                <p className="text-[11px] text-amber-400/90 leading-relaxed">
                  Esta senha provisória será exibida apenas esta vez. Ao fechar esta janela, a senha não poderá ser
                  recuperada nem visualizada novamente pelo administrador. O usuário será obrigado a alterá-la no seu
                  primeiro login.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setProvisionalPasswordModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Compreendi e já copiei a senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Inativação / Reativação com Proteção de Último Admin */}
      {statusActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  statusActionModal.targetStatus === 'INACTIVE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {statusActionModal.targetStatus === 'INACTIVE' ? (
                  <Ban className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {statusActionModal.targetStatus === 'INACTIVE'
                    ? 'Confirmar Inativação de Usuário'
                    : 'Confirmar Reativação de Usuário'}
                </h3>
                <p className="text-xs text-slate-400">
                  Deseja {statusActionModal.targetStatus === 'INACTIVE' ? 'inativar' : 'reativar'} o usuário{' '}
                  <strong className="text-white">{statusActionModal.user.name}</strong>?
                </p>
              </div>
            </div>

            {statusActionModal.targetStatus === 'INACTIVE' &&
              statusActionModal.user.roles?.includes('ADMIN') &&
              activeAdminsCount <= 1 && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold block">Ação Bloqueada:</span>
                    <span>Operação não permitida: não é possível inativar o único Administrador ativo do sistema.</span>
                  </div>
                </div>
              )}

            {actionError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{actionError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Motivo / Justificativa administrativa (opcional):
              </label>
              <textarea
                value={statusActionModal.reason}
                onChange={(e) =>
                  setStatusActionModal({
                    ...statusActionModal,
                    reason: e.target.value,
                  })
                }
                rows={2}
                placeholder="Informe o motivo da alteração de situação..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusActionModal(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmStatusChange}
                disabled={
                  isUpdatingStatus ||
                  (statusActionModal.targetStatus === 'INACTIVE' &&
                    statusActionModal.user.roles?.includes('ADMIN') &&
                    activeAdminsCount <= 1)
                }
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-all cursor-pointer ${
                  statusActionModal.targetStatus === 'INACTIVE'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>
                    Confirmar {statusActionModal.targetStatus === 'INACTIVE' ? 'Inativação' : 'Reativação'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
