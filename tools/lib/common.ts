import { existsSync } from 'node:fs';
import path from 'node:path';

export function loadToolsEnv() {
  const file = path.join(process.cwd(), 'tools', '.env.local');
  if (existsSync(file)) {
    const before = { ...process.env };
    process.loadEnvFile(file);
    Object.assign(process.env, before);
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Hiányzik a(z) ${name} változó. Futtasd a \`pnpm db:seed\` parancsot, vagy add meg környezeti változóként.`,
    );
    process.exit(2);
  }
  return value;
}

export function baseUrl(): string {
  return (process.env.LM_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export type HttpResult = { status: number; body: unknown; ms: number };

export async function request(
  method: 'GET' | 'POST',
  urlPath: string,
  token: string,
  body?: unknown,
  timeoutMs = 10_000,
): Promise<HttpResult> {
  const started = performance.now();
  const response = await fetch(`${baseUrl()}${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {}
  return { status: response.status, body: parsed, ms: Math.round(performance.now() - started) };
}

export function timestamp(date = new Date()): string {
  return date.toISOString().replace('T', ' ').replace('Z', '');
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function parseDuration(value: string): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m)?$/.exec(value.trim());
  if (!match) throw new Error(`Érvénytelen időtartam: ${value}`);
  const amount = Number(match[1]);
  return match[2] === 'm' ? amount * 60_000 : match[2] === 'ms' ? amount : amount * 1000;
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

loadToolsEnv();
