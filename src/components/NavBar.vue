<template>
  <nav class="navbar">
    <div class="nav-brand">
      <span class="brand-icon">🍗</span>
      <span class="brand-text">DCelup Crispy</span>
    </div>
    <div class="nav-links">
      <router-link to="/" class="nav-link" active-class="active" exact>
        <span class="nav-icon">💰</span>
        <span>Kasir</span>
      </router-link>
      <router-link to="/menu" class="nav-link" active-class="active">
        <span class="nav-icon">📋</span>
        <span>Menu</span>
      </router-link>
      <router-link to="/rekap" class="nav-link" active-class="active">
        <span class="nav-icon">📊</span>
        <span>Rekap</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup></script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 64px;
  background: rgba(15, 15, 26, 0.97);
  border-bottom: 1px solid rgba(255, 165, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.6rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ff9f43, #feca57);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1.1rem;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: #feca57;
  background: rgba(255, 165, 0, 0.08);
}

.nav-link.active {
  color: #feca57;
  background: rgba(255, 165, 0, 0.12);
  box-shadow: 0 0 12px rgba(255, 165, 0, 0.1);
}

.nav-icon {
  font-size: 1.1rem;
}
</style>
