'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    setLoading(true); setError('')
    try {
      const inviteCode = generateInviteCode()
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({ invite_code: inviteCode, phase: 'waiting' })
        .select()
        .single()
      if (roomErr || !room) throw new Error('部屋作成失敗')

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: (room as any).id, name: name.trim() })
        .select()
        .single()
      if (playerErr || !player) throw new Error('プレイヤー作成失敗')

      const playerId = (player as any).id
      const playerName = (player as any).name
      window.localStorage.setItem('ito_player_id', playerId)
      window.localStorage.setItem('ito_player_name', playerName)

      window.location.href = `/room/${inviteCode}`
    } catch (e) {
      console.error(e)
      setError('作成に失敗しました: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    if (!code.trim()) { setError('コードを入力してください'); return }
    setLoading(true); setError('')
    try {
      const upperCode = code.trim().toUpperCase()
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select()
        .eq('invite_code', upperCode)
        .single()
      if (roomErr || !room) { setError('部屋が見つかりません'); setLoading(false); return }

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: (room as any).id, name: name.trim() })
        .select()
        .single()
      if (playerErr || !player) throw new Error('プレイヤー作成失敗')

      const playerId = (player as any).id
      const playerName = (player as any).name
      window.localStorage.setItem('ito_player_id', playerId)
      window.localStorage.setItem('ito_player_name', playerName)

      window.location.href = `/room/${upperCode}`
    } catch (e) {
      console.error(e)
      setError('参加に失敗しました: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--accent)' }}>ito</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Discord通話しながら遊ぼう</p>
        </div>

        <div className="card space-y-3">
          <p className="text-center font-bold">部屋を作る</p>
          <input
            className="input"
            placeholder="あなたの名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? '作成中...' : '部屋を作る'}
          </button>
        </div>

        <div className="card space-y-3">
          <p className="text-center font-bold">部屋に入る</p>
          <input
            className="input"
            placeholder="あなたの名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="招待コード（6文字）"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button className="btn-primary" onClick={handleJoin} disabled={loading}>
            {loading ? '参加中...' : '部屋に入る'}
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>アカウント登録不要・無料</p>
      </div>
    </main>
  )
}
