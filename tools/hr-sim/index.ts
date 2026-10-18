import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { request, requireEnv, sleep } from '../lib/common';

type EventType = 'employee.hired' | 'employee.role_changed' | 'employee.terminated';
type HrEvent = {
  eventId: string;
  type: EventType;
  occurredAt: string;
  employee: { hrId: string; jobRole?: string; name?: string; email?: string };
};

const HISTORY = path.join(process.cwd(), 'tools', '.hr-sim-history.json');

function loadHistory(): Record<string, HrEvent> {
  return existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, 'utf8')) : {};
}

function remember(event: HrEvent) {
  const history = loadHistory();
  history[event.eventId] = event;
  writeFileSync(HISTORY, JSON.stringify(history, null, 2));
}

let apiKey = '';

function newEventId(prefix = 'sim') {
  return `${prefix}-${new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 17)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function send(event: HrEvent | string, label?: string) {
  const payload = typeof event === 'string' ? event : JSON.stringify(event);
  const result = await request('POST', '/api/v1/hr/events', apiKey, payload);
  const title = label ?? (typeof event === 'string' ? 'nyers kérés' : `${event.type} ${event.employee.hrId}`);
  console.log(`→ ${title}: HTTP ${result.status} (${result.ms} ms) ${JSON.stringify(result.body)}`);
  if (typeof event !== 'string' && result.status < 300) {
    remember(event);
    await printStatus(event.eventId);
  }
  return result;
}

async function printStatus(eventId: string, waitMs = 5_000) {
  const deadline = Date.now() + waitMs;
  for (;;) {
    const result = await request('GET', `/api/v1/hr/events/${encodeURIComponent(eventId)}`, apiKey);
    const body = result.body as { status?: string };
    if (result.status !== 200 || body.status !== 'pending' || Date.now() > deadline) {
      console.log(`  feldolgozás: HTTP ${result.status} ${JSON.stringify(result.body)}`);
      return body.status;
    }
    await sleep(100);
  }
}

function buildEvent(
  type: EventType,
  hrId: string,
  options: { role?: string; name?: string; email?: string; occurredAt?: string; eventId?: string },
): HrEvent {
  return {
    eventId: options.eventId ?? newEventId(),
    type,
    occurredAt: options.occurredAt ? new Date(options.occurredAt).toISOString() : new Date().toISOString(),
    employee: {
      hrId,
      ...(options.role ? { jobRole: options.role } : {}),
      ...(options.name ? { name: options.name } : {}),
      ...(options.email ? { email: options.email } : {}),
    },
  };
}

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const scenarios: Record<string, { title: string; run: () => Promise<void> }> = {
  s2: {
    title: 'S2: 20/20 hely foglalt, belép a 21. fejlesztő → várólista 1. hely',
    run: async () => {
      await send(buildEvent('employee.hired', 'E-1026', { role: 'developer', name: 'Huszonegyedik Fejlesztő' }));
    },
  },
  s3: {
    title: 'S3: kilép E-1005 → visszavonás, E-1026 megkapja a felszabadult helyet',
    run: async () => {
      await send(buildEvent('employee.terminated', 'E-1005', {}));
    },
  },
  s5: {
    title: 'S5: ugyanaz az esemény kétszer → második válasz: duplicate',
    run: async () => {
      const event = buildEvent('employee.role_changed', 'E-1023', { role: 'designer' });
      await send(event, 'első küldés');
      await send(event, 'ismételt küldés');
    },
  },
  s6: {
    title: 'S6: belépés T1, kilépés T3, késve érkező belépés T2 → stale, kilépett marad',
    run: async () => {
      const hrId = `E-S6-${Math.random().toString(36).slice(2, 6)}`;
      await send(buildEvent('employee.hired', hrId, { role: 'developer', occurredAt: minutesAgo(30) }), 'belépés (T1)');
      await send(buildEvent('employee.terminated', hrId, { occurredAt: minutesAgo(10) }), 'kilépés (T3)');
      await send(
        buildEvent('employee.hired', hrId, { role: 'developer', occurredAt: minutesAgo(20) }),
        'késő belépés (T2)',
      );
    },
  },
  s7: {
    title: 'S7: E-1010 fejlesztőből könyvelő lesz (accountant → office-suite szabály kell hozzá)',
    run: async () => {
      await send(buildEvent('employee.role_changed', 'E-1010', { role: 'accountant' }));
    },
  },
  s11: {
    title:
      'S11: hiba a feldolgozás közben (a szerveren HR_FAULT_INJECTION=1 kell) → failed, majd újrapróbálva processed',
    run: async () => {
      const event = buildEvent('employee.terminated', 'E-1006', { eventId: newEventId('fault') });
      await send(event);
      console.log('  a worker 1 másodperc múlva újrapróbálja…');
      await sleep(7_000);
      await printStatus(event.eventId, 0);
    },
  },
  s14: {
    title: 'S14: ugyanaz az eventId eltérő munkakörrel → 409 EVENT_ID_CONFLICT',
    run: async () => {
      const event = buildEvent('employee.hired', `E-S14-${Math.random().toString(36).slice(2, 6)}`, {
        role: 'designer',
      });
      await send(event, 'eredeti');
      await send({ ...event, employee: { ...event.employee, jobRole: 'developer' } }, 'eltérő tartalom');
    },
  },
  s15: {
    title:
      'S15: hibás események (hiányzó hrId, rossz időpont, ismeretlen típus, túl nagy törzs) → 400, semmi sem tárolódik',
    run: async () => {
      const base = buildEvent('employee.hired', 'E-S15', { role: 'developer' });
      await send(JSON.stringify({ ...base, employee: { jobRole: 'developer' } }), 'hiányzó hrId');
      await send(JSON.stringify({ ...base, occurredAt: 'tegnap' }), 'hibás occurredAt');
      await send(JSON.stringify({ ...base, type: 'employee.promoted' }), 'ismeretlen típus');
      await send(
        JSON.stringify({ ...base, employee: { ...base.employee, name: 'x'.repeat(17_000) } }),
        'túl nagy törzs',
      );
    },
  },
};

const usage = `Használat:
  pnpm hr-sim hire <hrId> --role <munkakör> [--name <név>] [--email <cím>]
  pnpm hr-sim change-role <hrId> --role <munkakör>
  pnpm hr-sim terminate <hrId>
  pnpm hr-sim send <típus> <hrId> --occurred-at <ISO idő> [--role <munkakör>]
  pnpm hr-sim replay <eventId>
  pnpm hr-sim status <eventId>
  pnpm hr-sim scenario <név|list>
  pnpm hr-sim snapshot <fájl.json>
Közös kapcsolók: --event-id <azonosító>, --occurred-at <ISO idő>, --other (a második cég kulcsa)`;

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      role: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      'occurred-at': { type: 'string' },
      'event-id': { type: 'string' },
      other: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  const [command, ...args] = positionals;
  if (!command || values.help) {
    console.log(usage);
    return;
  }
  apiKey = requireEnv(values.other ? 'LM_OTHER_API_KEY' : 'LM_API_KEY');
  const options = {
    role: values.role,
    name: values.name,
    email: values.email,
    occurredAt: values['occurred-at'],
    eventId: values['event-id'],
  };

  switch (command) {
    case 'hire':
      if (!args[0] || !options.role) throw new Error('hire: add meg a HR-azonosítót és a --role kapcsolót');
      await send(buildEvent('employee.hired', args[0], options));
      break;
    case 'change-role':
      if (!args[0] || !options.role) throw new Error('change-role: add meg a HR-azonosítót és a --role kapcsolót');
      await send(buildEvent('employee.role_changed', args[0], options));
      break;
    case 'terminate':
      if (!args[0]) throw new Error('terminate: add meg a HR-azonosítót');
      await send(buildEvent('employee.terminated', args[0], options));
      break;
    case 'send':
      if (!args[0] || !args[1] || !options.occurredAt) {
        throw new Error('send: add meg a típust, a HR-azonosítót és az --occurred-at kapcsolót');
      }
      await send(buildEvent(args[0] as EventType, args[1], options));
      break;
    case 'replay': {
      const event = loadHistory()[args[0] ?? ''];
      if (!event) throw new Error(`replay: nincs ilyen elküldött esemény: ${args[0]}`);
      await send(event, `újraküldés ${event.eventId}`);
      break;
    }
    case 'status':
      if (!args[0]) throw new Error('status: add meg az eseményazonosítót');
      await printStatus(args[0], 0);
      break;
    case 'snapshot': {
      if (!args[0]) throw new Error('snapshot: add meg a JSON fájlt (az összes aktív munkavállaló listája)');
      const employees = JSON.parse(readFileSync(args[0], 'utf8'));
      const result = await request('POST', '/api/v1/hr/snapshot', apiKey, {
        snapshotId: options.eventId ?? newEventId('snapshot'),
        occurredAt: options.occurredAt ? new Date(options.occurredAt).toISOString() : new Date().toISOString(),
        employees,
      });
      console.log(`→ snapshot: HTTP ${result.status} (${result.ms} ms) ${JSON.stringify(result.body)}`);
      break;
    }
    case 'scenario': {
      if (!args[0] || args[0] === 'list') {
        for (const [name, scenario] of Object.entries(scenarios)) console.log(`  ${name.padEnd(4)} ${scenario.title}`);
        break;
      }
      const scenario = scenarios[args[0]];
      if (!scenario) throw new Error(`ismeretlen forgatókönyv: ${args[0]}`);
      console.log(scenario.title);
      await scenario.run();
      break;
    }
    default:
      console.log(usage);
      process.exitCode = 2;
  }
}

main().catch(error => {
  console.error(`Hiba: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
