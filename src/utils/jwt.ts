/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilitários de Inspeção e Validação de JWT - Consolida Frontend
 */

export interface JwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decodifica o payload de um token JWT sem dependências externas.
 */
export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Verifica se um token JWT já ultrapassou o tempo de expiração (`exp`).
 */
export function isJwtExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }
  // exp está em segundos; compara com Date.now() em milissegundos
  return payload.exp * 1000 <= Date.now();
}
