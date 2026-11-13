/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Configurações de Ambiente - Consolida Frontend
 */

export interface EnvConfig {
  apiUrl: string;
  isDev: boolean;
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://consolida-api.up.railway.app';

export const env: EnvConfig = {
  // Remove barra final se houver
  apiUrl: rawApiUrl.replace(/\/+$/, ''),
  isDev: import.meta.env.DEV,
};
