# DevKit Hub Liquid Glass Design Notes

`src/styles/app.css` is the source of truth for the active visual system. This file records the intent and the maintenance rules so future changes do not drift back into ad hoc glass effects.

## Direction

DevKit Hub is a compact developer toolkit, not a marketing page. The interface should feel like a focused utility surface floating over a quiet blue technical wallpaper.

- Material language: blue Liquid Glass approximation for web, implemented with `backdrop-filter`, tokenized fills, lensing shadows, and solid fallbacks.
- Product feel: dense enough for repeated tool use, restrained enough that JSON and timestamp data remain easy to scan.
- Accent: `--primary` blue is the only strong interaction color.
- Typography: Inter/SF/system sans for UI, JetBrains/IBM Plex/system mono for machine-readable values.

## Material Rules

Glass is reserved for floating shells and overlays:

- `.topbar.glass`
- `.surface-card.glass` except code tone, which becomes a solid code surface
- `.tool-card.glass`
- `.workspace-bar.glass`

Controls inside those shells are not glass. Buttons, badges, form controls, small icons, nav icons, inline actions, and input mode cards use `--control-fill`, `--muted-fill`, or semantic fills without their own `backdrop-filter`.

Toast notifications are intentionally not glass. They use `--code-bg` and `--code-fg` as a high-contrast solid overlay so status text stays readable in both themes.

The only live blur declarations should be inside:

- `.glass, .glass-overlay`

This prevents glass-on-glass nesting and keeps the GPU cost bounded.

## Core Tokens

| Token | Purpose |
|---|---|
| `--glass-fill`, `--glass-fill-soft`, `--glass-fill-strong` | Main translucent shell fills |
| `--glass-stroke`, `--glass-stroke-outer` | Inner and outer material borders |
| `--glass-highlight`, `--glass-tint` | Static material lighting |
| `--glass-edge-*` | Lensing edge highlights and faint side bands |
| `--blur-shell`, `--blur-overlay` | Blur strengths for shells and overlays |
| `--control-fill`, `--control-fill-hover`, `--control-fill-active` | Non-blurred inner control materials |
| `--code-bg`, `--code-bg-2`, `--code-border`, `--code-muted` | Solid code and diff surfaces |

## Wallpaper

The wallpaper is a static SVG asset:

- `public/liquid-glass-wallpaper.svg`
- `public/liquid-glass-wallpaper-dark.svg`

Do not recreate the old multi-gradient `background-attachment: fixed` stack in CSS. If the wallpaper needs to change, update the SVG asset and the `--wallpaper-image` token.

## Accessibility And Fallbacks

- `--muted-foreground` is the minimum color for secondary readable text.
- `--text-muted` is only for decorative or low-importance metadata.
- `@supports not (backdrop-filter)` switches glass surfaces to solid card backgrounds.
- `prefers-reduced-transparency: reduce` removes blur and disables glass pseudo highlights.
- `prefers-reduced-motion: reduce` removes smooth scrolling and transform-heavy motion.

## Component Guidance

New floating surfaces should add `glass` or `glass-overlay` and set material variables when needed:

```css
.new-floating-shell {
  --glass-material-fill: var(--glass-fill-strong);
  --glass-material-shadow: var(--glass-shadow);
}
```

New inner controls should not use `backdrop-filter`. Use the control tokens and semantic colors instead.
