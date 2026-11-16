import React from 'react';
import { Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RootMessageResponse } from '../services/systemService';

interface ApiStatusCardProps {
  data: RootMessageResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const ApiStatusCard: React.FC<ApiStatusCardProps> = ({
  data,
  isLoading,
  error,
  onRefresh,
}) => {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Endpoint Raiz (GET /)</h2>
            <p className="text-xs text-slate-400">Mensagem do servidor da aplicação</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Atualizar mensagem raiz"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          title="Recarregar endpoint GET /"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800/80 animate-pulse space-y-2">
          <div className="h-4 bg-slate-800 rounded-md w-3/4"></div>
          <div className="h-3 bg-slate-800/60 rounded-md w-1/2"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Falha ao consultar GET /</span>
          </div>
          <p className="text-[11px] text-rose-300/90 leading-relaxed font-mono">
            {error}
          </p>
          <div className="pt-1">
            <button
              onClick={onRefresh}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : data ? (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Resposta Recebida:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HTTP 200 OK</span>
            </span>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 break-all select-all">
            {typeof data.message === 'string' ? data.message : JSON.stringify(data)}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Nenhum dado retornado da API.</p>
      )}
    </div>
  );
};

