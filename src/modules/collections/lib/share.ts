import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { ITEM_STATUS_LABELS } from '../domain/CollectionItem'
import type { CollectionItem } from '../domain/CollectionItem'
import type { CollectionTypeConfig } from '../domain/types'

export interface ShareOutcome {
	method: 'native' | 'web' | 'clipboard' | 'cancelled' | 'failed'
}

/** Human-readable card of an item, ready to paste into a chat. */
export function buildItemShareText(
	item: CollectionItem,
	type: CollectionTypeConfig,
	collectionName?: string,
): string {
	const lines: string[] = [item.title]

	const sub =
		type.formatSubtitle?.({ subtitle: item.subtitle, data: item.data }) ?? item.subtitle ?? ''
	if (sub) lines.push(sub)

	const extras: string[] = []
	for (const f of type.fields) {
		const v = item.data[f.key]
		if (v === undefined || v === null || v === '') continue
		if (sub.includes(String(v))) continue
		extras.push(`${f.label}: ${v}`)
	}
	if (extras.length) lines.push('', ...extras)

	const facts: string[] = []
	if (item.quantity > 1) facts.push(`Экземпляров: ${item.quantity}`)
	if (item.status && item.status !== 'have') {
		const label = ITEM_STATUS_LABELS[item.status] ?? item.status
		facts.push(item.status === 'for_sale' && item.price ? `${label}: ${item.price}` : label)
	}
	if (item.location) facts.push(`Где: ${item.location}`)
	if (facts.length) lines.push('', ...facts)

	if (item.notes) lines.push('', item.notes)
	if (collectionName) lines.push('', `— из коллекции «${collectionName}»`)

	return lines.join('\n')
}

export async function shareItem(
	item: CollectionItem,
	type: CollectionTypeConfig,
	collectionName?: string,
): Promise<ShareOutcome> {
	const text = buildItemShareText(item, type, collectionName)
	const url = item.cover_url || undefined

	// Native (Android/iOS): system share sheet -> Telegram, WhatsApp, etc.
	if (Capacitor.isNativePlatform()) {
		try {
			await Share.share({ title: item.title, text, url, dialogTitle: 'Поделиться' })
			return { method: 'native' }
		} catch (e: any) {
			if (String(e?.message ?? e).toLowerCase().includes('cancel')) return { method: 'cancelled' }
			return { method: 'failed' }
		}
	}

	// Web: Web Share API where available
	const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
	if (typeof nav.share === 'function') {
		try {
			await nav.share({ title: item.title, text: url ? `${text}\n${url}` : text })
			return { method: 'web' }
		} catch (e: any) {
			if (e?.name === 'AbortError') return { method: 'cancelled' }
			// fall through to clipboard
		}
	}

	// Fallback: copy to clipboard
	try {
		await navigator.clipboard.writeText(url ? `${text}\n${url}` : text)
		return { method: 'clipboard' }
	} catch {
		return { method: 'failed' }
	}
}
