<template>
    <nav class="fp-breadcrumbs">
        <ol>
            <li v-for="(item, index) in items" :key="index" :class="{ active: index === items.length - 1 }">
                <template v-if="item.to && index < items.length - 1">
                    <router-link :to="item.to">{{ item.label }}</router-link>
                    <span class="separator">/</span>
                </template>
                <span v-else>{{ item.label }}</span>
            </li>
        </ol>
    </nav>
</template>

<script setup lang="ts">


interface BreadcrumbItem {
    label: string
    to?: string
}

defineProps<{
    items: BreadcrumbItem[]
}>()
</script>

<style scoped lang="scss">
.fp-breadcrumbs {
    font-size: var(--text-caption);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);

    ol {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    li {
        display: flex;
        align-items: center;
        gap: 8px;

        &.active span {
            color: var(--color-text-primary);
            font-weight: 500;
        }
    }

    a {
        color: var(--color-primary);
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
            text-decoration: underline;
        }
    }

    .separator {
        color: var(--color-text-disabled);
    }
}
</style>
