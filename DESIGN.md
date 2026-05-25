---
name: AxiomID Agentic
colors:
  primary: "#00FF41"
  secondary: "#00D4FF"
  accent: "#FBBF24"
  success: "#16A34A"
  warning: "#D97706"
  danger: "#DC2626"
  background: "#060608"
  surface: "#09090B"
  foreground: "#F4F4F6"
  muted: "#121217"
  border: "rgba(0, 255, 65, 0.08)"
typography:
  h1:
    fontFamily: "Geist"
    fontSize: 2.5rem
  h2:
    fontFamily: "Geist"
    fontSize: 1.75rem
  body-md:
    fontFamily: "Geist"
    fontSize: 1rem
  body-sm:
    fontFamily: "Geist"
    fontSize: 0.875rem
  label-caps:
    fontFamily: "Geist Mono"
    fontSize: 0.75rem
    textTransform: uppercase
    letterSpacing: 0.05em
  sourceScale: "14/16/18/24/32/40"
  weights: "300, 400, 500, 600, 700, 800, 900"
rounded:
  sm: 8px
  md: 14px
  lg: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sourceScale: "8pt baseline grid"
---

## Overview

Conversational AI-first interface with minimal controls, clear outcomes, and delegated task flows for agentic workflows. Dark cyberpunk aesthetic with neon green accents and glass-morphism surfaces.

## Style Foundations

- **Visual style:** dark, modern, cyberpunk, glass-morphism
- **Typography scale:** 14/16/18/24/32/40
- **Typography fonts:** primary=Geist, display=Geist, mono=Geist Mono
- **Typography weights:** 300, 400, 500, 600, 700, 800, 900
- **Color palette:** dark background (#060608), neon green primary (#00FF41), electric blue secondary (#00D4FF), gold accent (#FBBF24)
- **Spacing scale:** 8pt baseline grid
- **Surfaces:** glass-panel with backdrop-filter blur(12px), semi-transparent borders
- **Glow effects:** text-shadow and box-shadow with rgba primary color glow

## Colors

- **Background (#060608):** Deep near-black base.
- **Surface (#09090B):** Slightly lighter card/panel surfaces.
- **Foreground (#F4F4F6):** Near-white text on dark backgrounds.
- **Primary (#00FF41):** Neon green — interactive elements, active states, hover glows.
- **Secondary (#00D4FF):** Electric blue — secondary actions, gradients.
- **Accent (#FBBF24):** Gold — highlights, badges, premium indicators.
- **Success (#16A34A):** Green status indicators.
- **Warning (#D97706):** Amber warning signals.
- **Danger (#DC2626):** Red destructive actions and error states.
- **Muted (#121217):** Subtle background layers, dividers.
- **Border (rgba(0, 255, 65, 0.08)):** Subtle green-tinted borders.

## Typography

- **Headings:** Geist (sans-serif), bold weights (600-800)
- **Body:** Geist (sans-serif), weight 400
- **Mono:** Geist Mono for code, labels, and data displays
- **Label caps:** 0.75rem, uppercase, 0.05em letter-spacing, Geist Mono

## Spacing

- **Grid:** 8pt baseline grid
- **Card padding:** 20-24px
- **Section gaps:** 32-48px
- **Component gaps:** 12-16px

## Rounded Corners

- **Cards (bento):** 20px radius with glass border
- **Buttons:** 12px radius
- **Inputs:** 10px radius
- **Pills/badges:** 9999px (full rounded)

## Components

### Bento Card
- Background: rgba(9, 9, 11, 0.75) with backdrop-filter blur(16px)
- Border: 1px solid rgba(0, 255, 65, 0.08)
- Border-radius: 20px
- Top gradient line on hover: linear-gradient(90deg, transparent, #00FF41, #00D4FF, transparent)
- Hover: translateY(-2px), green glow shadow, border opacity increase

### Primary Button
- Gradient background: rgba(0, 255, 65, 0.15) to rgba(0, 212, 255, 0.15)
- Hover: solid #00FF41 to #00D4FF gradient, black text
- Text: 0.75rem uppercase, Geist Mono, 0.05em letter-spacing

### Ghost Button
- Background: rgba(255, 255, 255, 0.02)
- Border: 1px solid rgba(255, 255, 255, 0.05)
- Hover: white text, brighter border

### Engineering Grid Background
- Background pattern: 40px grid with subtle white lines at 1.5% opacity
- Mask: radial gradient at center (black 30%, transparent 95%)
- Scanline: animated 4px top-to-bottom purple gradient line

### Glow Text
- .text-neon: #00FF41 with 10px green text-shadow
- .text-electric: #00D4FF with 10px blue text-shadow

### Scrollbar
- Width: 5px
- Track: #030305
- Thumb: #1F1F2E, rounded, hover turns green (#00FF41)

## Animation

- Card hover: 0.5s cubic-bezier(0.16, 1, 0.3, 1)
- Button hover: 0.3s cubic-bezier(0.16, 1, 0.3, 1)
- Scanline: 8s linear infinite
- Pulse-slow: 3s cubic-bezier(0.4, 0, 0.6, 1) infinite

## Accessibility

- Contrast ratio minimum 4.5:1 for text
- Focus indicators with green glow outline
- Interactive elements have visible hover/focus states
- Reduced motion: respect prefers-reduced-motion

## Writing Tone

- Technical, concise, Arabic-supportive
- English UI labels, Arabic content where appropriate
- Short labels, clear CTAs

## Rules: Do

- Use dark theme as default (color-scheme: dark)
- Use neon green (#00FF41) for primary CTAs and active states
- Use glass-morphism for cards and panels
- Apply backdrop-filter blur on overlay surfaces
- Use Geist Mono for code, labels, technical data
- Use gradient borders on hover for interactive cards
- Keep generous whitespace and breathing room

## Rules: Don't

- Don't use pure white backgrounds (#FFFFFF) on dark surfaces
- Don't use bright saturated colors without alpha for backgrounds
- Don't add box-shadows without considering glow effects
- Don't use non-Geist font families
- Don't create heavy/dense layouts — prefer bento grid with whitespace
