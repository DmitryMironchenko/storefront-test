---
version: alpha
name: A Legacy of Exploration & Innovation
description: "Discover Gallet's history of precise watchmaking, renowned for precision, reliability, and an adventurous spirit since 1826."
sourceUrl: "https://www.gallet.com/"

colors:
  primary: "#3e4827"
  on-primary: "#ffffff"
  background: "#ffffff"
  surface: "#3e4827"
  border: "#f68d2e"
  text: "#ffffff"
  text-muted: "#000000"
  accent: "#f68d2e"

typography:
  display:
    fontFamily: "Moderat Extended, Moderat, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
  heading:
    fontFamily: "Moderat Extended, Moderat, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Moderat, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5

spacing:
  base: 4px
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]

radius:
  sm: 1px
  md: 6px
  lg: 50px

motion:
  duration-fast: 150ms
  duration-base: 600ms
  duration-slow: 2000ms
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"

breakpoints: [480px, 576px, 600px, 640px, 768px, 769px, 991px, 992px, 1024px, 1200px, 1280px, 1440px]
---

> **⚠️ ORPHANED — non-authoritative.** These tokens were extracted from
> gallet.com, which is unrelated to this project's Breitling brief and BestBuy
> demo data. Kept only as a reference artifact / discussion aid — do **not** wire
> these values into the code. The token source of truth is HeroUI v3's theme
> (see `docs/adr/0003-frontend-architecture.md`).

## Rationale

Measured design tokens extracted from https://www.gallet.com/. The frontmatter above is the design system — real colors, type scale, spacing, radius, shadows, motion, and breakpoints read from the live page. Upgrade to Pro for the full written system (rationale, component guidance, and accessibility notes).
