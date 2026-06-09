'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  getStoredPlayerId,
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
  const inviteCode = (params.code as string).toUpperCase()

  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 初回ロード
  const loadRoom = useCallback(async () => {
    const playerId = getStoredPlayerId()
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
      .eq('room_id', roomData.id)
      .order('created_at')
    
    setRoom(roomData)
    setPlayers(playersData ?? [])
    setLoading(false)
  }, [inviteCode, router])

  useEffect(() => {
    loadRoom()
  }, [loadRoom])

  // Realtime購読
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          setRoom(payload.new as Room)
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
        async () => {
          const { data } = await supabase
            .from('players')
            .select()
            .eq('room_id', room.id)
            .order('created_at')
          setPlayers(data ?? [])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room?.id])

  // ゲーム開始（ホストのみ実行）
  async function handleStartGame() {
    if (!room) return
    const numbers = assignNumbers(players.length)
    const topic = getRandomTopic()

    const updates = players.map((p, i) =>
      supabase.from('players').update({ number: numbers[i] }).eq('id', p.id)
    )
    await Promise.all(updates)

    await supabase
      .from('rooms')
      .update({ phase: 'playing', topic })
      .eq('id', room.id)
  }

  // お題チェンジ（ホストのみ）
  async function handleChangeTopic() {
    if (!room) return
    const newTopic = getRandomTopic()
    await supabase
      .from('rooms')
      .update({ topic: newTopic })
      .eq('id', room.id)
  }

  // 発言ボタンを押したとき
  async function handleSpeak() {
    if (!room || !myId) return
    const spoke = players.filter((p) => p.speak_order !== null)
    const nextOrder = spoke.length + 1

    await supabase
      .from('players')
      .update({ speak_order: nextOrder })
      .eq('id', myId)

    const updatedPlayers = players.map((p) =>
      p.id === myId ? { ...p, speak_order: nextOrder } : p
    )
    if (allSpoke(updatedPlayers)) {
      await supabase
        .from('rooms')
        .update({ phase: 'revealing' })
        .eq('id', room.id)
    }
  }

  // もう一度遊ぶ（ホストのみ）
  async function handlePlayAgain() {
    if (!room) return
    await supabase
      .from('players')
      .update({ number: null, speak_order: null, is_ready: false })
      .eq('room_id', room.id)
    await supabase
      .from('rooms')
      .update({ phase: 'waiting', topic: null })
      .eq('id', room.id)
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

  const myPlayer = players.find((p) => p.id === myId) ?? null
  const isHost = room.host_player_id === myId
  const { success, orderedPlayers } = room.phase === 'revealing'
    ? judgeResult(players)
    : { success: false, orderedPlayers: [] }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {room.phase === 'waiting' && (
          <LobbyView
            room={room}
            players={players}
            isHost={isHost}
            onStartGame={handleStartGame}
          />
        )}
        {room.phase === 'playing' && (
          <GameView
            room={room}
            players={players}
            myPlayer={myPlayer}
            isHost={isHost}
            onSpeak={handleSpeak}
            onChangeTopic={handleChangeTopic}
          />
        )}
        {room.phase === 'revealing' && (
          <ResultView
            success={success}
            orderedPlayers={orderedPlayers}
            topic={room.topic ?? ''}
            isHost={isHost}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </main>
  )
}