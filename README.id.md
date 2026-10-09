# GuShot

[![test](https://github.com/rombyar/gushot/actions/workflows/test.yml/badge.svg)](https://github.com/rombyar/gushot/actions/workflows/test.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](README.md) · **Bahasa Indonesia**

GuShot (Guide User Shot) membuat screenshot untuk buku panduan aplikasi web. Halaman, login, dan klik ditulis di satu file JSON, lalu satu perintah memotret semuanya dengan ukuran yang sama, data sensitif di-blur, dan tombol yang dibahas diberi sorotan. Kalau tampilan aplikasi berubah, cukup jalankan ulang, tidak perlu memotret manual lagi.

![Demo GuShot: login, OTP, blur, sorotan, modal](demo/gushot-demo.gif)

## Isi

- [Kebutuhan](#kebutuhan)
- [Mulai cepat](#mulai-cepat)
- [Menulis config](#menulis-config)
- [Menjalankan](#menjalankan)
- [Dipakai lewat agen AI](#dipakai-lewat-agen-ai)
- [Masalah umum](#masalah-umum)
- [Berkontribusi](#berkontribusi)

## Kebutuhan

- Node.js 18 atau lebih baru
- Google Chrome atau Microsoft Edge (dicari otomatis; kalau tidak ketemu, isi `CHROME_PATH`)
- Aplikasi web yang mau dipotret, berjalan di alamat yang bisa dibuka browser (biasanya server lokal dengan data contoh)

Jalan di Windows, macOS, dan Linux.

## Mulai cepat

Ambil kodenya lalu pasang satu dependensinya (`puppeteer-core`, yang menjalankan Chrome yang sudah terpasang; tidak mengunduh browser baru):

```bash
git clone https://github.com/rombyar/gushot.git
cd gushot
npm install --omit=dev --prefix skills/guide-screenshots/scripts
```

Coba dengan aplikasi demo yang ada di repo:

```bash
cd demo
DEMO_PASSWORD=demo node ../skills/guide-screenshots/scripts/shot.cjs gushot.json
```

```
OK    screenshots/01_login.png
OK    screenshots/02_dashboard.png
OK    screenshots/03_new_order.png
OK    screenshots/04_mobile.png

Done: 4 OK, 0 failed. Output in /path/to/gushot/demo/screenshots
```

Gambarnya ada di `demo/screenshots/`; [demo/README.md](demo/README.md) menjelaskan setiap langkah config tersebut. Di Windows PowerShell, isi variabelnya dulu: `$env:DEMO_PASSWORD='demo'`, lalu jalankan perintah `node` yang sama.

## Menulis config

Config terdiri dari tiga bagian:

- **`sessions`**: cara login, berupa daftar langkah. Setiap sesi dijalankan sekali, lalu tab yang sudah login dipakai ulang oleh semua shot yang menyebut nama sesi itu.
- **`shots`**: daftar screenshot, urut sesuai panduan. Setiap shot membuka `url`, bisa menjalankan `steps` tambahan (membuka menu, mengisi form), lalu menyimpan `<name>.png`.
- **Pengaturan** di bagian atas: URL dasar aplikasi (`base`), folder hasil, ukuran layar, dan elemen yang selalu di-blur.

```json
{
  "base": "http://localhost:3000",
  "out": "screenshots",
  "alwaysBlur": [".customer-name", ".phone"],
  "sessions": {
    "admin": [
      { "open": "/login" },
      { "type": "#email", "text": "admin@example.com" },
      { "type": "#password", "text": "{{APP_PASSWORD}}" },
      { "click": "button[type=submit]" },
      { "wait": "nav" }
    ]
  },
  "shots": [
    { "name": "01_login", "url": "/login", "highlight": ["button[type=submit]"] },
    { "name": "02_dashboard", "session": "admin", "url": "/dashboard" },
    {
      "name": "03_pesanan_baru",
      "session": "admin",
      "url": "/orders",
      "steps": [{ "clickText": "New order" }, { "wait": ".modal" }],
      "element": ".modal"
    }
  ]
}
```

Yang paling sering dipakai:

| Di dalam shot | Fungsi |
|---|---|
| `highlight` | memberi kotak merah pada elemen yang dibahas di langkah panduan |
| `blur` | mem-blur elemen tambahan di shot ini (`alwaysBlur` berlaku untuk semua shot) |
| `element` | memotret satu elemen saja, misalnya modal atau form |
| `fullPage` | memotret seluruh halaman sampai bawah |
| `viewport` | ukuran layar khusus shot ini, misalnya `{ "width": 390, "height": 844 }` untuk HP |

| Langkah | Contoh |
|---|---|
| buka halaman | `{ "open": "/settings" }` |
| ketik | `{ "type": "#email", "text": "a@b.c" }` |
| klik | `{ "click": "#save" }` atau berdasarkan teks: `{ "clickText": "Simpan" }` |
| tunggu | `{ "wait": ".modal" }` (selector) atau `{ "wait": 1000 }` (ms) |
| kode OTP | `{ "otp": { "file": "logs/app.log", "pattern": "code: (\\d{6})", "into": "#otp" } }` |

Langkah OTP membaca kode terbaru dari file yang ditulis aplikasi saat development (log biasa atau log email), jadi login dengan kode dua langkah bisa jalan tanpa HP.

Selector memakai selector CSS biasa. Path di dalam config, seperti `out` dan `otp.file`, dihitung dari folder file config.

**Rahasia:** jangan tulis password di config. `{{APP_PASSWORD}}` diganti dengan isi variabel environment `APP_PASSWORD` saat config dibaca.

Semua kunci dan langkah, termasuk `select`, `press`, `scrollTo`, `hide`, `theme`, dan menjalankan perintah shell sebelum memotret: [REFERENCE.md](skills/guide-screenshots/references/REFERENCE.md) (bahasa Inggris). Contoh lengkap dengan OTP: [config.example.json](skills/guide-screenshots/assets/config.example.json).

Kunci config juga bisa ditulis dalam bahasa Indonesia (`buka`, `klik`, `sorot`, ...): [daftar alias](skills/guide-screenshots/references/aliases-id.md). Tambahkan `"lang": "id"` (atau env `SHOT_LANG=id`) supaya pesan terminal berbahasa Indonesia.

## Menjalankan

```bash
node <path>/shot.cjs panduan.json             # semua shot
node <path>/shot.cjs panduan.json 03 login    # hanya shot yang namanya mengandung "03" atau "login"
```

- Setiap shot mencetak `OK <file>` atau `FAIL <nama> - <alasan>`. Shot yang gagal tidak menghentikan yang lain.
- Kunci yang salah ketik memunculkan baris `WARN unknown key`, tidak diabaikan diam-diam.
- Kode keluar: `0` semua OK, `1` ada yang gagal, `2` dependensi belum dipasang.
- Tambahkan `"headless": false` di config untuk melihat browser saat bekerja.

## Dipakai lewat agen AI

GuShot juga sebuah [Agent Skill](https://agentskills.io): agen membaca kode aplikasi Anda untuk memahami alur login, menulis config, menjalankannya, lalu memeriksa hasilnya.

**Claude Code:**

```
/plugin marketplace add rombyar/gushot
/plugin install gushot@gushot
```

Lalu di proyek Anda: `/guide-screenshots buatkan screenshot halaman login dan dasbor`.

**Agen lain** yang mendukung Agent Skills: salin folder [`skills/guide-screenshots/`](skills/guide-screenshots/) ke folder skill agen tersebut. Semua yang dibutuhkan ada di folder itu.

Agennya harus bisa menjalankan perintah di komputer yang sama dengan aplikasi Anda (atau yang bisa mengaksesnya). Agen yang berjalan di sandbox cloud, misalnya chat di browser, tidak bisa membuka `localhost` Anda dan tidak punya Chrome.

## Masalah umum

| Masalah | Kemungkinan penyebab |
|---|---|
| Halaman tampil tanpa CSS | Pengaturan URL dasar aplikasi (misalnya `APP_URL`) tidak sama dengan `base` |
| `OTP not found` | Kode terkirim ke email atau SMS sungguhan, bukan ke file log, atau `pattern` tidak cocok dengan baris log |
| Hasil screenshot malah halaman login | Langkah login gagal atau cookie sesi tidak tersimpan; cek HTTP vs HTTPS dan domain cookie |
| `text "X" not found` | Elemen belum tampil; tambahkan `{ "wait": "<selector>" }` sebelum klik |
| Gambar tertangkap di tengah animasi | Naikkan `delay` (bawaan 500 ms) |
| `Chrome/Edge not found` | Isi `CHROME_PATH` atau `"chrome"` di config dengan path browser |

Pakai data contoh dari seeder, bukan data pelanggan asli. Data pribadi tetap di-blur.

## Berkontribusi

```
skills/guide-screenshots/   skill-nya: SKILL.md, scripts/shot.cjs, referensi, contoh config
demo/                       aplikasi demo, config-nya, serta screenshot dan video hasilnya
test/                       uji mandiri (tidak butuh server)
.claude-plugin/             manifest plugin Claude Code
```

Jalankan uji mandiri sebelum mengirim perubahan:

```bash
node test/run.cjs
```

Uji ini menjalankan config berbahasa Inggris dan Indonesia terhadap halaman lokal; masing-masing sengaja berisi satu shot yang gagal dan satu kunci yang salah ketik. CI menjalankan uji yang sama setiap push. Aturan pengembangan ada di [AGENTS.md](AGENTS.md), riwayat rilis di [CHANGELOG.md](CHANGELOG.md).

## Lisensi

[MIT](LICENSE)
