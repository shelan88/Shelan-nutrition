# Shilan — Nutritionist Landing Page

## Overview
A bilingual (English/Arabic) landing page for Shilan, a nutritionist and
Lipedema specialist. Built with React + Vite + Tailwind CSS. Full RTL/LTR
support with a language toggle in the navbar.

## Tech Stack
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`, configured through `@theme` in `src/index.css` — no separate tailwind.config file)
- Framer Motion for animations
- lucide-react for icons

## Structure
- `src/content/content.ts` — **all copy lives here** (English + Arabic), organized by section. Edit this file to change any text on the site.
- `src/context/LanguageContext.tsx` — language/direction state, persisted to localStorage, auto-detects browser language on first visit.
- `src/components/` — one component per section (Navbar, Hero, About, Services, InfoHub, FAQ, Booking, Footer).

## Design System
- Colors: White (dominant), Lavender, Dusty Rose accents — defined as `lavender-*` / `rose-*` scales in `src/index.css`.
- Fonts: Montserrat (headings) / Inter (body) for English; Cairo / Tajawal for Arabic, switched automatically via `[dir="rtl"]` selectors.

## Placeholders
Shilan's photo and final bio copy are placeholders (gradient boxes with labels) pending real assets from the user — swap into `About.tsx` / `Hero.tsx` and `content.ts` when available.

## User preferences
None recorded yet.
