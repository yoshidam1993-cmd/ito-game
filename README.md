# ito - オンラインパーティーゲーム

Discord通話しながら4〜8人で遊べるitoゲーム。

## セットアップ手順

### 1. Supabaseプロジェクトを作る

1. https://supabase.com でプロジェクト作成
2. `supabase-schema.sql` の内容を **SQL Editor** にコピーして実行
3. **Database > Replication** で `rooms` と `players` にチェックを入れる

### 2. 環境変数を設定

```bash
cp .env.local.example .env.local
```

`.env.local` を開いて以下を埋める：
- `NEXT_PUBLIC_SUPABASE_URL` → SupabaseダッシュボードのProject Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → 同ページのanon public key

### 3. 起動

```bash
npm install
npm run dev
```

http://localhost:3000 で起動します。

### 4. Vercelにデプロイ

```bash
npx vercel
```

環境変数を Vercel のダッシュボードにも同じ内容で設定してください。

## ゲームの遊び方

1. ホストがトップページから「ルームを作る」
2. 招待コードをDiscordで共有
3. 全員が参加したらホストが「ゲームを始める」
4. 各自に1〜100の数字が割り当てられる
5. お題を見ながら、自分の数字が小さいと思う順に「発言する」ボタンを押す
6. 全員が押したら結果発表
7. 発言した順に数字が昇順なら成功！

## ディレクトリ構成

```
src/
  app/
    page.tsx              # トップページ（名前入力・ルーム作成/参加）
    room/[code]/page.tsx  # ルームページ（ロビー/ゲーム/結果を一画面で管理）
    globals.css
    layout.tsx
  components/
    LobbyView.tsx         # ロビー画面
    GameView.tsx          # ゲーム中画面
    ResultView.tsx        # 結果発表画面
  lib/
    supabase.ts           # Supabaseクライアント
    topics.ts             # お題データ（50件）
    utils.ts              # 招待コード生成・数字割り当て・判定ロジック
  types/
    database.ts           # TypeScript型定義
supabase-schema.sql       # DBスキーマ（Supabaseで実行）
```
