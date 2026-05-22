import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import {
  companionChatSchema,
  companionHistoryQuerySchema,
  companionTurnSchema,
  endCompanionSessionSchema,
} from '@catetin/types'
import type { AppEnv } from '../context'
import { getDb } from '../db'
import { requireAuth } from '../middleware/auth'
import { logger } from '../logger'
import {
  clearSessionHistory,
  generateUmbrielTts,
  runCompanionChatTurn,
  runCompanionTurn,
} from '../services/companion-agent-service'
import {
  assertSessionOwnedAndActive,
  deleteAllCompanionMessages,
  endCompanionSession,
  getCompanionHistory,
  getCompanionQuota,
  saveCompanionMessages,
  startCompanionSession,
} from '../services/companion-service'

export const companionRouter = new Hono<AppEnv>()
companionRouter.use('*', requireAuth)

companionRouter.get('/quota', async (c) => {
  const db = getDb()
  const quota = await getCompanionQuota(db, c.get('userId'))
  return c.json({ ok: true, quota })
})

companionRouter.post('/start', async (c) => {
  const db = getDb()
  const session = await startCompanionSession(db, c.get('userId'))
  return c.json({ ok: true, ...session })
})

companionRouter.post('/turn', zValidator('json', companionTurnSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { sessionId, audio, mimeType } = c.req.valid('json')
  await assertSessionOwnedAndActive(db, userId, sessionId)

  const result = await runCompanionTurn({ userId, sessionId, audio: { data: audio, mimeType } })

  let wavBase64: string | undefined
  try {
    wavBase64 = await generateUmbrielTts(result.text)
  } catch (err) {
    logger.warn({ err }, 'TTS generation failed, returning text-only')
  }

  await saveCompanionMessages(db, userId, [
    { role: 'user', content: '[Pesan suara]', source: 'voice' },
    { role: 'model', content: result.text, source: 'voice' },
  ]).catch((err) => logger.warn({ err }, 'failed to save voice turn messages'))

  return c.json({ ok: true, text: result.text, audio: wavBase64, mimeType: 'audio/wav' })
})

companionRouter.post('/end', zValidator('json', endCompanionSessionSchema), async (c) => {
  const db = getDb()
  const { sessionId } = c.req.valid('json')
  await endCompanionSession(db, c.get('userId'), sessionId)
  clearSessionHistory(sessionId)
  return c.json({ ok: true })
})

companionRouter.post('/chat', zValidator('json', companionChatSchema), async (c) => {
  const db = getDb()
  const userId = c.get('userId')
  const { message } = c.req.valid('json')

  const dbHistory = await getCompanionHistory(db, userId, 20)
  const history = dbHistory.map((m) => ({ role: m.role, content: m.content }))

  return streamSSE(c, async (stream) => {
    let fullText = ''
    try {
      await runCompanionChatTurn(userId, message, history, async (chunk) => {
        fullText += chunk
        await stream.writeSSE({ data: JSON.stringify({ chunk }) })
      })
      await stream.writeSSE({ data: JSON.stringify({ done: true }) })
    } catch (err) {
      logger.error({ err, userId }, 'companion chat stream error')
      await stream.writeSSE({ data: JSON.stringify({ error: 'Gagal memproses pesan.' }) })
      return
    }

    if (fullText) {
      await saveCompanionMessages(db, userId, [
        { role: 'user', content: message, source: 'chat' },
        { role: 'model', content: fullText, source: 'chat' },
      ]).catch((err) => logger.warn({ err }, 'failed to save chat messages'))
    }
  })
})

companionRouter.get('/history', zValidator('query', companionHistoryQuerySchema), async (c) => {
  const db = getDb()
  const { limit, before } = c.req.valid('query')
  const messages = await getCompanionHistory(
    db,
    c.get('userId'),
    limit,
    before ? new Date(before) : undefined,
  )
  return c.json({ ok: true, messages })
})

companionRouter.delete('/history', async (c) => {
  const db = getDb()
  await deleteAllCompanionMessages(db, c.get('userId'))
  return c.json({ ok: true })
})
