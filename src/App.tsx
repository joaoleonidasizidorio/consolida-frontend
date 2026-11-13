import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ApiStatusCard } from './components/ApiStatusCard';
import { HealthCheckCard } from './components/HealthCheckCard';
import {
  getRootMessage,
  getHealthCheck,
  RootMessageResponse,
  HealthCheckResult,
} from './services/systemService';
import {
  ShieldCheck,
  Layers,
  ExternalLink,
  Code2,
  Lock,
  Building2,
  ArrowDownLeft,
  CalendarCheck2,
  Repeat,
} from 'lucide-react';

export const App: React.FC = () => {
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

    // Polling periódico da saúde da API a cada 30 segundos
    const interval = setInterval(() => {
      loadHealthCheck();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadRootMessage, loadHealthCheck]);

  const isHealthy = healthResult?.data?.status === 'UP';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <Header isHealthy={isHealthy} isLoadingHealth={isLoadingHealth} />

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 z-10 space-y-8">
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

          {/* Roadmap of Upcoming Endpoints */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Próximos Módulos e Endpoints Mapeados:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>1. Autenticação & 2FA</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">POST /api/v1/auth/login</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Empresas & Contas</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GET /api/v1/companies</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
                  <span>3. Lançamentos & Caixa</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GET /api/v1/transactions</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <CalendarCheck2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>4. Fechamento Diário</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GET /api/v1/daily-close</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Repeat className="w-3.5 h-3.5 text-teal-400" />
                  <span>5. Transferências</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GET /api/v1/transfers</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Code2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>6. Gestão de Usuários</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">GET /api/v1/admin/users</p>
                <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
                  Aguardando BE
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-500 z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 <strong className="text-slate-400">Consolida</strong> · Frontend de Produção
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Repositório: consolida-frontend</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono font-medium">Railway Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
