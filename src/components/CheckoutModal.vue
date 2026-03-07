<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content slide-up">
      <div class="modal-header">
        <h3 class="modal-title">💳 Pembayaran</h3>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Order Summary -->
      <div class="checkout-summary">
        <div v-for="item in cart" :key="item.cartKey" class="summary-item">
          <span class="summary-name">
            {{ item.name }}
            <small v-if="item.variant">({{ item.variant }})</small>
            × {{ item.qty }}
          </span>
          <span class="summary-subtotal">{{
            formatCurrency(item.price * item.qty)
          }}</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span class="total-value">{{ formatCurrency(total) }}</span>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="payment-methods">
        <label class="payment-label">Metode Pembayaran</label>
        <div class="method-options">
          <button
            v-for="m in methods"
            :key="m.value"
            :class="['method-btn', { active: method === m.value }]"
            @click="method = m.value"
          >
            <span class="method-icon">{{ m.icon }}</span>
            <span class="method-name">{{ m.label }}</span>
          </button>
        </div>
      </div>

      <!-- Cash Input -->
      <div v-if="method === 'cash'" class="cash-section">
        <div class="form-group">
          <label class="form-label">Nominal Bayar</label>
          <input
            type="number"
            class="form-input"
            v-model.number="cashPaid"
            :min="total"
            placeholder="Masukkan nominal..."
            @input="calculateChange"
          />
        </div>
        <!-- Quick amounts -->
        <div class="quick-amounts">
          <button
            v-for="amt in quickAmounts"
            :key="amt"
            class="btn btn-sm btn-secondary"
            @click="
              cashPaid = amt;
              calculateChange();
            "
          >
            {{ formatCurrency(amt) }}
          </button>
        </div>
        <div v-if="cashPaid >= total" class="change-display">
          <span class="change-label">Kembalian</span>
          <span class="change-value">{{ formatCurrency(change) }}</span>
        </div>
      </div>

      <!-- Confirm Button -->
      <button
        class="btn btn-primary btn-lg confirm-btn"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        ✅ Konfirmasi Pembayaran
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  cart: { type: Array, required: true },
  total: { type: Number, required: true },
});

const emit = defineEmits(["close", "confirm"]);

const methods = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "qris", label: "QRIS", icon: "📱" },
  { value: "transfer", label: "Transfer", icon: "🏦" },
];

const method = ref("cash");
const cashPaid = ref(0);
const change = ref(0);

const quickAmounts = computed(() => {
  const t = props.total;
  const amounts = [];
  // Round up to nearest 5k, 10k, 20k, 50k
  const roundUp = (n, r) => Math.ceil(n / r) * r;
  const base = roundUp(t, 5000);
  if (base >= t) amounts.push(base);
  const r10 = roundUp(t, 10000);
  if (r10 > base) amounts.push(r10);
  const r20 = roundUp(t, 20000);
  if (r20 > r10) amounts.push(r20);
  const r50 = roundUp(t, 50000);
  if (r50 > r20) amounts.push(r50);
  if (100000 > r50 && 100000 >= t) amounts.push(100000);
  return [...new Set(amounts)].slice(0, 4);
});

const canConfirm = computed(() => {
  if (method.value === "cash") return cashPaid.value >= props.total;
  return true; // QRIS / Transfer just record
});

function calculateChange() {
  change.value = Math.max(0, cashPaid.value - props.total);
}

function formatCurrency(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

function handleConfirm() {
  emit("confirm", {
    method: method.value,
    cashPaid: method.value === "cash" ? cashPaid.value : 0,
    change: method.value === "cash" ? change.value : 0,
  });
}
</script>

<style scoped>
.checkout-summary {
  background: var(--bg-glass);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.summary-item small {
  color: var(--accent);
}

.summary-subtotal {
  font-weight: 600;
  color: var(--text-primary);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.6rem;
  margin-top: 0.6rem;
  border-top: 1px solid var(--border);
  font-weight: 700;
  font-size: 1.05rem;
}

.total-value {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Payment Methods */
.payment-methods {
  margin-bottom: 1.5rem;
}

.payment-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.6rem;
}

.method-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.8rem;
  background: var(--bg-glass);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
  font-family: inherit;
}

.method-btn:hover {
  border-color: var(--border-accent);
  color: var(--text-primary);
}

.method-btn.active {
  border-color: var(--accent);
  background: var(--accent-glow);
  color: var(--accent-light);
  box-shadow: var(--shadow-glow);
}

.method-icon {
  font-size: 1.5rem;
}

.method-name {
  font-size: 0.8rem;
  font-weight: 600;
}

/* Cash Section */
.cash-section {
  margin-bottom: 1.5rem;
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.change-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background: var(--success-bg);
  border: 1px solid rgba(0, 210, 160, 0.2);
  border-radius: var(--radius-md);
}

.change-label {
  color: var(--success);
  font-weight: 600;
  font-size: 0.9rem;
}

.change-value {
  color: var(--success);
  font-weight: 800;
  font-size: 1.2rem;
}

.confirm-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
