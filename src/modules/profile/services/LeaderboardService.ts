import { supabase } from '@/api/supabase'

export type LeaderboardCategory = 'reputation' | 'products' | 'prices'

export interface LeaderboardEntry {
    userId: string
    displayName: string
    score: number
    rank: number
    isCurrentUser: boolean
}

class LeaderboardServiceImpl {
    async getLeaderboard(category: LeaderboardCategory): Promise<LeaderboardEntry[]> {
        const { data: { user } } = await supabase.auth.getUser()
        const currentUserId = user?.id

        let rows: Array<{ user_id: string; score: number }> = []

        if (category === 'products') {
            const { data, error } = await supabase.rpc('leaderboard_products')
            if (error) throw error
            rows = (data || []).map((r: any) => ({ user_id: r.user_id, score: Number(r.count) }))
        } else if (category === 'prices') {
            const { data, error } = await supabase.rpc('leaderboard_prices')
            if (error) throw error
            rows = (data || []).map((r: any) => ({ user_id: r.user_id, score: Number(r.count) }))
        } else {
            const { data, error } = await supabase.rpc('leaderboard_reputation')
            if (error) throw error
            rows = (data || []).map((r: any) => ({ user_id: r.user_id, score: Number(r.reputation) }))
        }

        return rows.map((entry, index) => ({
            userId: entry.user_id,
            displayName: entry.user_id === currentUserId
                ? 'Вы'
                : `Участник #${entry.user_id.slice(-4).toUpperCase()}`,
            score: entry.score,
            rank: index + 1,
            isCurrentUser: entry.user_id === currentUserId
        }))
    }
}

export const LeaderboardService = new LeaderboardServiceImpl()
