<template>
  <div class="cart-panel glass-card">
    <div class="cart-header">
      <h2 class="cart-title">🛒 Pesanan</h2>
      <button
        v-if="cart.length > 0"
        class="btn btn-sm btn-danger"
        @click="$emit('clear-cart')"
      >
        Hapus Semua
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="cart.length === 0" class="empty-state">
      <div class="empty-state-icon">📋</div>
      <p class="empty-state-text">Belum ada pesanan</p>
    </div>

    <!-- Cart Items -->
    <div v-else class="cart-items">
      <div
        v-for="(item, index) in cart"
        :key="item.cartKey"
        class="cart-item fade-in"
      >
        <div class="item-info">
          <span class="item-name">{{ item.name }}</span>
          <span v-if="item.variant" class="item-variant">{{
            item.variant
          }}</span>
          <span class="item-price-each"
            >@ {{ formatCurrency(item.price) }}</span
          >
        </div>
        <div class="item-controls">
          <button class="qty-btn" @click="$emit('update-qty', index, -1)">
            −
          </button>
          <span class="qty-value">{{ item.qty }}</span>
          <button class="qty-btn" @click="$emit('update-qty', index, 1)">
            +
          </button>
          <button class="remove-btn" @click="$emit('remove-item', index)">
            ✕
          </button>
        </div>
        <div class="item-subtotal">
          {{ formatCurrency(item.price * item.qty) }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="cart.length > 0" class="cart-footer">
      <div class="total-row">
        <span class="total-label">Total</span>
        <span class="total-amount">{{ formatCurrency(total) }}</span>
      </div>
      <button
        class="btn btn-primary btn-lg checkout-btn"
        @click="$emit('checkout')"
      >
        💳 Bayar
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  cart: { type: Array, required: true },
});

defineEmits(["update-qty", "remove-item", "checkout", "clear-cart"]);

const total = computed(() =>
  props.cart.reduce((sum, item) => sum + item.price * item.qty, 0),
);

function formatCurrency(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}
</script>

<style scoped>
.cart-panel {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--border);
}

.cart-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
}

.cart-item {
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--border);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-bottom: 0.4rem;
}

.item-name {
  font-size: 0.88rem;
  font-weight: 600;
}

.item-variant {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 500;
}

.item-price-each {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.3rem;
}

.qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.qty-btn:hover {
  background: var(--bg-glass-hover);
  border-color: var(--accent);
  color: var(--accent-light);
}

.qty-value {
  width: 30px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
}

.remove-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: auto;
  transition: all var(--transition-fast);
}

.remove-btn:hover {
  color: var(--danger);
  background: var(--danger-bg);
}

.item-subtotal {
  text-align: right;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-light);
}

/* Footer */
.cart-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.total-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.total-amount {
  font-size: 1.4rem;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.checkout-btn {
  width: 100%;
}
</style>
