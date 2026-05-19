---
name: Adventure Learning
colors:
  surface: '#f6fafe'
  surface-dim: '#d6dade'
  surface-bright: '#f6fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f8'
  surface-container: '#eaeef2'
  surface-container-high: '#e4e9ed'
  surface-container-highest: '#dfe3e7'
  on-surface: '#171c1f'
  on-surface-variant: '#3e484f'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#edf1f5'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#40c4ff'
  on-primary-container: '#004e6b'
  inverse-primary: '#7ad0ff'
  secondary: '#7e5700'
  on-secondary: '#ffffff'
  secondary-container: '#feb300'
  on-secondary-container: '#6a4800'
  tertiary: '#126d27'
  on-tertiary: '#ffffff'
  tertiary-container: '#75cb78'
  on-tertiary-container: '#005519'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c3e8ff'
  primary-fixed-dim: '#7ad0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#ffdeac'
  secondary-fixed-dim: '#ffba38'
  on-secondary-fixed: '#281900'
  on-secondary-fixed-variant: '#604100'
  tertiary-fixed: '#9ff79f'
  tertiary-fixed-dim: '#83da85'
  on-tertiary-fixed: '#002105'
  on-tertiary-fixed-variant: '#005318'
  background: '#f6fafe'
  on-background: '#171c1f'
  surface-variant: '#dfe3e7'
  sunny-yellow: '#FFD54F'
  warm-orange: '#FF8F00'
  leaf-green: '#4CAF50'
  sky-blue-deep: '#00B0FF'
  soft-border: '#D1DBE3'
  safety-blue: '#1A237E'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  label-lg:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
  headline-xl-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 40px
---

## Brand & Style

The design system is anchored in a **Tactile / Bubbly-Modern** aesthetic designed to evoke curiosity, safety, and joy for children aged 5-12. The brand personality is that of a supportive "Adventure Guide"—encouraging and energetic without being overstimulating. 

The visual language uses physical metaphors to make the digital interface feel like a toy. Elements feature exaggerated "squishy" physics, thick outlines to define boundaries clearly for developing motor skills, and a "Town/World" narrative where every UI component feels like a physical object in a play-set. High-contrast interactive elements are balanced by soft, creamy backgrounds to ensure long-term visual comfort during learning sessions.

## Colors

The palette is driven by "Natural Vibrance." We use **Sky Blue** as the primary action color to represent the horizon and exploration. **Sunny Yellow** and **Warm Orange** serve as secondary accents for rewards and motivation, while **Leaf Green** is reserved for success states and growth indicators.

To maintain a "safe" feel, avoid pure blacks. Instead, use deep navy or charcoal-tinted blues for text and borders. Backgrounds should use soft, off-white or very pale blue tints to reduce glare. All interactive elements must maintain a thick, darker-toned bottom border to create a "3D button" effect that invites tapping.

## Typography

This design system exclusively utilizes **Quicksand** for its rounded terminals and open counters, which maximize legibility for early readers. 

- **Weight Usage:** Bold (700) is the standard for all interactive labels and headlines to ensure high visibility against colorful backgrounds. Medium (500) is used for instructional body text.
- **Scaling:** Font sizes are intentionally larger than standard SaaS applications to accommodate younger users' visual processing. 
- **Readability:** Maintain a minimum line-height of 1.4x for body text to prevent "crowding" of letters, which can be a barrier for children with dyslexia or those just learning to read.

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous safe areas. For children, "white space" is "breathing space"—it prevents the UI from feeling cluttered or overwhelming.

- **Mobile/Tablet:** Use a single-column or 2-column layout with a minimum 24px margin to prevent accidental taps near the bezel.
- **Desktop:** Center-aligned fixed-width containers (max 1200px) to keep the focal point consistent.
- **Touch Targets:** All interactive elements must have a minimum height/width of 56px to accommodate lower precision in younger children's motor skills.

## Elevation & Depth

Depth in this design system is conveyed through **Tactile Layering** rather than traditional lighting:

- **Shadows:** Use large, soft, tinted shadows (e.g., a Sky Blue shadow for a blue button) rather than gray shadows. This keeps the colors looking "clean" and vibrant.
- **The "Press Effect":** Buttons and cards use a 4px-8px solid bottom border in a darker shade of the element's background color. When pressed, the element should translate Y+4px and the border should disappear, mimicking a physical button being pushed down.
- **Tonal Layers:** Backgrounds use "Surface Containers"—white cards sitting on very light pastel foundations—to separate the "Town" (background) from the "Activities" (foreground).

## Shapes

The shape language is **Ultra-Rounded**. There are no sharp corners in this design system, as sharp angles equate to "danger" or "seriousness" in a child's visual vocabulary.

- **Cards/Containers:** Use `rounded-xl` (1.5rem / 24px) or `rounded-2xl` for large mission cards.
- **Buttons:** Use full pill-shapes (`rounded-full`) to emphasize their tapability.
- **Borders:** Use a consistent 2px to 4px "ink-stroke" border on cards and buttons to define shapes clearly against vibrant backgrounds.

## Components

### Bubbly Buttons
Primary buttons are pill-shaped with a 6px bottom "offset shadow" (a darker solid color). Use high-contrast white text for labels.

### XP Progress Bar
A thick (24px height) pill-shaped track. The "fill" should be a vibrant gradient of Leaf Green to Emerald, with a "glossy" highlight streak running through the center. On fill, use a slight "bounce" animation.

### Mission Cards
Cards feature a thick 2px colored border matching the difficulty level (Green = Easy, Yellow = Medium, Blue = Hard). They include a large, friendly icon on the left, a bold Quicksand headline, and a "Star" rating system for difficulty.

### Avatar Mood Rings
Avatars are enclosed in circular backgrounds that change color based on state:
- **Thinking:** Soft Yellow with a subtle "pulsing" glow.
- **Happy/Correct:** Vibrant Green with "sparkle" icons.
- **Neutral:** Primary Sky Blue.

### Parent Dashboard & Safety
The Parent Dashboard uses more structured, "Standard Rounded" shapes (16px) instead of pill-shapes to signify a more serious/data-focused environment. Safety cards utilize a "Shield" icon and a deep Navy (Safety Blue) border to communicate trustworthiness and protection.

### Badges & Rewards
Badges should feature a "shiny" overlay (a 45-degree semi-transparent white gradient) to simulate a plastic or metallic finish, rewarding the child with a tactile-looking trophy.