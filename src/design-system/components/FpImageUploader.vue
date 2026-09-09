<script setup lang="ts">
import { ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'

interface Props {
	/** list of image URLs already attached */
	modelValue: string[]
	label?: string
	max?: number
	uploading?: boolean
	disabled?: boolean
	/** style the first image as a "cover" */
	coverFirst?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	max: 8,
	uploading: false,
	disabled: false,
	coverFirst: false,
})

const emit = defineEmits<{
	(e: 'update:modelValue', value: string[]): void
	(e: 'add', files: File[]): void
	(e: 'remove', url: string): void
}>()

const onPick = (e: Event) => {
	const input = e.target as HTMLInputElement
	const files = Array.from(input.files ?? [])
	input.value = ''
	if (files.length) emit('add', files)
}

const remove = (url: string) => {
	emit('remove', url)
	emit(
		'update:modelValue',
		props.modelValue.filter(u => u !== url),
	)
}
</script>

<template>
	<div class="fp-uploader" :class="{ 'is-disabled': disabled }">
		<span v-if="label" class="fp-uploader__label">{{ label }}</span>
		<div class="fp-uploader__grid">
			<div v-for="(url, i) in modelValue" :key="url" class="fp-uploader__thumb"
				:class="{ 'is-cover': coverFirst && i === 0 }">
				<img :src="url" alt="" />
				<button type="button" class="fp-uploader__del" @click="remove(url)">
					<Trash2 :size="14" />
				</button>
			</div>

			<label v-if="modelValue.length < max" class="fp-uploader__add">
				<Loader2 v-if="uploading" :size="22" class="spin" />
				<ImagePlus v-else :size="22" />
				<input type="file" accept="image/*" multiple hidden :disabled="disabled || uploading"
					@change="onPick" />
			</label>
		</div>
	</div>
</template>

<style scoped lang="scss">
.fp-uploader {
	display: flex;
	flex-direction: column;
	gap: 6px;

	&.is-disabled {
		opacity: 0.5;
		pointer-events: none;
	}
}

.fp-uploader__label {
	font-size: 12px;
	font-weight: 500;
	color: var(--color-text-secondary);
	padding-left: 2px;
}

.fp-uploader__grid {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.fp-uploader__thumb,
.fp-uploader__add {
	width: 76px;
	height: 76px;
	border-radius: var(--radius-md);
	overflow: hidden;
	position: relative;
	flex-shrink: 0;
}

.fp-uploader__thumb {
	border: 1px solid var(--color-border);

	&.is-cover {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent);
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.fp-uploader__del {
	position: absolute;
	top: 4px;
	right: 4px;
	display: inline-flex;
	border: none;
	border-radius: 6px;
	padding: 3px;
	background: color-mix(in srgb, var(--color-text-primary) 55%, transparent);
	color: #fff;
	cursor: pointer;
}

.fp-uploader__add {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px dashed var(--color-border);
	color: var(--color-text-tertiary);
	cursor: pointer;

	&:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
	}
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	100% {
		transform: rotate(360deg);
	}
}
</style>
