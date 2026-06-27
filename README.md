# 🐍 Flicker Snake

スマホのフリック操作で遊ぶシンプルなスネークゲーム。

**[▶ Play on GitHub Pages](https://shisoaqron.github.io/flicker-snake/)**

---

## スクリーンショット

| トップ | ゲーム中 | ゲームオーバー |
|--------|----------|----------------|
| スタートボタンを押してスタート | フリックでヘビを操作 | リトライまたはトップへ |

---

## 操作方法

| 操作 | 入力 |
|------|------|
| 上へ移動 | 上フリック / `↑` キー |
| 下へ移動 | 下フリック / `↓` キー |
| 左へ移動 | 左フリック / `←` キー |
| 右へ移動 | 右フリック / `→` キー |

- 最初のフリック（またはキー入力）でゲーム開始
- 進行方向と真逆への入力は無視される

---

## ゲーム仕様

- フィールド: 20×20
- 初期スネーク長: 1
- 移動間隔: 150ms（長さに応じて最大10msまで加速）
- 成長アイテム: 最大3個同時出現 / 2秒ごとに追加
- アイテム取得でスネークが1マス成長 & スコア +1
- 壁または自分自身に衝突するとゲームオーバー

| 長さ | 移動間隔 |
|------|----------|
| 1〜9 | 150ms |
| 10〜19 | 130ms |
| 20〜29 | 110ms |
| 30〜39 | 90ms |
| 40〜49 | 70ms |
| 50〜59 | 50ms |
| 60〜69 | 30ms |
| 70〜 | 10ms（下限） |

---

## 技術構成

| 項目 | 内容 |
|------|------|
| フレームワーク | React 18 |
| ビルドツール | Vite 5 |
| 言語 | TypeScript |
| ルーティング | React Router v6 (HashRouter) |
| 公開先 | GitHub Pages |
| CI/CD | GitHub Actions |

---

## ディレクトリ構成

```
src/
├── types.ts               # 型定義 (Position, Direction, GameState)
├── App.tsx                # ルーティング
├── main.tsx
├── utils/
│   ├── position.ts        # 座標ユーティリティ
│   └── game.ts            # ゲームロジック・定数
├── hooks/
│   ├── useSnakeGame.ts    # ゲーム状態管理
│   └── useSwipe.ts        # フリック判定
├── components/
│   ├── GameBoard.tsx      # 20×20グリッド描画
│   ├── SnakeSegment.tsx   # スネークセグメント
│   └── GrowthItem.tsx     # 成長アイテム
├── pages/
│   ├── HomePage.tsx       # トップページ
│   └── GamePage.tsx       # ゲームページ
└── styles/
    └── global.css
```

---

## ローカルで動かす

```bash
npm install
npm run dev
```

http://localhost:5173/flicker-snake/ をブラウザで開く。

---

## デプロイ

`main` ブランチへ push すると GitHub Actions が自動でビルド・デプロイします。

事前に GitHub リポジトリの **Settings → Pages → Source** を **"GitHub Actions"** に設定してください。
