<template>
  <div class="kasir-page">
    <div class="page-header">
      <h1 class="page-title">Kasir</h1>
      <p class="page-subtitle">Pilih menu untuk memulai pesanan</p>
    </div>

    <div class="kasir-layout">
      <!-- Left: Menu Grid -->
      <div class="menu-section">
        <!-- Main Menu -->
        <h2 class="section-title">Menu Utama</h2>
        <div class="menu-grid">
          <MenuCard
            v-for="item in menus"
            :key="item.id"
            :item="item"
            @add-to-cart="handleAddToCart"
          />
        </div>

        <!-- Extra Menu -->
        <h2 class="section-title" style="margin-top: 1.5rem">Menu Tambahan</h2>
        <div class="menu-grid extras">
          <div
            v-for="(extra, idx) in extras"
            :key="'extra-' + idx"
            class="extra-card glass-card"
            @click="addExtraToCart(extra)"
          >
            <span class="extra-icon">➕</span>
            <span class="extra-name">{{ extra.name }}</span>
            <span class="extra-price">{{ formatCurrency(extra.price) }}</span>
          </div>
        </div>
      </div>

      <!-- Right: Cart Panel -->
      <CartPanel
        :cart="cart"
        @update-qty="updateQty"
        @remove-item="removeItem"
        @checkout="showCheckout = true"
        @clear-cart="clearCart"
      />
    </div>

    <!-- Checkout Modal -->
    <CheckoutModal
      v-if="showCheckout"
      :cart="cart"
      :total="cartTotal"
      @close="showCheckout = false"
      @confirm="handleCheckout"
    />

    <!-- Toast -->
    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">
      <span>{{ toast.icon }}</span>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import MenuCard from "../components/MenuCard.vue";
import CartPanel from "../components/CartPanel.vue";
import CheckoutModal from "../components/CheckoutModal.vue";
import { db, collection, getDocs, addDoc, Timestamp } from "../firebase";

const menus = ref([]);
const extras = ref([]);
const cart = ref([]);
const showCheckout = ref(false);
const toast = ref({ show: false, message: "", type: "success", icon: "✅" });

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.qty, 0),
);

function formatCurrency(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

async function loadMenus() {
  try {
    const snap = await getDocs(collection(db, "menus"));
    if (snap.empty) {
      // Seed from produk.json
      await seedMenus();
    } else {
      const items = [];
      const extraItems = [];
      snap.forEach((d) => {
        const data = { ...d.data(), docId: d.id };
        if (data.isExtra) {
          extraItems.push(data);
        } else {
          items.push(data);
        }
      });
      menus.value = items.sort((a, b) => a.id - b.id);
      extras.value = extraItems;
    }
  } catch (e) {
    console.error("Error loading menus:", e);
    showToast("Gagal memuat menu", "error", "❌");
  }
}

async function seedMenus() {
  const produkData = await fetch("/produk.json").then((r) => r.json());
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
  const existing = cart.value.find((c) => c.cartKey === key);
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
  showToast(`${item.name} ditambahkan`, "success", "🛒");
}

function addExtraToCart(extra) {
  const existing = cart.value.find((c) => c.cartKey === extra.name);
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
  showToast(`${extra.name} ditambahkan`, "success", "🛒");
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
      items: cart.value.map((c) => ({
        name: c.name,
        variant: c.variant,
        qty: c.qty,
        price: c.price,
        subtotal: c.price * c.qty,
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

    await addDoc(collection(db, "transactions"), transaction);
    showCheckout.value = false;
    cart.value = [];
    showToast("Transaksi berhasil! 🎉", "success", "✅");
  } catch (e) {
    console.error("Checkout error:", e);
    showToast("Gagal menyimpan transaksi", "error", "❌");
  }
}

function showToast(message, type = "success", icon = "✅") {
  toast.value = { show: true, message, type, icon };
  setTimeout(() => {
    toast.value.show = false;
  }, 2500);
}

onMounted(() => {
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
</style>
