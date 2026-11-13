import React from 'react';
import { Activity, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { HealthCheckResult } from '../services/systemService';

interface HealthCheckCardProps {
  healthResult: HealthCheckResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const HealthCheckCard: React.FC<HealthCheckCardProps> = ({
  healthResult,
  isLoading,
  onRefresh,
}) => {
  const isUp = healthResult?.data?.status === 'UP';
  const hasError = Boolean(healthResult?.error) || (!isLoading && healthResult && !isUp);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Saúde da Aplicação (/actuator/health)</h2>
            <p className="text-xs text-slate-400">Monitoramento e integridade do Spring Boot</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Atualizar verificação de saúde"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          title="Recarregar saúde da API"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-800 rounded-md w-1/3"></div>
            <div className="h-4 bg-slate-800 rounded-md w-1/4"></div>
          </div>
          <div className="h-8 bg-slate-800/60 rounded-md w-full"></div>
        </div>
      ) : hasError ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-400">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Servidor Indisponível ou com Falha</span>
          </div>
          <p className="text-[11px] text-rose-300/90 leading-relaxed font-mono">
            {healthResult?.error || `Status retornado: ${healthResult?.data?.status || 'UNKNOWN'}`}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Verificado às: {healthResult?.checkedAt || 'Agora'}</span>
            </span>
            <button
              onClick={onRefresh}
              className="text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : healthResult?.data ? (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Estado de Operação:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{healthResult.data.status}</span>
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              ⚡ {healthResult.latencyMs} ms
            </span>
          </div>

          {healthResult.data.groups && healthResult.data.groups.length > 0 && (
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                Grupos Monitorados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {healthResult.data.groups.map((group) => (
                  <span
                    key={group}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded font-mono"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-900">
            <span>Spring Boot Actuator v3</span>
            <span>Última checagem: {healthResult.checkedAt}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
