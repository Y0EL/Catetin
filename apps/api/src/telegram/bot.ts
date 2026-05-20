import { Bot } from 'grammy'
import { registerHandlers } from './handlers'

export function createTelegramBot(token: string) {
  const bot = new Bot(token)
  registerHandlers(bot)
  return bot
}

export type CatetinBot = ReturnType<typeof createTelegramBot>
