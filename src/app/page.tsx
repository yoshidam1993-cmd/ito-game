'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    setLoading(true)
    setError('')

    const playerId = crypto.randomUUID()
    const inviteCode = generateCode()

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({ invite_code: inviteCode, phase: 'waiting' })
      .select()
      .single()

    if (roomError || !room) {
      setError('作成に失敗しました')
      setLoading(false)
      return
    }

    await supabase.from('players').insert({
      id: playerId,
      room_id: room.id,
      name: name.trim(),
    })

    await supabase.from('rooms').update({ host_player_id: playerId }).eq('id', room.id)

    localStorage.setItem('playerId', playerId)
    router.push(`/room/${room.invite_code}`)
  }

  async function handleJoin() {
    if (!name.trim()) { setError('名前を入力してください'); return }
    if (!joinCode.trim()) { setError('招待コードを入力してください'); return }
    setLoading(true)
    setError('')

    const { data: room } = await supabase
      .from('rooms')
      .select()
      .eq('invite_code', joinCode.toUpperCase())
      .single()

    if (!room) {
      setError('部屋が見つかりません')
      setLoading(false)
      return
    }

    const playerId = crypto.randomUUID()
    await supabase.from('players').insert({
      id: playerId,
      room_id: room.id,
      name: name.trim(),
    })

    localStorage.setItem('playerId', playerId)
    router.push(`/room/${room.invite_code}`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black" style={{ color: 'var(--accent)' }}>ito</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Discord通話しながら遊ぼう</p>
        </div>

        <div className="card space-y-3">
          <input
            className="input"
            placeholder="あなたの名前"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? '処理中...' : '部屋を作る'}
          </button>
        </div>

        <div className="card space-y-3">
          <input
            className="input"
            placeholder="招待コード"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <button className="btn-secondary" onClick={handleJoin} disabled={loading}>
            {loading ? '処理中...' : '部屋に入る'}
          </button>
        </div>
      </div>
    </main>
  )
}