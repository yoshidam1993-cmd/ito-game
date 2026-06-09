'use client'

import type { Room, Player } from '@/types/database'

type Props = {
  room: Room
  players: Player[]
  myPlayer: Player | null
  isHost: boolean
  onSpeak: () => Promise<void>
  onChangeTopic: () => Promise<void>
}

export default function GameView({ room, players, myPlayer, isHost, onSpeak, onChangeTopic }: Props) {
  const hasSpoken = myPlayer?.speak_order !== null
  const spokeCount = players.filter((p) => p.speak_order !== null).length
  const totalCount = players.length

  const spokeList = players
    .filter((p) => p.speak_order !== null)
    .sort((a, b) => a.speak_order! - b.speak_order!)

  const notYet = players.filter((p) => p.speak_order === null)

  return (
    <div className="space-y-6">
      <div className="card text-center space-y-1">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          お題
        </p>
        <p className="text-2xl font-bold">{room.topic}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          このお題で 1〜100 の数字を表現してください
        </p>
        {isHost && (
          <button
            className="btn-secondary text-sm mt-2"
            style={{ maxWidth: 160, margin: '8px auto 0' }}
            onClick={onChangeTopic}
          >
            お題をチェンジ 🔄
          </button>
        )}
      </div>

      <div className="card text-center space-y-2" style={{ border: '2px solid var(--accent)' }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          あなたの数字
        </p>
        <p className="text-8xl font-black" style={{ color: 'var(--accent)', lineHeight: 1 }}>
          {myPlayer?.number ?? '?'}
        </p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          他の人には見せないでください
        </p>
      </div>

      <div className="text-sm text-center py-3 px-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        自分の番だと思ったら「発言する」を押してください。
        <br />
        <span style={{ color: 'var(--muted)' }}>全員がボタンを押した順番が確定します。</span>
      </div>

      {!hasSpoken ? (
        <button className="btn-primary text-lg py-4" onClick={onSpeak}>
          発言する！
        </button>
      ) : (
        <div className="text-center py-4 rounded-xl font-bold" style={{ background: 'var(--surface)', color: 'var(--success)' }}>
          発言済み（{myPlayer?.speak_order}番目）
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--muted)' }}>発言状況</span>
          <span>
            <span style={{ color: 'var(--success)' }}>{spokeCount}</span>
            <span style={{ color: 'var(--muted)' }}> / {totalCount}人</span>
          </span>
        </div>

        {spokeList.length > 0 && (
          <div className="space-y-1">
            {spokeList.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg)' }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--success)' }}>
                  {p.speak_order}
                </span>
                <span className="font-medium" style={{ color: p.id === myPlayer?.id ? 'var(--accent)' : 'var(--text)' }}>
                  {p.name}
                </span>
                <span className="ml-auto text-xs" style={{ color: 'var(--success)' }}>発言済み</span>
              </div>
            ))}
          </div>
        )}

        {notYet.length > 0 && (
          <div className="space-y-1">
            {notYet.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg)' }}>
                <span className="text-xs w-5 text-center" style={{ color: 'var(--muted)' }}>-</span>
                <span style={{ color: 'var(--muted)' }}>{p.name}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>待機中</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}