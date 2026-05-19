# TalkyTown — Product Scope

## 1. Propósito del documento

Este documento define el alcance inicial del MVP de **TalkyTown**, una aplicación web gamificada para que niños de 5 a 12 años puedan practicar idiomas mediante conversaciones con avatares impulsados por IA.

El objetivo de esta fase es fijar una versión realizable, demostrable y evaluable como Trabajo de Fin de Máster, evitando un alcance excesivo y priorizando una primera entrega funcional, bien documentada y técnicamente sólida.

---

## 2. Contexto del TFM

El Trabajo de Fin de Máster requiere desarrollar una aplicación real, adaptada al nivel de conocimientos y experiencia del alumno, original, diferenciadora y que demuestre el aprendizaje adquirido durante el máster.

Para que el proyecto sea evaluable, TalkyTown deberá entregarse con:

- Código versionado, preferiblemente en un repositorio público.
- Documentación completa y detallada en `README.md`.
- Información clara de instalación y ejecución.
- Despliegue o publicación del proyecto, siempre que sea posible.
- Slides de presentación del proyecto.
- Enlaces de entrega al código, despliegue y presentación.

TalkyTown se plantea como un producto realista, acotado y con potencial de evolución, orientado a demostrar conocimientos de desarrollo fullstack, arquitectura, integración de IA, diseño de producto, documentación, testing y despliegue.

---

## 3. Visión del producto

**TalkyTown** es una aplicación web educativa donde los niños aprenden y practican idiomas conversando con personajes virtuales dentro de una ciudad gamificada.

Cada niño puede elegir un avatar, seleccionar un modo de práctica y mantener conversaciones adaptadas a su edad y nivel. La IA actúa como tutor conversacional: propone preguntas, guía misiones, corrige de forma amable y refuerza la motivación mediante recompensas, puntos de experiencia, insignias y progreso visible.

La aplicación está pensada para que el aprendizaje sea:

- Seguro.
- Ameno.
- Conversacional.
- Progresivo.
- Gamificado.
- Adaptado a la edad.
- Técnicamente extensible a distintos proveedores de IA.

---

## 4. Elevator pitch

**TalkyTown es una ciudad interactiva para aprender idiomas hablando con avatares de IA.**

Los niños practican inglés mediante conversaciones libres y misiones guiadas, reciben ayuda amable, ganan XP, desbloquean insignias y pueden ver su progreso. La plataforma permite utilizar proveedores de IA cloud o locales mediante una arquitectura modular, priorizando seguridad infantil, privacidad y una experiencia de uso divertida.

---

## 5. Público objetivo

### 5.1 Usuario principal

Niños de **5 a 12 años** que quieren practicar un idioma de forma amena, principalmente mediante conversación.

### 5.2 Usuario secundario

Padres, madres, tutores o profesores que configuran perfiles infantiles, revisan progreso y controlan la experiencia.

### 5.3 Evaluador del TFM

Persona que debe poder entender, ejecutar y probar el proyecto con facilidad a través de:

- README.
- Demo desplegada.
- Usuario de prueba.
- Capturas o vídeo demo.
- Slides.
- Código bien estructurado.

---

## 6. Franjas de edad

TalkyTown debe adaptarse a tres grupos principales.

### 6.1 Niños de 5 a 7 años

Características:

- Menor autonomía lectora.
- Necesidad de instrucciones cortas.
- Uso preferente de voz, iconos y apoyo visual.
- Correcciones muy simples y positivas.
- Sesiones cortas.

Diseño recomendado:

- Frases muy breves.
- Vocabulario básico.
- Mucha repetición.
- Respuestas tipo juego.
- Avatar muy expresivo.
- Misiones de 2 a 4 minutos.

Ejemplo de experiencia:

> El avatar saluda, pregunta el nombre o color favorito, enseña 2 o 3 palabras y premia la participación.

### 6.2 Niños de 8 a 10 años

Características:

- Mayor capacidad para seguir instrucciones.
- Interés por retos, mundos y misiones.
- Pueden combinar texto y voz.
- Aceptan correcciones sencillas.

Diseño recomendado:

- Misiones temáticas.
- Vocabulario por categorías.
- Conversaciones guiadas.
- Recompensas visibles.
- Sesiones de 5 a 8 minutos.

Ejemplo de experiencia:

> El niño ayuda al avatar a comprar un helado, hablar de animales o resolver una pequeña aventura.

### 6.3 Niños de 11 a 12 años

Características:

- Más autonomía.
- Pueden mantener conversaciones algo más abiertas.
- Pueden recibir feedback un poco más detallado.
- Les motivan retos, progreso y desbloqueables.

Diseño recomendado:

- Conversaciones libres sobre temas elegidos.
- Misiones con más pasos.
- Correcciones con explicación breve.
- Progreso semanal.
- Sesiones de 8 a 12 minutos.

Ejemplo de experiencia:

> El niño conversa sobre hobbies, viajes, deportes o tecnología, y recibe sugerencias para mejorar su expresión.

---

## 7. Problema que resuelve

Aprender un idioma puede resultar aburrido, intimidante o poco constante para muchos niños. Las aplicaciones tradicionales suelen centrarse en ejercicios repetitivos, mientras que hablar con otra persona puede generar vergüenza o requerir disponibilidad de un adulto o profesor.

TalkyTown busca resolver estos problemas mediante una experiencia:

- Conversacional.
- Segura.
- Adaptativa.
- Disponible bajo demanda.
- Gamificada.
- Basada en avatares amigables.
- Diseñada para mantener la motivación.

---

## 8. Objetivos del MVP

### 8.1 Objetivo principal

Construir una aplicación web funcional que permita a un niño practicar inglés mediante conversación con un avatar de IA, dentro de una experiencia gamificada y segura.

### 8.2 Objetivos específicos

- Permitir el acceso mediante usuario demo o cuenta básica.
- Crear o seleccionar un perfil infantil.
- Configurar edad, nivel e idioma objetivo.
- Elegir un avatar.
- Iniciar una conversación libre.
- Iniciar una misión guiada.
- Obtener respuestas adaptadas por edad y nivel.
- Recibir correcciones amables.
- Ganar XP tras las interacciones.
- Desbloquear insignias básicas.
- Consultar progreso.
- Cambiar proveedor de IA entre mock, cloud y local configurable.
- Permitir ejecución local documentada.
- Disponer de una demo desplegada o, como mínimo, una demo reproducible.
- Entregar README y slides completos.

---

## 9. Objetivos de aprendizaje demostrados

TalkyTown debe demostrar aprovechamiento del máster en varias áreas.

### 9.1 Ingeniería de software

- Definición de requisitos.
- Separación clara de responsabilidades.
- Modelado de dominio.
- Casos de uso.
- Documentación técnica.
- Testing básico.

### 9.2 Arquitectura de software

- Arquitectura modular.
- Separación frontend/backend.
- Adaptadores para proveedores IA.
- Capa de seguridad.
- Persistencia relacional.
- Diseño preparado para evolución.

### 9.3 Desarrollo backend

- API con Node.js y TypeScript.
- Validación de datos.
- Persistencia en PostgreSQL.
- Gestión de sesiones de conversación.
- Gestión de gamificación.
- Configuración por entorno.

### 9.4 Desarrollo frontend

- Interfaz web usable.
- Experiencia infantil.
- Avatar animado.
- Pantalla de conversación.
- Panel de progreso.
- Diseño responsive.

### 9.5 IA aplicada

- Integración de LLM conversacional.
- Prompts adaptados por edad.
- Respuestas estructuradas.
- Abstracción multi-proveedor.
- Fallback con proveedor mock.
- Guardrails de seguridad infantil.

### 9.6 DevOps y entrega

- Repositorio Git.
- Docker Compose.
- Variables de entorno.
- Despliegue.
- README.
- Slides.
- Release de entrega.

---

## 10. Alcance funcional del MVP

### 10.1 Funcionalidades incluidas

El MVP incluirá las siguientes funcionalidades.

#### Gestión básica de acceso

- Acceso con usuario demo.
- Opción de crear usuario adulto si el tiempo lo permite.
- Sesión persistente durante el uso.

#### Perfiles infantiles

- Crear perfil infantil.
- Seleccionar alias.
- Seleccionar edad o franja de edad.
- Seleccionar idioma nativo.
- Seleccionar idioma objetivo.
- Seleccionar nivel inicial.
- Seleccionar avatar.

#### Idioma inicial

- Inglés para niños hispanohablantes.

#### Avatares

- Al menos un avatar principal.
- Idealmente dos avatares.
- Estados visuales básicos:
  - Idle.
  - Escuchando.
  - Pensando.
  - Hablando.
  - Celebrando.

#### Modos de práctica

- Conversación libre.
- Misión guiada.

#### Conversación

- Interacción por texto.
- Voz básica si es viable dentro del plazo.
- Respuestas adaptadas a edad y nivel.
- Correcciones amables.
- Feedback positivo.

#### IA

- Proveedor mock para demo y tests.
- Proveedor cloud OpenAI-compatible.
- Proveedor local OpenAI-compatible mediante `baseUrl`, pensado para Ollama o LM Studio.
- Selección de proveedor desde configuración o variables de entorno.

#### Gamificación

- XP por interacción válida.
- Bonus por misión completada.
- Nivel del perfil infantil.
- Racha básica.
- Insignias iniciales.

#### Progreso

- Sesiones completadas.
- XP total.
- Nivel.
- Insignias.
- Misiones completadas.
- Palabras practicadas.
- Errores frecuentes si están disponibles.

#### Seguridad infantil

- No solicitar datos personales.
- Rechazar o redirigir temas no apropiados.
- Prompts adaptados a menores.
- Validación básica de entrada y salida.
- Registro de eventos de seguridad.

#### Documentación y entrega

- README completo.
- Instrucciones de instalación.
- Instrucciones de ejecución.
- Variables de entorno.
- Documentación de arquitectura.
- Slides.
- Capturas o vídeo demo.
- URL de despliegue si existe.

---

## 11. Fuera de alcance del MVP

Las siguientes funcionalidades no forman parte del primer MVP, aunque pueden incluirse en el roadmap futuro.

- App móvil nativa.
- Avatar 3D.
- Sincronización labial avanzada.
- Reconocimiento avanzado de pronunciación.
- Múltiples idiomas completos.
- Modo aula para profesores.
- Panel de administración avanzado.
- Ranking social entre niños.
- Multijugador.
- Pagos o suscripciones.
- Marketplace de avatares.
- Generación avanzada de imágenes.
- LMS completo.
- Analítica educativa avanzada.
- Evaluación oficial tipo examen.
- Integración con colegios.
- Control parental avanzado con permisos granulares.
- Moderación avanzada basada en modelos especializados.

---

## 12. Hipótesis y supuestos

- El primer idioma objetivo será inglés.
- El usuario base será hispanohablante.
- El evaluador podrá probar el proyecto con un usuario demo.
- La demo deberá funcionar sin depender obligatoriamente de claves privadas.
- El proveedor mock permitirá simular la experiencia sin coste.
- Los proveedores locales como Ollama o LM Studio se documentarán, pero no serán obligatorios para probar el flujo principal.
- El proyecto se desarrollará con Node.js y TypeScript como stack principal.
- El despliegue priorizará estabilidad y facilidad de evaluación frente a complejidad técnica.
- La voz será progresiva: primero texto funcional, después voz básica si el plazo lo permite.
- La seguridad infantil será parte explícita del diseño, no un añadido final.

---

## 13. Restricciones

### 13.1 Restricciones técnicas

- El proyecto debe poder ejecutarse localmente.
- Las claves de API no deben subirse al repositorio.
- Debe existir `.env.example`.
- La base de datos debe poder inicializarse con migraciones y seed.
- Debe haber un modo demo sin coste.
- La arquitectura debe permitir cambiar proveedor IA sin reescribir la lógica de negocio.

### 13.2 Restricciones de producto

- La experiencia debe ser comprensible para niños.
- Las sesiones deben ser cortas.
- El tono debe ser siempre amable y positivo.
- El sistema no debe pedir datos personales al niño.
- La interfaz debe evitar sobrecarga cognitiva.
- La gamificación no debe tapar el aprendizaje.

### 13.3 Restricciones de entrega TFM

- Debe existir repositorio de código.
- Debe existir README completo.
- Debe documentarse el stack.
- Debe documentarse instalación y ejecución.
- Debe documentarse la estructura del proyecto.
- Deben describirse las funcionalidades principales.
- Deben entregarse slides.
- Debe proporcionarse URL de despliegue si existe.
- El directorio del código debe incluir o enlazar documentación, despliegue y slides.

---

## 14. Personas

### 14.1 Niño de 6 años

Nombre ficticio: Leo.

Necesidades:

- Quiere jugar.
- Se cansa rápido leyendo.
- Necesita instrucciones simples.
- Responde mejor a voz, colores y recompensas.

Objetivo en TalkyTown:

- Repetir palabras.
- Responder frases muy cortas.
- Ganar una insignia rápida.

### 14.2 Niña de 9 años

Nombre ficticio: Sofía.

Necesidades:

- Quiere misiones y retos.
- Puede leer frases cortas.
- Le gusta desbloquear cosas.
- Tolera correcciones breves.

Objetivo en TalkyTown:

- Completar una misión.
- Practicar vocabulario de animales, comida o colegio.
- Ver progreso y XP.

### 14.3 Niño de 12 años

Nombre ficticio: Marcos.

Necesidades:

- Quiere más autonomía.
- Puede mantener conversaciones temáticas.
- Aprecia feedback útil.
- Puede aburrirse si la app parece demasiado infantil.

Objetivo en TalkyTown:

- Practicar conversación libre.
- Recibir correcciones de gramática.
- Desbloquear niveles.
- Ver progreso semanal.

### 14.4 Adulto tutor

Nombre ficticio: Ana.

Necesidades:

- Saber si el niño practica.
- Ver progreso sin entrar en detalles invasivos.
- Configurar idioma y nivel.
- Confiar en que la app es segura.

Objetivo en TalkyTown:

- Crear perfil.
- Revisar sesiones.
- Ver XP, racha, misiones y palabras practicadas.

---

## 15. Experiencia principal del usuario

### 15.1 Flujo MVP

1. El adulto entra en la app.
2. Accede con usuario demo o cuenta básica.
3. Crea o selecciona un perfil infantil.
4. El niño elige avatar.
5. El niño entra en la home de TalkyTown.
6. Elige conversación libre o misión.
7. El avatar saluda y explica el objetivo.
8. El niño responde por texto o voz.
9. La IA responde de forma adaptada.
10. El sistema corrige de forma amable si procede.
11. El niño gana XP.
12. Al finalizar, se muestra resumen de sesión.
13. El adulto puede consultar progreso.

### 15.2 Flujo de evaluación del TFM

1. El evaluador abre el README.
2. Accede a la demo o ejecuta localmente.
3. Usa credenciales demo.
4. Selecciona perfil infantil demo.
5. Inicia una misión.
6. Envía 2 o 3 mensajes.
7. Observa respuesta IA/mock, avatar y XP.
8. Revisa panel de progreso.
9. Comprueba configuración de proveedor IA.
10. Consulta documentación técnica y slides.

---

## 16. Modos de práctica del MVP

### 16.1 Conversación libre

El niño puede conversar con el avatar sobre temas permitidos y adecuados a su edad.

Temas iniciales:

- Animales.
- Colores.
- Comida.
- Colegio.
- Familia en sentido genérico, sin pedir datos personales.
- Deportes.
- Hobbies.
- Viajes imaginarios.
- Cuentos.
- Superhéroes.

Características:

- El avatar guía si el niño no sabe qué decir.
- Se corrige solo lo necesario.
- Se refuerza la confianza.
- Se adapta la dificultad.

### 16.2 Misión guiada

El niño debe completar un pequeño objetivo conversacional.

Misiones iniciales:

1. **Meet a New Friend**
   - Objetivo: saludar y presentarse con frases simples.
   - Edad recomendada: 5–7.

2. **Animal Adventure**
   - Objetivo: hablar de animales favoritos.
   - Edad recomendada: 5–10.

3. **Ice Cream Shop**
   - Objetivo: pedir un helado en inglés.
   - Edad recomendada: 8–12.

4. **Space Explorer**
   - Objetivo: responder preguntas sobre una aventura espacial.
   - Edad recomendada: 8–12.

---

## 17. Requisitos funcionales iniciales

### RF-001 Acceso demo

La aplicación debe permitir entrar con un usuario demo para facilitar la evaluación.

### RF-002 Gestión de perfiles infantiles

La aplicación debe permitir crear y seleccionar perfiles infantiles asociados a un usuario adulto.

### RF-003 Configuración de edad

Cada perfil infantil debe tener una edad o franja de edad para adaptar la experiencia.

### RF-004 Selección de idioma

Cada perfil debe indicar idioma nativo e idioma objetivo.

### RF-005 Selección de avatar

El niño debe poder elegir un avatar disponible.

### RF-006 Home infantil

El niño debe acceder a una pantalla principal con opciones claras de práctica.

### RF-007 Conversación libre

El niño debe poder iniciar una conversación libre con el avatar.

### RF-008 Misión guiada

El niño debe poder iniciar una misión con objetivo conversacional.

### RF-009 Envío de mensajes

El niño debe poder enviar mensajes por texto.

### RF-010 Voz básica

La aplicación debería permitir entrada o salida por voz si el plazo lo permite.

### RF-011 Respuesta adaptada

La IA debe responder de forma adaptada a edad, idioma y nivel.

### RF-012 Corrección amable

La IA debe corregir errores de forma breve, positiva y comprensible.

### RF-013 Gamificación

El sistema debe asignar XP e insignias básicas.

### RF-014 Progreso

El adulto debe poder consultar el progreso del perfil infantil.

### RF-015 Proveedores IA

El sistema debe soportar proveedor mock, cloud y local OpenAI-compatible.

### RF-016 Seguridad infantil

El sistema debe evitar o redirigir contenido no adecuado.

### RF-017 Configuración del proveedor

El usuario adulto o el entorno debe poder seleccionar el proveedor activo.

### RF-018 Demo reproducible

El proyecto debe poder ejecutarse sin depender de claves privadas mediante modo mock.

---

## 18. Requisitos no funcionales iniciales

### RNF-001 Usabilidad infantil

La interfaz debe ser clara, visual y adecuada para niños de 5 a 12 años.

### RNF-002 Accesibilidad básica

La app debe usar textos legibles, contrastes adecuados y botones grandes.

### RNF-003 Privacidad

La app no debe almacenar audio bruto por defecto ni pedir datos personales al niño.

### RNF-004 Seguridad

Las claves de API deben gestionarse mediante variables de entorno.

### RNF-005 Rendimiento

Las respuestas deben llegar en un tiempo razonable. Si el proveedor tarda, la interfaz debe mostrar estado de carga.

### RNF-006 Reproducibilidad

El proyecto debe poder ejecutarse localmente con instrucciones claras.

### RNF-007 Extensibilidad

Debe poder añadirse un nuevo proveedor IA sin modificar la lógica principal de conversación.

### RNF-008 Testabilidad

Debe existir proveedor mock y tests para lógica crítica.

### RNF-009 Observabilidad básica

El backend debe registrar errores relevantes y eventos básicos de seguridad.

### RNF-010 Documentación

La documentación debe permitir comprender, ejecutar y evaluar el proyecto sin asistencia externa.

---

## 19. Criterios de éxito del MVP

El MVP se considerará satisfactorio si cumple lo siguiente:

- El proyecto se puede ejecutar localmente.
- Existe una demo o modo demo funcional.
- El usuario puede entrar como demo.
- Existe al menos un perfil infantil.
- El niño puede iniciar una misión.
- El niño puede enviar mensajes.
- El avatar responde mediante IA o provider mock.
- La respuesta se adapta a edad y nivel.
- La app asigna XP.
- La app muestra progreso.
- Existe al menos una insignia desbloqueable.
- Existe configuración documentada de proveedores IA.
- Existe safety básico.
- El README explica claramente el proyecto.
- El repositorio incluye instrucciones de instalación.
- El proyecto tiene slides.
- El proyecto está versionado.
- Existe release o tag de entrega.

---

## 20. Indicadores de calidad para la evaluación

Para reforzar la entrega del TFM, se buscará que el proyecto evidencie:

- Buen criterio de alcance.
- Funcionalidad completa aunque acotada.
- Código organizado.
- Arquitectura explicada.
- IA integrada con propósito.
- Seguridad infantil tratada explícitamente.
- Experiencia visual cuidada.
- Demo fácil de probar.
- Documentación clara.
- Roadmap futuro honesto.
- Limitaciones conocidas explicadas.

---

## 21. Riesgos iniciales

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| Alcance excesivo | Alto | Limitar MVP a 1 idioma, 2 modos, 1–2 avatares. |
| Voz demasiado compleja | Alto | Texto primero; voz básica como mejora progresiva. |
| Dependencia de APIs externas | Alto | Provider mock y proveedor local configurable. |
| Evaluador sin claves IA | Alto | Demo con mock provider. |
| Proveedor local difícil de configurar | Medio | Documentar Ollama/LM Studio como opción, no requisito de demo. |
| UI demasiado adulta | Medio | Diseñar interfaz infantil desde el principio. |
| Parecer un simple chatbot | Alto | Añadir misiones, XP, badges, avatar y progreso. |
| Seguridad infantil débil | Alto | Crear módulo safety, prompts y tests específicos. |
| Falta de documentación | Alto | Mantener README y docs desde fases tempranas. |
| Despliegue inestable | Medio | Usar modo demo sencillo y servicios conocidos. |

---

## 22. Roadmap posterior al MVP

Una vez entregado el MVP, TalkyTown podría evolucionar con:

- Más idiomas.
- Más avatares.
- Más barrios o zonas de la ciudad.
- Cuentos interactivos.
- Modo profesor.
- Informes semanales para familias.
- Reconocimiento de pronunciación.
- Mejor TTS/STT.
- Integración con modelos multimodales.
- Sistema de niveles más avanzado.
- Biblioteca de misiones.
- Personalización de avatar.
- App móvil.

---

## 23. Decisiones iniciales

| Decisión | Valor |
|---|---|
| Nombre | TalkyTown |
| Tipo de producto | Aplicación web educativa |
| Público | Niños de 5 a 12 años |
| Usuario secundario | Adulto/tutor |
| Idioma inicial | Inglés para hispanohablantes |
| Stack preferido | Node.js + TypeScript |
| Frontend recomendado | Next.js |
| Backend recomendado | NestJS o Fastify |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| IA | Proveedores OpenAI-compatible |
| Proveedor demo | Mock provider |
| Proveedores locales | Ollama / LM Studio mediante `baseUrl` |
| Interacción inicial | Texto |
| Interacción deseada | Voz básica |
| Gamificación MVP | XP, nivel, badges, racha |
| Entrega | GitHub + README + demo + slides |

---

## 24. Definición final del alcance MVP

La primera versión de TalkyTown será una aplicación web en la que un adulto pueda acceder con un usuario demo, seleccionar un perfil infantil y permitir que el niño practique inglés con un avatar mediante conversación libre o una misión guiada.

El sistema responderá usando una capa de IA abstraída por proveedores, con soporte para un proveedor mock, un proveedor cloud OpenAI-compatible y un proveedor local configurable. La experiencia incluirá correcciones amables, XP, insignias básicas, progreso y medidas de seguridad infantil.

El MVP priorizará que el producto sea usable, demostrable y bien documentado, antes que incorporar funcionalidades avanzadas como avatar 3D, múltiples idiomas, analítica compleja o reconocimiento avanzado de pronunciación.

---

## 25. Próximo paso

El siguiente documento recomendado es:

`docs/ux-flow.md`

Ese documento debe definir:

- Flujo de usuario adulto.
- Flujo de usuario infantil.
- Pantallas principales.
- Estados del avatar.
- Textos base por franja de edad.
- Flujo de demo para evaluación.
- Estados de error y fallback.
