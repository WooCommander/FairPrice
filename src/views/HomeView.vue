<script setup lang="ts">
import { useRouter } from 'vue-router'
import FpCard from '@/design-system/components/FpCard.vue'

const router = useRouter()

const login = async () => {
  alert('Please implement real login or use Supabase Auth UI.')
}

const mockFeed = [
  { id: 1, icon: '🥔', title: 'Potato (Young)', price: '4,500 UZS', store: 'Makro', time: '2 mins ago' },
  { id: 2, icon: '🥩', title: 'Beef (Boneless)', price: '95,000 UZS', store: 'Chorsu Bazaar', time: '15 mins ago' },
  { id: 3, icon: '🥚', title: 'Eggs (10pcs)', price: '18,200 UZS', store: 'Korzinka', time: '45 mins ago' },
  { id: 4, icon: '🥛', title: 'Milk (Nestle 1L)', price: '14,500 UZS', store: 'Havas', time: '1 hour ago' },
  { id: 5, icon: '🍎', title: 'Apples (Golden)', price: '12,000 UZS', store: 'Eco Bazaar', time: '2 hours ago' },
]
</script>

<template>
  <div class="home-dashboard">
    <!-- Main Content Area -->
    <section class="dashboard-main">
      <div class="hero-banner">
        <div class="hero-content">
          <h1>Welcome to Fair Price</h1>
          <p>Find the best deals nearby or share your own findings.</p>
          <div class="hero-actions">
            <button class="primary-btn" @click="router.push('/search')">Search Products</button>
            <button class="secondary-btn" @click="router.push('/about')">How it works</button>
          </div>
        </div>
        <div class="hero-illustration">
          <!-- Abstract pattern or illustration -->
          🛒
        </div>
      </div>

      <div class="quick-actions-section">
        <h3>What would you like to do?</h3>
        <div class="actions-grid">
          <FpCard class="action-card" @click="router.push('/search')">
            <span class="emoji">🔍</span>
            <span class="label">Find Products</span>
            <span class="desc">Search efficiently</span>
          </FpCard>
          <FpCard class="action-card" @click="login">
            <span class="emoji">➕</span>
            <span class="label">Add Price</span>
            <span class="desc">Contribute data</span>
          </FpCard>
          <FpCard class="action-card">
            <span class="emoji">📍</span>
            <span class="label">Map View</span>
            <span class="desc">Explore nearby</span>
          </FpCard>
          <FpCard class="action-card">
            <span class="emoji">⭐</span>
            <span class="label">Saved Items</span>
            <span class="desc">Your favorites</span>
          </FpCard>
        </div>
      </div>
    </section>

    <!-- Sidebar / Feed Area -->
    <aside class="dashboard-sidebar">
      <div class="feed-container">
        <div class="feed-header">
          <h3>Recent Updates</h3>
          <a href="#">View All</a>
        </div>

        <div class="feed-list">
          <FpCard class="feed-item" padding="sm" v-for="item in mockFeed" :key="item.id">
            <div class="feed-icon">{{ item.icon }}</div>
            <div class="feed-content">
              <span class="title">{{ item.title }}</span>
              <div class="meta-row">
                <span class="price">{{ item.price }}</span>
                <span class="divider">•</span>
                <span class="store">{{ item.store }}</span>
              </div>
              <span class="time">{{ item.time }}</span>
            </div>
          </FpCard>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.home-dashboard {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-xl);
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// --- Hero Section ---
.hero-banner {
  background: linear-gradient(110deg, var(--color-primary), #A66EFF);
  border-radius: var(--radius-lg);
  padding: 56px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-2);
  position: relative;
  overflow: hidden;

  // Background blobs
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
  }

  .hero-content {
    z-index: 1;
    max-width: 65%;

    h1 {
      font-size: var(--text-h2);
      font-weight: 700;
      margin: 0 0 var(--spacing-sm);
      letter-spacing: -1px;
    }

    p {
      opacity: 0.95;
      font-size: var(--text-h6);
      margin-bottom: var(--spacing-lg);
      line-height: 1.5;
    }
  }

  .hero-actions {
    display: flex;
    gap: var(--spacing-md);

    button {
      padding: 14px 28px;
      border-radius: var(--radius-pill);
      font-weight: 600;
      font-size: var(--text-body-1);
      cursor: pointer;
      border: none;
      transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
      }
    }

    .primary-btn {
      background: white;
      color: var(--color-primary);
    }

    .secondary-btn {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.4);

      &:hover {
        background: rgba(255, 255, 255, 0.35);
      }
    }
  }

  .hero-illustration {
    font-size: 140px;
    opacity: 0.8;
    transform: rotate(15deg) translateY(10px);
    filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.2));
  }
}

.quick-actions-section {
  h3 {
    margin-bottom: var(--spacing-md);
    font-size: var(--text-h5);
    font-weight: 700;
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--spacing-md);
  }

  .action-card {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-lg);
    gap: var(--spacing-xs);
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    position: relative;
    overflow: hidden;

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-hover);
      transform: translateY(-4px);

      .emoji {
        transform: scale(1.1);
      }
    }

    .emoji {
      font-size: 40px;
      margin-bottom: var(--spacing-sm);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .label {
      font-weight: 700;
      font-size: var(--text-h6);
    }

    .desc {
      font-size: var(--text-body-2);
      color: var(--color-text-secondary);
      line-height: 1.4;
    }
  }
}

// --- Sidebar ---
.feed-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-md);

  h3 {
    font-size: var(--text-h5);
    font-weight: 700;
    margin: 0;
  }

  a {
    font-size: var(--text-body-2);
    font-weight: 600;
    color: var(--color-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.feed-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid transparent; // prevent layout shift on hover

  &:hover {
    background-color: var(--color-surface);
    border-color: var(--color-border);
    transform: scale(1.01);
    box-shadow: var(--shadow-1);
  }

  .feed-icon {
    font-size: 28px;
    background: var(--color-background);
    width: 56px;
    height: 56px; // Larger touch target
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
  }

  .feed-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .title {
    font-weight: 700;
    font-size: var(--text-body-1);
    color: var(--color-text-primary);
  }

  .meta-row {
    display: flex;
    gap: 8px;
    font-size: var(--text-body-2);
    color: var(--color-text-secondary);
    align-items: center;
    margin-top: 2px;

    .price {
      color: var(--color-success);
      font-weight: 700;
      background: rgba(0, 210, 160, 0.1);
      padding: 0 6px;
      border-radius: 4px;
    }
  }

  .time {
    font-size: var(--text-caption);
    color: var(--color-text-disabled);
    margin-top: 4px;
  }
}
</style>
