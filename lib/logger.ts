type Level = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = levels[(process.env.LOG_LEVEL as Level) ?? 'info'] ?? levels.info;

function write(level: Level, message: string, fields?: Record<string, unknown>) {
  if (levels[level] < minLevel || process.env.LOG_LEVEL === 'silent') return;
  const entry = JSON.stringify({ time: new Date().toISOString(), level, msg: message, ...fields }, (_key, value) =>
    value instanceof Error ? { name: value.name, message: value.message } : value,
  );
  if (level === 'error' || level === 'warn') console.error(entry);
  else console.log(entry);
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => write('debug', message, fields),
  info: (message: string, fields?: Record<string, unknown>) => write('info', message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => write('warn', message, fields),
  error: (message: string, fields?: Record<string, unknown>) => write('error', message, fields),
};
