import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { parseDuration, percentile, request, requireEnv } from '../lib/common';

const { values } = parseArgs({
  options: {
    clients: { type: 'string', default: '20' },
    duration: { type: 'string', default: '15s' },
    product: { type: 'string', default: 'ide-pro' },
    json: { type: 'string' },
  },
});

const token = requireEnv('LM_CLIENT_TOKEN');
const clients = Number(values.clients);
const durationMs = parseDuration(values.duration);

async function client(deadline: number, samples: number[], errors: { count: number }) {
  while (performance.now() < deadline) {
    try {
      const result = await request('POST', '/api/v1/license/check', token, { product: values.product });
      if (result.status === 200) samples.push(result.ms);
      else errors.count++;
    } catch {
      errors.count++;
    }
  }
}

async function main() {
  console.log(`Terheléses mérés: ${clients} párhuzamos kliens, ${durationMs / 1000} s, ${values.product}`);
  await request('POST', '/api/v1/license/check', token, { product: values.product });

  const samples: number[] = [];
  const errors = { count: 0 };
  const started = performance.now();
  const deadline = started + durationMs;
  await Promise.all(Array.from({ length: clients }, () => client(deadline, samples, errors)));
  const elapsed = (performance.now() - started) / 1000;

  const sorted = [...samples].sort((a, b) => a - b);
  const report = {
    clients,
    durationS: Number(elapsed.toFixed(1)),
    requests: samples.length,
    errors: errors.count,
    throughputRps: Number((samples.length / elapsed).toFixed(1)),
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    maxMs: sorted[sorted.length - 1],
    measuredAt: new Date().toISOString(),
  };
  console.log(
    `kérések: ${report.requests} (${report.throughputRps}/s), hibák: ${report.errors}\n` +
      `p50: ${report.p50Ms} ms   p95: ${report.p95Ms} ms   max: ${report.maxMs} ms   (NFR-PERF-2: p95 ≤ 200 ms)`,
  );
  if (values.json) writeFileSync(values.json, JSON.stringify(report, null, 2));
  process.exitCode = report.p95Ms <= 200 && report.errors === 0 ? 0 : 1;
}

main().catch(error => {
  console.error(`Hiba: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
