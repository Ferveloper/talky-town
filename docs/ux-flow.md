# TalkyTown — UX Flow

## 1. Propósito del documento

Este documento define la experiencia de usuario del MVP de **TalkyTown**, una aplicación web gamificada para que niños de 5 a 12 años practiquen idiomas conversando con avatares impulsados por IA.

El objetivo de esta fase es traducir el alcance definido en `product-scope.md` a flujos de usuario, pantallas, estados de interfaz, estados del avatar, textos base, criterios UX y necesidades de wireframing.

Este documento debe servir como referencia para:

- Diseñar los wireframes.
- Validar el flujo de producto antes de desarrollar.
- Definir las pantallas del MVP.
- Alinear frontend, backend e IA.
- Preparar una demo clara para el TFM.
- Evitar funcionalidades innecesarias en la primera versión.

---

## 2. Principios UX del MVP

TalkyTown debe sentirse como una experiencia infantil, segura, sencilla y motivadora.

### 2.1 Claridad antes que complejidad

Cada pantalla debe tener una acción principal evidente. El niño no debe tener que interpretar demasiadas opciones al mismo tiempo.

### 2.2 Interfaz adaptada por edad

La app está orientada a niños de 5 a 12 años, por lo que debe funcionar para distintos niveles de autonomía:

- 5–7 años: botones grandes, iconos, voz, frases muy cortas.
- 8–10 años: misiones visuales, instrucciones breves, recompensas claras.
- 11–12 años: más autonomía, conversaciones temáticas y progreso visible.

### 2.3 Seguridad visible

El adulto debe percibir que la app es segura. El niño debe percibir que está en un entorno amable, no en una herramienta técnica.

### 2.4 Gamificación con propósito

La gamificación debe reforzar el aprendizaje, no sustituirlo.

Elementos permitidos en MVP:

- XP.
- Niveles.
- Insignias.
- Racha.
- Misiones.
- Celebraciones visuales.

### 2.5 IA invisible pero útil

La IA debe sentirse como un personaje conversacional, no como una consola de chat. La complejidad técnica se oculta detrás del avatar.

### 2.6 Fallback siempre disponible

Si falla voz, IA, proveedor local o permisos de micrófono, el niño debe poder seguir usando el modo texto o el provider mock.

---

## 3. Roles de usuario

## 3.1 Adulto / tutor

Responsabilidades:

- Entrar en la aplicación.
- Crear o seleccionar perfiles infantiles.
- Configurar edad, idioma, nivel y avatar.
- Consultar progreso.
- Cambiar proveedor IA.
- Acceder a información de seguridad y privacidad.

Necesidades:

- Entender rápido cómo funciona.
- Confiar en que la app es segura.
- Ver que el niño practica.
- Poder probar la app como demo TFM.

## 3.2 Niño

Responsabilidades:

- Elegir avatar o perfil.
- Iniciar práctica.
- Hablar o escribir con el avatar.
- Completar misiones.
- Recibir recompensas.
- Ver progreso simplificado.

Necesidades:

- Pantallas visuales.
- Pocas opciones.
- Instrucciones simples.
- Recompensas frecuentes.
- Tono amable.
- Sensación de juego.

## 3.3 Evaluador TFM

Responsabilidades:

- Acceder al README.
- Ejecutar o abrir la demo.
- Entrar con usuario demo.
- Probar el flujo principal.
- Entender arquitectura y alcance.
- Validar entregables.

Necesidades:

- Demo rápida.
- Credenciales claras.
- Flujo guiado.
- Datos precargados.
- Explicación de limitaciones.
- Capturas y vídeo demo.

---

## 4. Estructura general de navegación

```txt
Landing / Welcome
  ├── Demo login
  └── Login adulto

Adult Dashboard
  ├── Child Profile Selector
  ├── Create Child Profile
  ├── Progress Panel
  ├── AI Provider Settings
  └── Safety / Privacy Info

Child Home
  ├── Avatar Selection
  ├── Free Conversation
  ├── Guided Mission
  ├── Rewards
  └── Session Summary

Conversation Room
  ├── Avatar
  ├── Conversation feed
  ├── Text input
  ├── Voice control
  ├── XP feedback
  └── End session
```

---

## 5. Flujo principal del adulto

### 5.1 Objetivo

Permitir que un adulto entre en TalkyTown, seleccione o cree un perfil infantil y lance una sesión de práctica.

### 5.2 Flujo

```txt
1. El adulto abre TalkyTown.
2. Ve una pantalla de bienvenida.
3. Pulsa "Entrar en modo demo" o inicia sesión.
4. Accede al selector de perfiles infantiles.
5. Selecciona un perfil existente o crea uno nuevo.
6. Configura edad, idioma objetivo y nivel.
7. Elige avatar.
8. Accede a la home infantil.
9. El niño toma el control de la experiencia.
```

### 5.3 Criterios UX

- El modo demo debe estar visible.
- El adulto debe poder probar la app sin configurar claves IA.
- La creación de perfil debe durar menos de 1 minuto.
- Los textos legales o técnicos no deben invadir la experiencia infantil.
- La configuración avanzada de proveedores IA debe estar separada de la experiencia del niño.

---

## 6. Flujo principal del niño

### 6.1 Objetivo

Permitir que el niño practique inglés con un avatar de forma sencilla y divertida.

### 6.2 Flujo

```txt
1. El niño llega a la home infantil.
2. Ve su avatar, nivel, XP y racha.
3. Elige entre "Hablar libremente" o "Ir a una misión".
4. El avatar saluda.
5. El niño responde por texto o voz.
6. El avatar contesta.
7. Si hay error de idioma, corrige de forma amable.
8. El sistema concede XP.
9. Al completar la sesión, se muestra resumen.
10. El niño ve recompensas y progreso.
```

### 6.3 Criterios UX

- La acción principal debe ser evidente: "Empezar".
- El avatar debe estar siempre presente en la conversación.
- El feedback debe ser inmediato.
- Las correcciones deben ser cortas.
- No debe haber lenguaje técnico.
- Los mensajes deben ser adecuados a la franja de edad.

---

## 7. Flujo demo para evaluación del TFM

### 7.1 Objetivo

Diseñar un recorrido rápido para que el evaluador entienda el valor del proyecto en menos de 5 minutos.

### 7.2 Flujo recomendado

```txt
1. Abrir README.
2. Abrir URL de demo.
3. Pulsar "Entrar en modo demo".
4. Seleccionar perfil demo: Sofía, 9 años.
5. Ver home infantil.
6. Elegir misión "Animal Adventure".
7. Enviar mensaje: "I like dogs".
8. Recibir respuesta del avatar.
9. Ver XP ganado.
10. Completar 2 o 3 turnos.
11. Ver resumen de sesión.
12. Abrir panel adulto.
13. Ver progreso actualizado.
14. Abrir configuración IA.
15. Confirmar provider mock/cloud/local configurable.
```

### 7.3 Elementos obligatorios para la demo

- Usuario demo.
- Perfil infantil demo.
- Misión demo.
- Provider mock activable.
- Datos seed.
- XP visible.
- Panel de progreso.
- Enlace a GitHub.
- Enlace a slides.
- Instrucciones en README.

---

## 8. Mapa de pantallas MVP

## 8.1 Pantalla 01 — Landing / Welcome

### Objetivo

Presentar TalkyTown y facilitar entrada inmediata.

### Usuario

Adulto / evaluador.

### Contenido

- Logo o nombre: TalkyTown.
- Claim: "Aprende idiomas hablando con avatares de IA".
- Descripción breve.
- Botón principal: "Entrar en modo demo".
- Botón secundario: "Iniciar sesión".
- Enlace: "Ver cómo funciona".
- Enlace a GitHub o documentación, opcional para TFM.

### Acciones

- Entrar en modo demo.
- Iniciar sesión.
- Leer breve explicación del producto.

### Wireframe textual

```txt
+--------------------------------------------------+
| TalkyTown                                        |
| Aprende idiomas hablando con avatares de IA      |
|                                                  |
| [Entrar en modo demo]                            |
| [Iniciar sesión]                                 |
|                                                  |
| Seguro para niños · Gamificado · Con IA          |
+--------------------------------------------------+
```

### Criterios UX

- El modo demo debe ser la acción más visible.
- Debe transmitir seguridad y diversión.
- No debe parecer una herramienta empresarial.

---

## 8.2 Pantalla 02 — Login adulto / Demo login

### Objetivo

Permitir acceso sencillo.

### Usuario

Adulto / evaluador.

### Contenido

- Email.
- Contraseña.
- Botón "Entrar".
- Botón "Usar demo".
- Mensaje: "El modo demo no requiere configuración de IA".

### Acciones

- Login real.
- Login demo.

### Wireframe textual

```txt
+--------------------------------------------------+
| Entrar en TalkyTown                              |
|                                                  |
| Email                                            |
| [____________________]                           |
| Password                                         |
| [____________________]                           |
|                                                  |
| [Entrar]                                         |
| [Usar modo demo]                                 |
+--------------------------------------------------+
```

### Criterios UX

- El evaluador no debe bloquearse por credenciales.
- El login real puede ser muy simple en MVP.

---

## 8.3 Pantalla 03 — Selector de perfiles infantiles

### Objetivo

Elegir quién va a practicar.

### Usuario

Adulto / niño acompañado.

### Contenido

- Lista de perfiles infantiles.
- Avatar de cada perfil.
- Edad.
- Idioma objetivo.
- Nivel.
- Botón "Crear nuevo perfil".

### Acciones

- Seleccionar perfil.
- Crear perfil.
- Ir al panel adulto.

### Wireframe textual

```txt
+--------------------------------------------------+
| ¿Quién va a practicar hoy?                       |
|                                                  |
| [Avatar] Sofía · 9 años · Inglés · Explorer      |
| [Avatar] Leo · 6 años · Inglés · Starter         |
|                                                  |
| [+ Crear nuevo perfil]                           |
| [Panel adulto]                                   |
+--------------------------------------------------+
```

### Criterios UX

- Debe ser visual y fácil de elegir.
- Evitar datos personales reales.
- Usar alias, no nombre completo.

---

## 8.4 Pantalla 04 — Crear perfil infantil

### Objetivo

Configurar una experiencia adaptada.

### Usuario

Adulto.

### Campos

- Alias.
- Edad.
- Idioma nativo.
- Idioma objetivo.
- Nivel inicial.
- Temas favoritos.
- Avatar.

### Acciones

- Crear perfil.
- Cancelar.

### Wireframe textual

```txt
+--------------------------------------------------+
| Crear perfil                                     |
|                                                  |
| Alias: [_________]                               |
| Edad:  [5 v]                                     |
| Idioma nativo: [Español v]                       |
| Idioma a practicar: [Inglés v]                   |
| Nivel: [Starter v]                               |
|                                                  |
| Elige avatar:                                    |
| [Luna] [Max] [Tiko]                              |
|                                                  |
| [Crear perfil]                                   |
+--------------------------------------------------+
```

### Criterios UX

- Debe indicar que se recomienda usar alias.
- No pedir datos personales innecesarios.
- Edad permite adaptar contenido.

---

## 8.5 Pantalla 05 — Home infantil

### Objetivo

Ser el punto de entrada a la práctica.

### Usuario

Niño.

### Contenido

- Saludo personalizado.
- Avatar.
- XP.
- Nivel.
- Racha.
- Botón "Hablar libremente".
- Botón "Ir a una misión".
- Botón "Mis premios".
- Botón pequeño "Volver al adulto".

### Acciones

- Iniciar conversación libre.
- Elegir misión.
- Ver recompensas.
- Volver.

### Wireframe textual

```txt
+--------------------------------------------------+
| Hola, Sofía!                                     |
| Nivel 2 · 120 XP · Racha 3 días                  |
|                                                  |
|              [ Avatar animado ]                  |
|                                                  |
| [Hablar libremente]                              |
| [Ir a una misión]                                |
| [Mis premios]                                    |
|                                                  |
| Adulto                                           |
+--------------------------------------------------+
```

### Criterios UX

- Botones grandes.
- Muy poco texto.
- Estado de progreso visible.
- Visualmente alegre.

---

## 8.6 Pantalla 06 — Selección de misión

### Objetivo

Elegir una misión conversacional.

### Usuario

Niño.

### Contenido

Tarjetas de misión:

- Nombre.
- Icono.
- Edad recomendada.
- Dificultad.
- XP estimado.
- Breve descripción.

### Misiones MVP

- Meet a New Friend.
- Animal Adventure.
- Ice Cream Shop.
- Space Explorer.

### Wireframe textual

```txt
+--------------------------------------------------+
| Elige una misión                                 |
|                                                  |
| [Animal Adventure]                               |
| Habla de tus animales favoritos · +30 XP         |
|                                                  |
| [Ice Cream Shop]                                 |
| Pide un helado en inglés · +40 XP                |
|                                                  |
| [Space Explorer]                                 |
| Viaja al espacio y responde preguntas · +50 XP   |
+--------------------------------------------------+
```

### Criterios UX

- Mostrar solo misiones adecuadas a la edad.
- Las misiones deben parecer aventuras, no deberes.

---

## 8.7 Pantalla 07 — Conversación

### Objetivo

Permitir la interacción principal con el avatar.

### Usuario

Niño.

### Contenido

- Avatar grande.
- Estado del avatar.
- Mensaje del avatar.
- Historial simple.
- Input de texto.
- Botón de micrófono.
- Botón de enviar.
- XP ganado.
- Progreso de misión.
- Botón finalizar.

### Wireframe textual

```txt
+--------------------------------------------------+
| Animal Adventure                     [Salir]     |
| Progreso: █████░░░░ 50% · +15 XP                 |
|                                                  |
|              [ Avatar: escuchando ]              |
|                                                  |
| Avatar: What animal do you like?                 |
|                                                  |
| Tú: I like dogs                                  |
| Avatar: Great! Dogs are friendly.                |
|                                                  |
| [ Escribe aquí...                 ] [Enviar]     |
| [🎤 Hablar]                                      |
+--------------------------------------------------+
```

### Criterios UX

- El avatar debe dominar visualmente.
- El historial no debe parecer chat técnico.
- La corrección debe aparecer como ayuda, no como error grave.
- Si voz no funciona, texto sigue disponible.

---

## 8.8 Pantalla 08 — Resumen de sesión

### Objetivo

Cerrar la práctica con recompensa y aprendizaje.

### Usuario

Niño.

### Contenido

- Mensaje de celebración.
- XP ganado.
- Badge desbloqueado, si aplica.
- Palabras practicadas.
- Corrección amable principal.
- Botón "Otra misión".
- Botón "Volver a inicio".

### Wireframe textual

```txt
+--------------------------------------------------+
| Great job, Sofía!                                |
|                                                  |
| Ganaste +35 XP                                   |
| Desbloqueaste: Animal Explorer                   |
|                                                  |
| Palabras practicadas: dog, cat, bird             |
| Pequeña mejora: "I like dogs"                   |
|                                                  |
| [Otra misión]                                    |
| [Volver a inicio]                                |
+--------------------------------------------------+
```

### Criterios UX

- Refuerzo positivo primero.
- Correcciones breves.
- Celebración visual.
- Evitar listas largas.

---

## 8.9 Pantalla 09 — Mis premios

### Objetivo

Mostrar recompensas y motivación.

### Usuario

Niño.

### Contenido

- Nivel actual.
- Barra de XP.
- Badges desbloqueados.
- Badges bloqueados con pista.
- Racha.

### Wireframe textual

```txt
+--------------------------------------------------+
| Mis premios                                      |
|                                                  |
| Nivel 2                                          |
| XP: ███████░░░ 120/200                           |
|                                                  |
| Badges                                           |
| [First Talk] [Animal Explorer] [???]             |
|                                                  |
| Racha: 3 días seguidos                           |
+--------------------------------------------------+
```

### Criterios UX

- El progreso debe parecer coleccionable.
- No crear competición social en MVP.

---

## 8.10 Pantalla 10 — Panel adulto

### Objetivo

Consultar progreso y configuración.

### Usuario

Adulto.

### Contenido

- Selector de perfil.
- Sesiones completadas.
- XP total.
- Nivel.
- Misiones completadas.
- Palabras practicadas.
- Errores frecuentes.
- Última actividad.
- Enlace a configuración IA.
- Enlace a privacidad/seguridad.

### Wireframe textual

```txt
+--------------------------------------------------+
| Panel adulto                                     |
| Perfil: Sofía                                    |
|                                                  |
| Sesiones: 5                                      |
| XP total: 120                                    |
| Nivel: Explorer                                  |
| Misiones completadas: 3                          |
| Palabras practicadas: dog, cat, hello            |
| Errores frecuentes: I likes -> I like            |
|                                                  |
| [Configurar IA]                                  |
| [Seguridad y privacidad]                         |
+--------------------------------------------------+
```

### Criterios UX

- Mostrar progreso educativo, no vigilancia invasiva.
- No mostrar transcripciones completas por defecto.
- Evitar métricas complejas en MVP.

---

## 8.11 Pantalla 11 — Configuración IA

### Objetivo

Permitir seleccionar proveedor IA y demostrar arquitectura multi-proveedor.

### Usuario

Adulto / evaluador.

### Contenido

- Provider activo.
- Opción Mock.
- Opción Cloud OpenAI-compatible.
- Opción Local OpenAI-compatible.
- Campo base URL.
- Campo modelo.
- Estado de conexión.
- Botón probar provider.

### Wireframe textual

```txt
+--------------------------------------------------+
| Configuración de IA                              |
|                                                  |
| Provider activo: [Mock v]                        |
|                                                  |
| Base URL: [http://localhost:11434/v1]            |
| Modelo:   [llama3.1]                             |
|                                                  |
| [Probar conexión]                                |
| Estado: OK                                       |
|                                                  |
| Nota: el modo mock permite probar sin claves.    |
+--------------------------------------------------+
```

### Criterios UX

- Esta pantalla no debe estar disponible para el niño.
- Debe explicar claramente el provider mock.
- No mostrar claves completas.
- No guardar secretos en frontend.

---

## 8.12 Pantalla 12 — Seguridad y privacidad

### Objetivo

Explicar medidas de seguridad infantil.

### Usuario

Adulto / evaluador.

### Contenido

- No se piden datos personales al niño.
- Se recomienda usar alias.
- No se almacena audio bruto por defecto.
- Se redirigen temas no adecuados.
- El contenido se adapta a la edad.
- El adulto puede revisar progreso.

### Wireframe textual

```txt
+--------------------------------------------------+
| Seguridad y privacidad                           |
|                                                  |
| - Usa alias, no nombres completos.               |
| - TalkyTown no pide datos personales al niño.    |
| - El audio no se guarda por defecto.             |
| - Los temas no adecuados se redirigen.           |
| - Las respuestas se adaptan a la edad.           |
+--------------------------------------------------+
```

### Criterios UX

- Lenguaje simple.
- Transparencia.
- Sin exceso jurídico en MVP.

---

## 9. Estados del avatar

El avatar es el elemento central de la experiencia infantil.

### 9.1 Estados MVP

| Estado          | Cuándo aparece       | Representación visual  |
| --------------- | -------------------- | ---------------------- |
| `idle`          | Home o espera        | Sonrisa tranquila      |
| `greeting`      | Inicio de sesión     | Saludo animado         |
| `listening`     | Niño habla o escribe | Oreja/icono micrófono  |
| `thinking`      | Esperando IA         | Animación suave        |
| `speaking`      | Avatar responde      | Boca/gesto activo      |
| `encouraging`   | Corrección amable    | Pulgar arriba          |
| `celebrating`   | XP/badge             | Confeti/estrella       |
| `safe_redirect` | Tema no adecuado     | Gesto amable de cambio |

### 9.2 Reglas de avatar

- Nunca debe parecer enfadado.
- No debe castigar errores.
- Debe reforzar intentos.
- Debe celebrar avances pequeños.
- Debe hablar con frases adecuadas a edad.
- Debe ayudar si el niño no sabe qué responder.

---

## 10. Voz y fallback

### 10.1 Objetivo de voz

Permitir que el niño practique oralmente, aunque el backend trabaje internamente con texto.

### 10.2 Flujo de voz básico

```txt
1. Niño pulsa botón de micrófono.
2. Navegador solicita permiso.
3. El sistema transcribe voz a texto.
4. El texto aparece en el input.
5. El niño confirma o se envía automáticamente.
6. Backend genera respuesta.
7. El avatar responde.
8. El navegador lee la respuesta con TTS.
```

### 10.3 Estados de error

| Error                  | Mensaje UX                                    |
| ---------------------- | --------------------------------------------- |
| Micrófono denegado     | "No pasa nada, puedes escribir tu respuesta." |
| STT no disponible      | "Hoy usaremos el teclado para jugar."         |
| TTS no disponible      | "Te muestro la respuesta en pantalla."        |
| IA tarda demasiado     | "Estoy pensando..."                           |
| Provider no disponible | "Vamos a intentarlo de nuevo."                |

### 10.4 Regla de MVP

La conversación por texto es obligatoria. La voz es deseable, pero no debe bloquear la entrega.

---

## 11. Textos base por franja de edad

## 11.1 Edad 5–7

### Tono

Muy simple, cálido y visual.

### Ejemplos

- "Hi! I am Luna."
- "Let's say hello!"
- "Can you say: dog?"
- "Great job!"
- "Try again: I like dogs."
- "You got a star!"

### Reglas

- Frases de 3 a 7 palabras.
- Una pregunta por turno.
- Correcciones mínimas.
- Mucho refuerzo positivo.

---

## 11.2 Edad 8–10

### Tono

Aventurero, guiado y motivador.

### Ejemplos

- "Welcome to Animal Adventure!"
- "What animal do you like?"
- "Nice! You can say: I like dogs."
- "Let's find the next clue."
- "You earned 10 XP!"

### Reglas

- Frases cortas.
- Misiones con objetivo.
- Corrección breve.
- Vocabulario temático.

---

## 11.3 Edad 11–12

### Tono

Más conversacional, menos infantil.

### Ejemplos

- "What topic would you like to explore today?"
- "Good answer. A more natural sentence is..."
- "Can you explain why you like it?"
- "You completed the challenge."
- "Here is one useful expression for next time."

### Reglas

- Permitir respuestas más largas.
- Feedback algo más detallado.
- Temas más variados.
- Menos infantilización visual.

---

## 12. Correcciones amables

### 12.1 Principios

- Corregir solo lo necesario.
- No interrumpir constantemente.
- Felicitar antes de corregir.
- Proponer repetición opcional.
- Evitar explicaciones gramaticales largas en menores de 10 años.

### 12.2 Formato recomendado

```txt
1. Refuerzo positivo.
2. Corrección breve.
3. Nueva oportunidad.
```

### 12.3 Ejemplos

Entrada:

```txt
I likes dogs
```

Respuesta para 5–7:

```txt
Great! Say: I like dogs.
```

Respuesta para 8–10:

```txt
Nice! Small fix: say "I like dogs". Can you try again?
```

Respuesta para 11–12:

```txt
Good answer. Use "like" with "I": "I like dogs". What animal do you like next?
```

---

## 13. Safety UX

### 13.1 Objetivo

Redirigir contenido no adecuado sin generar miedo, castigo o exceso de explicación.

### 13.2 Flujo de redirección

```txt
1. Niño introduce tema no adecuado.
2. Safety layer detecta riesgo.
3. No se envía el contenido directamente al flujo normal.
4. El avatar responde con redirección segura.
5. Se propone un tema alternativo.
6. Se registra SafetyEvent.
```

### 13.3 Mensajes seguros

- "Let's talk about something fun and safe."
- "How about animals, space or games?"
- "I can't help with that, but we can learn a new word!"
- "Let's go back to the mission."

### 13.4 Criterios UX

- No culpabilizar.
- No repetir contenido sensible.
- No pedir explicaciones al niño.
- Redirigir con naturalidad.

---

## 14. Gamificación UX

### 14.1 Eventos de recompensa

| Evento                            | Recompensa                                   |
| --------------------------------- | -------------------------------------------- |
| Primer mensaje válido             | +5 XP, sin bonus extra                       |
| Turno válido, también corregido   | +5 XP                                        |
| Uso de palabra nueva              | Registro de práctica, sin bonus XP en Fase 4 |
| Corrección repetida correctamente | +5 XP como turno válido                      |
| Misión completada                 | Recompensa del catálogo: 25/30/40/50 XP      |
| Primer turno válido               | Badge First Talk                             |
| Tema animales completado          | Badge Animal Explorer                        |
| 3 días de uso                     | Badge histórico; cálculo de racha pendiente  |

### 14.2 Momentos de celebración

- Al finalizar sesión.
- Al completar misión.
- Al desbloquear badge.
- El nivel de competencia no sube por XP; nivel numérico de gamificación fuera de Fase 4.

### 14.3 Criterios UX

- No interrumpir cada turno con animaciones largas.
- Celebraciones cortas.
- Feedback visible pero no invasivo.
- Recompensar esfuerzo más que perfección.

---

## 15. Contenido inicial del MVP

## 15.1 Avatares

### Avatar 1: Luna

- Personalidad: amable, paciente, alegre.
- Edad percibida: personaje fantástico.
- Uso: perfil general para niños de 5–10.
- Estilo: estrella, exploradora o criatura mágica.

### Avatar 2: Max

- Personalidad: aventurero, divertido, energético.
- Uso: misiones y retos.
- Estilo: explorador de TalkyTown.

### Avatar 3 opcional: Nova

- Personalidad: más calmada y madura.
- Uso: niños de 11–12.
- Estilo: guía espacial o científica.

## 15.2 Misiones

### Mission 1 — Meet a New Friend

Objetivo:

- Saludar.
- Expresar un gusto sobre un tema seguro, sin pedir nombre ni edad.
- Decir un gusto simple.

Edad:

- 5–7.

### Mission 2 — Animal Adventure

Objetivo:

- Nombrar animales.
- Decir animal favorito.
- Usar "I like...".

Edad:

- 5–10.

### Mission 3 — Ice Cream Shop

Objetivo:

- Pedir un helado.
- Usar "I want..." o "Can I have...?"

Edad:

- 8–12.

### Mission 4 — Space Explorer

Objetivo:

- Responder preguntas temáticas.
- Practicar colores, objetos y acciones.

Edad:

- 8–12.

---

## 16. Diseño visual recomendado

### 16.1 Estilo

- Infantil.
- Colorido.
- Limpio.
- Redondeado.
- Amable.
- Con sensación de ciudad/aventura.

### 16.2 Componentes

- Tarjetas grandes.
- Botones redondeados.
- Iconos simples.
- Barras de progreso.
- Avatares expresivos.
- Confeti ligero.
- Mapa o ciudad como metáfora visual.

### 16.3 Evitar

- Interfaces oscuras por defecto.
- Tablas densas en zona infantil.
- Mucho texto.
- Jerga técnica.
- Demasiados menús.
- Estética corporativa.

---

## 17. Wireframes a generar

Los wireframes mínimos para Fase 1 son:

1. Landing / Welcome.
2. Login / Demo login.
3. Selector de perfiles infantiles.
4. Crear perfil infantil.
5. Home infantil.
6. Selección de misión.
7. Conversación.
8. Resumen de sesión.
9. Mis premios.
10. Panel adulto.
11. Configuración IA.
12. Seguridad y privacidad.

### 17.1 Prioridad de wireframes

| Prioridad | Pantallas                                                          |
| --------- | ------------------------------------------------------------------ |
| Alta      | Home infantil, conversación, resumen de sesión, selector de perfil |
| Media     | Landing, crear perfil, selección de misión, panel adulto           |
| Baja      | Configuración IA, seguridad, premios                               |

---

## 18. Prompts sugeridos para herramienta de wireframes IA

### 18.1 Prompt general de producto

```txt
Design a playful web app called TalkyTown for children aged 5 to 12 to practice English with AI avatars. The app should feel like a colorful friendly town. It needs large rounded buttons, simple navigation, a warm and safe visual style, and a gamified learning experience with XP, badges and missions. The target users are children and parents. Create a high-fidelity UI concept for desktop and tablet.
```

### 18.2 Prompt para home infantil

```txt
Create a child-friendly home screen for TalkyTown, a language learning web app for kids aged 5 to 12. Show a friendly avatar, the child's level, XP, daily streak, and two main buttons: "Free Talk" and "Go on a Mission". Use a colorful town/adventure theme, large rounded cards, playful icons and accessible spacing.
```

### 18.3 Prompt para conversación

```txt
Create a conversation screen for TalkyTown. A child is practicing English with an AI avatar. The screen should show a large animated avatar area, mission progress, XP gained, a simple chat history, a text input, a microphone button, and an "End session" button. The style must be safe, playful, colorful and suitable for children.
```

### 18.4 Prompt para panel adulto

```txt
Create a parent dashboard for TalkyTown. It should show a child's learning progress: sessions completed, XP, level, badges, missions completed, practiced words and frequent mistakes. The design should be clean, trustworthy, simple and not too childish.
```

### 18.5 Prompt para configuración IA

```txt
Create an AI provider settings screen for TalkyTown. The parent can choose between Mock provider, Cloud OpenAI-compatible provider and Local OpenAI-compatible provider. Include fields for base URL and model, a test connection button, and a clear note that Mock mode allows the demo to work without API keys.
```

---

## 19. Requisitos de accesibilidad iniciales

- Botones grandes.
- Tamaño de fuente legible.
- Contraste suficiente.
- No depender solo del color.
- Estados de carga claros.
- Iconos acompañados de texto.
- Interacción usable sin voz.
- Feedback textual si el audio falla.
- Diseño responsive para tablet.

---

## 20. Estados de carga y errores

### 20.1 Estados de carga

| Estado             | Mensaje                  |
| ------------------ | ------------------------ |
| Iniciando sesión   | "Entering TalkyTown..."  |
| Cargando perfil    | "Preparing your town..." |
| Esperando IA       | "Luna is thinking..."    |
| Guardando progreso | "Saving your stars..."   |
| Probando provider  | "Testing connection..."  |

### 20.2 Estados de error

| Error                  | Mensaje usuario                            |
| ---------------------- | ------------------------------------------ |
| Login falla            | "We could not enter. Try demo mode."       |
| IA falla               | "Luna needs a second. Let's try again."    |
| Provider no disponible | "Let's try again in a moment."             |
| DB/API falla           | "Something went wrong. Please try again."  |
| Voz falla              | "You can write your answer instead."       |
| Safety redirection     | "Let's talk about something safe and fun." |

---

## 21. Métricas UX del MVP

Se considerará que la UX es suficiente si:

- El evaluador puede completar el flujo principal sin ayuda.
- Un usuario puede iniciar una misión en menos de 3 clics desde la home infantil.
- La pantalla de conversación deja claro qué debe hacer el niño.
- El modo demo no requiere claves externas.
- El resumen de sesión muestra recompensa y aprendizaje.
- El panel adulto muestra progreso comprensible.
- La configuración IA no interfiere con el flujo infantil.

---

## 22. Entregables de Fase 1

Al finalizar la Fase 1 deberían existir:

- `docs/ux-flow.md`.
- Wireframes de las pantallas principales.
- Decisión de herramienta de wireframing.
- Primer estilo visual de TalkyTown.
- Flujo demo definido.
- Lista de pantallas MVP cerrada.

---

## 23. Decisión recomendada sobre wireframes

Para esta fase, se recomienda usar una herramienta IA para generar primeras versiones visuales y luego refinar manualmente.

Opciones recomendadas:

1. Google Stitch para generar primeras propuestas visuales a partir de prompts.
2. Figma o Figma Make para refinar prototipos y preparar assets visuales.
3. Penpot si se desea una opción open source y gratuita.
4. Excalidraw si se quiere empezar con wireframes rápidos de baja fidelidad.

Recomendación práctica:

- Usar Google Stitch para explorar estilos.
- Exportar o replicar las mejores pantallas en Figma o Penpot.
- Mantener una versión simple en PNG o PDF para incluirla en README y slides.
- No dedicar demasiado tiempo a perfección visual antes de validar el flujo.

---

## 24. Checklist de validación UX

Antes de pasar a la Fase 2, revisar:

- [ ] ¿El flujo demo está claro?
- [ ] ¿Hay máximo dos acciones principales por pantalla infantil?
- [ ] ¿La home infantil se entiende en 5 segundos?
- [ ] ¿La conversación no parece un chat empresarial?
- [ ] ¿El avatar tiene estados definidos?
- [ ] ¿Hay fallback si falla voz?
- [ ] ¿Hay fallback si falla IA?
- [ ] ¿El panel adulto es simple?
- [ ] ¿La configuración IA está separada de la experiencia infantil?
- [ ] ¿Las pantallas cubren los requisitos del MVP?
- [ ] ¿El diseño evita pedir datos personales al niño?
- [ ] ¿Existe un modo demo claro para evaluación?

---

## 25. Próximo paso

El siguiente paso recomendado es crear los wireframes de las pantallas de prioridad alta:

1. Home infantil.
2. Pantalla de conversación.
3. Resumen de sesión.
4. Selector de perfil infantil.

Una vez validadas esas pantallas, se podrán diseñar el resto y pasar a la Fase 2: setup técnico del proyecto.

## Phase 4 implementation boundary

Backend demonstration uses Swagger; frontend integration is deferred. MissionEvaluationService advances deterministic objectives through 0/33/67/100, not adaptive assessment. ChildProfile.level maps to learningLevel proficiency and never changes from XP. Streak is cached; numeric XP level remains future work. Session avatar uses profile selection only. Cloud/local activation fails explicitly without substitution.

## Phase 5 provider behavior

The adult can configure, test and activate real providers through Swagger; frontend
screens remain unchanged. Test verifies inference plus the strict pedagogical schema,
without showing/storing its generated text. Activation checks configuration/key
presence, not credential validity. Existing sessions retain provider/model; an adult
may explicitly choose Mock for a new session after a real-provider failure.
Real failures leave the operation uncommitted for retry. No automatic Mock switch.
