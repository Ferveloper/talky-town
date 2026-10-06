# TalkyTown — Design Implementation Handoff

## Objetivo

Este paquete reorganiza la exportación de Google Stitch para convertirla en material útil para el desarrollo asistido por IA.

La intención no es copiar cada `code.html` directamente al producto final, sino usar las pantallas como referencia visual y convertirlas en componentes reutilizables.

## Estructura recomendada en el repositorio

Copia el contenido de este paquete dentro del repositorio de TalkyTown respetando esta estructura:

```txt
docs/
  design/
    stitch/
      screens/
      generated-html/
      assets/
      exploratory/
    references/
    contact-sheets/
    screen-inventory.md
    design-system.md
  development/
    implementation-handoff.md
AGENTS.md
```

## Orden de implementación recomendado

1. Crear design tokens y componentes base.
2. Implementar `/design-system` como página de referencia.
3. Implementar pantallas con datos mock.
4. Conectar navegación entre pantallas.
5. Conectar backend/API.
6. Conectar provider IA real/local después de tener el flujo mock completo.

## Componentes a extraer

```txt
TalkyButton
TalkyCard
TalkyBadge
XpProgressBar
StreakBadge
AvatarDisplay
AvatarStateIndicator
ProfileCard
MissionCard
ConversationBubble
VoiceButton
SessionRewardCard
ProviderStatusCard
SafetyInfoCard
FallbackStateCard
```

## Rutas sugeridas en Next.js

```txt
/
/login
/profiles
/profiles/new
/child-home
/missions
/conversation
/session-summary
/rewards
/parent-dashboard
/ai-settings
/safety
/design-system
```

## Criterios de conversión desde Stitch a código final

- Mantener la apariencia general, colores, bordes redondeados, espaciado y jerarquía.
- Evitar duplicación de estilos entre pantallas.
- Sustituir datos hardcodeados por props o mock data centralizada.
- Convertir cada pantalla en una composición de componentes.
- Mantener las pantallas de niño simples y visuales.
- Mantener las pantallas de adulto más limpias y confiables.
- No exponer claves ni configuración sensible en frontend.
- Mantener provider mock como modo por defecto para demo.

## Prompt recomendado para el asistente de código

```txt
You are helping me implement TalkyTown, a child-friendly AI language learning web app for children aged 5 to 12.

Use docs/design/stitch/screens as visual reference and docs/design/screen-inventory.md to understand each screen.
Use Next.js, TypeScript and Tailwind CSS.
Build reusable components instead of copying isolated HTML files.
Start with mock data and do not connect the backend yet.
Keep the child UI playful, colorful, safe and rounded.
Keep parent/admin screens cleaner and more trustworthy.
Implement the shared design system first, then the child home, mission selection and conversation screens.
```

## Pantallas prioritarias para desarrollo

1. `05-child-home.png`
2. `06-mission-selection.png`
3. `07-conversation-desktop.png`
4. `09-session-summary.png`
5. `11-parent-dashboard.png`

## Pantallas que necesitan revisión

- `03-profile-selector.png`: el archivo exportado pesa muy poco y en la previsualización parece incompleto. Recomiendo regenerarlo en Stitch o rehacerlo directamente en código usando `ProfileCard`.

## Recomendación de uso en el TFM

En el README puedes explicar:

> La fase de diseño visual se prototipó con Google Stitch. Posteriormente, las pantallas generadas se organizaron como handoff de diseño y se transformaron en componentes reutilizables en Next.js, TypeScript y Tailwind CSS.

Esto demuestra un uso adecuado de IA generativa en el flujo de desarrollo sin depender de código generado sin revisión.
