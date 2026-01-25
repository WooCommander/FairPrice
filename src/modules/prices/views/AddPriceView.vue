<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PricesService } from '../services/PricesService'
import { useAuth } from '@/modules/auth/composables/useAuth'
import FpInput from '@/design-system/components/FpInput.vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpCard from '@/design-system/components/FpCard.vue'

const route = useRoute()
const router = useRouter()
const { currentUser } = useAuth()

const productId = String(route.params.productId || '')
const price = ref<number | ''>('')
const placeName = ref('')
const loading = ref(false)

const submitPrice = async () => {
    if (!price.value || !placeName.value) return
    if (!currentUser.value) return // Should be guarded by route

    loading.value = true
    try {
        await PricesService.addPriceReport({
            productId,
            price: Number(price.value),
            placeName: placeName.value,
            userId: currentUser.value.id,
            dateObserved: new Date().toISOString()
        })

        alert('Price saved!')
        router.back()
    } catch (e) {
        alert('Failed to save price')
        console.error(e)
    } finally {
        loading.value = false
    }
}

const goBack = () => router.back()
</script>

<template>
    <div class="add-price-view">
        <header>
            <FpButton variant="text" size="sm" @click="goBack">Cancel</FpButton>
            <h3>Add Price</h3>
        </header>

        <FpCard class="form-card">
            <FpInput v-model="price" label="Price (UZS)" type="number" placeholder="e.g. 5000" />

            <FpInput v-model="placeName" label="Place Name" placeholder="e.g. Makro on Pushkin str" />

            <div class="actions">
                <FpButton variant="primary" size="full" :loading="loading" :disabled="!price || !placeName"
                    @click="submitPrice">
                    Submit Price
                </FpButton>
            </div>
        </FpCard>
    </div>
</template>

<style scoped lang="scss">
.add-price-view {
    padding: var(--spacing-md);
}

header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);

    h3 {
        margin: 0;
    }
}

.actions {
    margin-top: var(--spacing-lg);
}
</style>
