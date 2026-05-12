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
