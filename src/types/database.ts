export type GamePhase =
  | 'waiting'    // ロビー待機中
  | 'playing'    // ゲーム進行中
  | 'revealing'  // 結果発表中
  | 'finished'   // 終了

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          invite_code: string
          host_player_id: string | null
          phase: GamePhase
          topic: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invite_code: string
          host_player_id?: string | null
          phase?: GamePhase
          topic?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invite_code?: string
          host_player_id?: string | null
          phase?: GamePhase
          topic?: string | null
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          room_id: string
          name: string
          number: number | null        // 1〜100 の割り当て数字（ゲーム開始後）
          speak_order: number | null   // 発言した順番（1始まり）
          is_ready: boolean
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          number?: number | null
          speak_order?: number | null
          is_ready?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          number?: number | null
          speak_order?: number | null
          is_ready?: boolean
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// アプリ内で使う便利な型エイリアス
export type Room = Database['public']['Tables']['rooms']['Row']
export type Player = Database['public']['Tables']['players']['Row']
