'use client'

import { useState } from 'react'
import type { Player } from '@/types/database'

type Props = {
  success: boolean
  orderedPlayers: Player[]
  topic: string
  isHost: boolean
  onPlayAgain: () => Promise<void>
}

export default function ResultView({
  success,
  orderedPlayers,
  topic,
  isHost,
  onPlayAgain,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function handlePlayAgain() {
    setLoading(true)
    await onPlayAgain()
    setLoading(false)
  }

  // 発言順の隣どうしで数字が逆転している箇所を検出
  const badIndexes = new Set<number>()
  for (let i = 1; i < orderedPlayers.length; i++) {
    if (orderedPlayers[i].number! < orderedPlayers[i - 1].number!) {
      badIndexes.add(i - 1)
      badIndexes.add(i)
    }
  }

  return (
    <div className="space-y-6">
      {/* 結果発表 */}
      <div
        className="card text-center space-y-3 py-8"
        style={{
          border: `2px solid ${success ? 'var(--success)' : 'var(--danger)'}`,
        }}
      >
        <div className="text-6xl">{success ? '🎉' : '💥'}</div>
        <p
          className="text-3xl font-black"
          style={{ color: success ? 'var(--success)' : 'var(--danger)' }}
        >
          {success ? '成功！' : '失敗...'}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {success
            ? '全員の数字が正しい順番で並んでいました！'
            : '数字の順番がどこかで狂ってしまいました。'}
        </p>
        <div
          className="inline-block px-4 py-1 rounded-full text-sm"
          style={{ background: 'var(--border)', color: 'var(--muted)' }}
        >
          お題：{topic}
        </div>
      </div>

      {/* 全員の数字公開 */}
      <div className="card space-y-3">
        <h2 className="font-bold text-sm" style={{ color: 'var(--muted)' }}>
          発言順と数字（発言した順）
        </h2>
        <div className="space-y-2">
          {orderedPlayers.map((p, i) => {
            const isBad = badIndexes.has(i)
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isBad ? 'rgba(239,68,68,0.08)' : 'var(--bg)',
                  border: `1px solid ${isBad ? 'var(--danger)' : 'transparent'}`,
                }}
              >
                {/* 発言順 */}
                <span
                  className="text-sm font-bold w-6 text-center flex-shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {p.speak_order}
                </span>
                {/* 名前 */}
                <span className="font-medium flex-1">{p.name}</span>
                {/* 数字 */}
                <span
                  className="text-2xl font-black flex-shrink-0"
                  style={{
                    color: isBad ? 'var(--danger)' : 'var(--success)',
                  }}
                >
                  {p.number}
                </span>
                {/* 逆転マーク */}
                {isBad && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--danger)' }}>
                    ← ここ
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* もう一度 */}
      {isHost ? (
        <button
          className="btn-primary"
          onClick={handlePlayAgain}
          disabled={loading}
        >
          {loading ? '準備中...' : 'もう一度遊ぶ'}
        </button>
      ) : (
        <div
          className="text-center text-sm py-3"
          style={{ color: 'var(--muted)' }}
        >
          ホストが次のゲームを始めるまで待ってください
        </div>
      )}
    </div>
  )
}
