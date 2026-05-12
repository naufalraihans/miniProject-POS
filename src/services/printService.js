import { BluetoothPrinter } from "../plugins/bluetoothPrinter";
import { isAndroidApp } from "./platform";
import {
  buildEscPosReceiptText,
  buildReceiptHtml,
  buildTestPrintPayload,
} from "./receipt";

const WEB_PRINTER_STORAGE_KEY = "kasir-qz-printer-name";
const ANDROID_PRINTER_STORAGE_KEY = "kasir-android-printer";
const QZ_SCRIPT_ID = "qz-tray-script";
const QZ_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js";
const PRINTER_NAME_HINTS = ["haoyin dt-58d", "haoyin", "dt-58d", "pos-58", "58d"];

function getQz() {
  return window.qz || null;
}

function getStorageKey() {
  return isAndroidApp() ? ANDROID_PRINTER_STORAGE_KEY : WEB_PRINTER_STORAGE_KEY;
}

function normalizePrinterRecord(rawPrinter) {
  if (!rawPrinter) return null;

  if (typeof rawPrinter === "string") {
    return {
      id: rawPrinter,
      name: rawPrinter,
      address: "",
      platform: "web-desktop",
    };
  }

  const id = rawPrinter.id || rawPrinter.address || rawPrinter.name;
  if (!id) return null;

  return {
    id,
    name: rawPrinter.name || rawPrinter.id || rawPrinter.address || "Printer",
    address: rawPrinter.address || "",
    platform: rawPrinter.platform || detectPrintPlatform(),
  };
}

async function loadQzScript() {
  if (getQz()) return getQz();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(QZ_SCRIPT_ID);
    if (existing) {
      if (getQz()) {
        resolve(getQz());
        return;
      }
      if (existing.dataset.status === "error") {
        existing.remove();
      } else {
        existing.addEventListener("load", () => resolve(getQz()), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Gagal memuat library QZ Tray")),
          { once: true },
        );
        return;
      }
    }

    const script = document.createElement("script");
    script.id = QZ_SCRIPT_ID;
    script.src = QZ_SCRIPT_SRC;
    script.async = true;
    script.dataset.status = "loading";
    script.onload = () => {
      script.dataset.status = "loaded";
      resolve(getQz());
    };
    script.onerror = () => {
      script.dataset.status = "error";
      reject(new Error("Gagal memuat library QZ Tray"));
    };
    document.head.appendChild(script);
  });
}

async function ensureQzConnection() {
  const qz = await loadQzScript();
  if (!qz) {
    throw new Error("Library QZ Tray tidak tersedia");
  }

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 2, delay: 1 });
  }

  return qz;
}

async function ensureAndroidBluetoothPermission() {
  const state = await BluetoothPrinter.prepare();
  if (state?.granted && state?.enabled) {
    return state;
  }
  if (state?.granted && state?.enabled === false) {
    throw new Error("Bluetooth is disabled");
  }
  throw new Error("Bluetooth permission not granted");
}

async function printWithQz(printer, payload) {
  const qz = await ensureQzConnection();
  const matchedPrinter = await qz.printers.find(printer.name || printer.id);
  if (!matchedPrinter) {
    throw new Error(`Printer "${printer.name || printer.id}" tidak ditemukan`);
  }

  const config = qz.configs.create(matchedPrinter, { encoding: "CP437" });
  await qz.print(config, [payload]);
}

async function printWithAndroid(printer, payload) {
  await ensureAndroidBluetoothPermission();
  await BluetoothPrinter.print({
    address: printer.address || printer.id,
    payload,
    encoding: "CP437",
  });
}

export function detectPrintPlatform() {
  return isAndroidApp() ? "android" : "web-desktop";
}

export function canUseBrowserPrint() {
  return !isAndroidApp();
}

export function getPrinterDisplayName(printer) {
  if (!printer) return "";
  if (printer.address) {
    return `${printer.name} (${printer.address})`;
  }
  return printer.name;
}

export function getSavedPrinter() {
  const rawValue = localStorage.getItem(getStorageKey());
  if (!rawValue) return null;

  if (isAndroidApp()) {
    try {
      return normalizePrinterRecord(JSON.parse(rawValue));
    } catch {
      localStorage.removeItem(getStorageKey());
      return null;
    }
  }

  return normalizePrinterRecord(rawValue);
}

export function saveSelectedPrinter(printer) {
  const normalizedPrinter = normalizePrinterRecord(printer);
  if (!normalizedPrinter) {
    throw new Error("Printer tidak valid");
  }

  if (isAndroidApp()) {
    localStorage.setItem(getStorageKey(), JSON.stringify(normalizedPrinter));
  } else {
    localStorage.setItem(getStorageKey(), normalizedPrinter.name);
  }

  return normalizedPrinter;
}

export function suggestPrinterSelection(printers, selectedPrinter = null) {
  if (!Array.isArray(printers) || printers.length === 0) return "";

  const selectedId = selectedPrinter?.id;
  if (selectedId && printers.some((printer) => printer.id === selectedId)) {
    return selectedId;
  }

  if (!isAndroidApp()) {
    const hintedPrinter = printers.find((printer) => {
      const normalizedName = String(printer.name || "").toLowerCase();
      return PRINTER_NAME_HINTS.some((hint) => normalizedName.includes(hint));
    });
    if (hintedPrinter) {
      return hintedPrinter.id;
    }
  }

  return printers[0].id;
}

export async function listPrinters() {
  if (isAndroidApp()) {
    await ensureAndroidBluetoothPermission();
    const result = await BluetoothPrinter.getPairedPrinters();
    const printers = Array.isArray(result?.printers) ? result.printers : [];
    return printers.map((printer) =>
      normalizePrinterRecord({
        ...printer,
        platform: "android",
      }),
    );
  }

  const qz = await ensureQzConnection();
  const printers = await qz.printers.find();
  return (Array.isArray(printers) ? printers : [printers])
    .filter(Boolean)
    .map((printerName) => normalizePrinterRecord(printerName));
}

export async function printReceipt(transaction, printer = getSavedPrinter()) {
  if (!printer) {
    throw new Error("Printer belum dipilih");
  }

  const payload = buildEscPosReceiptText(transaction);
  if (isAndroidApp()) {
    await printWithAndroid(printer, payload);
    return;
  }

  await printWithQz(printer, payload);
}

export async function printTest(printer = getSavedPrinter()) {
  if (!printer) {
    throw new Error("Printer belum dipilih");
  }

  const payload = buildTestPrintPayload();
  if (isAndroidApp()) {
    await printWithAndroid(printer, payload);
    return;
  }

  await printWithQz(printer, payload);
}

export function launchQzTray() {
  if (isAndroidApp()) return;

  const launcher = document.createElement("iframe");
  launcher.style.display = "none";
  launcher.src = "qz:launch";
  document.body.appendChild(launcher);
  setTimeout(() => launcher.remove(), 1200);
}

export function printBrowserReceipt(transaction) {
  if (isAndroidApp()) {
    throw new Error("Browser print tidak tersedia di Android app");
  }

  const printWindow = window.open("", "_blank", "width=420,height=700");
  if (!printWindow) {
    throw new Error("Popup diblokir browser, izinkan popup untuk print");
  }

  printWindow.document.open();
  printWindow.document.write(buildReceiptHtml(transaction));
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => {
    printWindow.onafterprint = () => printWindow.close();
    printWindow.print();
  };
}

export function resolvePrintErrorMessage(error, platform = detectPrintPlatform()) {
  const rawMessage = String(error?.message || error || "");
  const lowerMessage = rawMessage.toLowerCase();

  if (platform === "android") {
    if (lowerMessage.includes("permission")) {
      return "Izin Bluetooth belum diberikan. Izinkan akses Nearby Devices lalu coba lagi.";
    }
    if (lowerMessage.includes("disabled")) {
      return "Bluetooth HP sedang mati. Nyalakan Bluetooth lalu muat ulang printer.";
    }
    if (lowerMessage.includes("not supported")) {
      return "HP ini tidak mendukung Bluetooth classic yang dibutuhkan printer thermal.";
    }
    if (lowerMessage.includes("not paired") || lowerMessage.includes("bonded")) {
      return "Printer belum dipair di Android. Pair dulu lewat Settings > Bluetooth.";
    }
    if (lowerMessage.includes("not found")) {
      return "Printer tidak ditemukan. Pastikan printer masih paired di HP ini.";
    }
    if (lowerMessage.includes("connect")) {
      return "Gagal tersambung ke printer Bluetooth. Dekatkan printer lalu coba lagi.";
    }
    return `Bluetooth print error: ${rawMessage || "Unknown error"}`;
  }

  if (lowerMessage.includes("gagal memuat library qz tray")) {
    return "Library QZ gagal dimuat. Cek koneksi internet/adblock lalu klik Muat Ulang.";
  }
  if (lowerMessage.includes("unable to establish connection with qz")) {
    return "QZ Tray belum bisa dihubungi. Pastikan app QZ Tray aktif, lalu klik Muat Ulang.";
  }
  if (lowerMessage.includes("websocket")) {
    return "Koneksi websocket QZ gagal. Coba restart QZ Tray lalu Muat Ulang.";
  }

  return `QZ error: ${rawMessage || "Unknown error"}`;
}
