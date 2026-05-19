---
name: TalkyTown
colors:
  surface: '#fff9f0'
  surface-dim: '#dfd9d1'
  surface-bright: '#fff9f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f3ea'
  surface-container: '#f3ede4'
  surface-container-high: '#ede7df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1b16'
  on-surface-variant: '#3e484f'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f6f0e7'
  outline: '#6e7980'
  outline-variant: '#bdc8d1'
  surface-tint: '#00668a'
  primary: '#00668a'
  on-primary: '#ffffff'
  primary-container: '#40c4ff'
  on-primary-container: '#004e6b'
  inverse-primary: '#7ad0ff'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fdd34d'
  on-secondary-container: '#725b00'
  tertiary: '#286b33'
  on-tertiary: '#ffffff'
  tertiary-container: '#82c885'
  on-tertiary-container: '#0a541f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c3e8ff'
  primary-fixed-dim: '#7ad0ff'
  on-primary-fixed: '#001e2c'
  on-primary-fixed-variant: '#004c69'
  secondary-fixed: '#ffe087'
  secondary-fixed-dim: '#ebc23e'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#abf4ac'
  tertiary-fixed-dim: '#90d792'
  on-tertiary-fixed: '#002107'
  on-tertiary-fixed-variant: '#07521d'
  background: '#fff9f0'
  on-background: '#1d1b16'
  surface-variant: '#e7e2d9'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  label-bold:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  caption:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 24px
  gutter: 16px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The brand personality is energetic, encouraging, and safe, designed to transform language learning into a digital playground. The target audience is children aged 5–12, requiring a UI that feels like a toy rather than a tool.

The design style is **Modern Playful**, blending elements of **Minimalism** (to reduce cognitive load) with **Tactile/Skeuomorphic** accents (to make elements feel interactive and "tappable"). The interface uses large, friendly shapes, soft depth, and high-contrast visuals to ensure the app is accessible to young learners with developing motor skills and literacy.

## Colors
The palette utilizes "Safety Brights"—vibrant hues softened by white mixing to prevent eye strain while maintaining a high-energy feel.

- **Primary (Sky Blue):** Used for main actions, navigation, and core branding.
- **Secondary (Sunny Yellow):** Reserved for "Moment of Joy" indicators: XP, rewards, and achievements.
- **Tertiary (Grass Green):** Used for positive reinforcement, progress bars, and "Correct" states.
- **Neutral (Warm Cream):** The base surface color, replacing harsh whites with a warmer, more inviting tone to reduce blue-light fatigue.
- **Semantic Accents:** Soft Coral (#FF8A80) is used sparingly for errors or "Try Again" states.

## Typography
The typography system uses **Quicksand** for its rounded terminals and open apertures, which mimic child-friendly handwriting styles and maximize legibility. 

- **Weight Strategy:** Use Bold (700) for all interactive elements and headers to create a clear visual hierarchy. Medium (500) is used for body text to maintain a soft look.
- **Accessibility:** Line heights are generous (1.5x) to assist early readers. 
- **Mobile scaling:** Display sizes shrink by 20% on mobile while maintaining the 700 weight to ensure readability on small handheld devices.

## Layout & Spacing
This design system uses a **Fluid Grid** with generous safe zones to prevent accidental taps (fat-finger syndrome). 

- **Grid Model:** 12-column grid for desktop, 4-column grid for mobile.
- **Rhythm:** An 8px base unit drives all spacing.
- **Touch Targets:** No interactive element should be smaller than 48x48px. 
- **Padding:** Containers utilize a minimum of 24px internal padding to ensure content feels "breathable" and uncrowded, which is essential for maintaining focus in a gamified environment.

## Elevation & Depth
Depth is used to signify "tappability" through **Soft Ambient Shadows**. Instead of neutral greys, shadows are tinted with the surface color (e.g., a dark blue shadow under a Sky Blue button) to maintain a vibrant look.

- **Level 1 (Surface):** Flat, Warm Cream neutral.
- **Level 2 (Cards):** 2px solid border with a subtle 4px drop shadow.
- **Level 3 (Interactive):** 4px "bottom-heavy" shadow (Skeuomorphic effect) that disappears on press to simulate a physical button being pushed down.
- **Backgrounds:** Use subtle radial gradients or soft cloud-like patterns to create a sense of world-building without distracting from the primary tasks.

## Shapes
The shape language is defined by extreme **Pill-shaped** and oversized rounded corners. There are no sharp points in the UI. 

- **Small elements (Chips/Labels):** Full pill (100px radius).
- **Medium elements (Buttons/Inputs):** 1.5rem (24px) radius.
- **Large elements (Cards/Modals):** 2rem (32px) radius.
This extreme roundedness reinforces the "Safe & Playful" brand narrative and mimics the physical design of toys for this age group.

## Components

### Buttons & Navigation
- **Primary Buttons:** High-contrast Sky Blue with a 4px darker-blue bottom border (3D effect). Use bold Quicksand in all-caps for labels.
- **Navigation Bar:** A bottom-docked bar with oversized icons and text labels. Use high-contrast active states with a "bouncing" animation on tap.

### Gamification Elements
- **Progress Bars:** Thick, 24px height tracks with a rounded interior "fill" in Grass Green. Use a glossy highlight on the fill to make it look like liquid or candy.
- **XP Badges:** Circular containers with Secondary Yellow backgrounds and a 2px stroke. 
- **Avatar Frames:** Thick-bordered circles that use the user's current level color as the border stroke.

### Input & Feedback
- **Input Fields:** Large, 56px height fields with Warm Cream backgrounds and 2px borders. Focus states should use a thick 4px Sky Blue outline.
- **Cards:** Use Level 2 elevation. Cards should always contain an illustrative icon or emoji to aid pre-literate users.
- **Success States:** Full-screen "Confetti" overlays and large Tertiary Green checkmarks for positive reinforcement.