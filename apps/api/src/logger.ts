import { pino, type LoggerOptions } from 'pino'
import { loadEnv } from './env'

const env = loadEnv()

const options: LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token', '*.secret'],
}

if (env.NODE_ENV === 'development') {
  options.transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
}

export const logger = pino(options)
