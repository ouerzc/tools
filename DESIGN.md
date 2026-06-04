---
version: alpha
name: MeetMind Soft Glass Dashboard
description: A soft glassmorphism SaaS dashboard style for AI meeting capture, transcription, snippets, action items, and workspace collaboration.

colors:
  canvas: "#F4F6FA"
  canvas-soft: "#FAFAFC"

  surface: "#FFFFFF"
  surface-frosted: "rgba(255,255,255,0.72)"
  surface-muted: "#F7F7FA"
  surface-lavender: "#F2E8FF"

  border-subtle: "#E8E8EF"
  border-soft: "#F1F1F6"

  text-primary: "#15141A"
  text-secondary: "#6E7380"
  text-muted: "#9AA1AC"
  text-inverse: "#FFFFFF"

  primary: "#6A43C8"
  primary-hover: "#5B35B8"
  primary-soft: "#EFE4FF"
  primary-soft-hover: "#E6D6FF"

  accent-blue: "#4B8EE3"
  accent-green: "#5C9D5B"
  accent-warm: "#D9B87E"
  accent-pink: "#D9A0E8"

  success: "#56A35A"
  warning: "#D9B87E"
  danger: "#E25555"

typography:
  h1:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
    letterSpacing: "-0.02em"

  h2:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "30px"
    letterSpacing: "-0.015em"

  h3:
    fontFamily: "Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 650
    lineHeight: "24px"

  body:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "22px"

  body-sm:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"

  label:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"

  label-strong:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: "18px"

rounded:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  pill: "999px"

spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"

components:
  app-shell:
    backgroundColor: "{colors.surface-frosted}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"

  sidebar:
    backgroundColor: "{colors.surface-frosted}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"

  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
    padding: "12px"

  nav-item-active:
    backgroundColor: "{colors.surface-lavender}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "12px"

  primary-button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    padding: "16px 24px"
    height: "64px"

  segmented-tab-active:
    backgroundColor: "{colors.surface-lavender}"
    textColor: "{colors.primary}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    padding: "14px 20px"

  segmented-tab:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.md}"
    padding: "14px 20px"

  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
    height: "56px"

  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"

  small-chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"

  toggle-on:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.pill}"
    size: "36px"
---

## 1. Visual Theme & Atmosphere

The interface should feel like a calm AI meeting workspace floating over a soft, premium 3D environment.

The visual direction is:

- **Soft Glass SaaS**: translucent white surfaces, blur-like layering, and very gentle shadows.
- **Productivity Calm**: the page should feel organized, quiet, and low-friction, not dense or enterprise-heavy.
- **Friendly AI Utility**: purple accents suggest intelligence, automation, and modern collaboration.
- **Premium Light Mode**: mostly white and off-white, with carefully placed lavender accents.
- **Floating Dashboard**: the main product shell appears suspended above a soft 3D cushion-tile background.

Avoid making it look like a hard admin panel. The UI should feel more like a polished AI productivity product than a CRUD dashboard.

## 2. Color Palette & Roles

| Role | Token | Value | Usage |
|---|---:|---:|---|
| App canvas | `canvas` | `#F4F6FA` | Base page background behind the glass shell |
| Frosted surface | `surface-frosted` | `rgba(255,255,255,0.72)` | Main app container, sidebar, large panels |
| Primary surface | `surface` | `#FFFFFF` | Cards, inputs, meeting items |
| Muted surface | `surface-muted` | `#F7F7FA` | Chips, secondary controls, disabled-looking areas |
| Lavender surface | `surface-lavender` | `#F2E8FF` | Active nav, selected tabs, subtle primary highlights |
| Primary purple | `primary` | `#6A43C8` | Main CTA, toggles, active states, important links |
| Primary hover | `primary-hover` | `#5B35B8` | Hover/pressed CTA states |
| Primary soft | `primary-soft` | `#EFE4FF` | Background fill for active states |
| Main text | `text-primary` | `#15141A` | Headings, key labels, meeting titles |
| Secondary text | `text-secondary` | `#6E7380` | Body copy, descriptions, navigation labels |
| Muted text | `text-muted` | `#9AA1AC` | Placeholder text, metadata, timestamps |
| Border | `border-subtle` | `#E8E8EF` | Card borders, separators, input outlines |
| Integration blue | `accent-blue` | `#4B8EE3` | Video meeting icons, platform indicators |
| Integration green | `accent-green` | `#5C9D5B` | Google Meet-style indicator or success state |
| Warm accent | `accent-warm` | `#D9B87E` | Background decorative glow only |
| Pink accent | `accent-pink` | `#D9A0E8` | Background decorative glow only |

Color usage rule: **purple is the only strong interaction color**. Blue, green, warm yellow, and pink should appear mainly as small icons, background reflections, or integration indicators.

## 3. Typography Rules

Use a modern neutral sans-serif such as **Inter**, **SF Pro**, or a close system fallback.

Typography should be clean, slightly compact, and product-like:

| Style | Size | Weight | Usage |
|---|---:|---:|---|
| `h1` | 28px | 700 | Page-level title if needed |
| `h2` | 22px | 700 | Section titles like “New meeting”, “Recent meetings”, “Today” |
| `h3` | 16px | 650 | Card titles and meeting names |
| `body` | 14px | 400 | Card descriptions, normal UI copy |
| `body-sm` | 13px | 400 | Metadata, secondary descriptions |
| `label` | 12px | 500 | Field labels, timestamps, small chips |
| `label-strong` | 13px | 650 | Buttons, active tabs, selected nav |

Rules:

- Use dark near-black for headings, not pure black.
- Keep paragraph text muted and low-contrast.
- Avoid oversized display typography. This is an app UI, not a marketing hero.
- Use medium weights instead of heavy bold except for section headings.
- Keep line height generous enough to preserve the airy feel.

## 4. Component Stylings

### App Shell

The central dashboard should be a large frosted-glass rectangle with rounded corners.

- Background: translucent white
- Border: subtle white or light gray
- Radius: 28px
- Shadow: large, soft, low-opacity
- Internal layout: sidebar + main content + right panel
- The shell should feel like one unified floating object.

### Sidebar

The sidebar is calm and minimal.

- Width: around 280–320px on desktop
- Background: frosted white
- Logo area at top
- Navigation items use icon + label
- Active item uses pale lavender fill and purple text/icon
- Section labels such as “WORKSPACE” are small uppercase purple-gray text
- Avoid heavy dividers; use very subtle separators only.

### Top Search

Search should be a wide rounded pill/card.

- Height: around 56px
- White background
- Small search icon on the left
- Muted placeholder
- Keyboard shortcut chip on the right
- Very low border contrast

### New Meeting Module

This is the main task creation area.

Structure:

1. Section title: “New meeting”
2. Segmented tabs: Online meeting / In-person meeting / Upload meeting
3. URL input + primary CTA
4. Secondary fields: meeting name, language, bot name

Style:

- Active tab has lavender background and purple label/icon.
- Inactive tabs are text-only with thin separators.
- Main CTA is solid purple with white text.
- Inputs are white, rounded, and softly bordered.

### Cards

Cards should feel like floating white sheets.

- Radius: 16–20px
- Background: pure white or near-white
- Border: very subtle
- Shadow: soft and diffuse
- Padding: 20–24px
- Internal spacing: relaxed
- Use metadata rows with small icons and muted labels.

### Meeting List Items

Right-side meeting items are compact cards.

- Title on top
- Time + platform icon below
- Host avatar/name line
- Toggle aligned to the right
- Purple toggle when active
- White background with soft border

### Chips and Tags

Use pill-shaped muted chips.

- Background: `surface-muted`
- Text: `text-secondary`
- Small icon optional
- Radius: full pill
- Keep chip colors understated.

### Avatars

Avatars are small circular images.

- Size: 24–32px
- Slight overlap allowed for participant groups
- Use tiny count bubble with lavender background and purple text.

## 5. Layout Principles

The layout uses a **three-column productivity dashboard**:

```text
[ Sidebar ] [ Main work area ] [ Today / To-do panel ]