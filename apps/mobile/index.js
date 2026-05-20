if (typeof globalThis !== 'undefined' && globalThis.__reanimatedLoggerConfig === undefined) {
  globalThis.__reanimatedLoggerConfig = { strict: false, level: 'warn' }
}

require('expo-router/entry')
