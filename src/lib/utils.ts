import type { Player } from '@/types/database'

// 6桁の英数字招待コードを生成
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 紛らわしい文字を除外
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// プレイヤー数に応じて 1〜100 の重複なしランダム数字を割り当て
export function assignNumbers(playerCount: number): number[] {
  const pool: number[] = Array.from({ length: 100 }, (_, i) => i + 1)
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, playerCount)
}

// 全員が発言済みかどうか
export function allSpoke(players: Player[]): boolean {
  return players.every((p) => p.speak_order !== null)
}

// 発言順が正しい（数字の昇順）かどうかを判定
// speak_order 順に並べたときに number が昇順なら成功
export function judgeResult(players: Player[]): {
  success: boolean
  orderedPlayers: Player[]
} {
  const spoke = players.filter((p) => p.speak_order !== null)
  const ordered = [...spoke].sort((a, b) => a.speak_order! - b.speak_order!)

  let success = true
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].number! < ordered[i - 1].number!) {
      success = false
      break
    }
  }

  return { success, orderedPlayers: ordered }
}

// localStorageにプレイヤーIDを保存・取得
const PLAYER_ID_KEY = 'ito_player_id'
const PLAYER_NAME_KEY = 'ito_player_name'

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PLAYER_ID_KEY)
}

export function storePlayerId(id: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAYER_ID_KEY, id)
}

export function getStoredPlayerName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PLAYER_NAME_KEY) ?? ''
}

export function storePlayerName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAYER_NAME_KEY, name)
}
