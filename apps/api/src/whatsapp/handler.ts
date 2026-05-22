import type { WAMessage, WASocket } from 'baileys'
import type { Database } from '@catetin/db'
import { logger as appLogger } from '../logger'
import { runAgentTurn, type AgentTurn } from '../services/gemini-agent'

const sentIds = new Map<string, number>()
const SENT_TTL_MS = 5 * 60 * 1000
const MESSAGE_FRESHNESS_MS = 60 * 1000

function pruneSent() {
  const now = Date.now()
  for (const [id, t] of sentIds) {
    if (now - t > SENT_TTL_MS) sentIds.delete(id)
  }
}

function extractText(msg: WAMessage): string | null {
  const m = msg.message
  if (!m) return null
  if (typeof m.conversation === 'string' && m.conversation.length > 0) return m.conversation
  const ext = m.extendedTextMessage
  if (ext && typeof ext.text === 'string' && ext.text.length > 0) return ext.text
  const img = m.imageMessage
  if (img && typeof img.caption === 'string' && img.caption.length > 0) return img.caption
  return null
}

function isSelfChat(socket: WASocket, msg: WAMessage): boolean {
  const me = socket.user?.id
  if (!me) return false
  const meBase = me.split(':')[0]?.split('@')[0]
  const remote = msg.key.remoteJid ?? ''
  const remoteBase = remote.split('@')[0]
  return !!meBase && meBase === remoteBase
}

export async function handleIncomingMessage(
  db: Database,
  userId: string,
  socket: WASocket,
  msg: WAMessage,
): Promise<void> {
  pruneSent()
  if (!msg.key.id) return
  if (sentIds.has(msg.key.id)) {
    sentIds.delete(msg.key.id)
    return
  }
  if (!isSelfChat(socket, msg)) return
  if (typeof msg.messageTimestamp === 'number') {
    const ageMs = Date.now() - msg.messageTimestamp * 1000
    if (ageMs > MESSAGE_FRESHNESS_MS) return
  }

  const text = extractText(msg)
  if (!text) return

  const remoteJid = msg.key.remoteJid
  if (!remoteJid) return

  try {
    const turn: AgentTurn = {
      conversationId: `wa:${userId}`,
      userId,
      channel: 'whatsapp',
      parts: [{ text }],
    }
    const reply = await runAgentTurn(turn)
    const result = await socket.sendMessage(remoteJid, { text: reply })
    if (result?.key.id) sentIds.set(result.key.id, Date.now())
    void db
  } catch (err) {
    appLogger.error({ err, userId }, 'wa agent gagal nge-reply')
    try {
      await socket.sendMessage(remoteJid, { text: 'Lagi ada gangguan, coba sebentar lagi ya.' })
    } catch {
      // give up, network bermasalah
    }
  }
}
