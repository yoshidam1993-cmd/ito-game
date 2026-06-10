'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  assignNumbers,
  allSpoke,
  judgeResult,
} from '@/lib/utils'
import { getRandomTopic } from '@/lib/topics'
import type { Room, Player } from '@/types/database'
import LobbyView from '@/components/LobbyView'
import GameView from '@/components/GameView'
import ResultView from '@/components/ResultView'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = (params.code as string).toUpperCase()
  const pidFromUrl = searchParams.get('pid')

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadRoom = useCallback(async () => {
    const playerId = pidFromUrl
    if (!playerId) { router.push('/'); return }
    setMyId(playerId)

    const { data: roomData } = await supabase
      .from('rooms')
      .select()
      .eq('invite_code', inviteCode)
      .single()
    if (!roomData) { setError('部屋が見つかりません'); setLoading(false); return }

    const { data: playersData } = await supabase
      .from('players')
      .select()
      .eq('room_id', (roomData as any).id)
      .order('created_at')

    setRoom(roomData as any)
    setPlayers((playersData ?? []) as any)
    setLoading(false)
  }, [inviteCode, router, pidFromUrl])

  useEffect(() => {
    loadRoom()
  }, [loadRoom])

  useEffect(() => {
    if (!room) return
    const r = room as any
    const channel = supabase
      .channel(`room-${r.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${r.id}` },
        (payload) => { setRoom(payload.new as any) }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${r.id}` },
        async () => {
          const { data } = await supabase.from('players').select().eq('room_id', r.id).order('created_at')
          setPlayers((data ?? []) as any)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [(room as any)?.id])

  async function handleStartGame() {
    if (!room) return
    const r = room as any
    const numbers = assignNumbers(players.length)
    const topic = getRandomTopic()
    const updates = players.map((p: any, i: number) =>
      supabase.from('players').update({ number: numbers[i] }).eq('id', p.id)
    )
    await Promise.all(updates)
    await supabase.from('rooms').update({ phase: 'playing', topic }).eq('id', r.id)
  }

  async function handleChangeTopic() {
    if (!room) return
    const newTopic = getRandomTopic()
    await supabase.from('rooms').update({ topic: newTopic }).eq('id', (room as any).id)
  }

  async function handleSpeak() {
    if (!room || !myId) return
    const spoke = players.filter((p: any) => p.speak_order !== null)
    const nextOrder = spoke.length + 1
    await supabase.from('players').update({ speak_order: nextOrder }).eq('id', myId)
    const updatedPlayers = players.map((p: any) =>
      p.id === myId ? { ...p, speak_order: nextOrder } : p
    )
    if (allSpoke(updatedPlayers as any)) {
      await supabase.from('rooms').update({ phase: 'revealing' }).eq('id', (room as any).id)
    }
  }

  async function handlePlayAgain() {
    if (!room) return
    await supabase.from('players').update({ number: null, speak_order: null, is_ready: false }).eq('room_id', (room as any).id)
    await supabase.from('rooms').update({ phase: 'waiting', topic: null }).eq('id', (room as any).id)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>読み込み中...</p>
      </main>
    )
  }

  if (error || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p style={{ color: 'var(--danger)' }}>{error || '部屋が見つかりません'}</p>
          <button className="btn-secondary" style={{ maxWidth: 200 }} onClick={() => router.push('/')}>
            トップに戻る
          </button>
        </div>
      </main>
    )
  }

  const r = room as any
  const myPlayer = players.find((p: any) => p.id === myId) ?? null
  const isHost = r.host_player_id === myId
  const { success, orderedPlayers } = r.phase === 'revealing'
    ? judgeResult(players as any)
    : { success: false, orderedPlayers: [] }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {r.phase === 'waiting' && (
          <LobbyView room={room} players={players} isHost={isHost} onStartGame={handleStartGame} />
        )}
        {r.phase === 'playing' && (
          <GameView room={room} players={players} myPlayer={myPlayer} isHost={isHost} onSpeak={handleSpeak} onChangeTopic={handleChangeTopic} />
        )}
        {r.phase === 'revealing' && (
          <ResultView success={success} orderedPlayers={orderedPlayers} topic={r.topic ?? ''} isHost={isHost} onPlayAgain={handlePlayAgain} />
        )}
      </div>
    </main>
  )
}
