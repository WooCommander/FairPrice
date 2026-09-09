<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'
import FpIconButton from './FpIconButton.vue'

interface Props {
	visible: boolean
	title?: string
	size?: 'sm' | 'md' | 'lg'
	hideClose?: boolean
	/** disable closing on backdrop click */
	persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	size: 'md',
	hideClose: false,
	persistent: false,
})

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void
	(e: 'close'): void
}>()

const close = () => {
	emit('update:visible', false)
	emit('close')
}

const onBackdrop = () => {
	if (!props.persistent) close()
}

const onKey = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && props.visible && !props.persistent) close()
}

watch(
	() => props.visible,
	v => {
		if (typeof document === 'undefined') return
		document.body.style.overflow = v ? 'hidden' : ''
		if (v) document.addEventListener('keydown', onKey)
		else document.removeEventListener('keydown', onKey)
	},
)

onBeforeUnmount(() => {
	if (typeof document !== 'undefined') {
		document.body.style.overflow = ''
		document.removeEventListener('keydown', onKey)
	}
})
</script>

<template>
	<Teleport to="body">
		<Transition name="fp-modal">
			<div v-if="visible" class="fp-modal-backdrop" @click.self="onBackdrop">
				<div class="fp-modal" :class="`fp-modal--${size}`" role="dialog" aria-modal="true">
					<header v-if="title || !hideClose || $slots.header" class="fp-modal__header">
						<slot name="header">
							<h2 class="fp-modal__title">{{ title }}</h2>
						</slot>
						<FpIconButton v-if="!hideClose" label="Закрыть" @click="close">
							<X :size="20" />
						</FpIconButton>
					</header>

					<div class="fp-modal__body">
						<slot />
					</div>

					<footer v-if="$slots.footer" class="fp-modal__footer">
						<slot name="footer" />
					</footer>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped lang="scss">
.fp-modal-backdrop {
	position: fixed;
	inset: 0;
	z-index: 3000;
	background: color-mix(in srgb, var(--color-text-primary) 55%, transparent);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: flex-end;
	justify-content: center;

	@media (min-width: 768px) {
		align-items: center;
		padding: 16px;
	}
}

.fp-modal {
	background: var(--color-surface);
	width: 100%;
	max-height: 92vh;
	border-radius: var(--radius-lg) var(--radius-lg) 0 0;
	display: flex;
	flex-direction: column;
	box-shadow: var(--shadow-3);

	@media (min-width: 768px) {
		border-radius: var(--radius-lg);
		max-height: 88vh;
	}

	&--sm {
		max-width: 400px;
	}

	&--md {
		max-width: 520px;
	}

	&--lg {
		max-width: 680px;
	}
}

.fp-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 12px 14px 20px;
	border-bottom: 1px solid var(--color-border);
}

.fp-modal__title {
	margin: 0;
	font-size: var(--text-h6);
	font-weight: 800;
	color: var(--color-text-primary);
}

.fp-modal__body {
	padding: 20px;
	overflow-y: auto;
	flex: 1;
}

.fp-modal__footer {
	display: flex;
	gap: 10px;
	padding: 14px 20px calc(14px + env(safe-area-inset-bottom, 0px));
	border-top: 1px solid var(--color-border);
}

.fp-modal-enter-active,
.fp-modal-leave-active {
	transition: opacity 0.2s ease;

	.fp-modal {
		transition: transform 0.25s ease;
	}
}

.fp-modal-enter-from,
.fp-modal-leave-to {
	opacity: 0;

	.fp-modal {
		transform: translateY(24px);
	}
}
</style>
