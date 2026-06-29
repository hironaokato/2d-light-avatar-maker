# 2D Light Avatar Maker

Webサイト/アプリのAIエージェント用の、**ルールベース生成 × アニメート**な2Dベクターアバター。
シードから決定論的に顔を生成し、円形ディスクのバスト構図・チャンキーなセルシェードの
フラットイラスト様式で描画。アイドルの微動（呼吸・瞬き・視線・頭の漂い）と
`idle / talking / thinking / listening` の状態で「佇まい」を演出します。

依存ゼロ（Vanilla JS + SVG + 最新CSS）。設計ルールは [`RULES.md`](./RULES.md) を参照。

## プレビュー（このリポジトリで触る）

```bash
npm run serve      # 依存インストール不要の静的サーバ → http://localhost:5178/
npm run sheet      # 多数の顔を1枚に描画した静止コンタクトシート (.preview/sheet.png)
npm run bundle     # dist/avatar-face.js を再生成
```

## 他プロジェクトで使う

### A. 単一ファイルを `<script>` で差し込む（最も手軽）

`dist/avatar-face.js`（依存なし・約35KB）をコピーして読み込むだけ。

```html
<script src="avatar-face.js"></script>

<avatar-face seed="aoi"></avatar-face>
<avatar-face seed="ren" fem="0.05" state="talking"></avatar-face>
<avatar-face seed="mei" fem="0.9" state="thinking"></avatar-face>

<style>avatar-face { width: 160px; height: 160px; }</style>
```

属性:
| 属性 | 説明 |
|---|---|
| `seed` | 同じ値なら必ず同じ顔（決定論生成） |
| `fem` | 0=男性〜1=女性（省略時はシードから自動） |
| `state` | `idle` / `talking` / `thinking` / `listening` |
| `animated` | `"false"` で静止画として描画 |

#### 4状態をアプリから切り替える（推奨パターン）

`state` プロパティ（または属性）が公開APIです。再描画せず滑らかに遷移します。
エージェントのライフサイクルに紐づけてください:

```html
<script src="https://hironaokato.github.io/2d-light-avatar-maker/dist/avatar-face.js"></script>
<avatar-face id="agent" seed="aoi" fem="0.82" age="48" state="idle"
  style="width:160px;height:160px"></avatar-face>
<script>
  const agent = document.getElementById('agent');
  // 例: LLMの状態に合わせて切り替える
  agent.state = 'thinking';    // 応答生成を待っている
  agent.state = 'talking';     // 返答を喋っている
  agent.state = 'listening';   // ユーザーの入力を聞いている
  agent.state = 'idle';        // 待機
  // 'idle' | 'talking' | 'thinking' | 'listening'
</script>
```

デモの「アニメ版＋状態切替をコピー」ボタンは、この id 付き要素＋切替スクリプト＋
確認用ボタンを丸ごとコピーします。

### B. ESM として読み込む（Vite/バンドラ環境）

```js
import './src/avatar-face.js';            // <avatar-face> を登録
// もしくはプログラムから:
import { generate } from './src/genome/generator.js';
import { renderFace } from './src/render/face.js';
import { createIdle } from './src/anim/idle.js';

const svgString = renderFace(generate('aoi'));   // 静的SVG文字列
el.innerHTML = svgString;
const idle = createIdle(el.querySelector('svg')); // 微動を付与
idle.setState('thinking');
```

> ESM版（A以外）は微動CSSを `src/anim/avatar.css` から読み込みます。`src/` 一式を配置・配信してください。
> 単一ファイル版（A）はCSSを内蔵しているので追加ファイル不要です。

### C. 静的な画像として書き出す

アニメ不要なら SVG をそのまま保存（プレビューの「SVGを保存」ボタン、または `renderFace()` の戻り値）。
PNG 化はヘッドレスブラウザ等で（`tools/render.mjs` が Chrome を使う例）。

## 構成

```
src/
  genome/   color, rng, palette, generator   # seed + fem軸 → genome
  render/   proportions(比率正準), parts(各パーツ), face(合成+アニメ用グループ)
  anim/     avatar.css(@keyframes), idle.js(瞬き/サッカード, setState)
  avatar-face.js                              # <avatar-face> Web Component (ESM)
tools/      serve.mjs, render.mjs, bundle.mjs
dist/       avatar-face.js                    # 単一ファイル配布物
```
