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

  // ルーム作成
  async function handleCreate() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    setLoading(true); setError('')
    try {
      const inviteCode = generateInviteCode()

      // ルーム作成
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .insert({ invite_code: inviteCode, phase: 'waiting' })
        .select()
        .single()
      if (roomErr) throw roomErr

      // ホストをプレイヤーとして追加
      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, name: name.trim(), is_ready: false })
        .select()
        .single()
      if (playerErr) throw playerErr

      // ホストIDをroomsに紐付け
      await supabase
        .from('rooms')
        .update({ host_player_id: player.id })
        .eq('id', room.id)

      storePlayerId(player.id)
      storePlayerName(name.trim())
      router.push(`/room/${inviteCode}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '作成に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ルーム参加
  async function handleJoin() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    if (!code.trim()) { setError('招待コードを入力してください'); return }
    setLoading(true); setError('')
    try {
      const upperCode = code.trim().toUpperCase()
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select()
        .eq('invite_code', upperCode)
        .single()
      if (roomErr || !room) { setError('部屋が見つかりません'); return }
      if (room.phase !== 'waiting') { setError('このゲームはすでに始まっています'); return }

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: room.id, name: name.trim(), is_ready: false })
        .select()
        .single()
      if (playerErr) throw playerErr

      storePlayerId(player.id)
      storePlayerName(name.trim())
      router.push(`/room/${upperCode}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '参加に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* タイトル */}
        <div className="text-center space-y-1">
          <h1 className="text-6xl font-black tracking-tight" style={{ color: 'var(--accent)' }}>
            ito
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Discordで通話しながら遊ぼう
          </p>
        </div>

        <div className="card space-y-4">
          {/* 名前入力（常に表示） */}
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>
              あなたの名前
            </label>
            <input
              className="input-field"
              placeholder="名前を入力"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (mode === 'create') handleCreate()
                  if (mode === 'join') handleJoin()
                }
              }}
            />
          </div>

          {/* モード: top */}
          {mode === 'top' && (
            <div className="space-y-3 pt-1">
              <button
                className="btn-primary"
                onClick={() => { if (!name.trim()) { setError('名前を入力してください'); return }; setError(''); setMode('create') }}
              >
                ルームを作る
              </button>
              <button
                className="btn-secondary"
                onClick={() => { if (!name.trim()) { setError('名前を入力してください'); return }; setError(''); setMode('join') }}
              >
                招待コードで参加
              </button>
            </div>
          )}

          {/* モード: create */}
          {mode === 'create' && (
            <div className="space-y-3 pt-1">
              <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? '作成中...' : 'ルームを作って始める'}
              </button>
              <button className="btn-secondary" onClick={() => { setMode('top'); setError('') }}>
                戻る
              </button>
            </div>
          )}

          {/* モード: join */}
          {mode === 'join' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--muted)' }}>
                  招待コード
                </label>
                <input
                  className="input-field tracking-widest text-center text-xl font-bold uppercase"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <button className="btn-primary" onClick={handleJoin} disabled={loading}>
                {loading ? '参加中...' : '参加する'}
              </button>
              <button className="btn-secondary" onClick={() => { setMode('top'); setError('') }}>
                戻る
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}
        </div>

        <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>
          アカウント登録不要 · 無料
        </p>
      </div>
    </main>
  )
}
