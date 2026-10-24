import { describe, expect, it } from 'vitest';

import { manualEventSchema } from '@/lib/validation/hr';
import { toFieldErrors } from '@/lib/validation/zod';

const occurredAt = '2026-10-13T14:11:00.000Z';

function parse(form: Record<string, string>) {
  const result = manualEventSchema.safeParse(form);
  return result.success ? { data: result.data, errors: {} } : { data: undefined, errors: toFieldErrors(result.error) };
}

describe('EMP-8 manual event form', () => {
  it('accepts a hire with every field', () => {
    const { data, errors } = parse({
      type: 'employee.hired',
      hrId: 'E-1042',
      name: 'Kiss Anna',
      email: 'kiss.anna@example.com',
      jobRole: 'developer',
      occurredAt,
    });
    expect(errors).toEqual({});
    expect(data).toMatchObject({ name: 'Kiss Anna', email: 'kiss.anna@example.com', jobRole: 'developer' });
  });

  it('treats a blank name and e-mail on a hire as not given (§7.1: recommended, not required)', () => {
    const { data, errors } = parse({
      type: 'employee.hired',
      hrId: 'E-1042',
      name: '',
      email: '',
      jobRole: 'developer',
      occurredAt,
    });
    expect(errors).toEqual({});
    expect(data?.name).toBeUndefined();
    expect(data?.email).toBeUndefined();
  });

  it('accepts a role change, which has no name or e-mail input', () => {
    const { data, errors } = parse({ type: 'employee.role_changed', hrId: 'E-1001', jobRole: 'tester', occurredAt });
    expect(errors).toEqual({});
    expect(data).toMatchObject({ type: 'employee.role_changed', jobRole: 'tester' });
  });

  it('accepts a termination, which has neither name, e-mail nor job role input', () => {
    const { data, errors } = parse({ type: 'employee.terminated', hrId: 'E-1001', occurredAt });
    expect(errors).toEqual({});
    expect(data?.jobRole).toBeUndefined();
  });

  it('requires the job role for hires and role changes', () => {
    const required = { jobRole: ['Belépésnél és munkakörváltásnál kötelező.'] };
    expect(
      parse({ type: 'employee.hired', hrId: 'E-1042', name: '', email: '', jobRole: '', occurredAt }).errors,
    ).toEqual(required);
    expect(parse({ type: 'employee.role_changed', hrId: 'E-1001', jobRole: ' ', occurredAt }).errors).toEqual(required);
  });

  it('reports an invalid e-mail or job role on its own field', () => {
    const { errors } = parse({
      type: 'employee.hired',
      hrId: 'E-1042',
      name: 'Kiss Anna',
      email: 'nem-cim',
      jobRole: 'Fejlesztő',
      occurredAt,
    });
    expect(errors).toEqual({
      email: ['Érvénytelen e-mail-cím.'],
      jobRole: ['Csak kisbetű, számjegy, kötőjel és aláhúzás használható (pl. developer).'],
    });
  });

  it('rejects a missing HR id and an invalid time', () => {
    const { errors } = parse({ type: 'employee.terminated', hrId: ' ', occurredAt: '2026-10-13 16:11' });
    expect(errors).toEqual({ hrId: ['Add meg a HR-azonosítót.'], occurredAt: ['Érvénytelen időpont.'] });
  });
});
