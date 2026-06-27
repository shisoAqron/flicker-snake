# Agent.md

## 概要

React で、スマホ向けのフリック操作スネークゲームを作成する。

まずはシンプルなプロトタイプを作り、以下を確認する。

* フリック操作でスネークを動かす感触
* スネークが成長する楽しさ
* スマホ画面での見やすさ
* スネークのブロックが頭から順に脈打つ見た目の気持ちよさ

作り込みすぎず、まず遊べる状態を優先する。

---

## 技術構成

* フレームワーク: React
* ビルドツール: Vite
* 公開先: GitHub Pages
* 主な対象環境: スマホブラウザ
* PCでもデバッグできるように、可能であればキーボード操作にも対応する

---

## ページ構成

### トップページ

ルートパス `/` にトップページを用意する。

#### 表示内容

* ゲームタイトル
* スタートボタン

#### 挙動

* スタートボタンを押すとゲームページへ遷移する
* 遷移後、ゲームを開始する

---

### ゲームページ

`/game` にゲームページを用意する。

#### 表示内容

* 20x20 のゲームフィールド
* スネーク
* 成長アイテム
* スコア
* ゲームオーバー表示
* リトライボタン
* トップへ戻るボタン

---

## ゲーム仕様

### フィールド

* フィールドサイズは 20x20
* 左上を `{ x: 0, y: 0 }` とする
* 右下を `{ x: 19, y: 19 }` とする
* フィールド外に出たらゲームオーバー

```ts
const BOARD_SIZE = 20;
```

---

## スネーク仕様

### 初期状態

* 初期長さは 3
* 初期位置はフィールド中央付近
* 初期方向は `null`
* ゲーム開始直後は停止状態
* 最初のフリック操作で移動を開始する

例:

```ts
const initialSnake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];
```

### 移動

* 一定間隔でスネークが1マス進む
* 初期の移動間隔は `150ms`
* プロトタイプでは速度上昇は不要

```ts
const MOVE_INTERVAL_MS = 150;
```

### 成長

* 成長アイテムを取るとスネークの長さが1増える
* アイテムを取ったときは末尾を削除しない
* アイテムを取っていないときは通常通り末尾を削除する

---

## 成長アイテム仕様

### 出現

* 成長アイテムはランダムな空きマスに出現する
* スネーク本体と重ならない
* 他の成長アイテムとも重ならない
* 同時に最大3つまで出現する

```ts
const MAX_ITEMS = 3;
```

### 初期配置

* ゲーム開始時に1〜3個の成長アイテムをランダムに配置する

### 追加出現

* 一定間隔で成長アイテムを追加する
* ただし、すでに3つ表示されている場合は追加しない

```ts
const ITEM_SPAWN_INTERVAL_MS = 2000;
```

### 獲得

* スネークの頭が成長アイテムのマスに到達したら獲得
* 獲得したアイテムは消える
* スネークが1マス分成長する
* スコアを1増やす

---

## 操作仕様

### 基本操作

スネークの操作はフリックで行う。

* 上フリック: 上へ移動
* 下フリック: 下へ移動
* 左フリック: 左へ移動
* 右フリック: 右へ移動

フリックされたら、スネークの頭がその方向へ向かう。

### フリック判定

タッチ開始位置とタッチ終了位置の差分から方向を判定する。

* 横方向の移動量が大きい場合は左右方向として扱う
* 縦方向の移動量が大きい場合は上下方向として扱う
* 一定距離未満の操作は誤入力として無視する

```ts
const MIN_SWIPE_DISTANCE = 30;
```

判定イメージ:

```ts
const dx = end.x - start.x;
const dy = end.y - start.y;

if (Math.abs(dx) < MIN_SWIPE_DISTANCE && Math.abs(dy) < MIN_SWIPE_DISTANCE) {
  return null;
}

if (Math.abs(dx) > Math.abs(dy)) {
  return dx > 0 ? "right" : "left";
}

return dy > 0 ? "down" : "up";
```

### 入力イベント

スマホ操作を優先するため、Pointer Events を使う。

推奨イベント:

* `onPointerDown`
* `onPointerUp`

実装イメージ:

```ts
const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

const handlePointerDown = (event: React.PointerEvent) => {
  pointerStartRef.current = {
    x: event.clientX,
    y: event.clientY,
  };
};

const handlePointerUp = (event: React.PointerEvent) => {
  if (!pointerStartRef.current) return;

  const start = pointerStartRef.current;
  const end = {
    x: event.clientX,
    y: event.clientY,
  };

  const direction = detectSwipeDirection(start, end);

  if (direction) {
    setNextDirection(direction);
  }

  pointerStartRef.current = null;
};
```

### 逆方向入力

スネークの長さが2以上ある場合、現在の進行方向と真逆の方向には曲がれない。

例:

* 右に進んでいるとき、左フリックは無視する
* 左に進んでいるとき、右フリックは無視する
* 上に進んでいるとき、下フリックは無視する
* 下に進んでいるとき、上フリックは無視する

```ts
const isOppositeDirection = (current: Direction, next: Direction) => {
  return (
    (current === "up" && next === "down") ||
    (current === "down" && next === "up") ||
    (current === "left" && next === "right") ||
    (current === "right" && next === "left")
  );
};
```

### 入力バッファ

フリック入力は `nextDirection` として保持する。

* 移動処理のタイミングで `nextDirection` を `direction` に反映する
* これにより、移動間隔の途中で入力しても自然に反映される
* 1tick内で連続入力された場合は、最後の有効な入力を採用してよい

### PCデバッグ用操作

PCで動作確認しやすいように、可能であれば矢印キーにも対応する。

* `ArrowUp`
* `ArrowDown`
* `ArrowLeft`
* `ArrowRight`

これは必須ではないが、開発効率のため実装推奨。

---

## 衝突判定

### 壁衝突

次の頭の座標がフィールド外に出た場合、ゲームオーバーにする。

```ts
const isOutOfBounds = (position: Position) => {
  return (
    position.x < 0 ||
    position.x >= BOARD_SIZE ||
    position.y < 0 ||
    position.y >= BOARD_SIZE
  );
};
```

### 自己衝突

スネークの頭が自分の体に衝突したらゲームオーバーにする。

注意点:

* 移動後に末尾が消える場合がある
* アイテムを取っていない通常移動では、移動前の末尾座標は衝突対象から除外してよい
* プロトタイプでは単純実装でもよいが、明らかな誤判定は避ける

---

## ゲーム状態

### 状態種別

```ts
type GameStatus = "ready" | "playing" | "gameOver";
```

### 想定する状態

```ts
type Position = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";

type GameState = {
  snake: Position[];
  direction: Direction | null;
  nextDirection: Direction | null;
  items: Position[];
  score: number;
  status: GameStatus;
};
```

### 状態遷移

#### ready

* ゲーム開始直後
* スネークは表示されている
* まだ移動していない
* 最初のフリックで `playing` に移行する

#### playing

* スネークが一定間隔で移動する
* フリック操作を受け付ける
* アイテム取得、成長、スコア加算を行う
* 衝突したら `gameOver` に移行する

#### gameOver

* 移動を停止する
* フリック操作は無効にする
* ゲームオーバーUIを表示する

---

## ゲームオーバー仕様

ゲームオーバー時は以下を表示する。

* `GAME OVER`
* 最終スコア
* リトライボタン
* トップへ戻るボタン

### リトライ

* ゲーム状態を初期化する
* URLは `/game` のままでよい
* 再び最初のフリックで移動開始する

### トップへ戻る

* `/` に遷移する

---

## 見た目・UI仕様

UIや細かい見た目は基本的にAgentに任せる。
ただし、以下は守ること。

### スマホ対応

* スマホ縦画面で遊びやすくする
* フィールドは画面幅内に収める
* 画面外にはみ出さない
* フィールド全体でフリック入力を受け付ける

### フィールド

* 20x20 のグリッドが分かる見た目にする
* マスサイズは画面幅に応じて調整する

```css
.game-board {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(20, 1fr);
  width: min(92vw, 520px);
  aspect-ratio: 1 / 1;
  touch-action: none;
}
```

### スネーク

スネークのブロックは、頭から順に脈打つ感じにする。

必須要件:

* 各ブロックは頭から順番に pulse する
* 頭のブロックが最初に脈打つ
* その後、体のブロックが順番に脈打つ
* `animation-delay` を使って実装してよい
* 頭は体より少し目立たせる

実装イメージ:

```css
.snake-segment {
  border-radius: 30%;
  animation: snakePulse 900ms infinite ease-in-out;
}

.snake-head {
  border-radius: 40%;
  transform: scale(1.05);
}

@keyframes snakePulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.15);
  }

  100% {
    transform: scale(1);
  }
}
```

React側では以下のように、indexに応じて遅延を設定してよい。

```tsx
<div
  className={index === 0 ? "snake-segment snake-head" : "snake-segment"}
  style={{
    animationDelay: `${index * 60}ms`,
  }}
/>
```

### 成長アイテム

* スネークと区別しやすい見た目にする
* 目立つ色や形にする
* 軽いポップ感、浮遊感、きらめきなどを入れてよい

---

## 実装方針

### ロジック分離

ゲームロジックとUIはある程度分ける。

推奨構成:

```txt
src/
  App.tsx
  main.tsx
  pages/
    HomePage.tsx
    GamePage.tsx
  components/
    GameBoard.tsx
    SnakeSegment.tsx
    GrowthItem.tsx
  hooks/
    useSnakeGame.ts
    useSwipe.ts
  utils/
    game.ts
    position.ts
  styles/
    global.css
```

### useSnakeGame

ゲームの中心ロジックは `useSnakeGame` にまとめる。

担当すること:

* スネークの状態管理
* 移動処理
* アイテム生成
* 衝突判定
* スコア管理
* ゲームオーバー管理
* リトライ処理

### useSwipe

フリック判定は `useSwipe` に切り出してよい。

担当すること:

* pointer down の座標保存
* pointer up の座標取得
* フリック方向の判定
* 閾値未満の入力無視

---

## GitHub Pages 公開

GitHub Pages で公開できるようにする。

### package scripts

例:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  }
}
```

### Vite base

GitHub Pages でリポジトリ名配下に公開する場合、`vite.config.ts` の `base` を設定する。

例:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/repository-name/",
});
```

リポジトリ名が未定の場合は、後から変更しやすいようにコメントを残しておく。

---

## 受け入れ条件

以下を満たしたらプロトタイプ完了とする。

* Reactアプリとして起動できる
* GitHub Pagesで公開できる
* トップページにスタートボタンがある
* スタートボタンを押すとゲームページへ遷移する
* 20x20のフィールドが表示される
* スネークが表示される
* 最初のフリックでスネークが移動開始する
* フリックで上下左右に方向転換できる
* 真逆方向への入力は無視される
* 成長アイテムがランダムに出現する
* 成長アイテムは最大3つまで同時に表示される
* 成長アイテムを取るとスネークが伸びる
* 成長アイテムを取るとスコアが増える
* 壁にぶつかるとゲームオーバーになる
* 自分自身にぶつかるとゲームオーバーになる
* ゲームオーバー後にリトライできる
* トップページへ戻れる
* スネークのブロックが頭から順に脈打つ
* スマホブラウザでフリック操作できる

---

## 今回はやらないこと

プロトタイプ時点では以下は不要。

* ログイン
* スコア保存
* ランキング
* 難易度選択
* ステージ選択
* BGM
* 効果音
* 複数種類のアイテム
* 障害物
* スキン変更
* PWA対応
* オンライン要素
* 広告
* 課金要素

---

## 補足

今回の目的は、完成度の高いゲームを作ることではなく、フリック操作のスネークゲームがスマホで気持ちよく遊べるかを確認すること。

優先度は以下の通り。

1. フリック操作が自然であること
2. スネークの移動が見やすいこと
3. 成長アイテムを取る流れが分かりやすいこと
4. スネークが頭から順に脈打つ見た目が気持ちよいこと
5. GitHub Pagesで簡単に公開できること
