/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Cliente HTTP Centralizado - Consolida Frontend
 */

import { env } from '../config/env';

export class ApiError extends Error {
  public status: number;
  public isNetworkError: boolean;

  constructor(message: string, status = 500, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const directUrl = `${env.apiUrl}${cleanPath}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Accept': 'application/json',
    ...(fetchOptions.headers || {}),
  };

  try {
    let response: Response;

    try {
      response = await fetch(directUrl, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
    } catch (directErr: any) {
      // Em ambiente de desenvolvimento, se falhar por restrição de CORS, tenta o proxy do Vite
      if (env.isDev && directErr.name !== 'AbortError') {
        try {
          response = await fetch(`/api-proxy${cleanPath}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
          });
        } catch {
          throw directErr;
        }
      } else {
        throw directErr;
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errMsg = `Falha na requisição (HTTP ${response.status}): ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson?.message) errMsg = errJson.message;
      } catch {}
      throw new ApiError(errMsg, response.status, false);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json') || contentType.includes('actuator')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ApiError(
        `Tempo limite esgotado (${timeoutMs / 1000}s). O servidor demorou a responder.`,
        408,
        true
      );
    }

    throw new ApiError(
      'Não foi possível conectar ao servidor da API. Verifique sua conexão e se o backend está ativo.',
      0,
      true
    );
  }
}
