import { pino } from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

async function main() {
  logger.info('Catetin WhatsApp bot booting')
  logger.warn('Implementation pending: Baileys QR session, message handler, linking flow')
}

main().catch((err: unknown) => {
  logger.error({ err }, 'fatal error')
  process.exit(1)
})
