// Reanimated 4 ganti API logger ke configureReanimatedLogger.
// Tetap set global sebelum reanimated load sebagai fallback aman.
type ReanimatedLoggerConfig = {
  strict: boolean
  level: 'fatal' | 'error' | 'warn' | 'info' | 'debug'
}

declare global {
  var __reanimatedLoggerConfig: ReanimatedLoggerConfig | undefined
}

if (typeof globalThis !== 'undefined' && globalThis.__reanimatedLoggerConfig === undefined) {
  globalThis.__reanimatedLoggerConfig = { strict: false, level: 'warn' }
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
  const r = require('react-native-reanimated') as any
  if (typeof r.configureReanimatedLogger === 'function') {
    r.configureReanimatedLogger({
      level: r.ReanimatedLogLevel?.warn ?? 'warn',
      strict: false,
    })
  }
} catch {
  // ignore, fallback to global config
}

export {}
