import {
  DisconnectReason,
  makeWASocket,
  type ConnectionState,
  type WAMessage,
} from '@whiskeysockets/baileys'
import { pino } from 'pino'
import { createDatabase } from '@catetin/db'
import { makeFileAuthState } from './session'
import { handleLink, handlePhoto, handleText } from './handlers'

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' })

const DATABASE_URL = process.env.DATABASE_URL
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR ?? '.wa-session'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''

if (!DATABASE_URL) {
  logger.error('DATABASE_URL wajib diset di environment')
  process.exit(1)
}

const db = createDatabase(DATABASE_URL)

const sentIds = new Map<string, number>()

function pruneSent() {
  const now = Date.now()
  for (const [id, t] of sentIds) {
    if (now - t > 5 * 60 * 1000) sentIds.delete(id)
  }
}

function extractText(msg: WAMessage): string | null {
  const m = msg.message
  if (!m) return null
  if (typeof m.conversation === 'string' && m.conversation.length > 0) return m.conversation
  const ext = m.extendedTextMessage
  if (ext && typeof ext.text === 'string' && ext.text.length > 0) return ext.text
  return null
}

async function startBot(): Promise<void> {
  const { state, saveCreds } = await makeFileAuthState(SESSION_DIR)

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }) as never,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  })

  socket.ev.on('creds.update', () => void saveCreds())

  socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) logger.info('Scan QR di terminal pakai WhatsApp untuk login')
    if (connection === 'open') logger.info({ jid: socket.user?.id }, 'WhatsApp bot terhubung')
    if (connection === 'close') {
      const code = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
        ?.output?.statusCode
      if (code === DisconnectReason.loggedOut) {
        logger.warn('Bot logged out. Hapus folder .wa-session dan restart.')
        process.exit(1)
      }
      logger.warn({ code }, 'Koneksi putus, reconnect dalam 5 detik...')
      setTimeout(() => void startBot(), 5000)
    }
  })

  socket.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return
    for (const msg of messages) void route(msg)
  })

  async function route(msg: WAMessage): Promise<void> {
    pruneSent()
    if (!msg.key.id || msg.key.fromMe) return
    if (sentIds.has(msg.key.id)) {
      sentIds.delete(msg.key.id)
      return
    }

    const jid = msg.key.remoteJid ?? ''
    if (jid.endsWith('@g.us')) return

    if (
      typeof msg.messageTimestamp === 'number' &&
      Date.now() - msg.messageTimestamp * 1000 > 60_000
    )
      return

    const text = extractText(msg)
    if (text) {
      const lower = text.trim().toLowerCase()
      if (lower.startsWith('link ')) {
        await handleLink(db, socket, msg, lower.slice(5).trim())
      } else {
        await handleText(db, socket, msg, text)
      }
      return
    }

    if (msg.message?.imageMessage) {
      await handlePhoto(db, socket, msg, GEMINI_API_KEY)
    }
  }
}

void startBot()
