# Islamic Students Movement (ISM) — Web Platform

An editorial, cinematic Next.js web application for the Islamic Students Movement (ISM). Built with a 3D scroll-driven interactive hero section, custom design system, and structured section layout.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with CSS Custom Properties
- **Animation**: [Framer Motion](https://www.framer.com/motion/) for scroll-linked & settle motion
- **3D Graphics**: [Three.js](https://threejs.org/) with [@react-three/fiber](https://r3f.docs.pmnd.rs/) & [@react-three/drei](https://github.com/pmndrs/drei)
- **Font Optimization**: `next/font` with self-hosted variable Google Fonts (`Fraunces` & `Inter`)

---

## 🛠️ Getting Started Locally

### Prerequisites

Ensure you have **Node.js 18.17+** and **npm** installed.

### Installation

```bash
# Clone repository & navigate into workspace
cd ISM

# Install dependencies
npm install --legacy-peer-deps
```

### Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production Test

To create an optimized production build:

```bash
npm run build
npm run start
```

---

## 📁 Project Architecture (`/src` layout)

```
src/
├── app/
│   ├── favicon.ico          # Site favicon
│   ├── globals.css          # Design tokens & base styling
│   ├── layout.tsx           # Root layout & font provider
│   └── page.tsx             # Main page composing sections
├── components/
│   ├── ui/                  # Generic UI primitives (Button, Container, Section, SectionHeading)
│   ├── sections/            # Page sections (Hero, About, Programs, Leadership, Events, etc.)
│   ├── three/               # 3D R3F components (QuranScene, CameraRig, HeroCanvas)
│   └── patterns/            # SVG geometric patterns (GirihPattern)
├── lib/
│   ├── hooks/               # Custom React hooks (useScrollProgress, usePrefersReducedMotion)
│   ├── utils/               # Pure utilities (cn, webgl detection)
│   ├── constants/           # Typed site copy, nav links, and metadata
│   └── types/               # Shared TypeScript interfaces
├── styles/                  # Additional global stylesheets (if required)
public/
├── fonts/                   # Self-hosted font files
├── images/                  # Static image assets
└── models/                  # 3D assets (.glb/.gltf)
tests/                       # Test suite setup
```

---

## 🎨 Design System Tokens

- **Ink Green**: `#0E1A15`
- **Bottle Green**: `#0B3D2E`
- **Parchment**: `#F5F0E6`
- **Brass**: `#A9843C`
- **Lapis**: `#1C3F5F`
- **Display Font**: `Fraunces` (`var(--font-display)`)
- **Body Font**: `Inter` (`var(--font-body)`)
- **Type Scale**: 1.25 ratio scale from a 16px base (xs through 7xl)
