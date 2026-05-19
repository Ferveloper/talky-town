# TalkyTown — Organized Stitch Design Handoff

Este paquete contiene la exportación de Google Stitch reorganizada para usarla como base de desarrollo asistido por IA.

## Qué incluye

- Pantallas MVP renombradas y ordenadas.
- HTML generado por Stitch separado como referencia.
- Assets de avatares.
- Pantallas exploratorias separadas del MVP.
- Inventario de pantallas.
- Design system inicial.
- Guía de implementación.
- Reglas `AGENTS.md` para asistentes de desarrollo.
- Contact sheet para revisar todas las pantallas de un vistazo.

## Estructura

```txt
docs/design/stitch/screens/              Pantallas principales del MVP
docs/design/stitch/generated-html/       HTML generado por Stitch como referencia
docs/design/stitch/assets/avatars/       Avatares exportados
docs/design/stitch/exploratory/          Diseños no obligatorios para MVP
docs/design/references/                  Documentos originales de diseño
docs/design/contact-sheets/              Resumen visual
docs/design/screen-inventory.md          Inventario de pantallas
docs/design/design-system.md             Mini design system
docs/development/implementation-handoff.md Guía para pasar a código
AGENTS.md                                Reglas para desarrollo asistido por IA
```

## Siguiente paso recomendado

1. Copiar este paquete al repositorio de TalkyTown.
2. Crear el proyecto Next.js.
3. Añadir `AGENTS.md` en la raíz del repo.
4. Implementar primero componentes base.
5. Implementar pantallas con mock data.
6. Conectar backend e IA después.
