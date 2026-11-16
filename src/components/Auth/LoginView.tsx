/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Tela de Login Oficial - Consolida Frontend
 * Em estrita conformidade com SCRUM-12 e SCRUM-10.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { env } from '../../config/env';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Server,
} from 'lucide-react';

interface LoginViewProps {
  onSuccess?: () => void;
  returnUrl?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, returnUrl }) => {
  const { login, sessionExpiredMessage, clearSessionExpiredMessage } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    clearSessionExpiredMessage();

    if (!email.trim() || !password) {
      setErrorMessage('Informe o e-mail e a senha para acessar.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({ email: email.trim(), password });
      if (res.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(res.message || 'E-mail ou senha incorretos');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'E-mail ou senha incorretos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[140px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 p-2.5 shadow-xl mx-auto">
            <img src="/logo-transparent.png" alt="Consolida" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Consolida
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Gestão Financeira Multinegócio — Autenticação de Produção
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Banner de Sessão Expirada */}
          {sessionExpiredMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">{sessionExpiredMessage}</span>
                <span className="text-[11px] text-amber-400/80">
                  Por motivos de segurança, autentique-se novamente para continuar de onde parou.
                </span>
              </div>
            </div>
          )}

          {/* Banner de Erro Geral / Bloqueio / Credenciais */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block leading-tight">{errorMessage}</span>
                {errorMessage.includes('BLOQUEADO POR DEPENDÊNCIA DA API') && (
                  <p className="text-[11px] text-rose-400/80 leading-relaxed">
                    O Front End está pronto e enviou a requisição para a API real, porém o endpoint ainda não foi publicado no ambiente de backend.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Input E-mail */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300"
              >
                E-mail corporativo
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300"
              >
                Senha de acesso
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={0}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Consolida</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Card Info */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sessão segura criptografada
            </span>
            {returnUrl && (
              <span className="text-[10px] text-slate-500 font-mono">
                Redirecionamento salvo
              </span>
            )}
          </div>
        </div>

        {/* API Target Reference */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            Backend API:
          </span>
          <span className="text-slate-300 font-semibold truncate max-w-[220px]" title={env.apiUrl}>
            {env.apiUrl}
          </span>
        </div>
      </div>
    </div>
  );
};
