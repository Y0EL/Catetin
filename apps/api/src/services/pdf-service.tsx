import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { categories, transactions, users, wallets, type Database } from '@catetin/db'
import { formatRupiah } from '@catetin/chat-core'
import { getMonthSummary, monthToRange } from './transaction-service'

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#18181b' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
  },
  brand: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
  brandSub: { fontSize: 9, color: '#71717a', marginTop: 2 },
  periodBox: { alignItems: 'flex-end' },
  periodLabel: { fontSize: 9, color: '#71717a' },
  periodValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#52525b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 6,
  },
  summaryLabel: { fontSize: 9, color: '#71717a' },
  summaryValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catBarTrack: {
    height: 4,
    backgroundColor: '#f4f4f5',
    borderRadius: 2,
    marginTop: 3,
  },
  catBarFill: { height: 4, backgroundColor: '#18181b', borderRadius: 2 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e4e4e7',
  },
  colDate: { width: 60 },
  colDesc: { flex: 1, paddingRight: 8 },
  colCat: { width: 70 },
  colWallet: { width: 60 },
  colAmount: { width: 70, textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#a1a1aa',
  },
})

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function formatPeriod(month: string): string {
  const [yStr, mStr] = month.split('-')
  const y = Number.parseInt(yStr ?? '0', 10)
  const m = Number.parseInt(mStr ?? '0', 10)
  return `${MONTH_NAMES[m - 1] ?? ''} ${y}`
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

type TxRow = {
  occurredAt: Date
  kind: 'income' | 'expense' | 'transfer'
  amount: number
  description: string | null
  merchant: string | null
  categoryName: string
  walletName: string
}

function Statement({
  userName,
  month,
  income,
  expense,
  byCategory,
  rows,
}: {
  userName: string
  month: string
  income: number
  expense: number
  byCategory: { name: string; total: number }[]
  rows: TxRow[]
}) {
  const net = income - expense
  const topCats = byCategory.slice(0, 6)
  const biggest = Math.max(1, ...topCats.map((c) => c.total))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Catetin</Text>
            <Text style={styles.brandSub}>Laporan keuangan bulanan {userName}</Text>
          </View>
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>Periode</Text>
            <Text style={styles.periodValue}>{formatPeriod(month)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ringkasan</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pemasukan</Text>
              <Text style={styles.summaryValue}>{formatRupiah(income)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pengeluaran</Text>
              <Text style={styles.summaryValue}>{formatRupiah(expense)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Net</Text>
              <Text style={styles.summaryValue}>{formatRupiah(net)}</Text>
            </View>
          </View>
        </View>

        {topCats.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top kategori pengeluaran</Text>
            {topCats.map((c) => {
              const pct = Math.round((c.total / biggest) * 100)
              return (
                <View key={c.name} style={{ marginBottom: 8 }}>
                  <View style={styles.catRow}>
                    <Text>{capitalize(c.name)}</Text>
                    <Text>{formatRupiah(c.total)}</Text>
                  </View>
                  <View style={styles.catBarTrack}>
                    <View style={[styles.catBarFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              )
            })}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaksi</Text>
          <View style={styles.tableHead}>
            <Text style={styles.colDate}>Tanggal</Text>
            <Text style={styles.colDesc}>Deskripsi</Text>
            <Text style={styles.colCat}>Kategori</Text>
            <Text style={styles.colWallet}>Wallet</Text>
            <Text style={styles.colAmount}>Nominal</Text>
          </View>
          {rows.map((r, i) => {
            const sign = r.kind === 'income' ? '+' : '-'
            const desc = r.description ?? r.merchant ?? 'Transaksi'
            return (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={styles.colDate}>{r.occurredAt.toISOString().slice(0, 10)}</Text>
                <Text style={styles.colDesc}>{desc}</Text>
                <Text style={styles.colCat}>{capitalize(r.categoryName)}</Text>
                <Text style={styles.colWallet}>{r.walletName}</Text>
                <Text style={styles.colAmount}>
                  {sign}
                  {formatRupiah(r.amount)}
                </Text>
              </View>
            )
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text>catetin.app</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

export async function buildMonthlyPdf(
  db: Database,
  userId: string,
  month: string,
): Promise<Buffer> {
  const { start, end } = monthToRange(month)

  const userRows = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  const userName = userRows[0]?.name ?? userRows[0]?.email ?? ''

  const summary = await getMonthSummary(db, userId, month)

  const txRows = await db
    .select({
      occurredAt: transactions.occurredAt,
      kind: transactions.kind,
      amount: transactions.amount,
      description: transactions.description,
      merchant: transactions.merchant,
      categoryName: categories.name,
      walletName: wallets.name,
    })
    .from(transactions)
    .innerJoin(categories, eq(categories.id, transactions.categoryId))
    .innerJoin(wallets, eq(wallets.id, transactions.walletId))
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, start),
        lt(transactions.occurredAt, end),
      ),
    )
    .orderBy(asc(transactions.occurredAt))

  return await renderToBuffer(
    <Statement
      userName={userName}
      month={month}
      income={summary.income}
      expense={summary.expense}
      byCategory={summary.byCategory.map((c) => ({ name: c.name, total: c.total }))}
      rows={txRows}
    />,
  )
}
