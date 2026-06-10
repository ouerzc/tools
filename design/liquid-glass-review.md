# Liquid Glass 风格样式 Review

> 对象：`src/styles/app.css` + `src/App.vue` 模板结构 + `public/liquid-glass-wallpaper*.svg`
> 当前版本：Round 2（2026-06-11）
> 范围：视觉层级、玻璃材质实现、可访问性、性能、Token 体系、文档一致性

---

## Round 2 总评

第一轮的方案 A + 方案 B 的大部分都落地了，而且落得很干净：

| Round 1 问题 | 状态 |
|---|---|
| 全员玻璃 / 嵌套 blur（19 处） | ✅ 已修。blur 只存在于 `.glass` / `.glass-overlay`，控件层改用 `--control-fill`，玻璃面收敛为 topbar、surface-card、tool-card、workspace-bar、toast 共 5 类 |
| `--text-muted` 2.5:1 对比度 | ✅ 已修。`#98a2b3 → #7d8696`，`--muted-foreground` 提到 `#5b6474`，fill 从 0.56 提到 0.68 |
| 14 处奶油色硬编码 | ✅ 已修。全部收编为 `--code-border/-muted/-row-bg` 等 token，全文件 0 残留 |
| 7 层 gradient + `background-attachment: fixed` | ✅ 已改。壁纸预渲染为静态 SVG（但引出了新问题，见下） |
| 降级清单不全 / 无 reduced-motion | ✅ 已修。`@supports not`、`prefers-reduced-transparency`、`prefers-reduced-motion` 三套齐全，JS 的 smooth scroll 也判了 `matchMedia` |
| nav active 与 hover 同样式 | ✅ 已修。active 有 3px 指示条 + `--control-fill-active` + 图标实色化 |
| toast 误用 focus-shadow | ✅ 已修（但引入了新 bug，见 P0） |
| DESIGN.md 文档漂移 | ✅ 已重写，声明 `app.css` 为唯一真源，并写入了材质规则 |
| lensing 边缘 / `.glass` 抽象 / 壁纸资产化 | ✅ 方案 B 的 1、3、4 都做了 |

工程纪律上这一版没什么可挑的。**但"不够液态"的感觉是对的，而且原因可以精确定位**——见下面的核心诊断。

---

## 核心诊断：为什么还不"液态"

玻璃的"液态感"不来自 blur 本身，而来自三件事：**背景透过玻璃的相对运动**、**边缘对光的弯折**、**对输入的流动响应**。现在这三件事分别是：没有、太弱、二态切换。逐个说。

### P0-1. 玻璃和壁纸一起滚动——blur 变成了"烤死的纹理"

这是液态感缺失的第一原因，也是这一轮重构无意间引入的退化。

旧版壁纸有 `background-attachment: fixed`：页面滚动时，卡片在壁纸上方移动，玻璃下透出的内容**在变**，blur 是活的。新版壁纸跟随文档流滚动：

```192:200:src/styles/app.css
body {
  min-height: 100vh;
  margin: 0;
  padding-top: 18px;
  background:
    radial-gradient(circle at 50% -12%, transparent 0 42%, var(--wallpaper-vignette) 100%),
    linear-gradient(180deg, var(--wallpaper-scrim), var(--body-gradient-end) 460px),
    var(--wallpaper-image) center top / cover no-repeat,
    var(--background);
```

卡片和壁纸的相对位置永远不变 → 每块玻璃的 blur 输出是一张恒定的图 → 视觉上等价于直接在卡片上画了一层磨砂贴图。整个页面只有 sticky 的 topbar 还有一点活性（它滚动时相对壁纸移动）。**用户感知到的"不液态"，多半就是这个。**

**修法**：不要回退到 `background-attachment: fixed`（Safari 上它会禁用合成层、逐帧重栅格化，正是上一轮想避免的）。用一个独立的固定定位壁纸层：

```html
<div class="wallpaper" aria-hidden="true"></div>
```

```css
.wallpaper {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 50% -12%, transparent 0 42%, var(--wallpaper-vignette) 100%),
    linear-gradient(180deg, var(--wallpaper-scrim), var(--body-gradient-end) 460px),
    var(--wallpaper-image) center top / cover no-repeat,
    var(--background);
}
```

`position: fixed` 元素自己是一个合成层，滚动时零重绘，性能与现状相同，但玻璃立刻"活"过来——滚动时每块卡片下面流过不同的光斑。这是本轮收益最大的一行改动。

### P0-2. 壁纸太素，玻璃没有东西可折射

`liquid-glass-wallpaper.svg` 的光晕透明度只有 0.18-0.34，底色是三段近白渐变。`blur(28px)` 是一个低通滤波器——把一张几乎纯白的图模糊之后还是几乎纯白。0.045 透明度的网格线在 blur 下完全消失（1px 高频信息是 blur 第一个杀掉的东西）。

结果就是：玻璃后面没有可辨认的色彩变化，`saturate(1.55)` 也无物可饱和。**Liquid Glass 的厚度感 = 背景色块透过玻璃的形变程度，背景没有色块，玻璃就没有厚度。**

**修法**（改 SVG 资产即可，不动 CSS）：

- 光晕透明度整体 ×2（0.34 → 0.6 量级），蓝/青光斑的色相拉开（一个偏 #3b6fff，一个偏 #2dd4c0），让 blur 后仍有可辨的冷暖分区；
- 增加 2-3 个中等尺寸（300-500px）的高饱和椭圆，专门放在首屏卡片常驻的位置下面——玻璃恰好压在色块边缘上时，lensing 边缘才有东西可弯折；
- 网格线可以删了，它在 blur 下不存在，徒增文件体积；
- dark 壁纸同理，当前光晕 0.26-0.36 在深底上更弱，需要更亮的 glow 才能让暗色玻璃显形。

判断标准：把壁纸单独打开，眯眼看仍能分辨出 3-4 个色彩区域，才够玻璃用。

### P1-3. lensing 是 1px 的"描边"，不是"折射"

```311:324:src/styles/app.css
.glass::after,
.glass-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 1px 1px var(--glass-edge-top),
    inset 1px 0 1px var(--glass-edge-side),
    inset -1px 0 1px rgba(255, 255, 255, 0.12),
    inset 0 -1px 1px var(--glass-edge-bottom);
}
```

方向对了，但 1px/1px 的 inset shadow 在视觉上就是一条亮 border，读不出"光在玻璃边缘弯折"。真实玻璃的边缘高光有两个特征：**有宽度**（光带从边缘向内衰减 2-4px）、**不对称**（顶部受光最亮、亮带最宽，底部是暗带）。另外右边缘的 `rgba(255,255,255,0.12)` 是硬编码，逃过了 token 体系。

**修法**：加宽并拉开衰减层次，补一个 token `--glass-edge-faint`：

```css
box-shadow:
  inset 0 1px 1px var(--glass-edge-top),
  inset 0 3px 6px -3px var(--glass-edge-top),      /* 顶部光带向内渗 */
  inset 1px 0 1px var(--glass-edge-side),
  inset -1px 0 1px var(--glass-edge-faint),
  inset 0 -1px 1px var(--glass-edge-bottom),
  inset 0 -3px 6px -3px var(--glass-edge-bottom);  /* 底部暗带向内渗 */
```

参数需要真机上调，但"亮带要有渗透宽度"这个结构是确定的。

### P1-4. 高光是二态开关，不是流动的光

```326:330:src/styles/app.css
.glass:is(:hover, :focus-within)::before,
.glass-overlay:is(:hover, :focus-within)::before {
  opacity: 1;
  transform: translate3d(1.5%, 1%, 0) scale(1.04);
}
```

hover 时光斑瞬移 3% 然后停住——这是"开关灯"，不是"液面反光"。液态感要求光斑**跟随指针连续移动**。

**修法**（约 30 行 JS + 3 行 CSS）：在玻璃容器上监听 `pointermove`，把指针相对位置写进 CSS 变量，specular 用变量定位：

```css
.glass::before {
  background:
    radial-gradient(280px circle at var(--glass-mx, 18%) var(--glass-my, 0%),
      var(--glass-light), transparent 62%),
    radial-gradient(circle at 92% 8%, var(--glass-light-cool), transparent 32%);
}
```

```ts
// 一个全局委托监听即可，rAF 节流，prefers-reduced-motion 时不挂
document.addEventListener("pointermove", e => {
  const glass = (e.target as HTMLElement).closest(".glass");
  if (!glass) return;
  const r = glass.getBoundingClientRect();
  (glass as HTMLElement).style.setProperty("--glass-mx", `${((e.clientX - r.left) / r.width) * 100}%`);
  (glass as HTMLElement).style.setProperty("--glass-my", `${((e.clientY - r.top) / r.height) * 100}%`);
});
```

只改 CSS 变量、不触发布局，`::before` 已是独立合成候选层，开销可控。这一条做完，"光在玻璃上流动"的感觉就有了——它和 P0-1 的滚动视差是液态感的两大支柱。

### P2-5. 没有折射畸变（可选的最后一公里）

blur + saturate 永远只是 frosted（磨砂），liquid（液态）的本质区别是**边缘的几何畸变**——背景线条在玻璃边缘被拉弯。Web 上唯一的实现路径是 SVG filter：

```html
<svg width="0" height="0" aria-hidden="true">
  <filter id="glass-refraction">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" result="noise"/>
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="22"
      xChannelSelector="R" yChannelSelector="G"/>
    <feGaussianBlur stdDeviation="10"/>
  </filter>
</svg>
```

```css
@supports (backdrop-filter: url(#glass-refraction)) {
  .glass { backdrop-filter: url(#glass-refraction) saturate(1.5); }
}
```

只有 Chromium 支持 `backdrop-filter: url()`，Safari/Firefox 自动落回现有 blur——`@supports` 包住即可，零风险渐进增强。建议放在 P0/P1 全部做完之后再评估：如果前四条做完已经满意，这条可以不做；displacement 的 scale 参数调不好会让边缘像"脏水波"，需要耐心。

---

## 新引入的问题

### P0-6. light 模式下 toast 白字白底（功能性 bug，必须修）

```1675:1689:src/styles/app.css
.toast {
  --glass-material-fill: var(--glass-fill-strong);
  --glass-material-blur: var(--blur-overlay);
  --glass-material-shadow: var(--raised-shadow);
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 100;
  translate: 0 24px;
  opacity: 0;
  pointer-events: none;
  border: 1px solid var(--code-border-strong);
  border-radius: var(--radius-md);
  color: var(--code-fg);
```

旧版 toast 是深色实底（`--code-bg`）配 `--code-fg` 白字。这一轮把底换成了 `--glass-fill-strong`——light 模式下是 `rgba(255,255,255,0.78)` 的白玻璃，但文字颜色还是 `--code-fg`（`#f8fbff`，近白）。**白字白玻璃，light 模式下 toast 文案不可读。** 边框用的 `--code-border-strong` 同样是给深底准备的。

两个修法选一个：

- **A（推荐，省事）**：toast 回到深色实底浮层——`background: var(--code-bg)`、去掉 glass 变量，深色浮层在两个主题下都成立，也符合"toast 要最高对比度"的功能定位；
- **B（保持玻璃）**：`color: var(--foreground)`、`border-color: var(--glass-stroke-outer)`，dark 模式自动跟随。注意玻璃 toast 叠在玻璃卡片上方时会出现 glass-on-glass，弹出位置在视口右下通常压不到卡片，可接受。

### P2-7. 收尾小项

- `.glass::after` 右边缘 `rgba(255,255,255,0.12)` 硬编码，应收为 `--glass-edge-faint`（顺手在 P1-3 里一起做）；
- `prefers-contrast: more` 仍未处理（上一轮 C 方案项，优先级不变，可继续放着）；
- `prefers-reduced-motion` 下指针跟随高光（P1-4）记得不挂监听，静态高光保留即可。

---

## 执行顺序建议

| 优先级 | 事项 | 成本 | 对"液态感"的贡献 |
|---|---|---|---|
| P0 | 壁纸层改 `position: fixed` 独立元素 | ~10 行 | ★★★★★ 滚动视差，玻璃复活 |
| P0 | toast 白字白底修复 | ~5 行 | —（功能 bug） |
| P0 | 壁纸 SVG 提饱和、加色块 | 改资产 | ★★★★ 玻璃有物可折射 |
| P1 | lensing 加宽 + token 收编 | ~10 行 | ★★★ 边缘开始"弯光" |
| P1 | 指针跟随 specular | ~35 行 | ★★★★ 光在玻璃上流动 |
| P2 | SVG displacement 折射（Chromium 渐进增强） | 半天起 | ★★ 锦上添花，先验收前面再说 |

P0 三项做完再看一眼，大概率"液态"的感觉就出来一大半——**现在缺的不是材质参数，是运动**。静止的玻璃无论参数多精确都是磨砂贴图，让背景动起来（滚动视差）、让光动起来（指针跟随），才是 liquid 和 frosted 的分界线。

---

## 附：Round 1 存档结论（已全部处理）

Round 1（2026-06-11 早些时候）针对旧版"全员玻璃"实现提出：玻璃层级收敛为三层材质、修对比度、收编硬编码色值、补全降级与 reduced-motion、区分 nav active/hover、重写 DESIGN.md。三套方案中 A 全部落地，B 的 lensing / 壁纸资产化 / `.glass` 抽象也已完成。修复质量良好，无返工项；本轮 P0-6（toast）是修复过程中的新引入问题，已在上文单列。
