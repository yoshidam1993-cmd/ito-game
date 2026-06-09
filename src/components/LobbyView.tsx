'use client'

import { useState } from 'react'
import type { Room, Player } from '@/types/database'

type Props = {
  room: Room
  players: Player[]
  isHost: boolean
  onStartGame: () => Promise<void>
}

export default function LobbyView({ room, players, isHost, onStartGame }: Props) {
  const [copying, setCopying] = useState(false)
  const [starting, setStarting] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(room.invite_code)
    setCopying(true)
    setTimeout(() => setCopying(false), 1500)
  }

  async function handleStart() {
    setStarting(true)
    await onStartGame()
    setStarting(false)
  }

  const canStart = players.length >= 2

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="text-center space-y-1">
        <h1 className="text-4xl font-black" style={{ color: 'var(--accent)' }}>
          ito
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Discordで通話しながら遊ぼう
        </p>
      </div>

      {/* 招待コード */}
      <div className="card text-center space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          招待コードをDiscordで共有
        </p>
        <div className="flex items-center justify-center gap-3">
          <span
            className="text-4xl font-black tracking-widest"
            style={{ color: 'var(--accent)', letterSpacing: '0.2em' }}
          >
            {room.invite_code}
          </span>
          <button
            onClick={copyCode}
            className="text-sm px-3 py-1 rounded-lg transition-colors"
            style={{
              background: copying ? 'var(--success)' : 'var(--border)',
              color: copying ? '#fff' : 'var(--text)',
            }}
          >
            {copying ? 'コピー完了！' : 'コピー'}
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          URLをコピーする場合は{' '}
          <span style={{ color: 'var(--text)' }}>
            {typeof window !== 'undefined' ? window.location.href : ''}
          </span>
        </p>
      </div>

      {/* 参加者リスト */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">参加者</h2>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {players.length}人
          </span>
        </div>
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 py-2 px-3 rounded-lg"
              style={{ background: 'var(--bg)' }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: 'var(--success)' }}
              />
              <span className="font-medium">{p.name}</span>
              {p.id === room.host_player_id && (
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  ホスト
                </span>
              )}
            </li>
          ))}
        </ul>

        {players.length < 2 && (
          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
            あと{2 - players.length}人以上で遊べます
          </p>
        )}
      </div>

      {/* ゲーム開始ボタン（ホストのみ） */}
      {isHost ? (
        <button
          className="btn-primary"
          onClick={handleStart}
          disabled={!canStart || starting}
        >
          {starting ? '開始中...' : `ゲームを始める（${players.length}人）`}
        </button>
      ) : (
        <div
          className="text-center text-sm py-3"
          style={{ color: 'var(--muted)' }}
        >
          ホストがゲームを開始するまで待ってください
        </div>
      )}
    </div>
  )
}
