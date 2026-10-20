import { parseArgs } from 'node:util';

import { parseDuration, request, requireEnv, sleep, timestamp } from '../lib/common';

type CheckBody =
  | { allowed: true; product: string; company: { name: string }; license: { validUntil: string | null } }
  | { allowed: false; product: string; reason: string; waitlistPosition?: number }
  | { error: { code: string; message: string } };

const reasons: Record<string, string> = {
  NOT_MEMBER: 'nem vagy tagja egy cégnek sem',
  NOT_LINKED: 'a fiókod nincs munkavállalóhoz kapcsolva',
  NOT_ELIGIBLE: 'a munkakörödnek nincs jogosultsága',
  WAITLISTED: 'várólistán vagy',
  NO_VALID_LICENSE: 'a céged licence lejárt vagy kevés',
};

async function check(token: string, product: string): Promise<boolean> {
  let result;
  try {
    result = await request('POST', '/api/v1/license/check', token, { product }, 5_000);
  } catch (error) {
    console.log(
      `[${timestamp()}] BLOKKOLVA   ${product}  hálózati hiba: ${error instanceof Error ? error.message : error}`,
    );
    return false;
  }
  const body = result.body as CheckBody;
  if ('error' in body) {
    console.log(
      `[${timestamp()}] BLOKKOLVA   ${product}  HTTP ${result.status} ${body.error.code}: ${body.error.message}`,
    );
    return false;
  }
  if (body.allowed) {
    const until = body.license.validUntil ? `, licenc: ${body.license.validUntil.slice(0, 10)}-ig` : '';
    console.log(`[${timestamp()}] ENGEDÉLYEZVE ${product}  (${body.company.name}${until}) ${result.ms} ms`);
    return true;
  }
  const position = body.waitlistPosition ? ` (${body.waitlistPosition}. a sorban)` : '';
  console.log(
    `[${timestamp()}] ELUTASÍTVA  ${product}  ${body.reason}: ${reasons[body.reason] ?? ''}${position} ${result.ms} ms`,
  );
  return false;
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      interval: { type: 'string', default: '1s' },
      count: { type: 'string' },
      admin: { type: 'boolean', default: false },
      token: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, product] = positionals;
  if (!command || !product || values.help) {
    console.log(
      'Használat:\n  pnpm demo-client check <termék>\n  pnpm demo-client watch <termék> [--interval 1s] [--count N]\nKapcsolók: --admin, --token <lm_ct_…>',
    );
    return;
  }
  const token = values.token ?? requireEnv(values.admin ? 'LM_ADMIN_CLIENT_TOKEN' : 'LM_CLIENT_TOKEN');

  if (command === 'check') {
    process.exitCode = (await check(token, product)) ? 0 : 1;
    return;
  }
  if (command === 'watch') {
    const interval = parseDuration(values.interval);
    const limit = values.count ? Number(values.count) : Infinity;
    let stop = false;
    process.on('SIGINT', () => (stop = true));
    for (let i = 0; i < limit && !stop; i++) {
      const allowed = await check(token, product);
      if (allowed) process.stdout.write('             … védett művelet végrehajtva\n');
      await sleep(interval);
    }
    return;
  }
  console.error(`Ismeretlen parancs: ${command}`);
  process.exitCode = 2;
}

main().catch(error => {
  console.error(`Hiba: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
