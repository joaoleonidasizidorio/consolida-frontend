/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cabeçalho Oficial - Consolida Frontend
 * Em conformidade com SCRUM-12 (identificação de usuário, perfis, troca de senha e logout,
 * sem troca fictícia de usuário ou reset de teste).
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  LogOut,
  Users,
  Activity,
} from 'lucide-react';

interface HeaderProps {
  isHealthy: boolean | null;
  isLoadingHealth: boolean;
  activeTab?: 'status' | 'users';
  onSelectTab?: (tab: 'status' | 'users') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isHealthy,
  isLoadingHealth,
  activeTab = 'status',
  onSelectTab,
}) => {
  const { user, isAuthenticated, isAdmin, logout, openPasswordChangeModal } = useAuth();

  return (
    <header className="border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1.5 flex items-center justify-center shadow-md">
              <img src="/logo-transparent.png" alt="Consolida" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight leading-tight">
                  Consolida
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Produção FE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Gestão Financeira Multinegócio
              </p>
            </div>
          </div>

          {/* Nav Tabs for Authenticated Users */}
          {isAuthenticated && onSelectTab && (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectTab('status')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === 'status'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Status da API</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onSelectTab('users')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gestão de Usuários</span>
                </button>
              )}
            </nav>
          )}
        </div>

        {/* Right Section: API Status & User Identification */}
        <div className="flex items-center gap-3">
          {/* API Status Badge */}
          <div
            data-testid="api-health-badge"
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isLoadingHealth
                ? 'bg-slate-900/80 text-slate-400 border-slate-800'
                : isHealthy
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs shadow-emerald-500/10'
                : isHealthy === false
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-xs shadow-rose-500/10'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLoadingHealth
                  ? 'bg-slate-500 animate-pulse'
                  : isHealthy
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {isLoadingHealth
                ? 'Checando API...'
                : isHealthy
                ? 'API Online (UP)'
                : 'API Indisponível'}
            </span>
          </div>

          {/* User Section (SCRUM-12: Real User Identity, Password Change, Logout) */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-800">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight">
                  {user.name}
                </span>
                <div className="flex items-center justify-end gap-1">
                  {user.roles?.map((r) => (
                    <span
                      key={r}
                      className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Password Change & Logout */}
              <button
                type="button"
                onClick={openPasswordChangeModal}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Alterar Senha de Acesso"
                aria-label="Alterar Senha"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors text-xs font-semibold cursor-pointer"
                title="Encerrar Sessão"
                aria-label="Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Não autenticado
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
