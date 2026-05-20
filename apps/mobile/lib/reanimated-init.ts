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

export {}
