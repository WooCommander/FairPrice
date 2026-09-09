<script setup lang="ts">
import { ref } from 'vue'
import { ImagePlus, Camera as CameraIcon, Loader2, Trash2 } from 'lucide-vue-next'

interface Props {
	/** list of image URLs already attached */
	modelValue: string[]
	label?: string
	max?: number
	uploading?: boolean
	disabled?: boolean
	/** style the first image as a "cover" */
	coverFirst?: boolean
	/** show a "take a photo" tile (uses the device camera) */
	camera?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	max: 8,
	uploading: false,
	disabled: false,
	coverFirst: false,
	camera: true,
})

const emit = defineEmits<{
	(e: 'update:modelValue', value: string[]): void
	(e: 'add', files: File[]): void
	(e: 'remove', url: string): void
}>()

const cameraFallbackRef = ref<HTMLInputElement | null>(null)

const onPick = (e: Event) => {
	const input = e.target as HTMLInputElement
	const files = Array.from(input.files ?? [])
	input.value = ''
	if (files.length) emit('add', files)
}

const captureFromCamera = async () => {
	if (props.disabled || props.uploading) return
	try {
		const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
		const photo = await Camera.getPhoto({
			quality: 85,
			resultType: CameraResultType.Uri,
			source: CameraSource.Camera,
			correctOrientation: true,
			promptLabelHeader: 'Фото',
			promptLabelPhoto: 'Из галереи',
			promptLabelPicture: 'Сделать снимок',
		})
		if (!photo.webPath) return
		const blob = await (await fetch(photo.webPath)).blob()
		const file = new File([blob], `photo.${photo.format || 'jpg'}`, {
			type: blob.type || 'image/jpeg',
		})
		emit('add', [file])
	} catch (e: any) {
		const msg = String(e?.message ?? e).toLowerCase()
		if (msg.includes('cancel') || msg.includes('denied')) return
		// plugin unavailable (e.g. plain browser) -> native file input with camera hint
		cameraFallbackRef.value?.click()
	}
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

			<template v-if="modelValue.length < max">
				<button v-if="camera" type="button" class="fp-uploader__tile" :disabled="disabled || uploading"
					@click="captureFromCamera">
					<Loader2 v-if="uploading" :size="22" class="spin" />
					<CameraIcon v-else :size="22" />
				</button>

				<label class="fp-uploader__tile">
					<Loader2 v-if="uploading && !camera" :size="22" class="spin" />
					<ImagePlus v-else :size="22" />
					<input type="file" accept="image/*" multiple hidden :disabled="disabled || uploading"
						@change="onPick" />
				</label>
			</template>
		</div>

		<input ref="cameraFallbackRef" type="file" accept="image/*" capture="environment" hidden
			@change="onPick" />
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
.fp-uploader__tile {
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

.fp-uploader__tile {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px dashed var(--color-border);
	background: transparent;
	color: var(--color-text-tertiary);
	cursor: pointer;

	&:hover:not(:disabled) {
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	&:disabled {
		cursor: default;
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
