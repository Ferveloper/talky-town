# TalkyTown — Design System

Este documento consolida los criterios visuales principales a partir de la exportación de Google Stitch.

# TalkyTown Mini Design System

Establishing a playful, safe, and modern visual language for children's language learning.

## 🎨 Color Palette
- **Sky Blue (Primary):** `#40c4ff` - Friendly and energetic.
- **Sunny Yellow (Accent):** `#ffcc33` - Positive and encouraging.
- **Leaf Green (Success):** `#88cc44` - Growth and progress.
- **Soft Peach (Background):** `#fff9f0` - Warm and non-intimidating.
- **Deep Slate (Text):** `#333333` - High contrast for readability.

## ✍️ Typography
- **Headlines:** Quicksand Bold - Rounded and friendly.
- **Body:** Quicksand Medium - Clear and accessible.
- **Labels:** Quicksand Semi-Bold - For buttons and badges.

## 🔘 Button Styles
- **Primary:** Large, bubbly, `#40c4ff` background, white text, thick rounded corners (32px+).
- **Secondary:** White background, `#40c4ff` border, blue text.
- **Demo Mode:** Sunny Yellow background, deep slate text.

## 🗂️ Components
- **Cards:** White background, 24px border radius, soft drop shadow (`0 4px 6px rgba(0,0,0,0.05)`).
- **XP Progress Bar:** 20px height, grey background track, Leaf Green fill, rounded ends.
- **Badges:** Small circular or star-shaped icons with gold/silver accents.
- **Mission Card:** Image top, title/XP below, primary button bottom right.
- **Parent Dashboard Card:** Data-heavy but spacious, uses simple charts.
- **Safety Card:** Icon-led, uses Soft Blue/Peach background to convey trust.

## 🦉 Avatar Indicators
- **Happy:** Glowing gold halo.
- **Thinking:** Soft blue pulsing border.
- **Encouraging:** Sparkle effects around the frame.


## Tokens iniciales recomendados para Tailwind

```ts
export const talkyTownTheme = {
  colors: {
    background: '#fff9f0',
    primary: '#40c4ff',
    primaryDark: '#00668a',
    accent: '#ffcc33',
    success: '#88cc44',
    danger: '#ba1a1a',
    text: '#333333',
    surface: '#ffffff',
    surfaceSoft: '#f9f3ea'
  },
  radius: {
    card: '24px',
    button: '32px',
    pill: '9999px'
  },
  fontFamily: {
    sans: ['Quicksand', 'sans-serif']
  }
}
```

## Componentes base

- `TalkyButton`: variantes `primary`, `secondary`, `demo`, `danger`, `ghost`.
- `TalkyCard`: tarjeta blanca con bordes redondeados y sombra suave.
- `TalkyBadge`: insignia para XP, nivel, idioma o estado.
- `XpProgressBar`: barra de progreso verde o azul.
- `AvatarDisplay`: avatar con estado visual.
- `MissionCard`: tarjeta de misión con título, descripción, edad y XP.
- `ConversationBubble`: burbuja para mensajes de avatar/niño.
- `FallbackStateCard`: estado amable de error o fallback.

## Reglas de consistencia

- Usar Quicksand como fuente principal.
- Mantener bordes redondeados grandes.
- Priorizar botones grandes y accesibles.
- Usar iconos acompañados de texto.
- No saturar las pantallas infantiles con demasiada información.
- Diferenciar zona niño y zona adulto con densidad visual distinta.
