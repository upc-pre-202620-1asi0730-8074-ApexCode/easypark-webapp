<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
});
</script>

<template>
  <div class="authentication-page">
    <section class="authentication-card" aria-labelledby="authentication-title">
      <header class="authentication-card__header">
        <span class="brand">
          <span class="brand-mark" aria-hidden="true"></span>
          <span>EasyPark</span>
        </span>
        <h1 id="authentication-title" class="authentication-card__title">{{ title }}</h1>
        <p class="authentication-card__subtitle">{{ subtitle }}</p>
      </header>
      <slot/>
    </section>
  </div>
</template>

<style scoped>
.authentication-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 16px;
  background: var(--ep-page);
}

.authentication-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border: 1px solid var(--ep-border);
  border-radius: 14px;
  background: var(--ep-surface);
}

.authentication-card__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 28px;
  text-align: center;
}

.authentication-card__title {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--ep-text);
}

.authentication-card__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--ep-text-secondary);
}

@media (max-width: 767px) {
  .authentication-card {
    padding: 28px 20px;
  }
}
</style>
