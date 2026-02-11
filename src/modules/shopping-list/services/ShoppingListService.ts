import { supabase } from '@/api/supabase'

export interface ShoppingListItem {
    id: string
    user_id: string
    product_id?: string
    text: string
    is_checked: boolean
    created_at: string
}

class ShoppingListService {
    async getItems(): Promise<ShoppingListItem[]> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('shopping_list')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    }

    async addItem(text: string, productId?: string): Promise<ShoppingListItem | null> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not logged in')

        const { data, error } = await supabase
            .from('shopping_list')
            .insert({
                user_id: user.id,
                text,
                product_id: productId,
                is_checked: false
            })
            .select()
            .single()

        if (error) throw error
        return data
    }

    async toggleItem(id: string, isChecked: boolean): Promise<void> {
        const { error } = await supabase
            .from('shopping_list')
            .update({ is_checked: isChecked })
            .eq('id', id)

        if (error) throw error
    }

    async removeItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('shopping_list')
            .delete()
            .eq('id', id)

        if (error) throw error
    }

    async deleteChecked(): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('shopping_list')
            .delete()
            .eq('user_id', user.id)
            .eq('is_checked', true)

        if (error) throw error
    }
}

export const shoppingListService = new ShoppingListService()
