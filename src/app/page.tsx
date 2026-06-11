'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/utils'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setCode(c.toUpperCase())
  }, [searchParams])

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

      await supabase.from('rooms').update({ host_player_id: (player as any).id }).eq('id', (room as any).id)

      window.location.href = `/room/${inviteCode}?pid=${(player as any).id}`
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
        .from('rooms').select().eq('invite_code', upperCode).single()
      if (roomErr || !room) { setError('部屋が見つかりません'); setLoading(false); return }

      const { data: player, error: playerErr } = await supabase
        .from('players')
        .insert({ room_id: (room as any).id, name: name.trim() })
        .select()
        .single()
      if (playerErr || !player) throw new Error('プレイヤー作成失敗')

      window.location.href = `/room/${upperCode}?pid=${(player as any).id}`
    } catch (e) {
      console.error(e)
      setError('参加に失敗しました: ' + String(e))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#1e1e2e',
    color: '#ffffff',
    border: '1px solid #444',
    borderRadius: 8,
    padding: '10px 14px',
    width: '100%',
    fontSize: 16,
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
          <input style={inputStyle} placeholder="あなたの名前" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? '作成中...' : '部屋を作る'}
          </button>
        </div>

        <div className="card space-y-3">
          <p className="text-center font-bold">部屋に入る</p>
          <input style={inputStyle} placeholder="あなたの名前" value={name} onChange={(e) => setName(e.target.value)} />
          <input style={inputStyle} placeholder="招待コード（6文字）" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} />
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

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}