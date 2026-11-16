/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Aplicação Principal - Consolida Frontend
 * Em conformidade com SCRUM-12 (Autenticação, Sessão, Gestão de Usuários e Troca de Senha).
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginView } from './components/Auth/LoginView';
import { ChangePasswordModal } from './components/Auth/ChangePasswordModal';
import { UsersManagementView } from './components/Admin/UsersManagementView';
import { ApiStatusCard } from './components/ApiStatusCard';
import { HealthCheckCard } from './components/HealthCheckCard';
import {
  getRootMessage,
  getHealthCheck,
  RootMessageResponse,
  HealthCheckResult,
} from './services/systemService';
import { User } from './types/auth';
import {
  ShieldCheck,
  Layers,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface AppProps {
  initialUser?: User | null;
}

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    isProvisionalPassword,
    isPasswordChangeModalOpen,
    closePasswordChangeModal,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'status' | 'users'>('status');

  const [rootData, setRootData] = useState<RootMessageResponse | null>(null);
  const [isLoadingRoot, setIsLoadingRoot] = useState<boolean>(true);
  const [rootError, setRootError] = useState<string | null>(null);

  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState<boolean>(true);

  const loadRootMessage = useCallback(async () => {
    setIsLoadingRoot(true);
    setRootError(null);
    try {
      const res = await getRootMessage();
      setRootData(res);
    } catch (err: any) {
      setRootError(err.message || 'Erro ao consultar mensagem raiz.');
    } finally {
      setIsLoadingRoot(false);
    }
  }, []);

  const loadHealthCheck = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const res = await getHealthCheck();
      setHealthResult(res);
    } catch (err: any) {
      setHealthResult({
        data: null,
        latencyMs: 0,
        checkedAt: new Date().toLocaleTimeString('pt-BR'),
        error: err.message || 'Falha crítica ao consultar saúde.',
      });
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    loadRootMessage();
    loadHealthCheck();

    const interval = setInterval(() => {
      loadHealthCheck();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadRootMessage, loadHealthCheck]);

  const isHealthy = healthResult?.data?.status === 'UP';

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-medium">Carregando Consolida...</span>
      </div>
    );
  }

  // Se não estiver autenticado, exibe a tela oficial de login
  if (!isAuthenticated) {
    return (
      <>
        <Header isHealthy={isHealthy} isLoadingHealth={isLoadingHealth} />
        <LoginView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <Header
        isHealthy={isHealthy}
        isLoadingHealth={isLoadingHealth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 space-y-8">
        {activeTab === 'users' ? (
          <UsersManagementView />
        ) : (
          <>
            {/* Hero Section */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Base de Produção do Front End — Consumo Estrito da API</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Consolida{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Frontend de Produção
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
                Este repositório é a base oficial de produção do frontend. Ele consome estritamente o que a API
                disponibiliza, sem dados simulados, sem persistência fictícia e com tratamento completo de resiliência.
              </p>
            </div>

            {/* Live Endpoints Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ApiStatusCard
                data={rootData}
                isLoading={isLoadingRoot}
                error={rootError}
                onRefresh={loadRootMessage}
              />

              <HealthCheckCard
                healthResult={healthResult}
                isLoading={isLoadingHealth}
                onRefresh={loadHealthCheck}
              />
            </div>

            {/* Prototype vs Production Contract Notice */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white">
                    Diretriz de Engenharia: Transição Guiada por Endpoints
                  </h2>
                </div>

                <a
                  href="https://consolida.up.railway.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  <span>Ver Protótipo Visual Completo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                O protótipo visual aprovado pelo time (<code className="text-blue-400">consolida.up.railway.app</code>)
                permanece como a referência estética e de layout das telas. No entanto, cada tela só será portada para este
                repositório quando o endpoint correspondente for homologado no Back End.
              </p>

              {/* Status matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">Autenticação & Sessão</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      FE Concluído
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Login, sessão centralizada, interceptação 401, troca de senha e gestão de usuários (SCRUM-12).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Empresas & Contas</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                      Aguardando BE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Cadastro e seleção de empresas multinegócio e contas bancárias.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">Lançamentos Financeiros</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                      Aguardando BE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Receitas, despesas, conciliação e fechamento diário de caixa.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 z-10">
        <p>Consolida — Gestão Financeira Multinegócio &copy; 2026. Todos os direitos reservados.</p>
      </footer>

      {/* Modal de Alteração de Senha (Obrigatório se senha for provisória) */}
      <ChangePasswordModal
        isOpen={isPasswordChangeModalOpen}
        onClose={closePasswordChangeModal}
        isMandatory={isProvisionalPassword}
      />
    </div>
  );
};

export const App: React.FC<AppProps> = ({ initialUser }) => {
  return (
    <AuthProvider initialUser={initialUser}>
      <AppContent />
    </AuthProvider>
  );
};
