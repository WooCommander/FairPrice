import type { Component } from 'vue'
import {
    Library, BookOpen, Pill, Wrench, Wine, Disc3, Gamepad2, Shirt, Leaf, Package,
} from 'lucide-vue-next'

// Curated icon set for collection types / categories — keeps the bundle small
// versus importing all of lucide.
export const COLLECTION_ICONS: Record<string, Component> = {
    Library, BookOpen, Pill, Wrench, Wine, Disc3, Gamepad2, Shirt, Leaf, Package,
}

export const resolveIcon = (name: string | null | undefined): Component =>
    (name && COLLECTION_ICONS[name]) || Package
