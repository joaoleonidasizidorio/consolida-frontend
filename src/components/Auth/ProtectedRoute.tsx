/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Guarda de Rotas Protegidas - Consolida Frontend
 * Em conformidade com SCRUM-12 (redirecionamento para login, bloqueio para não autenticados,
 * troca obrigatória de senha provisória e controle de papéis).
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginView } from './LoginView';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  returnUrl?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  returnUrl,
}) => {
  const {
    isAuthenticated,
    isLoading,
    isProvisionalPassword,
    hasRole,
    isPasswordChangeModalOpen,
    closePasswordChangeModal,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-medium">Validando sessão com o Consolida...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView returnUrl={returnUrl} />;
  }

  // Se o usuário precisa de um papel específico (ex: ADMIN) e não o possui
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">403 — Acesso Não Autorizado</h2>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              Seu perfil de acesso atual não possui permissão para visualizar este recurso ({requiredRole}).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Modal de Alteração de Senha (Obrigatório se senha for provisória) */}
      <ChangePasswordModal
        isOpen={isPasswordChangeModalOpen}
        onClose={closePasswordChangeModal}
        isMandatory={isProvisionalPassword}
      />
    </>
  );
};
