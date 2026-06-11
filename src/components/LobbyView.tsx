'use client'
import type { Room, Player } from '@/types/database'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  room: any
  players: any[]
  isHost: boolean
  onStartGame: () => void
}

export default function LobbyView({ room, players, isHost, onStartGame }: Props) {
  const inviteCode = room.invite_code
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?code=${inviteCode}`
    : `https://ito-game-nine.vercel.app/?code=${inviteCode}`

  async function copyUrl() {
    await navigator.clipboard.writeText(inviteUrl)
    alert('コピーしました！')
  }

  return (
    <div className="space-y-6">
      <div className="card text-center space-y-3">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>招待コードをDiscordで共有</p>
        <p className="text-4xl font-black tracking-widest" style={{ color: 'var(--accent)' }}>{inviteCode}</p>
        <button className="btn-secondary" onClick={copyUrl}>🔗 招待URLをコピー</button>
        <div className="flex justify-center pt-2">
          <QRCodeSVG value={inviteUrl} size={120} />
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <p className="font-bold">参加者</p>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{players.length}人</p>
        </div>
        {players.map((p: any) => (
          <div key={p.id} className="flex items-center gap-2">
            <span style={{ color: 'var(--accent)' }}>●</span>
            <span>{p.name}</span>
          </div>
        ))}
        {players.length < 2 && (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>あと{2 - players.length}人以上で遊べます</p>
        )}
      </div>

      {isHost ? (
        <button className="btn-primary" onClick={onStartGame} disabled={players.length < 2}>
          ゲームを開始する
        </button>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center' }}>ホストがゲームを開始するまで待ってください</p>
      )}
    </div>
  )
}