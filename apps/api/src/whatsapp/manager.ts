import type { Boom } from '@hapi/boom'
import {
  DisconnectReason,
  makeWASocket,
  type ConnectionState,
  type WAMessage,
  type WASocket,
} from 'baileys'
import { eq, isNotNull } from 'drizzle-orm'
import { whatsappSessions, type Database } from '@catetin/db'
import { logger as appLogger } from '../logger'
import { clearAuthState, makeDbAuthState } from './auth-state'
import { handleIncomingMessage } from './handler'

type Mode = 'pairing' | 'connected' | 'disconnected'

type SessionState = {
  userId: string
  mode: Mode
  qrDataUrl: string | null
  pairingCode: string | null
  pendingPhoneNumber: string | null
  socket: WASocket | null
  jid: string | null
  startedAt: number
  silentLogger: ReturnType<typeof makeSilentLogger>
  reconnectTimer: ReturnType<typeof setTimeout> | null
  reconnectAttempts: number
}

const sessions = new Map<string, SessionState>()
let dbRef: Database | null = null

function makeSilentLogger() {
  const noop = () => undefined
  const base = {
    level: 'silent',
    trace: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    fatal: noop,
    child() {
      return base
    },
  }
  return base
}

async function refreshLastSeen(db: Database, userId: string) {
  await db
    .update(whatsappSessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(whatsappSessions.userId, userId))
}

async function startSocket(
  db: Database,
  userId: string,
  initial: boolean,
  phoneNumber?: string,
): Promise<SessionState> {
  const existing = sessions.get(userId)
  if (existing && existing.socket && existing.mode !== 'disconnected') return existing

  const silentLogger = existing?.silentLogger ?? makeSilentLogger()
  const { state, saveCreds } = await makeDbAuthState(db, userId)
  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: silentLogger,
    syncFullHistory: false,
    markOnlineOnConnect: false,
  })

  const session: SessionState = existing ?? {
    userId,
    mode: initial && state.creds.registered ? 'connected' : 'pairing',
    qrDataUrl: null,
    pairingCode: null,
    pendingPhoneNumber: null,
    socket: null,
    jid: state.creds.me?.id ?? null,
    startedAt: Date.now(),
    silentLogger,
    reconnectTimer: null,
    reconnectAttempts: 0,
  }

  if (phoneNumber && !state.creds.registered) {
    session.pendingPhoneNumber = phoneNumber
    session.pairingCode = null
  }
  session.socket = socket
  session.mode = state.creds.registered ? 'connected' : 'pairing'
  sessions.set(userId, session)

  socket.ev.on('creds.update', () => {
    void saveCreds()
  })

  socket.ev.on('connection.update', (update: Partial<ConnectionState>) => {
    void handleConnectionUpdate(db, userId, update)
  })

  socket.ev.on('messages.upsert', (event) => {
    if (event.type !== 'notify') return
    for (const msg of event.messages) {
      void safeHandle(db, userId, msg)
    }
  })

  return session
}

async function safeHandle(db: Database, userId: string, msg: WAMessage) {
  try {
    const session = sessions.get(userId)
    if (!session || !session.socket) return
    await handleIncomingMessage(db, userId, session.socket, msg)
    await refreshLastSeen(db, userId)
  } catch (err) {
    appLogger.error({ err, userId }, 'wa message handle gagal')
  }
}

async function handleConnectionUpdate(
  db: Database,
  userId: string,
  update: Partial<ConnectionState>,
) {
  const session = sessions.get(userId)
  if (!session) return

  if (update.qr) {
    if (session.pendingPhoneNumber && session.socket) {
      const phone = session.pendingPhoneNumber
      session.pendingPhoneNumber = null
      try {
        const code = await session.socket.requestPairingCode(phone)
        session.pairingCode = code
        session.mode = 'pairing'
        appLogger.info({ userId }, 'pairing code didapat')
      } catch (err) {
        appLogger.error({ err, userId }, 'gagal request pairing code')
      }
    }
  }

  if (update.connection === 'open') {
    session.qrDataUrl = null
    session.mode = 'connected'
    session.reconnectAttempts = 0
    session.jid = session.socket?.user?.id ?? session.jid
    await db
      .update(whatsappSessions)
      .set({ jid: session.jid, linkedAt: new Date(), lastSeenAt: new Date() })
      .where(eq(whatsappSessions.userId, userId))
    appLogger.info({ userId, jid: session.jid }, 'wa session ke-link')
  }

  if (update.connection === 'close') {
    const reason = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode
    session.mode = 'disconnected'
    session.socket = null
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer)
      session.reconnectTimer = null
    }
    if (reason === DisconnectReason.loggedOut) {
      sessions.delete(userId)
      await clearAuthState(db, userId)
      appLogger.info({ userId }, 'wa session logout')
      return
    }
    session.reconnectAttempts += 1
    if (session.reconnectAttempts > 2) {
      sessions.delete(userId)
      await clearAuthState(db, userId)
      appLogger.warn(
        { userId },
        'wa session berhenti, max reconnect tercapai - pair ulang dari app',
      )
      return
    }
    appLogger.warn(
      { userId, reason, attempt: session.reconnectAttempts },
      'wa session putus, retry sebentar lagi',
    )
    session.reconnectTimer = setTimeout(() => {
      session.reconnectTimer = null
      if (!sessions.has(userId)) return
      void startSocket(db, userId, false).catch((err) =>
        appLogger.error({ err, userId }, 'wa reconnect gagal'),
      )
    }, 5000)
  }
}

export function setWhatsappDb(db: Database): void {
  dbRef = db
}

export async function startPairing(
  userId: string,
  phoneNumber: string,
): Promise<{ mode: Mode; pairingCode: string | null; jid: string | null }> {
  if (!dbRef) throw new Error('WhatsApp manager belum di-init')
  const session = await startSocket(dbRef, userId, false, phoneNumber)
  return { mode: session.mode, pairingCode: session.pairingCode, jid: session.jid }
}

export function getPairingStatus(userId: string): {
  mode: Mode
  pairingCode: string | null
  jid: string | null
} {
  const session = sessions.get(userId)
  if (!session) return { mode: 'disconnected', pairingCode: null, jid: null }
  return { mode: session.mode, pairingCode: session.pairingCode, jid: session.jid }
}

export async function unlinkUser(userId: string): Promise<void> {
  if (!dbRef) throw new Error('WhatsApp manager belum di-init')
  const session = sessions.get(userId)
  if (session?.reconnectTimer) {
    clearTimeout(session.reconnectTimer)
    session.reconnectTimer = null
  }
  sessions.delete(userId)
  if (session?.socket) {
    try {
      await session.socket.logout()
    } catch {
      // sudah putus, lanjut hapus creds aja
    }
  }
  await clearAuthState(dbRef, userId)
}

export async function restoreActiveSessions(db: Database): Promise<void> {
  setWhatsappDb(db)
  const rows = await db
    .select({ userId: whatsappSessions.userId })
    .from(whatsappSessions)
    .where(isNotNull(whatsappSessions.linkedAt))
  for (const row of rows) {
    try {
      await startSocket(db, row.userId, true)
    } catch (err) {
      appLogger.error({ err, userId: row.userId }, 'wa restore session gagal')
    }
  }
  appLogger.info({ count: rows.length }, 'wa sessions di-restore')
}
