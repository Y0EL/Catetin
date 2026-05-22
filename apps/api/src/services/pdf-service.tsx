import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { and, asc, eq, gte, lt } from 'drizzle-orm'
import { categories, transactions, users, wallets, type Database } from '@catetin/db'
import { formatRupiah } from '@catetin/chat-core'
import { getMonthSummary, monthToRange } from './transaction-service'

const INDIGO = '#4f46e5'
const DARK = '#18181b'
const MUTED = '#71717a'
const BORDER = '#e4e4e7'
const ZEBRA = '#f4f4f5'

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 36,
    paddingTop: 0,
    paddingBottom: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: DARK,
  },
  accentBar: { height: 5, backgroundColor: INDIGO, marginHorizontal: -36 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: INDIGO },
  brandSub: { fontSize: 9, color: MUTED, marginTop: 3 },
  periodBox: { alignItems: 'flex-end' },
  periodLabel: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 1 },
  periodValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  summaryGrid: { flexDirection: 'row', gap: 10 },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
  },
  summaryCardAccent: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: INDIGO,
    borderRadius: 4,
    backgroundColor: '#eef2ff',
  },
  summaryLabel: { fontSize: 8, color: MUTED },
  summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  summaryValueNet: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 4, color: INDIGO },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catBarTrack: { height: 3, backgroundColor: BORDER, borderRadius: 2, marginTop: 3 },
  catBarFill: { height: 3, backgroundColor: INDIGO, borderRadius: 2 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 6,
    backgroundColor: DARK,
    borderRadius: 3,
  },
  tableHeadText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: '#ffffff' },
  tableRowEven: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: ZEBRA,
  },
  colDate: { width: 58 },
  colDesc: { flex: 1, paddingRight: 6 },
  colCat: { width: 68 },
  colType: { width: 44 },
  colWallet: { width: 58 },
  colAmount: { width: 72, textAlign: 'right' },
  typeKredit: { fontSize: 9, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  typeDebit: { fontSize: 9, color: MUTED },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#a1a1aa',
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
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

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
        <View style={styles.accentBar} fixed />

        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>Catetin</Text>
            <Text style={styles.brandSub}>Laporan keuangan bulanan — {userName}</Text>
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
              <Text style={styles.summaryLabel}>Total Kredit</Text>
              <Text style={styles.summaryValue}>{formatRupiah(income)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total Debit</Text>
              <Text style={styles.summaryValue}>{formatRupiah(expense)}</Text>
            </View>
            <View style={styles.summaryCardAccent}>
              <Text style={styles.summaryLabel}>Selisih</Text>
              <Text style={styles.summaryValueNet}>{formatRupiah(net)}</Text>
            </View>
          </View>
        </View>

        {topCats.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top kategori pengeluaran</Text>
            {topCats.map((c) => {
              const pct = Math.round((c.total / biggest) * 100)
              return (
                <View key={c.name} style={{ marginBottom: 9 }}>
                  <View style={styles.catRow}>
                    <Text>{capitalize(c.name)}</Text>
                    <Text style={{ color: MUTED }}>{formatRupiah(c.total)}</Text>
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
          <Text style={styles.sectionTitle}>Riwayat transaksi</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colDate]}>Tanggal</Text>
            <Text style={[styles.tableHeadText, styles.colDesc]}>Keterangan</Text>
            <Text style={[styles.tableHeadText, styles.colCat]}>Kategori</Text>
            <Text style={[styles.tableHeadText, styles.colType]}>Tipe</Text>
            <Text style={[styles.tableHeadText, styles.colWallet]}>Sumber</Text>
            <Text style={[styles.tableHeadText, styles.colAmount]}>Nominal (Rp)</Text>
          </View>
          {rows.map((r, i) => {
            const isEven = i % 2 === 0
            const isKredit = r.kind === 'income'
            const desc = r.description ?? r.merchant ?? 'Transaksi'
            return (
              <View key={i} style={isEven ? styles.tableRowEven : styles.tableRowOdd} wrap={false}>
                <Text style={[{ fontSize: 9, color: MUTED }, styles.colDate]}>
                  {formatDate(r.occurredAt)}
                </Text>
                <Text style={[{ fontSize: 9 }, styles.colDesc]}>{desc}</Text>
                <Text style={[{ fontSize: 9, color: MUTED }, styles.colCat]}>
                  {capitalize(r.categoryName)}
                </Text>
                <Text style={[isKredit ? styles.typeKredit : styles.typeDebit, styles.colType]}>
                  {isKredit ? 'Kredit' : 'Debit'}
                </Text>
                <Text style={[{ fontSize: 9, color: MUTED }, styles.colWallet]}>
                  {r.walletName}
                </Text>
                <Text
                  style={[
                    {
                      fontSize: 9,
                      fontFamily: isKredit ? 'Helvetica-Bold' : 'Helvetica',
                      color: isKredit ? DARK : DARK,
                    },
                    styles.colAmount,
                  ]}
                >
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
