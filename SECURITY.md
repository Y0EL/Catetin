# Kebijakan Keamanan — Catetin

Dokumen ini menguraikan kebijakan keamanan, perlindungan data pribadi, dan batas tanggung jawab yang berlaku pada aplikasi Catetin (selanjutnya disebut "Aplikasi"), mencakup platform mobile (Android/iOS), antarmuka web, layanan API backend, serta bot Telegram. Kebijakan ini disusun mengacu pada peraturan perundang-undangan Indonesia dan regulasi internasional yang berlaku.

---

## 1. Ruang Lingkup

Kebijakan ini berlaku untuk:

- Pengguna terdaftar Aplikasi Catetin (aplikasi mobile dan web)
- Data yang diproses melalui layanan API (`catetin-api.fly.dev`)
- Integrasi pihak ketiga: Google Firebase Authentication, Google OAuth 2.0, RevenueCat, Expo Application Services (EAS), Telegram Bot API
- Data yang disimpan di basis data Neon PostgreSQL

---

## 2. Data yang Dikumpulkan dan Tujuan Pemrosesan

| Kategori Data      | Contoh                                     | Tujuan                                                    |
| ------------------ | ------------------------------------------ | --------------------------------------------------------- |
| Identitas          | Nama, alamat email, foto profil Google     | Autentikasi dan identifikasi akun                         |
| Keuangan pribadi   | Nominal transaksi, kategori, deskripsi     | Inti layanan pencatatan keuangan                          |
| Konten unggahan    | Foto struk, rekaman suara                  | OCR dan fitur voice companion                             |
| Data teknis        | Token perangkat, log aktivitas, session ID | Keamanan, notifikasi, debugging                           |
| Data saluran       | Telegram chat ID, nomor WhatsApp           | Integrasi bot pencatatan                                  |
| Data percakapan AI | Riwayat chat companion                     | Konteks percakapan, tidak digunakan untuk pelatihan model |

Pemrosesan data dilakukan berdasarkan **persetujuan eksplisit pengguna** (consent) yang diberikan pada saat onboarding. Pengguna dapat menarik persetujuan kapan saja melalui menu Pengaturan.

---

## 3. Dasar Hukum — Peraturan Indonesia

### 3.1 Undang-Undang Informasi dan Transaksi Elektronik (UU ITE)

Catetin beroperasi sesuai dengan:

**UU No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 jo. UU No. 1 Tahun 2024 tentang Informasi dan Transaksi Elektronik**

Ketentuan yang berlaku langsung:

- **Pasal 26**: Penggunaan data pribadi seseorang melalui media elektronik wajib mendapat persetujuan orang yang bersangkutan. Catetin tidak membagikan data pengguna kepada pihak ketiga tanpa persetujuan eksplisit.
- **Pasal 32**: Larangan mengubah, menambah, mengurangi, memindahkan, atau menyembunyikan informasi elektronik milik orang lain. Seluruh data pengguna di Catetin bersifat pribadi dan terlindungi akses berbasis token autentikasi Firebase.
- **Pasal 40**: Pemerintah berwenang melakukan pengawasan terhadap Penyelenggara Sistem Elektronik. Catetin bersedia memenuhi permintaan akses yang sah dari aparat penegak hukum sesuai prosedur hukum yang berlaku.

### 3.2 UU Pelindungan Data Pribadi (UU PDP)

**UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi**

UU PDP adalah kerangka hukum perlindungan data yang komprehensif di Indonesia. Catetin memenuhi prinsip-prinsip berikut:

| Prinsip UU PDP                           | Implementasi di Catetin                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------- |
| **Terbatas dan spesifik** (Pasal 16)     | Data dikumpulkan hanya untuk tujuan yang dinyatakan secara eksplisit             |
| **Akurasi** (Pasal 16)                   | Pengguna dapat mengedit dan menghapus data kapan saja                            |
| **Penyimpanan terbatas** (Pasal 16)      | Data dihapus otomatis setelah akun ditutup dalam 30 hari                         |
| **Keamanan** (Pasal 35)                  | Enkripsi transit (TLS 1.3), enkripsi at-rest di Neon PostgreSQL                  |
| **Hak subjek data** (Pasal 5–14)         | Pengguna dapat mengakses, mengunduh, dan menghapus seluruh data                  |
| **Pemberitahuan pelanggaran** (Pasal 46) | Pengguna dan otoritas diberitahu maksimal 14 hari setelah pelanggaran terdeteksi |

Data pribadi yang dikategorikan **sensitif** menurut Pasal 4 UU PDP (termasuk data keuangan) mendapatkan perlindungan berlapis: autentikasi dua-faktor tersedia, akses API menggunakan Firebase ID Token berumur pendek (1 jam).

### 3.3 Peraturan Pemerintah tentang Sistem dan Transaksi Elektronik

**PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik**

- **Pasal 14**: Penyelenggara Sistem Elektronik (PSE) wajib menjaga kerahasiaan, keutuhan, dan ketersediaan data. Catetin menggunakan layanan cloud dengan SLA ketersediaan tinggi (Fly.io, Neon DB).
- **Pasal 22**: PSE lingkup privat yang melayani pengguna di Indonesia wajib mendaftarkan sistem elektroniknya. Catetin akan memproses pendaftaran PSE sesuai ketentuan yang berlaku.
- **Pasal 100**: Kewajiban pengelolaan insiden keamanan siber. Catetin memiliki prosedur respons insiden yang tercantum di Bagian 7 dokumen ini.

### 3.4 Peraturan Menteri Komunikasi dan Informatika

**Permenkominfo No. 20 Tahun 2016 tentang Perlindungan Data Pribadi dalam Sistem Elektronik**

- Perolehan dan pengumpulan data pribadi wajib berdasarkan persetujuan pemilik data.
- Pengelola sistem elektronik wajib memiliki kebijakan internal perlindungan data pribadi (dokumen ini).
- Penggunaan data pribadi hanya untuk tujuan yang dinyatakan saat perolehan.

### 3.5 Peraturan Presiden tentang Infrastruktur Informasi Vital

**Perpres No. 82 Tahun 2022 tentang Pelindungan Infrastruktur Informasi Vital**

Meskipun Catetin bukan operator infrastruktur informasi vital, Aplikasi mengikuti standar keamanan yang mengacu pada regulasi ini sebagai praktik terbaik untuk layanan digital yang menyimpan data keuangan pengguna.

---

## 4. Dasar Hukum — Regulasi Internasional

### 4.1 General Data Protection Regulation (GDPR)

**Regulation (EU) 2016/679 — berlaku untuk pengguna yang berdomisili di Uni Eropa**

Catetin berkomitmen memenuhi GDPR untuk pengguna EU:

| Hak GDPR                                               | Implementasi                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| **Right of Access** (Art. 15)                          | Export data lengkap tersedia via menu Pengaturan → Export CSV/PDF |
| **Right to Rectification** (Art. 16)                   | Edit transaksi dan profil kapan saja                              |
| **Right to Erasure / Right to be Forgotten** (Art. 17) | Hapus akun menghapus semua data dalam 30 hari                     |
| **Right to Data Portability** (Art. 20)                | Export CSV/PDF seluruh riwayat transaksi                          |
| **Right to Object** (Art. 21)                          | Batalkan persetujuan pemrosesan data AI companion kapan saja      |
| **Lawful basis of processing** (Art. 6)                | Consent (6.1.a) dan Legitimate interest (6.1.f) untuk keamanan    |

**Data Protection Officer (DPO):** Karena Catetin saat ini beroperasi dalam skala startup, fungsi DPO dijalankan oleh tim inti. Pengguna EU dapat mengirim permintaan terkait hak data ke: `privacy@catetin.app`

**Data Transfers:** Data disimpan di server yang berlokasi di wilayah US/EU (Fly.io, Neon DB). Transfer data lintas batas mengikuti mekanisme Standard Contractual Clauses (SCC) yang disetujui Komisi Eropa.

---

## 5. Langkah-Langkah Keamanan Teknis

### 5.1 Autentikasi dan Otorisasi

- Autentikasi menggunakan **Firebase Authentication** (Google Sign-In via OAuth 2.0 PKCE)
- Setiap request API divalidasi menggunakan **Firebase ID Token** (JWT, umur 1 jam)
- Token tidak disimpan di client storage yang dapat diakses JavaScript (tidak ada localStorage untuk token sensitif)
- Tidak ada password yang disimpan — autentikasi 100% delegasi ke Google

### 5.2 Enkripsi

- **Transit**: TLS 1.3 pada seluruh komunikasi client-server
- **At-rest**: Enkripsi database dikelola oleh Neon PostgreSQL (AES-256)
- **API Key**: Seluruh credential sensitif disimpan sebagai environment variable terenkripsi di Fly.io Secrets dan EAS Secrets — tidak pernah di-commit ke repository

### 5.3 Perlindungan Endpoint API

- Rate limiting aktif pada seluruh endpoint publik
- Validasi input menggunakan **Zod schema** di setiap boundary API
- SQL injection dicegah melalui **Drizzle ORM** dengan parameterized queries
- Tidak ada SQL mentah yang menggunakan input pengguna tanpa sanitasi

### 5.4 Keamanan Mobile (OWASP Mobile Top 10 2024)

Mengacu pada [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/):

| Risiko OWASP                              | Mitigasi                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| M1 - Improper Credential Usage            | Tidak menyimpan credential di device storage; menggunakan token sementara |
| M2 - Inadequate Supply Chain Security     | Dependency audit rutin; pnpm lockfile di-commit                           |
| M3 - Insecure Authentication              | Firebase OAuth 2.0 + PKCE; tidak ada password lokal                       |
| M4 - Insufficient Input/Output Validation | Zod validation pada semua input pengguna dan API response                 |
| M5 - Insecure Communication               | TLS 1.3 wajib; certificate pinning pada build produksi                    |
| M8 - Security Misconfiguration            | Environment variable dipisah dari kode sumber; tidak ada hardcoded secret |
| M9 - Insecure Data Storage                | Token dan data sensitif tidak disimpan di AsyncStorage tanpa enkripsi     |
| M10 - Insufficient Cryptography           | Enkripsi dikelola oleh platform (Firebase, Neon) dengan standar industri  |

### 5.5 Keamanan Data AI dan Voice Companion

- Rekaman suara **tidak disimpan secara permanen** — hanya diproses saat turn berlangsung dan dibuang setelahnya
- Teks percakapan companion disimpan hanya untuk konteks sesi dan dapat dihapus pengguna kapan saja
- Data percakapan **tidak digunakan untuk melatih model AI** pihak ketiga manapun
- Koneksi ke Gemini API menggunakan API key server-side — tidak pernah diekspos ke client

---

## 6. Hak Pengguna

Pengguna Catetin berhak atas:

1. **Akses data**: Seluruh transaksi dapat dilihat, difilter, dan diekspor
2. **Koreksi data**: Edit transaksi, profil, dan preferensi kapan saja
3. **Penghapusan data**: Hapus akun dari menu Pengaturan — semua data dihapus permanen dalam 30 hari
4. **Portabilitas data**: Export CSV dan PDF bank statement bulanan tersedia tanpa biaya tambahan
5. **Pembatasan pemrosesan**: Nonaktifkan fitur AI companion, bot Telegram/WhatsApp secara independen
6. **Pencabutan persetujuan**: Disconnect saluran (Telegram/WhatsApp) kapan saja tanpa kehilangan data utama

Untuk permintaan yang tidak dapat dilakukan melalui antarmuka Aplikasi, hubungi: `privacy@catetin.app`

---

## 7. Respons Insiden Keamanan

### 7.1 Klasifikasi Insiden

| Tingkat    | Deskripsi                                                     | Target Respons |
| ---------- | ------------------------------------------------------------- | -------------- |
| **Kritis** | Pelanggaran data massal, akses tidak sah ke database produksi | 4 jam          |
| **Tinggi** | Kebocoran token autentikasi, eksploitasi API aktif            | 24 jam         |
| **Sedang** | Bug keamanan yang belum dieksploitasi, misconfiguration       | 72 jam         |
| **Rendah** | Vulnerability teoritis, temuan audit                          | 14 hari        |

### 7.2 Prosedur Notifikasi

Sesuai **Pasal 46 UU PDP No. 27/2022**, jika terjadi pelanggaran data yang memengaruhi data pribadi pengguna:

- Pengguna yang terdampak diberitahu **maksimal 14 hari** setelah pelanggaran terdeteksi
- Laporan disampaikan kepada **Lembaga Pelindungan Data Pribadi** (LPDP) sesuai ketentuan
- Pengguna EU diberitahu dalam **72 jam** sesuai GDPR Pasal 33–34

### 7.3 Pelaporan Kerentanan

Jika menemukan kerentanan keamanan pada Aplikasi, harap laporkan secara bertanggung jawab:

- **Email**: `security@catetin.app`
- **Sertakan**: Deskripsi kerentanan, langkah reproduksi, dampak potensial, bukti konsep (opsional)
- **Jangan publikasikan** kerentanan sebelum patch dirilis (responsible disclosure — 90 hari)
- Tim keamanan akan merespons dalam **48 jam** pada hari kerja

Kami tidak menuntut peneliti keamanan yang melaporkan kerentanan dengan itikad baik sesuai panduan di atas.

---

## 8. Keterbatasan dan Pengecualian

- Catetin **tidak bertanggung jawab** atas keamanan perangkat pengguna yang sudah di-root/jailbreak
- Fitur WhatsApp (Baileys) beroperasi menggunakan nomor khusus dan tunduk pada Kebijakan Penggunaan Acceptable Use Policy WhatsApp/Meta
- Integrasi Telegram tunduk pada Kebijakan Privasi Telegram
- Layanan pihak ketiga (Firebase, RevenueCat, Fly.io, Neon) memiliki kebijakan keamanan dan privasi masing-masing

---

## 9. Pembaruan Kebijakan

Kebijakan ini dapat diperbarui sewaktu-waktu mengikuti perubahan regulasi atau praktik operasional. Perubahan material akan diberitahukan kepada pengguna aktif melalui notifikasi dalam Aplikasi minimal **30 hari** sebelum berlaku efektif.

Versi terbaru selalu tersedia di: `https://github.com/Y0EL/Catetin/blob/main/SECURITY.md`

---

## Referensi Regulasi

### Indonesia (Domain Resmi Kenegaraan)

- [UU No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik](https://peraturan.bpk.go.id/details/37589/uu-no-11-tahun-2008) — peraturan.bpk.go.id
- [UU No. 19 Tahun 2016 tentang Perubahan Atas UU ITE](https://peraturan.bpk.go.id/Details/37582/uu-no-19-tahun-2016) — peraturan.bpk.go.id
- [UU No. 1 Tahun 2024 tentang Perubahan Kedua Atas UU ITE](https://peraturan.go.id/id/uu-no-1-tahun-2024) — peraturan.go.id (DITJEN PP)
- [UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi](https://peraturan.go.id/id/uu-no-27-tahun-2022) — peraturan.go.id (DITJEN PP)
- [JDIH Kemkomdigi — UU No. 27 Tahun 2022](https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang+nomor+27+tahun+2022) — jdih.komdigi.go.id
- [JDIH Kemkomdigi — UU No. 19 Tahun 2016](https://jdih.komdigi.go.id/produk_hukum/view/id/555/t/undangundang+nomor+19+tahun+2016) — jdih.komdigi.go.id
- [PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik](https://peraturan.go.id/id/pp-no-71-tahun-2019) — peraturan.go.id (DITJEN PP)
- [JDIH Kominfo — PP No. 71 Tahun 2019](https://jdih.kominfo.go.id/produk_hukum/view/id/695/t/peraturan+pemerintah+nomor+71+tahun+2019+tanggal+10+oktober+2019) — jdih.kominfo.go.id
- [Permenkominfo No. 20 Tahun 2016 tentang Perlindungan Data Pribadi dalam Sistem Elektronik](https://peraturan.bpk.go.id/Details/150543/permenkominfo-no-20-tahun-2016) — peraturan.bpk.go.id
- [JDIH Kemkomdigi — Permenkominfo No. 20 Tahun 2016](https://jdih.komdigi.go.id/produk_hukum/view/id/553/t/peraturan+menteri+komunikasi+dan+informatika+nomor+20+tahun+2016+tanggal+1+desember+2016) — jdih.komdigi.go.id
- [Perpres No. 82 Tahun 2022 tentang Pelindungan Infrastruktur Informasi Vital](https://peraturan.go.id/id/perpres-no-82-tahun-2022) — peraturan.go.id (DITJEN PP)

### Internasional

- [Regulation (EU) 2016/679 — General Data Protection Regulation (GDPR)](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng) — eur-lex.europa.eu (EUR-Lex, Official EU Legal Database)
- [GDPR Full Text PDF](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679) — eur-lex.europa.eu
- [OWASP Mobile Top 10 2024](https://owasp.org/www-project-mobile-top-10/) — owasp.org
- [OWASP Mobile Top 10 2024 — Daftar Risiko](https://owasp.org/www-project-mobile-top-10/2023-risks/) — owasp.org
- [OWASP Top 10 Web Application Security Risks](https://owasp.org/www-project-top-ten/) — owasp.org
- [OWASP Mobile Application Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mobile_Application_Security_Cheat_Sheet.html) — cheatsheetseries.owasp.org

---

_Dokumen ini dibuat pada Mei 2026 dan akan ditinjau setiap 12 bulan atau sewaktu-waktu jika terdapat perubahan regulasi yang signifikan._
