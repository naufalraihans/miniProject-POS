<template>
  <div class="kasir-page">
    <div class="page-header">
      <h1 class="page-title">Kasir</h1>
      <p class="page-subtitle">Pilih menu untuk memulai pesanan</p>
    </div>

    <div class="kasir-layout">
      <div class="menu-section">
        <h2 class="section-title">Menu Utama</h2>
        <div class="menu-grid">
          <MenuCard
            v-for="item in menus"
            :key="item.id"
            :item="item"
            @add-to-cart="handleAddToCart"
          />
        </div>

        <h2 class="section-title" style="margin-top: 1.5rem">Menu Tambahan</h2>
        <div class="menu-grid extras">
          <div
            v-for="(extra, idx) in extras"
            :key="'extra-' + idx"
            class="extra-card glass-card"
            @click="addExtraToCart(extra)"
          >
            <span class="extra-icon">+</span>
            <span class="extra-name">{{ extra.name }}</span>
            <span class="extra-price">{{ formatCurrency(extra.price) }}</span>
          </div>
        </div>
      </div>

      <CartPanel
        :cart="cart"
        @update-qty="updateQty"
        @remove-item="removeItem"
        @checkout="showCheckout = true"
        @clear-cart="clearCart"
      />
    </div>

    <CheckoutModal
      v-if="showCheckout"
      :cart="cart"
      :total="cartTotal"
      @close="showCheckout = false"
      @confirm="handleCheckout"
    />

    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">
      <span>{{ toast.icon }}</span>
      <span>{{ toast.message }}</span>
    </div>

    <div
      v-if="showReceiptPrompt && lastTransaction"
      class="modal-overlay"
      @click.self="showReceiptPrompt = false"
    >
      <div class="modal-content slide-up receipt-modal">
        <div class="modal-header">
          <h3 class="modal-title">Transaksi Berhasil</h3>
          <button class="modal-close" @click="showReceiptPrompt = false">x</button>
        </div>

        <div class="receipt-summary">
          <p>
            <strong>Waktu:</strong>
            {{ lastTransaction.date }} {{ lastTransaction.time }}
          </p>
          <p>
            <strong>Total:</strong> {{ formatCurrency(lastTransaction.total) }}
          </p>
          <p>
            <strong>Metode:</strong>
            {{ lastTransaction.paymentMethod.toUpperCase() }}
          </p>
        </div>

        <div class="printer-status glass-card">
          <div class="printer-text">
            <strong>{{ printerStatusLabel }}:</strong>
            {{ selectedPrinterLabel || "Belum diset" }}
          </div>
          <button class="btn btn-sm btn-secondary" @click="openPrinterSetup">
            Setup Printer
          </button>
        </div>

        <div class="receipt-actions">
          <button class="btn btn-secondary" @click="showReceiptPrompt = false">
            Tutup
          </button>
          <button
            v-if="showBrowserPrintButton"
            class="btn btn-secondary"
            @click="printLastReceiptBrowser"
          >
            Print Browser
          </button>
          <button class="btn btn-primary" :disabled="printingReceipt" @click="printLastReceipt">
            {{ printingReceipt ? "Mencetak..." : "Print Struk" }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showPrinterSetup"
      class="modal-overlay"
      @click.self="showPrinterSetup = false"
    >
      <div class="modal-content slide-up receipt-modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ printerSetupTitle }}</h3>
          <button class="modal-close" @click="showPrinterSetup = false">x</button>
        </div>

        <p class="setup-hint">
          {{ printerSetupHint }}
        </p>

        <div v-if="printerErrorMessage" class="qz-error-box">
          <p>{{ printerErrorMessage }}</p>
          <button
            v-if="!androidPrintMode"
            class="btn btn-sm btn-secondary"
            @click="openDesktopPrinterBridge"
          >
            Buka QZ Tray
          </button>
        </div>

        <div v-if="loadingPrinters" class="empty-state">
          <div class="empty-state-icon">...</div>
          <p class="empty-state-text">{{ loadingPrinterText }}</p>
        </div>

        <div v-else class="form-group">
          <label class="form-label">Daftar Printer</label>
          <select class="form-input" v-model="printerDraftId">
            <option value="" disabled>Pilih printer</option>
            <option v-for="printer in printerList" :key="printer.id" :value="printer.id">
              {{ printerOptionLabel(printer) }}
            </option>
          </select>
        </div>

        <p v-if="androidPrintMode" class="setup-note">
          Pair printer dulu lewat Settings Bluetooth Android. App hanya menampilkan device yang
          sudah paired.
        </p>

        <div class="receipt-actions">
          <button class="btn btn-secondary" @click="refreshPrinters">
            {{ refreshPrinterLabel }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="!draftPrinter || printingReceipt"
            @click="testSelectedPrinter"
          >
            Test Print
          </button>
          <button class="btn btn-primary" :disabled="!draftPrinter" @click="savePrinterChoice">
            Simpan Printer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import CartPanel from "../components/CartPanel.vue";
import CheckoutModal from "../components/CheckoutModal.vue";
import MenuCard from "../components/MenuCard.vue";
import { db, collection, getDocs, addDoc, Timestamp } from "../firebase";
import { formatCurrency } from "../services/receipt";
import {
  canUseBrowserPrint,
  detectPrintPlatform,
  getPrinterDisplayName,
  getSavedPrinter,
  launchQzTray,
  listPrinters,
  printBrowserReceipt,
  printReceipt,
  printTest,
  resolvePrintErrorMessage,
  saveSelectedPrinter,
  suggestPrinterSelection,
} from "../services/printService";

const menus = ref([]);
const extras = ref([]);
const cart = ref([]);
const showCheckout = ref(false);
const showReceiptPrompt = ref(false);
const showPrinterSetup = ref(false);
const lastTransaction = ref(null);
const selectedPrinter = ref(getSavedPrinter());
const printerDraftId = ref(selectedPrinter.value?.id || "");
const printerList = ref([]);
const loadingPrinters = ref(false);
const printingReceipt = ref(false);
const printerErrorMessage = ref("");
const toast = ref({ show: false, message: "", type: "success", icon: "OK" });

const printPlatform = detectPrintPlatform();
const androidPrintMode = printPlatform === "android";

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0),
);

const showBrowserPrintButton = computed(() => canUseBrowserPrint());
const selectedPrinterLabel = computed(() => getPrinterDisplayName(selectedPrinter.value));
const printerStatusLabel = computed(() =>
  androidPrintMode ? "Printer Bluetooth" : "Printer",
);
const printerSetupTitle = computed(() =>
  androidPrintMode ? "Setup Printer Bluetooth" : "Setup Printer QZ Tray",
);
const printerSetupHint = computed(() =>
  androidPrintMode
    ? "Izinkan akses bluetooth, lalu pilih printer thermal yang sudah paired di HP ini."
    : "Pastikan QZ Tray sedang berjalan. Pilih printer thermal sekali, lalu print tanpa pilih device lagi.",
);
const loadingPrinterText = computed(() =>
  androidPrintMode ? "Mencari printer paired..." : "Mencari printer...",
);
const refreshPrinterLabel = computed(() =>
  androidPrintMode ? "Muat Perangkat" : "Muat Ulang",
);
const draftPrinter = computed(
  () => printerList.value.find((printer) => printer.id === printerDraftId.value) || null,
);

async function loadMenus() {
  try {
    const snap = await getDocs(collection(db, "menus"));
    if (snap.empty) {
      await seedMenus();
      return;
    }

    const items = [];
    const extraItems = [];
    snap.forEach((docSnap) => {
      const data = { ...docSnap.data(), docId: docSnap.id };
      if (data.isExtra) {
        extraItems.push(data);
      } else {
        items.push(data);
      }
    });
    menus.value = items.sort((a, b) => a.id - b.id);
    extras.value = extraItems;
  } catch (error) {
    console.error("Error loading menus:", error);
    showToast("Gagal memuat menu", "error", "ERR");
  }
}

async function seedMenus() {
  const produkData = await fetch("/produk.json").then((response) => response.json());
  for (const item of produkData.menu) {
    await addDoc(collection(db, "menus"), {
      id: item.id,
      name: item.name,
      price: item.price,
      variants: item.variants || {},
      isExtra: false,
    });
  }

  for (const extra of produkData.extra_menu) {
    await addDoc(collection(db, "menus"), {
      name: extra.name,
      price: extra.price,
      isExtra: true,
    });
  }

  await loadMenus();
}

function handleAddToCart(item) {
  const key = item.name + (item.variantKey || "");
  const existing = cart.value.find((cartItem) => cartItem.cartKey === key);
  if (existing) {
    existing.qty++;
  } else {
    cart.value.push({
      cartKey: key,
      name: item.name,
      variant: item.variantLabel || null,
      price: item.price,
      qty: 1,
    });
  }
  showToast(`${item.name} ditambahkan`, "success", "+");
}

function addExtraToCart(extra) {
  const existing = cart.value.find((cartItem) => cartItem.cartKey === extra.name);
  if (existing) {
    existing.qty++;
  } else {
    cart.value.push({
      cartKey: extra.name,
      name: extra.name,
      variant: null,
      price: extra.price,
      qty: 1,
    });
  }
  showToast(`${extra.name} ditambahkan`, "success", "+");
}

function updateQty(index, delta) {
  const item = cart.value[index];
  item.qty += delta;
  if (item.qty <= 0) {
    cart.value.splice(index, 1);
  }
}

function removeItem(index) {
  cart.value.splice(index, 1);
}

function clearCart() {
  cart.value = [];
}

async function handleCheckout(paymentData) {
  try {
    const now = new Date();
    const transaction = {
      items: cart.value.map((item) => ({
        name: item.name,
        variant: item.variant,
        qty: item.qty,
        price: item.price,
        subtotal: item.price * item.qty,
      })),
      total: cartTotal.value,
      paymentMethod: paymentData.method,
      cashPaid: paymentData.cashPaid || 0,
      change: paymentData.change || 0,
      timestamp: Timestamp.fromDate(now),
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const savedTransaction = await addDoc(collection(db, "transactions"), transaction);
    lastTransaction.value = { ...transaction, id: savedTransaction.id };
    showCheckout.value = false;
    cart.value = [];
    showReceiptPrompt.value = true;
    showToast("Transaksi berhasil!", "success", "OK");
  } catch (error) {
    console.error("Checkout error:", error);
    showToast("Gagal menyimpan transaksi", "error", "ERR");
  }
}

async function openPrinterSetup() {
  showPrinterSetup.value = true;
  printerErrorMessage.value = "";
  await refreshPrinters();
}

async function refreshPrinters() {
  loadingPrinters.value = true;
  printerErrorMessage.value = "";
  try {
    printerList.value = await listPrinters();

    if (!printerList.value.length) {
      showToast(
        androidPrintMode
          ? "Belum ada printer paired di HP ini"
          : "Printer tidak ditemukan",
        "error",
        "WARN",
      );
      return;
    }

    printerDraftId.value = suggestPrinterSelection(
      printerList.value,
      selectedPrinter.value,
    );
  } catch (error) {
    console.error("Printer loading error:", error);
    printerErrorMessage.value = resolvePrintErrorMessage(error, printPlatform);
    showToast(
      androidPrintMode
        ? "Printer bluetooth belum siap. Cek detail di setup printer."
        : "QZ Tray belum terhubung. Cek detail di setup printer.",
      "error",
      "ERR",
    );
  } finally {
    loadingPrinters.value = false;
  }
}

function savePrinterChoice() {
  if (!draftPrinter.value) {
    showToast("Pilih printer dulu", "error", "WARN");
    return;
  }

  selectedPrinter.value = saveSelectedPrinter(draftPrinter.value);
  showPrinterSetup.value = false;
  showToast("Printer berhasil disimpan", "success", "OK");
}

function printerOptionLabel(printer) {
  return getPrinterDisplayName(printer);
}

function openDesktopPrinterBridge() {
  launchQzTray();
}

async function testSelectedPrinter() {
  if (!draftPrinter.value) {
    showToast("Pilih printer dulu", "error", "WARN");
    return;
  }

  printingReceipt.value = true;
  try {
    await printTest(draftPrinter.value);
    showToast("Test print berhasil dikirim", "success", "OK");
  } catch (error) {
    console.error("Printer test error:", error);
    showToast(resolvePrintErrorMessage(error, printPlatform), "error", "ERR");
  } finally {
    printingReceipt.value = false;
  }
}

function printLastReceiptBrowser() {
  if (!lastTransaction.value) {
    showToast("Data transaksi tidak ditemukan", "error", "ERR");
    return;
  }

  try {
    printBrowserReceipt(lastTransaction.value);
  } catch (error) {
    showToast(resolvePrintErrorMessage(error, printPlatform), "error", "ERR");
  }
}

async function printLastReceipt() {
  if (!lastTransaction.value) {
    showToast("Data transaksi tidak ditemukan", "error", "ERR");
    return;
  }
  if (!selectedPrinter.value) {
    showToast("Set printer dulu sebelum print", "error", "WARN");
    await openPrinterSetup();
    return;
  }

  printingReceipt.value = true;
  try {
    await printReceipt(lastTransaction.value, selectedPrinter.value);
    showToast("Struk berhasil dikirim ke printer", "success", "OK");
  } catch (error) {
    console.error("Print error:", error);
    showToast(resolvePrintErrorMessage(error, printPlatform), "error", "ERR");
  } finally {
    printingReceipt.value = false;
  }
}

function showToast(message, type = "success", icon = "OK") {
  toast.value = { show: true, message, type, icon };
  setTimeout(() => {
    toast.value.show = false;
  }, 2500);
}

onMounted(() => {
  printerDraftId.value = selectedPrinter.value?.id || "";
  loadMenus();
});
</script>

<style scoped>
.kasir-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.5rem;
  align-items: start;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.menu-grid.extras {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.extra-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1rem;
  cursor: pointer;
  text-align: center;
}

.extra-card:active {
  transform: scale(0.97);
}

.extra-icon {
  font-size: 1.3rem;
}

.extra-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.extra-price {
  font-size: 0.8rem;
  color: var(--accent-light);
  font-weight: 600;
}

@media (max-width: 900px) {
  .kasir-layout {
    grid-template-columns: 1fr;
  }
}

:global(body.android-shell) .kasir-layout {
  grid-template-columns: minmax(0, 1fr) 320px;
}

@media (max-width: 900px) and (orientation: landscape) {
  :global(body.android-shell) .kasir-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
}

.receipt-modal {
  max-width: 420px;
}

.receipt-summary {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
  font-size: 0.92rem;
}

.receipt-summary strong {
  color: var(--text-primary);
}

.printer-status {
  padding: 0.75rem 0.9rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
}

.printer-text {
  font-size: 0.84rem;
  color: var(--text-secondary);
  overflow-wrap: anywhere;
}

.setup-hint {
  margin-bottom: 1rem;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.setup-note {
  margin-top: -0.2rem;
  margin-bottom: 1rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.qz-error-box {
  margin-bottom: 1rem;
  padding: 0.8rem;
  border: 1px solid rgba(255, 107, 107, 0.35);
  border-radius: var(--radius-md);
  background: var(--danger-bg);
  display: grid;
  gap: 0.6rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.receipt-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.7rem;
}
</style>
