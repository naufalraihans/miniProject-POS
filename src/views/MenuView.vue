<template>
  <div class="menu-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Kelola Menu</h1>
        <p class="page-subtitle">Tambah, edit, atau hapus menu restoran</p>
      </div>
      <button class="btn btn-primary" @click="openForm()">
        ➕ Tambah Menu
      </button>
    </div>

    <!-- Main Menus -->
    <div class="menu-table-section glass-card">
      <h3 class="table-title">🍗 Menu Utama</h3>
      <table class="data-table" v-if="menus.length > 0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Menu</th>
            <th>Harga Dasar</th>
            <th>Varian</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in menus" :key="item.docId" class="fade-in">
            <td>{{ item.id }}</td>
            <td>
              <strong>{{ item.name }}</strong>
            </td>
            <td>{{ formatCurrency(item.price) }}</td>
            <td>
              <div class="variants-list">
                <span
                  v-for="(vPrice, vKey) in item.variants"
                  :key="vKey"
                  class="variant-tag"
                >
                  {{ formatVariantName(vKey) }}: {{ formatCurrency(vPrice) }}
                </span>
                <span
                  v-if="
                    !item.variants || Object.keys(item.variants).length === 0
                  "
                  class="no-variant"
                  >—</span
                >
              </div>
            </td>
            <td>
              <div class="action-btns">
                <button
                  class="btn btn-sm btn-secondary"
                  @click="openForm(item)"
                >
                  ✏️ Edit
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  @click="confirmDelete(item)"
                >
                  🗑️ Hapus
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p class="empty-state-text">Belum ada menu</p>
      </div>
    </div>

    <!-- Extra Menus -->
    <div class="menu-table-section glass-card" style="margin-top: 1.5rem">
      <div class="table-header-row">
        <h3 class="table-title">➕ Menu Tambahan</h3>
        <button class="btn btn-sm btn-secondary" @click="openExtraForm()">
          Tambah Extra
        </button>
      </div>
      <table class="data-table" v-if="extras.length > 0">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Harga</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in extras" :key="item.docId" class="fade-in">
            <td>
              <strong>{{ item.name }}</strong>
            </td>
            <td>{{ formatCurrency(item.price) }}</td>
            <td>
              <div class="action-btns">
                <button
                  class="btn btn-sm btn-secondary"
                  @click="openExtraForm(item)"
                >
                  ✏️ Edit
                </button>
                <button
                  class="btn btn-sm btn-danger"
                  @click="confirmDelete(item)"
                >
                  🗑️ Hapus
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p class="empty-state-text">Belum ada menu tambahan</p>
      </div>
    </div>

    <!-- Form Modal (Menu Utama) -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content slide-up">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingItem ? "✏️ Edit Menu" : "➕ Tambah Menu" }}
          </h3>
          <button class="modal-close" @click="showForm = false">✕</button>
        </div>

        <div class="form-group">
          <label class="form-label">Nama Menu</label>
          <input
            type="text"
            class="form-input"
            v-model="formData.name"
            placeholder="Contoh: Ayam Crispy Saus Sadis"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Harga Dasar (Rp)</label>
          <input
            type="number"
            class="form-input"
            v-model.number="formData.price"
            placeholder="12000"
          />
        </div>

        <!-- Dynamic Variants -->
        <div class="form-group">
          <label class="form-label">Varian</label>
          <div
            v-for="(v, idx) in formData.variantList"
            :key="idx"
            class="variant-row"
          >
            <input
              type="text"
              class="form-input"
              v-model="v.key"
              placeholder="Nama varian (misal: paha_dada_nasi)"
            />
            <input
              type="number"
              class="form-input variant-price-input"
              v-model.number="v.price"
              placeholder="Harga"
            />
            <button
              class="btn btn-sm btn-danger"
              @click="formData.variantList.splice(idx, 1)"
            >
              ✕
            </button>
          </div>
          <button
            class="btn btn-sm btn-secondary"
            style="margin-top: 0.5rem"
            @click="formData.variantList.push({ key: '', price: 0 })"
          >
            + Tambah Varian
          </button>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="showForm = false">
            Batal
          </button>
          <button
            class="btn btn-primary"
            @click="saveMenu"
            :disabled="!formData.name || !formData.price"
          >
            💾 Simpan
          </button>
        </div>
      </div>
    </div>

    <!-- Form Modal (Extra) -->
    <div
      v-if="showExtraForm"
      class="modal-overlay"
      @click.self="showExtraForm = false"
    >
      <div class="modal-content slide-up">
        <div class="modal-header">
          <h3 class="modal-title">
            {{ editingItem ? "✏️ Edit Extra" : "➕ Tambah Extra" }}
          </h3>
          <button class="modal-close" @click="showExtraForm = false">✕</button>
        </div>

        <div class="form-group">
          <label class="form-label">Nama</label>
          <input
            type="text"
            class="form-input"
            v-model="extraFormData.name"
            placeholder="Contoh: Extra Nasi"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Harga (Rp)</label>
          <input
            type="number"
            class="form-input"
            v-model.number="extraFormData.price"
            placeholder="4000"
          />
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="showExtraForm = false">
            Batal
          </button>
          <button
            class="btn btn-primary"
            @click="saveExtra"
            :disabled="!extraFormData.name || !extraFormData.price"
          >
            💾 Simpan
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div
      v-if="showDeleteConfirm"
      class="modal-overlay"
      @click.self="showDeleteConfirm = false"
    >
      <div class="modal-content slide-up" style="max-width: 400px">
        <div class="modal-header">
          <h3 class="modal-title">⚠️ Konfirmasi Hapus</h3>
          <button class="modal-close" @click="showDeleteConfirm = false">
            ✕
          </button>
        </div>
        <p style="margin-bottom: 1.5rem; color: var(--text-secondary)">
          Apakah kamu yakin ingin menghapus
          <strong>{{ deletingItem?.name }}</strong
          >?
        </p>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">
            Batal
          </button>
          <button class="btn btn-danger" @click="deleteMenu">🗑️ Hapus</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" :class="['toast', 'toast-' + toast.type]">
      <span>{{ toast.icon }}</span>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  db,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "../firebase";

const menus = ref([]);
const extras = ref([]);
const showForm = ref(false);
const showExtraForm = ref(false);
const showDeleteConfirm = ref(false);
const editingItem = ref(null);
const deletingItem = ref(null);
const toast = ref({ show: false, message: "", type: "success", icon: "✅" });

const formData = ref({
  name: "",
  price: 0,
  variantList: [],
});

const extraFormData = ref({
  name: "",
  price: 0,
});

function formatCurrency(val) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

function formatVariantName(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadMenus() {
  try {
    const snap = await getDocs(collection(db, "menus"));
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
  } catch (e) {
    console.error("Error loading menus:", e);
  }
}

function openForm(item = null) {
  editingItem.value = item;
  if (item) {
    formData.value = {
      name: item.name,
      price: item.price,
      variantList: item.variants
        ? Object.entries(item.variants).map(([key, price]) => ({ key, price }))
        : [],
    };
  } else {
    formData.value = { name: "", price: 0, variantList: [] };
  }
  showForm.value = true;
}

function openExtraForm(item = null) {
  editingItem.value = item;
  if (item) {
    extraFormData.value = { name: item.name, price: item.price };
  } else {
    extraFormData.value = { name: "", price: 0 };
  }
  showExtraForm.value = true;
}

async function saveMenu() {
  try {
    const variants = {};
    formData.value.variantList.forEach((v) => {
      if (v.key && v.price) variants[v.key] = v.price;
    });

    const data = {
      name: formData.value.name,
      price: formData.value.price,
      variants,
      isExtra: false,
    };

    if (editingItem.value) {
      await updateDoc(doc(db, "menus", editingItem.value.docId), data);
      showToast("Menu berhasil diupdate", "success", "✅");
    } else {
      data.id =
        menus.value.length > 0
          ? Math.max(...menus.value.map((m) => m.id || 0)) + 1
          : 1;
      await addDoc(collection(db, "menus"), data);
      showToast("Menu berhasil ditambahkan", "success", "✅");
    }

    showForm.value = false;
    await loadMenus();
  } catch (e) {
    console.error("Save error:", e);
    showToast("Gagal menyimpan menu", "error", "❌");
  }
}

async function saveExtra() {
  try {
    const data = {
      name: extraFormData.value.name,
      price: extraFormData.value.price,
      isExtra: true,
    };

    if (editingItem.value) {
      await updateDoc(doc(db, "menus", editingItem.value.docId), data);
      showToast("Extra berhasil diupdate", "success", "✅");
    } else {
      await addDoc(collection(db, "menus"), data);
      showToast("Extra berhasil ditambahkan", "success", "✅");
    }

    showExtraForm.value = false;
    await loadMenus();
  } catch (e) {
    console.error("Save error:", e);
    showToast("Gagal menyimpan extra", "error", "❌");
  }
}

function confirmDelete(item) {
  deletingItem.value = item;
  showDeleteConfirm.value = true;
}

async function deleteMenu() {
  try {
    await deleteDoc(doc(db, "menus", deletingItem.value.docId));
    showDeleteConfirm.value = false;
    showToast("Menu berhasil dihapus", "success", "✅");
    await loadMenus();
  } catch (e) {
    console.error("Delete error:", e);
    showToast("Gagal menghapus menu", "error", "❌");
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
.menu-page .page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-table-section {
  padding: 1.5rem;
}

.table-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.table-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.variants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.variant-tag {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: var(--accent-glow);
  color: var(--accent-light);
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 500;
}

.no-variant {
  color: var(--text-muted);
}

.action-btns {
  display: flex;
  gap: 0.4rem;
}

.variant-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.variant-price-input {
  max-width: 120px;
}

.form-actions {
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
