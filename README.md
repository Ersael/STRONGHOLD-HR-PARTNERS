# Plataforma de Evaluación Psicométrica (Fase 1 - Arquitectura Completa)

Plataforma enterprise para procesos de selección de personal: un ADMIN crea
candidatos, les asigna baterías de evaluación psicométrica, el CANDIDATO
responde desde un link único sin necesidad de crear cuenta, y el ADMIN
revisa resultados, compara candidatos y genera reportes en PDF.

**Aviso ético (por diseño del producto):** los ítems y baremos de esta
plataforma son ilustrativos; no existe un estudio de confiabilidad/validez
ni normas poblacionales reales detrás. Esto se muestra de forma visible en
el dashboard admin y al pie de cada reporte PDF, y no debe eliminarse.

La **Fase 1** construyó toda la infraestructura (base de datos, auth, RLS,
scoring, generación de reportes, exportación a PDF, UI de admin y del
candidato), funcionando de punta a punta con 2-3 preguntas de ejemplo por
batería. La **Fase 2** (`supabase/seed_full_content.sql`) agregó el
contenido completo: **435 preguntas** en total repartidas en las 7
baterías, sin requerir ningún cambio de esquema ni de código de la Fase 1
— ver la sección [Contenido de las baterías](#contenido-de-las-baterías).

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Postgres + Auth + RLS + funciones RPC)
- Recharts (gráficos en el dashboard admin)
- @react-pdf/renderer (generación de PDF, sin dependencias nativas)
- Zod (validación de inputs en las rutas API)

## 1. Crear un proyecto Supabase gratis

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Click en "New Project". Elige una organización, nombre (ej.
   `psicometricos-enterprise`), una contraseña de base de datos (guárdala) y
   una región cercana.
3. Espera unos minutos a que se aprovisione el proyecto.
4. Ve a **Project Settings → API**. Ahí encontrarás:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (sección "Project API keys", ⚠️ secreta) →
     `SUPABASE_SERVICE_ROLE_KEY`

## 2. Ejecutar el esquema SQL

1. En el panel de Supabase, ve a **SQL Editor → New query**.
2. Copia y pega **todo** el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
3. Ejecuta (Run). El script:
   - Crea todas las tablas, índices y políticas de Row Level Security.
   - Crea las funciones RPC (`get_assessment_by_token`, `save_response`,
     `update_candidate_personal_info`, `complete_candidate_assessment`)
     usadas por el portal del candidato (nunca se exponen las tablas
     directamente al `anon key`).
   - Siembra las 7 baterías fijas (`assessment_definitions`) y 2-3
     preguntas de ejemplo por batería (más 3 preguntas para los roles
     "Ventas" y "Director" de la batería de Competencias Específicas del
     Rol).
4. El script es re-ejecutable (usa `on conflict do nothing` / `if not
   exists`), así que puedes correrlo de nuevo si necesitas resetear datos
   de catálogo sin duplicar filas.
5. **Fase 2 — contenido completo:** en una nueva query, copia y pega
   **todo** el contenido de
   [`supabase/seed_full_content.sql`](./supabase/seed_full_content.sql) y
   ejecútalo *después* de `schema.sql`. Este script reemplaza las
   preguntas de ejemplo de 6 de las 7 baterías por el contenido completo
   (ver la sección [Contenido de las baterías](#contenido-de-las-baterías)
   más abajo) y agrega las preguntas faltantes de "Competencias
   Específicas del Rol" para los 7 roles. No es destructivo para
   `assessment_definitions` (mismos `id`/`code`), solo actualiza
   `config_json.dimensions` de cada batería para reflejar las nuevas
   dimensiones y reemplaza/agrega filas en `questions`. También es
   re-ejecutable de forma segura (usa `delete` + `insert ... on conflict
   do nothing` por batería, y `update` idempotente de `config_json`).

## 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Rellena `.env.local` con los 3 valores del paso 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG....
SUPABASE_SERVICE_ROLE_KEY=eyJhbG....
```

`SUPABASE_SERVICE_ROLE_KEY` nunca debe usarse en código de cliente ni
comprometerse en un repositorio público; solo se usa en
`lib/supabase/admin.ts` (cálculo de scores del lado servidor) y en
`scripts/seed-admin.ts`.

## 4. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 5. Crear el primer usuario ADMIN

Supabase Auth no permite crear usuarios (con password ya hasheado)
directamente por SQL. Hay dos formas de crear tu admin de prueba:

### Opción A (recomendada): script con la Admin API

```bash
npm run seed:admin -- "Tu Nombre" admin@tuempresa.com "unaClaveSegura123" "Tu Empresa"
```

Esto crea el usuario en Supabase Auth (con `email_confirm: true`, para
que no necesite verificar correo) y su fila correspondiente en la tabla
`admins`, usando la service role key definida en `.env.local`.

### Opción B: manual desde el dashboard de Supabase

1. Ve a **Authentication → Users → Add user** y crea el usuario con email
   y password (marca "Auto Confirm User").
2. Copia el UUID del usuario creado.
3. En **SQL Editor**, ejecuta:
   ```sql
   insert into public.admins (id, name, email, organization_name)
   values ('<uuid-del-usuario>', 'Tu Nombre', 'admin@tuempresa.com', 'Tu Empresa');
   ```

Después de cualquiera de las dos opciones, inicia sesión en
`/admin/login` con ese correo y contraseña.

## Desplegar en Hostinger

Esta sección es para quien quiera poner la plataforma en producción usando
un plan de hosting con Node.js de [Hostinger](https://www.hostinger.com/),
en lugar de (o además de) correrla localmente.

**Planes compatibles:** Next.js está soportado como framework de backend en
los planes **Business Web Hosting**, **Cloud Startup**, **Cloud
Professional**, **Cloud Enterprise** y **Cloud Enterprise Plus**. El
hosting compartido básico de Hostinger **no** soporta aplicaciones Node.js.
También es posible desplegar en un **VPS** de Hostinger, pero eso requiere
configuración manual completa por SSH (instalar Node, PM2/systemd, proxy
inverso, etc.) y no es lo que describen los pasos de abajo, pensados para
el dashboard de Node.js de hPanel.

Hostinger ofrece 4 formas de desplegar una app Node.js: integración con
GitHub (**recomendada**, con auto-deploy en cada `push`), subir un `.zip`
del proyecto, una plantilla desde su galería, o el **Hostinger Connector**
para IDEs. Los pasos siguientes usan la opción de GitHub.

### Pasos

1. **Crear el proyecto Supabase y cargar el esquema.** Sigue los pasos
   [1](#1-crear-un-proyecto-supabase-gratis) y
   [2](#2-ejecutar-el-esquema-sql) de arriba: crea el proyecto en
   [supabase.com](https://supabase.com), y en **SQL Editor** corre primero
   todo `supabase/schema.sql` y después todo `supabase/seed_full_content.sql`.
   Guarda las 3 credenciales (`Project URL`, `anon public key`,
   `service_role key`); las necesitarás en el paso 4.
2. **Sube el código a un repositorio de GitHub** (privado o público). Este
   proyecto no depende de ningún archivo generado en build time que no
   deba versionarse (aparte de lo ya cubierto por `.gitignore`), así que un
   `git init` + `git add` + `git commit` + `git push` normal es suficiente.
3. **En hPanel: `Add Website` → `Deploy Web App` → `Import Git Repository`.**
   Conecta tu cuenta de GitHub, elige el repositorio y la rama a
   desplegar. Hostinger detecta automáticamente que es un proyecto Next.js.
4. **Vincula Supabase con el "Database Connect Wizard".** En el dashboard
   de Node.js del sitio recién creado, hPanel ofrece un asistente con
   soporte nativo de un clic para **Supabase** (y también para MongoDB
   Atlas): autoriza tu cuenta de Supabase, elige el proyecto que creaste en
   el paso 1 (o crea uno nuevo desde ahí mismo), y Hostinger inyecta
   automáticamente las variables de entorno necesarias en el siguiente
   deploy. Con esto **no hace falta copiar manualmente**
   `NEXT_PUBLIC_SUPABASE_URL` ni `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

   Si prefieres no vincular tu cuenta de Supabase a Hostinger, puedes
   configurar las variables a mano: en la sección **"Environment
   Variables"** del sitio Node.js en hPanel, agrega las 3 variables del
   paso 1 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`), igual que harías en `.env.local` para
   desarrollo local.
5. **Despliega.** Lanza el deploy desde hPanel. Cada deploy vuelve a
   instalar dependencias y a construir la app desde cero; los archivos de
   build **se sobrescriben en cada deploy**, lo cual no es un problema en
   esta plataforma porque toda la persistencia (candidatos, respuestas,
   scores, reportes) vive en Supabase, no en disco local — a diferencia de
   una app que use, por ejemplo, SQLite en el propio servidor.
6. **Crea el primer usuario ADMIN.** Los planes Business/Cloud de
   Hostinger no dan acceso SSH al contenedor de la app, así que no puedes
   correr `npm run seed:admin` directamente en el servidor. Dos opciones:
   - **Opción A (recomendada):** corre el script **localmente**, apuntando
     a las credenciales de **producción**. Crea un `.env.local` temporal
     (o exporta las variables en tu shell) con la `NEXT_PUBLIC_SUPABASE_URL`
     y la `SUPABASE_SERVICE_ROLE_KEY` de tu proyecto Supabase de
     producción, y ejecuta:
     ```bash
     npm run seed:admin -- "Tu Nombre" admin@tuempresa.com "unaClaveSegura123" "Tu Empresa"
     ```
     Como toda la persistencia vive en Supabase (no en el servidor de
     Hostinger), esto crea el admin directamente en la base de datos de
     producción sin necesidad de ejecutar nada dentro de Hostinger.
   - **Opción B:** sigue la [Opción B manual](#opción-b-manual-desde-el-dashboard-de-supabase)
     ya descrita arriba (crear el usuario desde **Authentication → Users**
     en el dashboard de Supabase e insertar la fila en `admins` por SQL).
7. **Conecta tu dominio propio.** En hPanel, dentro del dashboard del
   sitio Node.js, ve a la sección de dominio (junto a "Environment
   Variables") y sigue el flujo de "conectar dominio personalizado" para
   apuntar tu dominio a la app. Si necesitas el detalle paso a paso, busca
   "connect a custom domain to a Node.js application" en el Centro de
   Ayuda de Hostinger — el proceso general es apuntar los registros DNS de
   tu dominio (o cambiar los nameservers) hacia Hostinger y luego asociarlo
   al sitio Node.js desde ese mismo dashboard.

## Flujo de uso

1. **Admin**: inicia sesión → `/admin` (dashboard con métricas y el aviso
   ético) → `/admin/candidates` → "+ Nuevo candidato".
2. Desde el detalle del candidato (`/admin/candidates/[id]`): "Asignar
   evaluación", elige 1 o más de las 7 baterías (si eliges "Competencias
   Específicas del Rol" también eliges el rol), y se genera un link único
   `/assessment/[token]` para compartir con el candidato.
3. **Candidato**: abre el link, confirma sus datos, responde las
   preguntas una por una (cada respuesta se guarda de inmediato — si
   cierra el navegador y vuelve a abrir el mismo link continúa donde se
   quedó), y ve una pantalla de agradecimiento al terminar. Nunca ve
   puntajes ni interpretaciones.
4. **Admin**: cuando el candidato completa una batería, los scores se
   calculan automáticamente. Desde el detalle del candidato: gráfico de
   scores por dimensión, tabla de resultados, botón "Generar reporte"
   (arma las 12 secciones) y "Descargar PDF".
5. `/admin/compare`: selecciona 2-4 candidatos para comparar sus scores
   lado a lado (tabla + gráfico de barras agrupado).

## Arquitectura de seguridad

- El ADMIN usa **Supabase Auth** (email + password). `middleware.ts`
  protege todas las rutas `/admin/*` exigiendo sesión válida.
- El CANDIDATO **no** usa Supabase Auth. Accede vía `unique_token` en la
  URL. Ese token se valida en cada request contra la tabla
  `candidate_assessments`, exclusivamente a través de funciones RPC
  `SECURITY DEFINER` (`get_assessment_by_token`, `save_response`,
  `update_candidate_personal_info`, `complete_candidate_assessment`).
  El `anon key` **nunca** tiene políticas RLS directas sobre
  `candidate_assessments` o `responses`; toda la superficie de ataque se
  reduce a esas 4 funciones, cada una validando el token explícitamente.
- Row Level Security en todas las tablas: un admin solo ve/edita
  candidatos, evaluaciones, respuestas, scores y reportes donde
  `admin_id` (vía `candidates`) sea su propio `auth.uid()`.
- El cálculo de `scores` (después de completar una batería) se hace en el
  servidor con la `service role key` (bypass de RLS deliberado, ya que es
  una operación interna del sistema, no algo que el token del candidato
  autorice directamente) — ver `app/api/assessment/[token]/complete/route.ts`.

## Decisiones de diseño relevantes

- **Un link, varias baterías**: cuando el admin asigna varias baterías a
  la vez, se crean varias filas en `candidate_assessments` que
  **comparten el mismo `unique_token`**, de modo que el candidato recibe
  un solo link que cubre todas. Por eso `unique_token` está indexado pero
  no es `UNIQUE` a nivel de columna (ver comentario en
  `supabase/schema.sql`).
- **Guardar y reanudar**: cada respuesta se persiste individualmente en
  `responses` en cuanto el candidato la contesta (no al final). El portal
  del candidato calcula "la siguiente pregunta sin responder" en cada
  carga, permitiendo cerrar el navegador y continuar después con el mismo
  link.
- **Scoring extensible por tipo de pregunta** (`lib/scoring/`):
  `likert5` (promedio 1-5, invierte si `is_reverse_scored`, normaliza a
  0-100), `multiple_choice` (% de aciertos por dimensión) y
  `forced_choice_quad` estilo Cleaver/DISC (acumula +1/-1 por bloque y
  normaliza). El percentil (`lib/scoring/percentile.ts`) usa una
  distribución normal con media=50/desviación=15 como **norma
  placeholder ilustrativa**, documentada como tal en el código.
- **Reporte de 12 secciones basado en reglas** (`lib/report/`): sin
  llamadas a IA externa. Cada sección tiene al menos una plantilla de
  texto por nivel alto/medio/bajo del score relevante.
- **Motor de competencias por rol**: `questions.role_variant` +
  `assessment_definitions.config_json.roles` permiten agregar cualquier
  cantidad de preguntas por rol sin cambios de esquema. Fase 1 sembró 3
  preguntas para "Ventas" y 3 para "Director"; Fase 2
  (`supabase/seed_full_content.sql`) agregó 13 preguntas más por cada uno
  de los 7 roles (91 en total) directamente con `INSERT` sobre
  `questions`, sin tocar la Fase 1.
- **Tipos de base de datos manuales** (`types/database.ts`): al no tener
  credenciales reales de Supabase en este entorno de desarrollo, no se
  pudo correr `supabase gen types`. Los tipos se mantienen a mano en
  sincronía con `supabase/schema.sql`; se recomienda regenerarlos con la
  CLI oficial en cuanto haya un proyecto real.

## Estructura del proyecto

```
app/
  admin/                     Dashboard, candidatos, comparar (protegidos por middleware)
  assessment/[token]/        Portal del candidato (sin auth, por token)
  api/                       Route handlers (candidatos, asignación, RPC del candidato, reportes, PDF)
components/
  admin/                     Formularios, gráficos y banners del panel admin
  assessment/                Renderizado de preguntas y flujo del portal candidato
  pdf/                       Documento PDF (@react-pdf/renderer)
lib/
  supabase/                  Clientes (browser, server/sesión, admin/service-role)
  scoring/                   Motor de scoring por tipo de pregunta + percentil + fortalezas/riesgos
  report/                    Generación de las 12 secciones del reporte
  constants.ts               Aviso ético, metadatos de baterías, roles, umbrales de score
  utils/token.ts             Generación de tokens únicos
scripts/seed-admin.ts        Script para crear el primer admin (Auth + tabla admins)
scripts/smoke-test-scoring.ts    Smoke test del pipeline seed -> scoring -> reporte (ver abajo)
scripts/seed-content-generator/  Generador Python del contenido Fase 2 (ver abajo)
supabase/schema.sql               Esquema completo, RLS, funciones RPC y datos de ejemplo (Fase 1)
supabase/seed_full_content.sql    Contenido completo de las 7 baterías (Fase 2, 435 preguntas)
types/database.ts            Tipos manuales de la base de datos
middleware.ts                Protección de /admin/*
```

## Contenido de las baterías

La **Fase 2** (`supabase/seed_full_content.sql`, generado por los scripts en
`scripts/seed-content-generator/`) agregó el contenido completo de las 7
baterías. Conteo final de ítems por batería y por dimensión:

### 1. Comportamiento (`behavioral`) — 28 bloques `forced_choice_quad`

Estilo DISC/Cleaver. Cada bloque tiene 4 frases (una por dimensión D/I/S/C)
sobre un escenario distinto (toma de decisiones, trabajo en equipo, manejo
de conflicto, ritmo de trabajo, reglas, presión, comunicación, cambio,
delegación, negociación, crisis, etc.). Dimensiones: **Dominancia (D)**,
**Influencia (I)**, **Estabilidad (S)**, **Cumplimiento (C)** — 28
apariciones cada una.

### 2. Razonamiento Cognitivo (`cognitive`) — 40 preguntas `multiple_choice`

| Dimensión | Ítems |
|---|---|
| Razonamiento Abstracto | 6 |
| Razonamiento Analítico | 6 |
| Reconocimiento de Patrones | 6 |
| Concentración | 6 |
| Juicio | 6 |
| Organización | 5 |
| Planeación | 5 |
| **Total** | **40** |

Los problemas de secuencias/patrones son 100% verbales o numéricos (sin
imágenes). Los ítems de concentración calculan su propia respuesta correcta
de forma programática (conteo real de letras/palabras/números en el texto
del enunciado) para garantizar que sean objetivamente verificables.

### 3. Inventario de Personalidad (`personality`) — 120 preguntas `likert5`

13 dimensiones, 9-10 ítems cada una, con **39/120 (32.5%) ítems de scoring
inverso** (`is_reverse_scored = true`) distribuidos de forma pareja
(2-3 por dimensión) para detectar respuestas descuidadas y aquiescencia:

| Dimensión | Ítems | Reversos |
|---|---|---|
| Liderazgo | 10 | 3 |
| Iniciativa | 9 | 3 |
| Persistencia | 9 | 3 |
| Orientación al Logro | 9 | 3 |
| Necesidad de Supervisión | 9 | 3 |
| Sociabilidad | 9 | 3 |
| Estabilidad Emocional | 9 | 3 |
| Comunicación | 9 | 3 |
| Adaptabilidad | 9 | 3 |
| Apego a Normas | 9 | 3 |
| Responsabilidad | 10 | 3 |
| Independencia | 9 | 3 |
| Orientación al Trabajo en Equipo | 10 | 3 |
| **Total** | **120** | **39** |

### 4. Competencias Generales (`competencies`) — 60 preguntas `likert5`

14 competencias, 4-5 ítems cada una (Liderazgo 5, Delegación 4, Inteligencia
Emocional 4, Comunicación 5, Trabajo en Equipo 4, Toma de Decisiones 5,
Planeación 4, Organización 4, Orientación al Servicio 4, Seguimiento y
Control 4, Tolerancia a la Presión 4, Orientación a Resultados 5,
Resolución de Problemas 4, Desarrollo de Colaboradores 4). Redactadas como
autoevaluaciones conductuales en contexto laboral.

### 5. Inventario de Valores (`values`) — 40 preguntas `likert5`

8 dimensiones x 5 ítems cada una (Honestidad, Ética, Responsabilidad,
Respeto, Justicia, Lealtad, Consistencia, Confiabilidad). Incluye **8
ítems de deseabilidad social inversa** (uno por dimensión, ej. "Alguna vez
he exagerado un logro para verme mejor ante mi jefe"), marcados
`is_reverse_scored = true`.

### 6. Potencial de Liderazgo (`leadership`) — 50 preguntas `likert5`

11 dimensiones, 4-5 ítems cada una (Comunicación 5, Delegación 4,
Negociación 4, Pensamiento Estratégico 5, Desarrollo de Equipos 5,
Coaching 4, Manejo de Conflictos 5, Toma de Decisiones 5, Gestión del
Cambio 5, Innovación 4, Responsabilidad/Accountability 4).

### 7. Competencias Específicas del Rol (`role_specific`) — 97 preguntas `likert5`

6 preguntas de ejemplo de la Fase 1 (3 "Ventas" + 3 "Director") se
conservaron, y se agregaron **13 preguntas nuevas por cada uno de los 7
roles** (91 en total), incluyendo dimensiones nuevas más específicas:

| Rol | Ítems totales | Dimensiones nuevas agregadas |
|---|---|---|
| Ventas (`sales`) | 16 | Manejo de Objeciones, Resiliencia ante el Rechazo, Orientación Comercial |
| Gerente Comercial (`commercial_manager`) | 13 | Gestión de Cartera, Forecasting, Negociación con Clientes Clave |
| Director (`director`) | 16 | Gobierno Corporativo, Decisiones de Alto Impacto |
| Consultor (`consultant`) | 13 | Entregables Basados en Evidencia |
| Analista (`analyst`) | 13 | Atención al Detalle, Rigor Metodológico |
| Operaciones (`operations`) | 13 | Gestión de Proveedores y Logística, Mejora Continua |
| RRHH (`hr`) | 13 | Sensibilidad Interpersonal, Confidencialidad |
| **Total** | **97** | |

### Gran total

**28 + 40 + 120 + 60 + 40 + 50 + 97 = 435 preguntas** en la tabla
`questions` tras ejecutar `schema.sql` + `seed_full_content.sql`.

### Verificación de consistencia seed -> scoring -> reporte

Como la Fase 2 reemplazó la taxonomía de dimensiones de 6 de las 7
baterías (ver arriba), existía el riesgo de que `lib/scoring/*` o
`lib/report/sections.ts` (escritos en la Fase 1 contra las dimensiones de
ejemplo) quedaran con nombres de dimensión desincronizados respecto al
contenido real. Se revisó el código y se confirmó que:

- El motor de scoring (`lib/scoring/likert5.ts`, `multipleChoice.ts`,
  `forcedChoiceQuad.ts`) es **agnóstico al nombre de la dimensión**: agrupa
  y calcula usando el `dimension` que traiga cada pregunta, sin ninguna
  lista hardcodeada de nombres.
- `lib/report/sections.ts` arma la mayoría de sus 12 secciones de forma
  genérica usando `dimension_label` (resuelto en `lib/report/fetchScores.ts`
  contra `assessment_definitions.config_json`), y solo tiene **2 lookups
  puntuales hardcodeados** (el mapa D/I/S/C de "Comportamiento" y el
  código `estabilidad_emocional` de "Personalidad" para la sección "Análisis
  Bajo Presión"), que **sí coinciden** con los códigos reales sembrados en
  `seed_full_content.sql` — no se encontró desajuste.
- `scripts/smoke-test-scoring.ts` (`npm run smoke:scoring`) automatiza esta
  verificación: parsea las dimensiones reales de
  `config_json` directamente desde `seed_full_content.sql`, genera
  respuestas ficticias para cada dimensión de las 7 baterías (incluyendo
  los 7 roles de "Competencias Específicas del Rol") y corre el motor de
  scoring real más `generateReport()`, confirmando que cada dimensión
  produce un `normalized_score` numérico válido y una etiqueta legible (sin
  caer a un fallback silencioso). Córrelo con:
  ```bash
  npm run smoke:scoring
  ```

## Limitaciones conocidas

- Los percentiles y niveles alto/medio/bajo son ilustrativos (no hay
  normas poblacionales reales), tal como se advierte en el aviso ético.
- No se implementó reenvío de email al candidato (el admin comparte el
  link manualmente vía el botón "Copiar"); se puede añadir un proveedor
  de email (Resend, Postmark, etc.) en una fase posterior sin tocar el
  modelo de datos.
- El logo del PDF es un placeholder ("PE" sobre un cuadro de color).
