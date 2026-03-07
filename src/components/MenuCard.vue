<template>
  <div class="menu-card glass-card" @click="handleClick">
    <div class="card-header">
      <span class="card-emoji">🍗</span>
      <span class="card-id">#{{ item.id }}</span>
    </div>
    <h3 class="card-name">{{ item.name }}</h3>
    <p class="card-price">{{ formatCurrency(item.price) }}</p>
    <div class="card-variants" v-if="hasVariants">
      <span class="variant-badge"
        >{{ Object.keys(item.variants).length }} varian</span
      >
    </div>

    <!-- Variant Picker Dropdown -->
    <div v-if="showVariants" class="variant-picker" @click.stop>
      <div class="variant-option" @click="selectVariant(null)">
        <span>Original</span>
        <span class="variant-price">{{ formatCurrency(item.price) }}</span>
      </div>
      <div
        v-for="(vPrice, vKey) in item.variants"
        :key="vKey"
        class="variant-option"
        @click="selectVariant(vKey, vPrice)"
      >
        <span>{{ formatVariantName(vKey) }}</span>
        <span class="variant-price">{{ formatCurrency(vPrice) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  item: { type: Object, required: true },
});

const emit = defineEmits(["add-to-cart"]);

const showVariants = ref(false);

const hasVariants = computed(
  () => props.item.variants && Object.keys(props.item.variants).length > 0,
);

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

function handleClick() {
  if (hasVariants.value) {
    showVariants.value = !showVariants.value;
  } else {
    emit("add-to-cart", {
      name: props.item.name,
      price: props.item.price,
      variantKey: "",
      variantLabel: null,
    });
  }
}

function selectVariant(vKey, vPrice) {
  emit("add-to-cart", {
    name: props.item.name,
    price: vKey ? vPrice : props.item.price,
    variantKey: vKey || "",
    variantLabel: vKey ? formatVariantName(vKey) : null,
  });
  showVariants.value = false;
}
</script>

<style scoped>
.menu-card {
  padding: 1.2rem;
  cursor: pointer;
  position: relative;
  user-select: none;
  animation: scaleIn 0.3s ease;
}

.menu-card:active {
  transform: scale(0.97);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.card-emoji {
  font-size: 2rem;
}

.card-id {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 600;
}

.card-name {
  font-size: 0.92rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  line-height: 1.3;
}

.card-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent-light);
}

.card-variants {
  margin-top: 0.5rem;
}

.variant-badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: var(--accent-glow);
  color: var(--accent-light);
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Variant Picker */
.variant-picker {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-md);
  padding: 0.4rem;
  z-index: 10;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
  margin-top: 4px;
}

.variant-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background var(--transition-fast);
}

.variant-option:hover {
  background: var(--bg-glass-hover);
}

.variant-price {
  font-weight: 600;
  color: var(--accent-light);
  font-size: 0.82rem;
}
</style>
