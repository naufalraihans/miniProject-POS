# Project Kasir - DCelup

## Jalankan project

```bash
npm install
npm run dev
```

## Print struk click-and-go (QZ Tray)

Fitur print struk di halaman **Kasir** sudah mendukung QZ Tray agar kasir cukup klik sekali tanpa dialog pilih printer tiap transaksi.

### Setup awal (sekali saja di laptop kasir)

1. Install dan jalankan **QZ Tray**.
2. Selesaikan transaksi seperti biasa sampai muncul modal **Transaksi Berhasil**.
3. Klik **Setup Printer**.
4. Pilih printer thermal yang dipakai kasir, lalu klik **Simpan Printer**.
5. Setelah itu tombol **Print Struk** akan langsung kirim struk ke printer terpilih.

Jika QZ Tray sedang tidak aktif atau gagal konek, tetap ada fallback **Print Browser**.

### Catatan printer Haoyin DT-58D

- Model ini umumnya kompatibel dengan alur **ESC/POS**.
- Nama printer di Windows kadang tampil berbeda, misalnya:
  - `Haoyin DT-58D`
  - `POS-58`
  - variasi lain yang mengandung `58D`
- Di modal setup, aplikasi akan mencoba auto-detect nama yang mirip.

### Troubleshooting cepat QZ Tray

1. Pastikan ikon **QZ Tray** muncul di system tray.
2. Klik **Setup Printer** lalu **Muat Ulang**.
3. Jika masih gagal, klik tombol **Buka QZ Tray** di modal setup.
4. Jika printer tidak muncul, cek driver printer di Windows (Devices and Printers).
