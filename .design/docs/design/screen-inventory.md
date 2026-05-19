# TalkyTown — Stitch Screen Inventory

Este inventario organiza las pantallas generadas con Google Stitch y las clasifica para su uso en desarrollo asistido por IA.

## Pantallas principales y estados MVP

| Archivo | Tipo | Pantalla | Tamaño | Peso | HTML | Uso | Observaciones |
|---|---|---|---:|---:|:---:|---|---|
| `01-landing-welcome.png` | MVP screen | Landing / Welcome | 1540x1600 | 751 KB | Sí | Entrada pública, CTA de demo y presentación del producto. |  |
| `02-login-demo.png` | MVP screen | Login / Demo login | 1600x1280 | 213 KB | Sí | Acceso adulto y modo demo. |  |
| `03-profile-selector.png` | MVP screen | Selector de perfiles | 1600x1280 | 9 KB | Sí | Selección del perfil infantil. | ⚠️ revisar: el PNG exportado pesa muy poco y puede estar incompleto. |
| `04-create-child-profile.png` | MVP screen | Crear perfil infantil | 1280x1376 | 259 KB | Sí | Alta/configuración de perfil infantil. |  |
| `05-child-home.png` | MVP screen | Home infantil | 1600x1280 | 152 KB | Sí | Pantalla principal del niño. |  |
| `06-mission-selection.png` | MVP screen | Selección de misión | 1600x1280 | 172 KB | Sí | Listado de misiones guiadas. |  |
| `07-conversation-desktop.png` | MVP screen | Conversación escritorio | 1600x1280 | 151 KB | Sí | Pantalla principal de conversación. |  |
| `07b-conversation-tablet.png` | Responsive variant | Conversación tablet | 1600x1280 | 130 KB | Sí | Variante táctil/tablet de la conversación. |  |
| `08-correction-state.png` | State screen | Corrección amable | 1600x1280 | 357 KB | Sí | Estado de corrección positiva. |  |
| `09-session-summary.png` | MVP screen | Resumen de sesión | 1600x1400 | 260 KB | Sí | Cierre de sesión con XP y aprendizaje. |  |
| `10-rewards-gallery.png` | MVP screen | Mis premios | 1600x1422 | 180 KB | Sí | Galería de recompensas del niño. |  |
| `11-parent-dashboard.png` | MVP screen | Panel adulto | 1600x1488 | 232 KB | Sí | Seguimiento de progreso. |  |
| `12-ai-provider-settings.png` | MVP screen | Configuración IA | 1600x1280 | 167 KB | Sí | Selección de provider IA. |  |
| `13-safety-privacy.png` | MVP screen | Seguridad y privacidad | 1280x1088 | 150 KB | Sí | Explicación de seguridad infantil. |  |
| `14-microphone-fallback.png` | State screen | Fallback de micrófono | 1600x1280 | 155 KB | Sí | Estado cuando falla o no hay permisos de voz. |  |
| `15-ai-fallback.png` | State screen | Fallback de IA | 1600x1280 | 217 KB | Sí | Estado cuando proveedor IA no responde. |  |


## Pantallas exploratorias

Estas pantallas no son obligatorias para el MVP, pero pueden servir como inspiración o roadmap.

| Archivo | Pantalla | Uso recomendado |
|---|---|---|
| `x01-adventure-map.png` | Mapa de aventura | Posible dashboard alternativo o roadmap visual. |
| `x02-learning-lab.png` | Learning Lab | Posible módulo futuro de contenidos/ejercicios. |
| `x03-chat-with-barnaby.png` | Chat con Barnaby | Conversación alternativa con otro avatar. |
| `x04-trophy-case-alt.png` | Trophy Case | Versión alternativa de premios. |


## Assets de avatar

| Archivo | Descripción | Uso recomendado |
|---|---|---|
| `avatar-leo-boy.png` | Avatar niño Leo | Perfil demo o avatar secundario. |
| `avatar-luna-owl-scene.png` | Luna, búho mágico con fondo | Ilustración principal/landing. |
| `avatar-luna-owl-transparent-style.png` | Luna, variante aislada | Conversación, estados o recompensas. |

## Nota importante

El código HTML generado por Stitch se conserva como **referencia visual y estructural**, pero no debe copiarse sin refactorizar. La implementación final debería realizarse con componentes reutilizables en Next.js + TypeScript + Tailwind.
