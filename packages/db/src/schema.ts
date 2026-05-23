import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const channelEnum = pgEnum('channel', ['telegram', 'whatsapp'])
export const walletTypeEnum = pgEnum('wallet_type', ['cash', 'bank', 'ewallet', 'credit', 'other'])
export const categoryKindEnum = pgEnum('category_kind', ['expense', 'income'])
export const transactionKindEnum = pgEnum('transaction_kind', ['expense', 'income', 'transfer'])
export const transactionSourceEnum = pgEnum('transaction_source', [
  'mobile',
  'telegram',
  'whatsapp',
  'ocr_photo',
  'ocr_video',
  'manual_chat',
  'split_bill',
])
export const confidenceEnum = pgEnum('confidence', ['high', 'medium', 'low'])
export const budgetPeriodEnum = pgEnum('budget_period', ['monthly', 'weekly'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').unique(),
  name: text('name'),
  phone: text('phone'),
  locale: text('locale').notNull().default('id-ID'),
  isSubscribed: boolean('is_subscribed').notNull().default(false),
  subscriptionExpiresAt: timestamp('subscription_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const channelLinks = pgTable(
  'channel_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: channelEnum('channel').notNull(),
    externalId: text('external_id').notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    channelExternalUnique: uniqueIndex('channel_links_channel_external_uq').on(
      t.channel,
      t.externalId,
    ),
  }),
)

export const linkingCodes = pgTable('linking_codes', {
  code: text('code').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
})

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: walletTypeEnum('type').notNull(),
  icon: text('icon'),
  color: text('color'),
  initialBalance: bigint('initial_balance', { mode: 'number' }).notNull().default(0),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  kind: categoryKindEnum('kind').notNull(),
  icon: text('icon'),
  color: text('color'),
  isPreset: boolean('is_preset').notNull().default(false),
})

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    kind: transactionKindEnum('kind').notNull(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    description: text('description'),
    merchant: text('merchant'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    source: transactionSourceEnum('source').notNull(),
    ocrConfidence: confidenceEnum('ocr_confidence'),
    rawPayload: jsonb('raw_payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userOccurredIdx: index('transactions_user_occurred_idx').on(t.userId, t.occurredAt),
    userCategoryIdx: index('transactions_user_category_idx').on(t.userId, t.categoryId),
  }),
)

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  period: budgetPeriodEnum('period').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  alertThreshold: smallint('alert_threshold').notNull().default(80),
  startsAt: date('starts_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const companionSessions = pgTable('companion_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationSec: integer('duration_sec'),
  wasSubscribed: boolean('was_subscribed').notNull().default(false),
})

export const companionMessages = pgTable(
  'companion_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    source: text('source').notNull().default('chat'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userCreatedIdx: index('companion_messages_user_created_idx').on(t.userId, t.createdAt),
  }),
)

export const whatsappSessions = pgTable('whatsapp_sessions', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  jid: text('jid'),
  creds: jsonb('creds'),
  keys: jsonb('keys').notNull().default({}),
  linkedAt: timestamp('linked_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
})

export const notificationPrefs = pgTable('notification_prefs', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  dailyReminder: boolean('daily_reminder').notNull().default(true),
  dailyTime: time('daily_time').notNull().default('20:00'),
  budgetAlerts: boolean('budget_alerts').notNull().default(true),
  weeklyRecap: boolean('weekly_recap').notNull().default(true),
  expoPushToken: text('expo_push_token'),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Wallet = typeof wallets.$inferSelect
export type NewWallet = typeof wallets.$inferInsert
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type ChannelLink = typeof channelLinks.$inferSelect
export type CompanionSession = typeof companionSessions.$inferSelect
export type WhatsappSession = typeof whatsappSessions.$inferSelect
export type NewWhatsappSession = typeof whatsappSessions.$inferInsert
export type CompanionMessage = typeof companionMessages.$inferSelect
export type NewCompanionMessage = typeof companionMessages.$inferInsert
