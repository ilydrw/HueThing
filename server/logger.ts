import fs from 'fs';

const LOG_FILE = 'debug.log';

function writeLog(scope: string, level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  const formatted = `[${new Date().toISOString()}] [${level}] [${scope}] ${message}`;
  console.log(formatted);

  try {
    fs.appendFileSync(LOG_FILE, `${formatted}\n`);
  } catch (error) {
    console.error('[HueThing] Failed to write debug log:', error);
  }
}

export function createLogger(scope: string) {
  return {
    info: (message: string) => writeLog(scope, 'INFO', message),
    warn: (message: string) => writeLog(scope, 'WARN', message),
    error: (message: string) => writeLog(scope, 'ERROR', message)
  };
}
