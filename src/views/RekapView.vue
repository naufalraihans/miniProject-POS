<template>
  <div class="rekap-page">
    <div class="page-header">
      <h1 class="page-title">Rekap Penjualan</h1>
      <p class="page-subtitle">Lihat ringkasan transaksi harian & bulanan</p>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-section">
      <div class="tab-group">
        <button
          :class="['tab-btn', { active: mode === 'daily' }]"
          @click="mode = 'daily'"
        >
          📅 Harian
        </button>
        <button
          :class="['tab-btn', { active: mode === 'monthly' }]"
          @click="mode = 'monthly'"
        >
          📆 Bulanan
        </button>
      </div>

      <div class="date-picker">
        <input
          v-if="mode === 'daily'"
          type="date"
          class="form-input"
          v-model="selectedDate"
          @change="loadTransactions"
        />
        <input
          v-else
          type="month"
          class="form-input"
          v-model="selectedMonth"
          @change="loadTransactions"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card glass-card">
        <div class="card-icon">💰</div>
        <div class="card-info">
          <span class="card-label">Total Pendapatan</span>
          <span class="card-value">{{ formatCurrency(totalRevenue) }}</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="card-icon">🧾</div>
        <div class="card-info">
          <span class="card-label">Jumlah Transaksi</span>
          <span class="card-value">{{ transactions.length }}</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="card-icon">💵</div>
        <div class="card-info">
          <span class="card-label">Cash</span>
          <span class="card-value cash-text">{{ paymentBreakdown.cash }}</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="card-icon">📱</div>
        <div class="card-info">
          <span class="card-label">QRIS</span>
          <span class="card-value qris-text">{{ paymentBreakdown.qris }}</span>
        </div>
      </div>
      <div class="summary-card glass-card">
        <div class="card-icon">🏦</div>
        <div class="card-info">
          <span class="card-label">Transfer</span>
          <span class="card-value transfer-text">{{
            paymentBreakdown.transfer
          }}</span>
        </div>
      </div>
    </div>

    <!-- Top Selling Items (monthly only) -->
    <div
      v-if="mode === 'monthly' && topItems.length > 0"
      class="top-items glass-card"
      style="margin-bottom: 1.5rem"
    >
      <h3 class="section-title">🏆 Menu Terlaris Bulan Ini</h3>
      <div class="top-items-list">
        <div v-for="(item, idx) in topItems" :key="idx" class="top-item">
          <span class="top-rank">{{ idx + 1 }}</span>
          <span class="top-name">{{ item.name }}</span>
          <span class="top-qty">{{ item.qty }}x terjual</span>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="transactions-section glass-card">
      <h3 class="section-title">📝 Daftar Transaksi</h3>

      <div v-if="loading" class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <p class="empty-state-text">Memuat data...</p>
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p class="empty-state-text">Tidak ada transaksi pada periode ini</p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Items</th>
            <th>Total</th>
            <th>Metode</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tx, idx) in transactions" :key="idx" class="fade-in">
            <td>
              <div>{{ tx.date }}</div>
              <small style="color: var(--text-muted)">{{ tx.time }}</small>
            </td>
            <td>
              <div class="tx-items-preview">
                {{ tx.items.map((i) => `${i.name} (${i.qty}x)`).join(", ") }}
              </div>
            </td>
            <td>
              <strong>{{ formatCurrency(tx.total) }}</strong>
            </td>
            <td>
              <span :class="['badge', 'badge-' + tx.paymentMethod]">
                {{ tx.paymentMethod.toUpperCase() }}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="viewDetail(tx)">
                👁️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="showDetail"
      class="modal-overlay"
      @click.self="showDetail = false"
    >
      <div class="modal-content slide-up">
        <div class="modal-header">
          <h3 class="modal-title">🧾 Detail Transaksi</h3>
          <button class="modal-close" @click="showDetail = false">✕</button>
        </div>

        <div class="detail-info">
          <div class="detail-row">
            <span>Tanggal</span>
            <span>{{ detailTx.date }}</span>
          </div>
          <div class="detail-row">
            <span>Waktu</span>
            <span>{{ detailTx.time }}</span>
          </div>
          <div class="detail-row">
            <span>Metode</span>
            <span :class="['badge', 'badge-' + detailTx.paymentMethod]">
              {{ detailTx.paymentMethod.toUpperCase() }}
            </span>
          </div>
        </div>

        <div class="detail-items">
          <h4
            style="
              margin-bottom: 0.5rem;
              font-size: 0.9rem;
              color: var(--text-secondary);
            "
          >
            Item Pesanan
          </h4>
          <div
            v-for="(item, idx) in detailTx.items"
            :key="idx"
            class="detail-item"
          >
            <div>
              <span class="detail-item-name">{{ item.name }}</span>
              <small v-if="item.variant" style="color: var(--accent)"
                >({{ item.variant }})</small
              >
            </div>
            <div class="detail-item-calc">
              <span>{{ item.qty }}x @ {{ formatCurrency(item.price) }}</span>
              <strong>{{ formatCurrency(item.subtotal) }}</strong>
            </div>
          </div>
        </div>

        <div class="detail-total">
          <span>Total</span>
          <span class="total-amount">{{ formatCurrency(detailTx.total) }}</span>
        </div>

        <div v-if="detailTx.paymentMethod === 'cash'" class="detail-cash">
          <div class="detail-row">
            <span>Dibayar</span>
            <span>{{ formatCurrency(detailTx.cashPaid) }}</span>
          </div>
          <div class="detail-row">
            <span>Kembalian</span>
            <span style="color: var(--success)">{{
              formatCurrency(detailTx.change)
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { db, collection, getDocs, query, where, orderBy } from "../firebase";

const mode = ref("daily");
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const transactions = ref([]);
const loading = ref(false);
const showDetail = ref(false);
const detailTx = ref({});

const totalRevenue = computed(() =>
  transactions.value.reduce((s, t) => s + t.total, 0),
);

const paymentBreakdown = computed(() => {
  const counts = { cash: 0, qris: 0, transfer: 0 };
  transactions.value.forEach((t) => {
    if (counts[t.paymentMethod] !== undefined) counts[t.paymentMethod]++;
  });
  return counts;
});

const topItems = computed(() => {
  const map = {};
  transactions.value.forEach((tx) => {
    tx.items.forEach((item) => {
      const key = item.name;
      if (!map[key]) map[key] = { name: key, qty: 0 };
      map[key].qty += item.qty;
    });
  });
  return Object.values(map)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
});

async function loadTransactions() {
  loading.value = true;
  try {
    let q;
    if (mode.value === "daily") {
      q = query(
        collection(db, "transactions"),
        where("date", "==", selectedDate.value),
      );
    } else {
      // Monthly: filter by date prefix
      const startDate = selectedMonth.value + "-01";
      const [y, m] = selectedMonth.value.split("-").map(Number);
      const endDate =
        y + "-" + String(m + 1 > 12 ? 1 : m + 1).padStart(2, "0") + "-01";
      const endYear = m + 1 > 12 ? y + 1 : y;
      const endDateFinal =
        endYear + "-" + String(m + 1 > 12 ? 1 : m + 1).padStart(2, "0") + "-01";
      q = query(
        collection(db, "transactions"),
        where("date", ">=", startDate),
        where("date", "<", endDateFinal),
      );
    }

    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => results.push(d.data()));
    // Sort by date+time descending
    results.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    transactions.value = results;
  } catch (e) {
    console.error("Error loading transactions:", e);
  }
  loading.value = false;
}

function viewDetail(tx) {
  detailTx.value = tx;
  showDetail.value = true;
}

function formatCurrency(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

onMounted(() => {
  loadTransactions();
});
</script>

<style scoped>
/* Filter Section */
.filter-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab-group {
  display: flex;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.tab-btn {
  padding: 0.6rem 1.2rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}

.tab-btn.active {
  background: var(--accent-glow);
  color: var(--accent-light);
}

.tab-btn:hover:not(.active) {
  color: var(--text-primary);
}

.date-picker .form-input {
  max-width: 220px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
}

.card-icon {
  font-size: 1.8rem;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
}

.cash-text {
  color: var(--success);
}
.qris-text {
  color: var(--info);
}
.transfer-text {
  color: #9b59ff;
}

/* Top Items */
.top-items {
  padding: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.top-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 0;
}

.top-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-glow);
  color: var(--accent-light);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 800;
}

.top-name {
  flex: 1;
  font-weight: 600;
  font-size: 0.9rem;
}

.top-qty {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Transactions */
.transactions-section {
  padding: 1.5rem;
}

.tx-items-preview {
  font-size: 0.82rem;
  color: var(--text-secondary);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Detail Modal */
.detail-info {
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.88rem;
}

.detail-items {
  background: var(--bg-glass);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
}

.detail-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item-name {
  font-weight: 600;
  font-size: 0.88rem;
}

.detail-item-calc {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.detail-total {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-top: 1px solid var(--border);
  font-weight: 700;
  font-size: 1.05rem;
}

.total-amount {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.detail-cash {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}
</style>
