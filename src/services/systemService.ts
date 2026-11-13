/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Serviços de Sistema (Root Message e Actuator Health)
 */

import { request } from './apiClient';

export interface RootMessageResponse {
  message: string;
}

export interface HealthResponse {
  status: 'UP' | 'DOWN' | string;
  groups?: string[];
  [key: string]: any;
}

export interface HealthCheckResult {
  data: HealthResponse | null;
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

export async function getRootMessage(): Promise<RootMessageResponse> {
  const result = await request<any>('/');
  if (typeof result === 'string') {
    return { message: result };
  }
  return result;
}

export async function getHealthCheck(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const checkedAt = new Date().toLocaleTimeString('pt-BR', { hour12: false });

  try {
    const data = await request<HealthResponse>('/actuator/health');
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data,
      latencyMs,
      checkedAt,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      data: null,
      latencyMs,
      checkedAt,
      error: err.message || 'Falha ao consultar saúde da API.',
    };
  }
}
