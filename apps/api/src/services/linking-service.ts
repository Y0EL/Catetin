import { and, eq, gt, isNull } from 'drizzle-orm'
import { channelLinks, linkingCodes, type Database } from '@catetin/db'

const CODE_TTL_MS = 15 * 60 * 1000
const CODE_LENGTH = 6
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export type ChannelName = 'telegram' | 'whatsapp'

export type LinkResult =
  | { status: 'linked'; userId: string }
  | { status: 'already' }
  | { status: 'invalid' }

function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length))
  }
  return out
}

export async function createLinkingCode(
  db: Database,
  userId: string,
): Promise<{ code: string; expiresAt: Date }> {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  await db.insert(linkingCodes).values({ code, userId, expiresAt })
  return { code, expiresAt }
}

export async function resolveUserByChannel(
  db: Database,
  channel: ChannelName,
  externalId: string,
): Promise<string | null> {
  const rows = await db
    .select({ userId: channelLinks.userId })
    .from(channelLinks)
    .where(and(eq(channelLinks.channel, channel), eq(channelLinks.externalId, externalId)))
    .limit(1)
  return rows[0]?.userId ?? null
}

export async function consumeLinkingCode(
  db: Database,
  rawCode: string,
  channel: ChannelName,
  externalId: string,
): Promise<LinkResult> {
  const existing = await resolveUserByChannel(db, channel, externalId)
  if (existing) return { status: 'already' }

  const code = rawCode.trim().toUpperCase()
  const rows = await db
    .select({ userId: linkingCodes.userId })
    .from(linkingCodes)
    .where(
      and(
        eq(linkingCodes.code, code),
        isNull(linkingCodes.usedAt),
        gt(linkingCodes.expiresAt, new Date()),
      ),
    )
    .limit(1)

  const row = rows[0]
  if (!row) return { status: 'invalid' }

  await db.insert(channelLinks).values({ userId: row.userId, channel, externalId })
  await db.update(linkingCodes).set({ usedAt: new Date() }).where(eq(linkingCodes.code, code))
  return { status: 'linked', userId: row.userId }
}
