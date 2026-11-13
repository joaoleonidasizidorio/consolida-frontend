import React from 'react';
import { env } from '../config/env';

interface HeaderProps {
  isHealthy: boolean | null;
  isLoadingHealth: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isHealthy, isLoadingHealth }) => {
  return (
    <header className="border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
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
            <p className="text-[11px] text-slate-400 font-medium">
              Gestão Financeira Multinegócio
            </p>
          </div>
        </div>

        {/* API Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
            <span className="text-slate-500">API:</span>
            <span className="text-slate-300 truncate max-w-[220px]" title={env.apiUrl}>
              {env.apiUrl}
            </span>
          </div>

          <div
            data-testid="api-health-badge"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
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
        </div>
      </div>
    </header>
  );
};
