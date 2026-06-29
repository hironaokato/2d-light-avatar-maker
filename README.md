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

## フレームワークでの利用（React / Next.js / Vue）

`<avatar-face>` は標準のカスタム要素なので、どのフレームワークでも使えます。ポイントは
**`seed/fem/age/shape` は属性で渡し、`state` だけは ref/プロパティで切り替える**こと
（state を再レンダリングで渡すと毎回作り直されてしまうため）。

### React / Next.js

Next.js（App Router）では DOM を触るのでクライアントコンポーネントにします。

```tsx
'use client';
import { useEffect, useRef } from 'react';

const BUNDLE = 'https://hironaokato.github.io/2d-light-avatar-maker/dist/avatar-face.js';

// JSX に avatar-face を許可（TypeScript の場合）
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'avatar-face': any;
    }
  }
}

export function Avatar({ seed, fem, age, shape = 'circle', state = 'idle', size = 160 }: {
  seed: string; fem?: number; age?: number; shape?: 'circle' | 'rounded' | 'square';
  state?: 'idle' | 'talking' | 'thinking' | 'listening'; size?: number;
}) {
  const ref = useRef<HTMLElement & { state?: string }>(null);

  useEffect(() => { // スクリプトを一度だけ読み込む
    if (!document.querySelector('script[data-avatar-face]')) {
      const s = document.createElement('script');
      s.src = BUNDLE; s.dataset.avatarFace = ''; document.head.appendChild(s);
    }
  }, []);

  useEffect(() => { if (ref.current) ref.current.state = state; }, [state]); // 再描画せず遷移

  return (
    <avatar-face
      ref={ref}
      seed={seed}
      fem={fem}
      age={age}
      shape={shape}
      style={{ width: size, height: size, display: 'inline-block' }}
    />
  );
}

// 使用例: <Avatar seed="aoi" fem={0.82} age={30} state={agentState} />
```

> Next.js では `next/script` をレイアウトに置いて先読みしてもOKです:
> `<Script src="https://hironaokato.github.io/2d-light-avatar-maker/dist/avatar-face.js" strategy="afterInteractive" />`

### Vue 3

Vite に「`avatar-face` はカスタム要素」と伝えます（`vite.config` の
`vue({ template: { compilerOptions: { isCustomElement: t => t === 'avatar-face' } } })`）。

```vue
<script setup>
import { ref, watch, onMounted } from 'vue';
const props = defineProps({
  seed: String, fem: Number, age: Number,
  shape: { type: String, default: 'circle' },
  state: { type: String, default: 'idle' },
  size: { type: Number, default: 160 },
});
const el = ref(null);
onMounted(() => {
  if (!document.querySelector('script[data-avatar-face]')) {
    const s = document.createElement('script');
    s.src = 'https://hironaokato.github.io/2d-light-avatar-maker/dist/avatar-face.js';
    s.dataset.avatarFace = ''; document.head.appendChild(s);
  }
});
watch(() => props.state, (v) => { if (el.value) el.value.state = v; }); // 再描画せず遷移
</script>

<template>
  <avatar-face ref="el" :seed="seed" :fem="fem" :age="age" :shape="shape"
    :style="{ width: size + 'px', height: size + 'px', display: 'inline-block' }" />
</template>
```

いずれも `state` をエージェントのライフサイクル（応答待ち→`thinking`、発話中→`talking`、
入力受付→`listening`、待機→`idle`）に紐づければOKです。

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
