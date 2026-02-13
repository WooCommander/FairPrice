<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FpButton from '@/design-system/components/FpButton.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpConfirmationModal from '@/design-system/components/FpConfirmationModal.vue'
import { catalogStore } from '@/modules/catalog/store/catalogStore'
import { shoppingListStore } from '@/modules/shopping-list/store/shoppingListStore'

import PriceChart from '@/components/PriceChart.vue'

const route = useRoute()
const router = useRouter()
const { currentProduct } = catalogStore

// Product Editing State
const isEditingProduct = ref(false)
const productForm = ref({ name: '', category: '' })

onMounted(async () => {
	const id = route.params.id as string
	if (id) {
		await catalogStore.loadProductById(id)
	}
})

const latestHistory = computed(() => {
	if (!currentProduct.value?.history) return []
	return currentProduct.value.history
})

// History grouping removed in favor of simple timeline

const chartData = computed(() => {
	if (!latestHistory.value) return []
	// Filter out invalid prices/dates if any
	return latestHistory.value
		.map(h => ({
			date: new Date(h.date),
			price: h.price
		}))
		.filter(d => !isNaN(d.price) && !isNaN(d.date.getTime()))
})

// --- Product Actions ---

const startEditProduct = () => {
	if (currentProduct.value) {
		productForm.value = {
			name: currentProduct.value.name,
			category: currentProduct.value.category
		}
		isEditingProduct.value = true
	}
}

const cancelEditProduct = () => {
	isEditingProduct.value = false
}

const saveProduct = async () => {
	if (currentProduct.value) {
		await catalogStore.updateProduct(currentProduct.value.id, productForm.value)
		isEditingProduct.value = false
	}
}

const showDeleteModal = ref(false)

const confirmDeleteProduct = () => {
	showDeleteModal.value = true
}

const handleDeleteConfirm = async () => {
	if (currentProduct.value) {
		try {
			await catalogStore.deleteProduct(currentProduct.value.id)
			router.back() // Return to previous page as requested
		} catch (e: any) {
			console.error('Failed to delete product:', e)
			alert(`Не удалось удалить товар: ${e.message || e}`)
		}
	}
}
// Store editing removed from this view for simplicity

const goToAddPrice = () => {
	if (currentProduct.value) {
		router.push(`/add-price/${currentProduct.value.id}`)
	}
}

const isFavorite = computed(() => {
	if (!currentProduct.value) return false
	return catalogStore.isFavorite(currentProduct.value.id)
})

const toggleFavorite = async () => {
	if (currentProduct.value) {
		await catalogStore.toggleFavorite(currentProduct.value.id)
	}
}

const addToShoppingList = async () => {
	if (currentProduct.value) {
		try {
			await shoppingListStore.addItem(currentProduct.value.name, currentProduct.value.id)
			alert('Добавлено в список покупок!')
		} catch (e) {
			alert('Не удалось добавить в список')
		}
	}
}
</script>

<template>
	<div class="product-view">
		<!-- Header -->
		<header class="ergo-header">
			<div style="display: flex; align-items: center; flex-direction: column;">
				<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
					<button class="nav-btn" @click="router.back()">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
							stroke-linecap="round" stroke-linejoin="round">
							<line x1="19" y1="12" x2="5" y2="12"></line>
							<polyline points="12 19 5 12 12 5"></polyline>
						</svg>
					</button>
					<div class="header-content">
						<!-- Empty for spacing or future use -->
					</div>
					<div class="header-controls">
						<button class="nav-btn" @click="toggleFavorite">
							<svg v-if="isFavorite" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
								stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
								class="icon-starred">
								<polygon
									points="12 2 15.09 8.26 21.78 9.27 16.94 14.14 18.18 21.02 12 17.77 5.82 21.02 7.06 14.14 2.22 9.27 8.91 8.26 12 2">
								</polygon>
							</svg>
							<svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								stroke-linecap="round" stroke-linejoin="round">
								<polygon
									points="12 2 15.09 8.26 21.78 9.27 16.94 14.14 18.18 21.02 12 17.77 5.82 21.02 7.06 14.14 2.22 9.27 8.91 8.26 12 2">
								</polygon>
							</svg>
						</button>
						<button class="nav-btn" @click="startEditProduct" title="Редактировать">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
								<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
							</svg>
						</button>
						<button class="nav-btn danger-icon" @click="confirmDeleteProduct" title="Удалить">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
								stroke-linecap="round" stroke-linejoin="round">
								<polyline points="3 6 5 6 21 6"></polyline>
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2">
								</path>
								<line x1="10" y1="11" x2="10" y2="17"></line>
								<line x1="14" y1="11" x2="14" y2="17"></line>
							</svg>
						</button>
					</div>
				</div>



			</div>
		</header>

		<div v-if="currentProduct" class="content-body">
			<!-- NEW HERO HEADER -->
			<div class="product-hero-header">
				<span class="hero-category">{{ currentProduct.category }}</span>
				<h1 class="hero-title">{{ currentProduct.name }}</h1>
			</div>
			<!-- VALUE CARD -->
			<div class="value-card">
				<div class="card-top-info">
					<span class="store-badge" v-if="latestHistory[0]?.storeName">
						📍 {{ latestHistory[0].storeName }}
					</span>
					<span class="date-badge" v-if="latestHistory[0]?.dateRelative">
						{{ latestHistory[0].dateRelative }}
					</span>
				</div>

				<div class="price-hero">
					<span class="main-price">{{ currentProduct.formattedPrice }}</span>
					<span class="unit-label" v-if="currentProduct.unit">за {{ currentProduct.unit }}</span>
				</div>

				<div class="value-analysis" v-if="currentProduct.priceStatus !== 'neutral'">
					<span class="analysis-pill" :class="currentProduct.priceStatus">
						{{ currentProduct.priceStatus === 'good' ? '🔥 Отличная цена' : '⚠️ Дороговато' }}
					</span>
					<span class="avg-ref" v-if="currentProduct.averagePrice">Средняя: ~{{
						Math.round(currentProduct.averagePrice) }} ₽</span>
				</div>

				<!-- INTEGRATED CHART -->
				<div class="integrated-chart" v-if="chartData.length > 1">
					<PriceChart :data="chartData" :average-price="currentProduct.averagePrice" :height="100" />
				</div>

				<!-- Primary Action -->
				<div class="primary-action">
					<FpButton size="md" width="full" @click="goToAddPrice">
						Обновить цену
					</FpButton>
				</div>
			</div>

			<!-- SECONDARY ACTIONS -->
			<div class="secondary-actions">
				<FpButton variant="outline" size="sm" @click="addToShoppingList">
					📝 В список
				</FpButton>
				<FpButton variant="outline" size="sm" @click="router.push(`/category/${currentProduct.category}`)">
					📂 В категорию
				</FpButton>
			</div>

			<!-- HISTORY LIST (Compact) -->
			<div class="history-section">
				<!-- Chart moved up -->

				<div class="history-cards-list">
					<div v-for="(item, idx) in latestHistory" :key="idx" class="history-card-item">
						<div class="h-card-left">
							<div class="h-price">{{ item.price }} ₽</div>
							<div class="h-store">{{ item.storeName }}</div>
						</div>
						<div class="h-card-right">
							<div class="h-date">{{ item.dateRelative }}</div>
							<!-- Optional: Trend arrow or indicator could go here -->
						</div>
					</div>
				</div>
			</div>

			<!-- Edit Modal (Overlay) -->
			<div v-if="isEditingProduct" class="edit-modal-overlay" @click.self="cancelEditProduct">
				<div class="edit-modal-card">
					<h3 class="modal-title">Редактирование</h3>

					<div class="modal-form">
						<FpInput v-model="productForm.name" label="Название товара" placeholder="Введите название" />
						<!-- Optional: Category Input if needed, using simple input or FpInput -->
						<FpInput v-model="productForm.category" label="Категория" placeholder="Категория" />
					</div>

					<div class="modal-actions">
						<FpButton size="md" width="full" @click="saveProduct">
							Сохранить
						</FpButton>
						<FpButton size="md" variant="text" width="full" @click="cancelEditProduct">
							Отмена
						</FpButton>


					</div>
				</div>
			</div>

		</div>
		<div v-else class="loading-state">
			Загрузка...
		</div>

		<FpConfirmationModal :visible="showDeleteModal" title="Удаление товара" message="Удалить товар навсегда?"
			confirm-text="Да, удалить" variant="danger" @update:visible="showDeleteModal = $event"
			@confirm="handleDeleteConfirm" />
	</div>
</template>

<style scoped lang="scss">
.product-view {
	padding-bottom: 40px;
}


.ergo-header {
	//display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	background: var(--color-surface);
	position: sticky;
	top: 0;
	z-index: 10;
	border-bottom: 1px solid var(--color-border);
}

.nav-btn {
	background: transparent;
	border: none;
	color: var(--color-text-secondary); // Default color
	width: 40px; // Standard touch target
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	cursor: pointer;
	transition: background 0.2s, color 0.2s;

	&:active {
		background: var(--color-surface-hover);
		color: var(--color-text-primary);
	}
}

.icon-starred {
	color: var(--color-warning, #FFD700);
}

.danger-icon {
	&:active {
		color: var(--color-error);
		background: rgba(var(--color-error-rgb), 0.1);
	}
}

.header-content {
	flex: 1;
}

.header-controls {
	display: flex;
	gap: 0;
}

.product-hero-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 12px;
	margin-bottom: 24px;
	margin-top: 8px;
}

.hero-category {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 1.5px;
	font-weight: 700;
	color: var(--color-primary);
	background: rgba(var(--color-primary-rgb), 0.1); // Fallback if var not set, or use surface-hover
	background: var(--color-surface-hover);
	padding: 6px 12px;
	border-radius: 20px;
}

.hero-title {
	font-size: 26px;
	font-weight: 800;
	line-height: 1.2;
	color: var(--color-text-primary);
	margin: 0;
	font-family: var(--font-heading); // Use the serif font for elegance
}

.content-body {
	padding: 16px;

	@media (max-width: 600px) {
		padding: 0.5rem; // User requested exactly this
	}

	display: flex;
	flex-direction: column;
	gap: 16px; // Adjusted gap
}

// Removed .product-page-title as it's back in header

// VALUE CARD
.value-card {
	background: var(--color-surface);
	border-radius: 20px; // Slightly smaller radius
	padding: 20px; // Reduced padding
	text-align: center;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
	border: 1px solid var(--color-border);
	position: relative;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.card-top-info {
	display: flex;
	justify-content: center;
	gap: 8px;
	margin-bottom: 8px; // Tighter
	font-size: 13px;
	color: var(--color-text-secondary);
	align-items: center;
}

.date-badge {
	font-size: 14px; // Increased for readability
	color: var(--color-text-secondary);
	font-weight: 500;
}

.store-badge {
	font-weight: 500;
	color: var(--color-text-primary);
	background: var(--color-background);
	padding: 4px 8px;
	border-radius: 8px;
}

.price-hero {
	margin-bottom: 12px; // Tighter
	display: flex;
	flex-direction: column;
	align-items: center;
}

.main-price {
	font-size: 40px; // Reduced from 48
	font-weight: 800;
	color: var(--color-text-primary);
	line-height: 1;
	letter-spacing: -1px;
}

.unit-label {
	font-size: 13px;
	color: var(--color-text-tertiary);
	margin-top: 2px;
}

.value-analysis {
	display: flex;
	align-items: center; // Horizontal alignment if possible, or tight vertical
	justify-content: center;
	gap: 8px;
	margin-bottom: 16px; // Tighter
	flex-wrap: wrap;
}

.analysis-pill {
	padding: 4px 10px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 600;

	&.good {
		background: rgba(var(--color-success-rgb), 0.1);
		color: var(--color-success);
	}

	&.bad {
		background: rgba(var(--color-error-rgb), 0.1);
		color: var(--color-error);
	}
}

.badge-bad {
	color: var(--color-error);
	background: rgba(var(--color-error-rgb), 0.1);
	padding: 4px 10px;
	border-radius: 16px;
	font-size: 12px;
	font-weight: 600;
}

.avg-ref {
	font-size: 14px; // Increased
	color: var(--color-text-secondary);
	font-weight: 500;
}

// SECONDARY ACTIONS
.secondary-actions {
	display: flex;
	gap: 8px; // Reduced gap
	justify-content: center; // Center on screen
	flex-wrap: wrap;
}

// HISTORY - COMPACT STYLE
.integrated-chart {
	width: 100%;
	margin: 8px 0 16px 0;
	/* Negative margin to pull it closer if needed */
}

.history-cards-list {
	display: flex;
	flex-direction: column;
	gap: 8px; // Reduced gap
	margin-top: 16px; // Space from secondary actions
}

.history-card-item {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: 8px; // Smaller radius
	padding: 8px 12px; // Compact padding
	display: flex;
	justify-content: space-between;
	align-items: center;
	// Removed shadow for flatter, less "heavy" look
	transition: transform 0.1s;

	&:active {
		transform: scale(0.99);
		background: var(--color-surface-hover);
	}
}

.h-card-left {
	display: flex;
	flex-direction: column;
	gap: 0; // Tighter
}

.h-price {
	font-size: 16px; // Smaller price
	font-weight: 700;
	color: var(--color-text-primary);
	line-height: 1.2;
}

.h-store {
	font-size: 12px; // Smaller store
	color: var(--color-text-secondary);
	font-weight: 400;
}

.h-card-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.h-date {
	font-size: 11px; // Smaller date
	color: var(--color-text-tertiary);
}

// MODAL STYLES
.edit-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6); // Dimmed background
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	backdrop-filter: blur(4px);
	padding: 16px;
}

.edit-modal-card {
	background: var(--color-surface);
	border-radius: 24px;
	padding: 24px;
	width: 100%;
	max-width: 340px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
	animation: modal-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes modal-pop {
	from {
		transform: scale(0.9);
		opacity: 0;
	}

	to {
		transform: scale(1);
		opacity: 1;
	}
}

.modal-title {
	font-size: 20px;
	font-weight: 700;
	text-align: center;
	margin: 0 0 24px 0;
	color: var(--color-text-primary);
}

.modal-form {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 24px;
}

.modal-actions {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.delete-action {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--color-border);
}
</style>
