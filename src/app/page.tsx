'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateInviteCode, storePlayerId, storePlayerName } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'top' | 'create' | 'join'>('top')
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
      if (roomErr) throw roomErr

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, name: name.trim() })
        .select()
        .single()
      if (playerErr) throw playerErr

      storePlayerId(player.id)
      storePlayerName(player.name)
      router.push(`/room/${inviteCode}`)
    } catch {
      setError('作成に失敗しました')
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
        .insert({ room_id: room.id, name: name.trim() })
        .select()
        .single()
      if (playerErr) throw playerErr

      storePlayerId(player.id)
      storePlayerName(player.name)
      router.push(`/room/${upperCode}`)
    } catch {
      setError('参加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--accent)' }}>ito</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Discordで通話しながら遊ぼう</p>
        </div>

        {mode === 'top' && (
          <div className="card space-y-3">
            <input
              className="input"
              placeholder="あなたの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn-primary" onClick={() => setMode('create')}>
              ルームを作って始める
            </button>
            <button className="btn-secondary" onClick={() => setMode('join')}>
              コードで参加する
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="card space-y-3">
            <input
              className="input"
              placeholder="あなたの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? '作成中...' : 'ルームを作って始める'}
            </button>
            <button className="btn-secondary" onClick={() => setMode('top')}>戻る</button>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        {mode === 'join' && (
          <div className="card space-y-3">
            <input
              className="input"
              placeholder="あなたの名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input"
              placeholder="招待コード（4文字）"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <button className="btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? '参加中...' : '参加する'}
            </button>
            <button className="btn-secondary" onClick={() => setMode('top')}>戻る</button>
            {error && <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center' }}>{error}</p>}
          </div>
        )}

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>アカウント登録不要・無料</p>
      </div>
    </main>
  )
}