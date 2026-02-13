<script setup lang="ts">
import { ref } from 'vue'
import FpButton from '@/design-system/components/FpButton.vue'
import FpInput from '@/design-system/components/FpInput.vue'
import FpCombobox, { type ComboboxItem } from '@/design-system/components/FpCombobox.vue'
import FpCard from '@/design-system/components/FpCard.vue'

// Button demo
const btnLoading = ref(false)
const toggleLoading = () => btnLoading.value = !btnLoading.value

// Input demo
const textVal = ref('')
const numberVal = ref('')
const errorVal = ref('Invalid input')

// Combobox demo
const comboVal = ref('')
const comboItems = ref<ComboboxItem[]>([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
    { id: 4, name: 'Date' }
])

const handleCreate = (val: string) => {
    alert(`Create: ${val}`)
}

</script>

<template>
    <div class="design-system-view">
        <header class="ds-header">
            <h1>Design System</h1>
            <p>Component showcase</p>
        </header>

        <section class="ds-section">
            <h2>Buttons</h2>
            <div class="ds-grid">
                <FpCard>
                    <h3>Variants</h3>
                    <div class="row">
                        <FpButton variant="primary">Primary</FpButton>
                        <FpButton variant="secondary">Secondary</FpButton>
                        <FpButton variant="outline">Outline</FpButton>
                        <FpButton variant="danger">Danger</FpButton>
                    </div>
                </FpCard>
                <FpCard>
                    <h3>Sizes</h3>
                    <div class="row">
                        <FpButton size="sm">Small</FpButton>
                        <FpButton size="md">Medium</FpButton>
                        <FpButton size="lg">Large</FpButton>
                    </div>
                </FpCard>
                <FpCard>
                    <h3>States</h3>
                    <div class="row">
                        <FpButton disabled>Disabled</FpButton>
                        <FpButton :loading="btnLoading" @click="toggleLoading">
                            {{ btnLoading ? 'Loading...' : 'Click to Load' }}
                        </FpButton>
                    </div>
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Inputs</h2>
            <div class="ds-grid">
                <FpCard>
                    <FpInput v-model="textVal" label="Text Input" placeholder="Type something..." />
                    <p>Value: {{ textVal }}</p>
                </FpCard>

                <FpCard>
                    <FpInput v-model="numberVal" label="Number Input" type="number" />
                </FpCard>

                <FpCard>
                    <FpInput v-model="errorVal" label="Error State" error="This field is required" />
                </FpCard>
            </div>
        </section>

        <section class="ds-section">
            <h2>Combobox</h2>
            <FpCard>
                <FpCombobox v-model="comboVal" :items="comboItems" label="Fruit Selector" placeholder="Select a fruit"
                    allow-create @create="handleCreate" />
                <p>Selected: {{ comboVal }}</p>
            </FpCard>
        </section>

        <section class="ds-section">
            <h2>Cards</h2>
            <div class="ds-grid">
                <FpCard padding="none">Padding: None</FpCard>
                <FpCard padding="sm">Padding: Small</FpCard>
                <FpCard padding="md">Padding: Medium</FpCard>
                <FpCard padding="lg">Padding: Large</FpCard>
                <FpCard flat>Flat Card</FpCard>
            </div>
        </section>
    </div>
</template>

<style scoped lang="scss">
.design-system-view {
    // max-width: 800px;
    // margin: 0 auto;
    padding: var(--spacing-lg);
}

.ds-header {
    margin-bottom: var(--spacing-xl);
    text-align: center;
}

.ds-section {
    margin-bottom: var(--spacing-xl);

    h2 {
        margin-bottom: var(--spacing-md);
        border-bottom: 2px solid var(--color-border);
        padding-bottom: 8px;
    }
}

.ds-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.row {
    display: flex;
    gap: var(--spacing-md);
    flex-wrap: wrap;
    align-items: center;
}
</style>
