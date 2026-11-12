import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { parseDuration, percentile, request, requireEnv, sleep } from '../lib/common';

const { values } = parseArgs({
  options: {
    rounds: { type: 'string', default: '30' },
    'hr-id': { type: 'string', default: 'E-1001' },
    product: { type: 'string', default: 'ide-pro' },
    role: { type: 'string', default: 'developer' },
    poll: { type: 'string', default: '10ms' },
    json: { type: 'string' },
  },
});

const apiKey = requireEnv('LM_API_KEY');
const clientToken = requireEnv('LM_CLIENT_TOKEN');
const rounds = Number(values.rounds);
const pollMs = parseDuration(values.poll);
const hrId = values['hr-id'];
const product = values.product;
const runId = Date.now().toString(36);

async function sendEvent(type: 'employee.hired' | 'employee.terminated', round: number) {
  const result = await request('POST', '/api/v1/hr/events', apiKey, {
    eventId: `latency-${runId}-${round}-${type}`,
    type,
    occurredAt: new Date().toISOString(),
    employee: { hrId, ...(type === 'employee.hired' ? { jobRole: values.role } : {}) },
  });
  if (result.status !== 202) throw new Error(`${type}: HTTP ${result.status} ${JSON.stringify(result.body)}`);
  return performance.now();
}

async function isAllowed(): Promise<boolean> {
  const result = await request('POST', '/api/v1/license/check', clientToken, { product });
  return (result.body as { allowed?: boolean }).allowed === true;
}

async function waitUntil(expected: boolean, timeoutMs: number): Promise<number | null> {
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    if ((await isAllowed()) === expected) return performance.now();
    if (pollMs > 0) await sleep(pollMs);
  }
  return null;
}

async function main() {
  console.log(`Késés mérése a hely elvesztésétől az elutasításig: ${rounds} kör, ${hrId}, ${product}`);
  const samples: number[] = [];
  for (let round = 1; round <= rounds; round++) {
    if (!(await isAllowed())) {
      await sendEvent('employee.hired', round);
      if ((await waitUntil(true, 10_000)) === null) {
        throw new Error(
          `${round}. kör: ${hrId} nem kapott helyet (minden hely foglalt, vagy nincs fiókkal összekapcsolva?)`,
        );
      }
    }
    await sleep(5);
    const accepted = await sendEvent('employee.terminated', round);
    const denied = await waitUntil(false, 30_000);
    if (denied === null) throw new Error(`${round}. kör: 30 s után is engedélyezve maradt`);
    const latency = denied - accepted;
    samples.push(latency);
    console.log(`  ${String(round).padStart(2)}. kör: ${latency.toFixed(1)} ms`);
  }

  await sendEvent('employee.hired', rounds + 1);

  const sorted = [...samples].sort((a, b) => a - b);
  const report = {
    rounds,
    hrId,
    product,
    p50Ms: Number(percentile(sorted, 50).toFixed(1)),
    p95Ms: Number(percentile(sorted, 95).toFixed(1)),
    maxMs: Number(sorted[sorted.length - 1].toFixed(1)),
    meanMs: Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1)),
    samplesMs: samples.map(s => Number(s.toFixed(1))),
    measuredAt: new Date().toISOString(),
    baseUrl: process.env.LM_BASE_URL ?? 'http://localhost:3000',
  };
  console.log(
    `\np50: ${report.p50Ms} ms   p95: ${report.p95Ms} ms   max: ${report.maxMs} ms   (NFR-PERF-1: p95 ≤ 2000 ms)`,
  );
  if (values.json) writeFileSync(values.json, JSON.stringify(report, null, 2));
  process.exitCode = report.p95Ms <= 2000 ? 0 : 1;
}

main().catch(error => {
  console.error(`Hiba: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
