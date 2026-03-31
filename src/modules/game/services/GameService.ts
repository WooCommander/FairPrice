import { supabase } from '@/api/supabase'

export interface CommunityLevel {
    id: string
    creator_id: string
    size: number
    dots: { color: string, r: number, c: number }[]
    solutions: Record<string, { r: number, c: number }[]>
    likes: number
    created_at: string
}

export interface LevelScore {
    id: string
    level_id: string
    user_id: string
    score: number
    created_at: string
}

class GameService {
    async shareLevel(level: { size: number, dots: any[], solutions: any }): Promise<CommunityLevel | null> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const { data, error } = await supabase.from('community_levels').insert({
            creator_id: user.id,
            size: level.size,
            dots: level.dots,
            solutions: level.solutions
        }).select().single()

        if (error) {
            console.error('Error sharing level:', error)
            return null
        }
        return data
    }

    async getCommunityLevels(limit = 50): Promise<CommunityLevel[]> {
        const { data, error } = await supabase
            .from('community_levels')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching levels:', error)
            return []
        }
        return data || []
    }

    async saveScore(levelId: string, score: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // We can do an upsert or just insert a new score. Let's just insert to keep history, or upsert best.
        // For simplicity: insert every valid run. Leaderboard will just query MAX(score) per user or we just order by score DESC.
        const { error } = await supabase.from('level_scores').insert({
            level_id: levelId,
            user_id: user.id,
            score
        })
        
        if (error) {
            console.error('Error saving score:', error)
        }
    }

    async getLeaderboard(levelId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('level_scores')
            .select('id, score, created_at, user_id, profiles(display_name)')
            .eq('level_id', levelId)
            .order('score', { ascending: false })
            .limit(10)

        if (error) {
            console.error('Error fetching leaderboard:', error)
            return []
        }
        
        return data || []
    }

    async likeLevel(levelId: string): Promise<number | null> {
        // Защита от накрутки локально
        if (localStorage.getItem('fp_liked_' + levelId)) return null

        const { data: levelData } = await supabase.from('community_levels').select('likes').eq('id', levelId).single()
        if (levelData) {
            const newLikes = (levelData.likes || 0) + 1
            const { error } = await supabase.from('community_levels').update({ likes: newLikes }).eq('id', levelId)
            if (!error) {
                localStorage.setItem('fp_liked_' + levelId, '1')
                return newLikes
            }
        }
        return null
    }
}

export const gameService = new GameService()
