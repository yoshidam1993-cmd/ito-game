import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ito - オンラインパーティーゲーム',
  description: 'Discordで通話しながら遊べるitoゲーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
