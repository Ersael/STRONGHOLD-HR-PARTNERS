# Plataforma de Evaluación Psicométrica (Fase 1 - Arquitectura Completa)

Plataforma enterprise para procesos de selección de personal: un ADMIN crea
candidatos (generándoles usuario y contraseña), les asigna baterías de
evaluación psicométrica con tiempo límite configurable, el CANDIDATO
inicia sesión en su propio portal (`/candidate/login`) y responde con un
cronómetro real por batería, y el ADMIN revisa resultados (incluso
parciales), compara candidatos y genera reportes en PDF. **Nota:** la
descripción de "link único sin necesidad de crear cuenta" corresponde
únicamente al flujo original de Fase 1, retirado en la v2 — ver
"Fase A (v2)" y "Guía de actualización a v2" más abajo.

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
  candidate/                 Portal NUEVO del candidato: login, dashboard, examen (Fase A, con sesión)
  assessment/[token]/        Portal VIEJO del candidato (sin auth, por token; intacto por compatibilidad)
  api/
    candidates/, assign/, compare/, reports/   Rutas del admin
    assessment/[token]/                        RPC del flujo viejo por token
    candidate/assessments/                     RPC del flujo nuevo por sesión (Fase A)
components/
  admin/                     Formularios, gráficos y banners del panel admin
  assessment/                Renderizado de preguntas (compartido) y flujo del portal viejo por token
  candidate/                 Dashboard, examen con temporizador y logout del portal nuevo (Fase A)
  pdf/                       Documento PDF (@react-pdf/renderer)
lib/
  supabase/                  Clientes (browser, server/sesión, admin/service-role)
  scoring/                   Motor de scoring + percentil + fortalezas/riesgos + computeAndPersist (Fase A)
  report/                    Generación de las 12 secciones del reporte
  candidate/types.ts         Tipos del flujo nuevo por sesión (Fase A)
  assessment/types.ts        Tipos del flujo viejo por token
  constants.ts               Aviso ético, metadatos de baterías, roles, umbrales de score
  utils/token.ts             Generación de tokens únicos (flujo viejo)
  utils/password.ts          Generación de contraseñas temporales para candidatos (Fase A)
scripts/seed-admin.ts            Script para crear el primer admin (Auth + tabla admins)
scripts/seed-test-candidate.ts   Script para crear un candidato de prueba con login (Fase A)
scripts/smoke-test-scoring.ts    Smoke test del pipeline seed -> scoring -> reporte (ver abajo)
scripts/seed-content-generator/  Generador Python del contenido Fase 2 (ver abajo)
supabase/schema.sql               Esquema completo, RLS, funciones RPC y datos de ejemplo (Fase 1)
supabase/seed_full_content.sql    Contenido completo de las 7 baterías (Fase 2, 435 preguntas)
supabase/migrations_v2.sql        Login de candidatos + motor de tiempo (Fase A v2, ver sección propia)
supabase/migrations_v2_b.sql      audit_logs (Fase B v2, aditiva, ver sección propia)
lib/audit/log.ts                  logAuditEvent() — escribe en audit_logs con la service role (Fase B)
types/database.ts            Tipos manuales de la base de datos
middleware.ts                Protección de /admin/* y /candidate/*
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

## Fase A (v2): Login de candidatos y temporizador

La **Fase A de la v2** reemplaza, para el flujo NUEVO, el acceso 100%
anónimo por `unique_token` en la URL por un login real de candidato
(email + password contra Supabase Auth) y agrega un motor de tiempo real
de examen por batería.

**Actualización (auditoría de Fase C):** el flujo viejo por token
(`/assessment/[token]`, `app/api/assessment/[token]/*`, las 4 funciones
RPC originales) se dejó originalmente "intacto por compatibilidad", pero
la auditoría final encontró que `app/api/assign/route.ts` seguía
generando un `unique_token` **funcional** para cada asignación nueva y
`AssignAssessmentForm.tsx` se lo mostraba al admin como "Link generado"
para copiar y compartir — es decir, el flujo viejo SÍ competía con el
nuevo para asignaciones creadas después de la Fase A, con sus mismos
problemas de origen (sin login, auto-inicia el cronómetro con solo abrir
la página, ignora `time_limit_minutes`). Esto ya se corrigió: el admin ya
no genera ni ve ningún link al asignar una evaluación (el candidato
siempre entra con su sesión real), y `supabase/migrations_v2_b.sql` revoca
el permiso de ejecución de las 4 funciones viejas, dejando `/assessment/*`
completamente inerte. El código de esas rutas/funciones se conserva sin
borrar como referencia histórica, pero no debe usarse ni reactivarse.

### Qué migración correr, y en qué orden

1. Asegúrate de que `supabase/schema.sql` ya esté aplicado (la Fase A es
   una extensión, no un reemplazo).
2. Abre **SQL Editor → New query** en Supabase y copia **solo** el bloque
   delimitado como `===== PASADA 1 =====` de
   [`supabase/migrations_v2.sql`](./supabase/migrations_v2.sql) (dos líneas
   `alter type assessment_status add value ...`). Ejecuta (Run) y espera a
   que termine.
3. **⚠️ Espera a que la Pasada 1 termine antes de continuar.** Abre una
   consulta **nueva** y copia **todo el resto** del archivo (desde
   `===== PASADA 2 =====` hasta el final). Ejecuta.

   **¿Por qué en dos pasadas?** Postgres corre todas las sentencias de un
   mismo "Run" del SQL Editor dentro de una única transacción implícita.
   `ALTER TYPE ... ADD VALUE` no puede usarse y leerse/compararse (p. ej. en
   un `where status = 'expired'`) dentro de esa misma transacción — lanza
   el error `unsafe use of new value of enum type`. Correr la Pasada 1 sola
   (con commit implícito al terminar el Run) y la Pasada 2 después evita
   ese error. El archivo tiene comentarios grandes marcando exactamente
   dónde empieza y termina cada bloque.

### ⚠️ Aviso destructivo: los candidatos de prueba existentes se borran

La Pasada 2 cambia `public.candidates.id` para que sea
`uuid references auth.users(id)`, igual que `admins.id`, en vez de un uuid
libre generado por la aplicación — esto es indispensable para dar login
real a cada candidato. Los candidatos que existieran ANTES de esta
migración fueron creados sin un `auth.users` correspondiente (el flujo
viejo era 100% anónimo), así que es **imposible preservarlos**: la Pasada 2
hace `truncate ... cascade` sobre `candidates`, `candidate_assessments`,
`responses`, `scores` y `reports`. **La tabla `admins` (tu cuenta de admin
real) NO se toca.** El propio archivo `migrations_v2.sql` tiene un bloque
de comentario grande con este mismo aviso justo antes del `truncate`, con
instrucciones de qué hacer si para cuando lo corras ya tienes candidatos
reales que necesitas conservar (exportarlos manualmente antes de
continuar).

### Cómo crear un candidato de prueba para probar el login

Mientras la Fase B (panel admin ampliado) no tiene su propia UI para crear
candidatos con usuario/contraseña generados, usa el script
`scripts/seed-test-candidate.ts` (análogo a `scripts/seed-admin.ts`):

```bash
npm run seed:test-candidate -- "Nombre Candidato" candidato@example.com admin@tuempresa.com "Puesto aplicado"
```

Esto crea el usuario de Supabase Auth del candidato (con una contraseña
temporal aleatoria que el script imprime en consola) y su fila en
`candidates`, ligada al admin que pases por email (debe existir ya). El
candidato puede iniciar sesión de inmediato en `/candidate/login`, pero su
dashboard (`/candidate`) aparecerá vacío hasta que le asignes al menos una
batería desde `/admin/candidates/[id]` → "Asignar evaluación" (esa acción
ya no genera ningún link para compartir — el candidato entra con su propia
sesión, ver nota de la auditoría de Fase C arriba).

**Nota:** `POST /api/candidates` (usado por el formulario
"Nuevo candidato" del admin) ya fue actualizado para seguir el mismo
patrón (crea el `auth.users` + fila en `candidates` con contraseña
temporal, devuelta como `temporary_password` en la respuesta), aunque la
Fase B es quien construirá la UI que muestre/copie esa contraseña al admin.

### Diseño del motor de tiempo (léase antes de asumir que es un bug)

- El tiempo real de examen (`candidate_assessments.time_limit_minutes`,
  default 30) es independiente de `expires_at`, que ahora se recalcula
  como `started_at + time_limit_minutes` **solo cuando el candidato
  presiona "Iniciar"** (RPC `start_candidate_assessment`) — antes,
  `expires_at` era una fecha de validez del link a 30 días y el cronómetro
  ni siquiera existía.
- **No hay cron ni worker en background.** La expiración se resuelve de
  forma **perezosa (lazy)**: cada RPC que lee o escribe una
  `candidate_assessment` en `in_progress` (`get_assessment_detail`,
  `save_my_response`, `complete_my_assessment`, y el barrido de
  `get_my_assessments`) compara primero `now()` contra `expires_at`; si ya
  venció, dispara el mismo cambio de estado (`status = 'expired'`,
  `completed_at = now()`, `completed_by_timeout = true`) y bloquea
  cualquier respuesta nueva. Esto es intencional, no un descuido: evita
  depender de infraestructura de jobs. En la práctica, el cliente
  (`components/candidate/CandidateAssessmentClient.tsx`) llama al endpoint
  de detalle apenas el cronómetro visible llega a `00:00`, así que la
  expiración real se confirma casi de inmediato — **el navegador nunca
  decide por sí mismo que expiró, solo dispara la verificación contra el
  servidor**.
- El cálculo de `scores` en sí sigue viviendo en TypeScript
  (`lib/scoring/`), no en SQL. Cuando una RPC detecta una expiración que
  "acaba de ocurrir" (`just_expired: true` en `get_assessment_detail`,
  `error: "expired"` en `save_my_response`/`complete_my_assessment`, o
  `just_expired_ids` en `get_my_assessments`), la ruta de API
  correspondiente (`app/api/candidate/assessments/**`) dispara
  `computeAndPersistScores` (en `lib/scoring/computeAndPersist.ts`) con la
  SERVICE ROLE key — la misma función que ahora también usa el flujo viejo
  por token (histórico, ya inerte, ver arriba), extraída para no duplicar
  esa lógica. El resultado es un scoring **parcial**, calculado sobre lo
  que sí se alcanzó a responder.
  **Bug real encontrado y corregido en la auditoría de Fase C:**
  `get_my_assessments` (usado por el dashboard `/candidate`) también
  expira baterías perezosamente, pero originalmente NO informaba a la capa
  de aplicación qué ids acababa de expirar en esa llamada — así que si un
  candidato dejaba correr el tiempo y solo volvía a cargar el dashboard
  (sin reabrir la pantalla de examen puntual), la fila quedaba `expired` en
  la base de datos pero su scoring parcial **nunca se calculaba**. Se
  corrigió agregando `just_expired_ids` al retorno de la RPC (ver
  `supabase/migrations_v2.sql`) y haciendo que
  `app/api/candidate/assessments/route.ts` dispare
  `computeAndPersistScores` para cada id devuelto ahí, igual que los demás
  endpoints.
- El cronómetro del navegador nunca confía en `Date.now()` puro para
  calcular cuánto tiempo queda: cada respuesta del servidor incluye
  `server_time`, y el cliente calcula un offset (`server_time - Date.now()`
  local) una sola vez por sincronización. Esto evita que un candidato
  adelante/atrase su reloj local para ganar tiempo.

### Rutas y RPC nuevas

- Páginas: `/candidate/login`, `/candidate` (dashboard),
  `/candidate/assessment/[id]` (pantalla de examen, con pantalla previa
  "Iniciar" para `pending`), `/candidate/assessment/[id]/gracias`.
- API: `GET /api/candidate/assessments`,
  `POST /api/candidate/assessments/[id]/start`,
  `GET /api/candidate/assessments/[id]`,
  `POST /api/candidate/assessments/[id]/answer`,
  `POST /api/candidate/assessments/[id]/complete`.
- RPC (`supabase/migrations_v2.sql`, todas `SECURITY DEFINER`, filtran por
  `auth.uid()`): `get_my_assessments`, `start_candidate_assessment`,
  `get_assessment_detail`, `save_my_response`, `complete_my_assessment`.
- `middleware.ts` ahora protege también `/candidate/*`: exige sesión Y que
  `auth.uid()` corresponda a una fila en `public.candidates` (no en
  `public.admins`). Un admin que entra a `/candidate/*` es redirigido a
  `/admin`, y un candidato que entra a `/admin/*` es redirigido a
  `/candidate`.

### Qué falta (Fase B, otro trabajo)

Todo lo listado aquí ya se construyó — ver la sección
["Fase B (v2): Panel admin ampliado"](#fase-b-v2-panel-admin-ampliado) más
abajo.

## Fase B (v2): Panel admin ampliado

La **Fase B** construye todo lo que la Fase A dejó pendiente para que el
sistema sea operable de punta a punta desde el panel de admin, sin tocar
nada del login de candidatos ni del motor de tiempo (Fase A). Es
**100% aditiva**: `supabase/migrations_v2_b.sql` no borra ni transforma
ningún dato existente (a diferencia de la Pasada 2 de `migrations_v2.sql`).

### Qué migración correr, y en qué orden

```
supabase/schema.sql  ->  supabase/migrations_v2.sql (Pasada 1 y 2)  ->  supabase/migrations_v2_b.sql
```

`migrations_v2_b.sql` se ejecuta completo en un solo "Run" del SQL Editor
(no necesita dos pasadas: no toca ningún `enum`). Agrega únicamente la
tabla `public.audit_logs` + su RLS — el resto de la Fase B (contraseña
temporal visible, tiempo límite configurable, revocar, visor de respuestas,
dashboard ampliado, filtros, reportes parciales) se apoya en columnas y
policies que **ya existían** desde `migrations_v2.sql`
(`candidate_assessments.time_limit_minutes`, el valor de enum `revoked`, y
la policy `candidate_assessments_owner` que ya permitía `update` al admin
dueño) — solo requirió código de aplicación nuevo.

### 1. Contraseña temporal visible al crear un candidato

`POST /api/candidates` ya devolvía `temporary_password` desde la Fase A,
pero ninguna pantalla la mostraba. `components/admin/CredentialsModal.tsx`
se despliega justo después de crear un candidato
(`components/admin/CandidateForm.tsx`) mostrando el correo, la contraseña
temporal, botones "Copiar" por campo, un botón para copiar un mensaje
completo listo para reenviar al candidato, el aviso de que Supabase no
vuelve a mostrar esa contraseña, y la URL de `/candidate/login`. El admin
debe presionar "Ya la guardé, continuar" para pasar a la ficha del
candidato.

### 2. Tiempo límite configurable por batería

`components/admin/AssignAssessmentForm.tsx` agrega un input de minutos por
cada batería marcada, pre-cargado con `DEFAULT_TIME_LIMIT_MINUTES`
(`lib/constants.ts`): Comportamiento 20, Cognitivo 45, Personalidad 30,
Competencias 25, Valores 20, Liderazgo 30, Rol Específico 25. El valor
elegido viaja como `time_limits` (mapa `assessment_definition_id ->
minutos`) a `POST /api/assign`, que lo persiste en
`candidate_assessments.time_limit_minutes` en vez del default de 30.

Una vez asignada, `components/admin/AssessmentRowActions.tsx` (en la ficha
del candidato) permite:
- **`pending`**: editar el tiempo límite (`PATCH
  /api/candidate-assessments/[id]` con `{ time_limit_minutes }`).
- **`in_progress` o posterior**: el campo se muestra de solo lectura con la
  nota "no editable: en curso" — el propio endpoint rechaza el cambio con
  409 si el estado ya no es `pending`, para no permitir manipular un examen
  en marcha (la validación real vive en el servidor, no solo en la UI).

### 3. Revocar acceso

El mismo endpoint (`PATCH /api/candidate-assessments/[id]` con `{ status:
"revoked" }`) permite pasar una batería `pending` o `in_progress` a
`revoked`, con botón "Revocar" (+ confirmación) en la ficha del candidato.
No requirió RPC ni cambio de esquema nuevo: la policy
`candidate_assessments_owner` de `schema.sql` ya es `for all` para el admin
dueño. Del lado del candidato, `CandidateDashboardClient.tsx` y
`CandidateAssessmentClient.tsx` (Fase A) ya trataban `revoked` como estado
terminal sin botón de acción, y las RPC `save_my_response` /
`complete_my_assessment` ya rechazan cualquier escritura fuera de
`in_progress` — así que una prueba revocada queda genuinamente bloqueada
para el candidato, no solo oculta en la UI.

### 4. Visor de respuestas individuales

`app/admin/candidates/[id]/assessments/[assessmentId]/page.tsx` (mismo
patrón de rutas anidadas que `app/admin/candidates/[id]/report/page.tsx`),
enlazado desde "Ver respuestas" en la ficha del candidato. Usa
`lib/supabase/admin.ts` (service role) porque necesita `correct_index` y el
detalle completo de las 4 frases de cada bloque `forced_choice_quad`, que
las RPC del candidato nunca exponen — antes de usar la service role, la
página verifica a mano que el candidato pertenece al admin en sesión (la
service role bypassa RLS, así que esa verificación no puede delegarse a
Postgres aquí). Muestra, por tipo de pregunta: las 4 afirmaciones y cuál se
marcó "MÁS"/"MENOS" con su dimensión y la contribución del bloque
(`forced_choice_quad`); pregunta, opciones, respuesta seleccionada,
respuesta correcta, acierto y el score agregado de la dimensión
(`multiple_choice`); y pregunta, respuesta Likert con etiqueta, valor usado
en el cálculo (ya invertido si aplica), dimensión y bandera de scoring
inverso (`likert5`).

### 5. Dashboard de métricas ampliado

`app/admin/page.tsx` agrega: evaluaciones revocadas (antes solo se contaban
pending/in_progress/completed/expired), y "reportes generados vs.
pendientes de generar" — comparando, **por candidato** (no por fila),
quién tiene al menos un reporte contra quién tiene al menos una batería
`completed` pero ningún reporte todavía. Se calcula en JS a partir de dos
`select` simples (sin una vista SQL nueva) para no añadir otra migración
solo por una métrica.

### 6. Filtros en la lista de candidatos

`app/admin/candidates/page.tsx` lee todo por `searchParams` (server
component, sin estado de cliente): búsqueda por nombre/correo, puesto
aplicado, rango de fecha de creación (`from`/`to`), batería asignada, y
**estado global** del candidato.

**Criterio de "estado global"** (decisión de diseño, ya que un candidato no
tiene un único `status` propio — eso vive por batería): se toma el estado
más urgente/con más necesidad de acción entre TODAS sus baterías asignadas,
en esta prioridad: `in_progress > pending > expired > completed > revoked >
sin_evaluaciones`. Ej.: un candidato con una batería `completed` y otra
`pending` se muestra como `pending` (todavía requiere acción); uno con todo
`completed` y una `revoked` se muestra `completed` (lo revocado ya no
importa). Ver `computeGlobalStatus()` en ese archivo.

### 7. Reportes parciales

Se revisó `lib/report/generate.ts`, `fetchScores.ts` y `sections.ts`: la
Fase 1 YA evitaba en su mayoría "rellenar con texto genérico" (varias
secciones ya devolvían mensajes explícitos de "sin información
suficiente"), pero 4 de las 12 secciones (`sectionBajoPresion`,
`sectionLiderazgo`, `sectionEtica`, `sectionCompetencias`) caían a un
`normalized_score` neutro de 50 cuando la batería de la que dependen no
tenía datos, generando texto "medio" con apariencia de resultado real
aunque no hubiera ninguna respuesta detrás. La Fase B corrige esto:

- `ReportJson` (`types/database.ts`) agrega `partial: boolean`,
  `completed_assessments: AssessmentCode[]` y
  `pending_assessments: AssessmentCode[]`.
- `lib/report/fetchScores.ts` agrega `fetchAssessmentCompletionStatus()`,
  que agrupa las `candidate_assessments` del candidato por código de
  batería y decide completada (al menos una fila `completed`) vs.
  pendiente (todas las demás: `pending`/`in_progress`/`expired`/`revoked`,
  ninguna produce scores utilizables).
- `generateReport()` recibe ese resultado como tercer parámetro opcional
  (compatible hacia atrás: si se omite, como hace
  `scripts/smoke-test-scoring.ts`, se comporta exactamente igual que antes
  — todas las baterías presentes se asumen completas).
- Las 4 secciones afectadas ahora devuelven un mensaje explícito
  ("Esta sección todavía no se puede generar: depende de la batería de
  ..., que el candidato aún no ha completado...") en vez de calcular con un
  valor neutro, cuando esa batería no tiene ningún score real.
- La vista admin (`app/admin/candidates/[id]/report/page.tsx`) y el PDF
  (`components/pdf/ReportDocument.tsx`) muestran un banner "Resultados
  parciales" con la lista de baterías completadas/pendientes cuando
  `report.partial === true`.

### 8. Audit log

`public.audit_logs` (`supabase/migrations_v2_b.sql`): `id`, `actor_id`
(nullable, referencia `auth.users`), `actor_type`
(`admin`/`candidate`/`system`), `action`, `entity_type`
(`candidate`/`candidate_assessment`/`report`/`system`), `entity_id`,
`metadata_json`, `created_at`. Sin policies de `insert`/`update`/`delete`
para `authenticated` a propósito: solo se escribe desde
`lib/audit/log.ts` (`logAuditEvent()`) con la service role, nunca desde el
cliente. La policy de lectura (`audit_logs_owner_read`) resuelve la
propiedad con un `OR` por `entity_type` (mismo patrón de joins que
`responses`/`scores`/`reports` en `schema.sql`), más `actor_id = auth.uid()`
para eventos donde el propio admin fue el actor.

Eventos registrados: `candidate_created` (`POST /api/candidates`),
`assessment_started` (`POST .../start`), `assessment_completed` y
`assessment_completed_timeout` (`POST .../complete` y, de forma lazy,
cualquier endpoint del candidato que detecte una expiración justo en ese
request), `assessment_revoked` y `assessment_time_limit_updated`
(`PATCH /api/candidate-assessments/[id]`), `report_generated`
(`POST /api/reports/[candidateId]`) y `report_pdf_downloaded`
(`GET /api/reports/[candidateId]/pdf`). Vista de solo lectura en
`app/admin/audit/page.tsx` (tabla simple con scroll, últimos 300 eventos,
enlazada desde la barra de navegación del admin).

### 9. Comparar candidatos: verificado, sin cambios

Se revisó `components/admin/CompareCandidates.tsx` y `app/api/compare/route.ts`
contra el modelo de datos de la Fase A (candidatos ligados a `auth.users`,
nuevos estados `expired`/`revoked`). No se encontró nada roto:
`fetchDimensionScoresForCandidate()` sigue filtrando por
`status = 'completed'` (que ni Fase A ni Fase B redefinieron) y opera sobre
`candidate.id` como cualquier `uuid`, sin importar si tiene o no una fila
correspondiente en `auth.users`. No requirió ningún cambio de código.

## Limitaciones conocidas

- Los percentiles y niveles alto/medio/bajo son ilustrativos (no hay
  normas poblacionales reales), tal como se advierte en el aviso ético.
- No se implementó envío automático de email al candidato: el admin debe
  comunicarle manualmente (por el canal que prefiera, fuera de la
  plataforma) el correo y la contraseña temporal que se muestran una sola
  vez en el modal al crearlo (`CredentialsModal.tsx`); se puede añadir un
  proveedor de email (Resend, Postmark, etc.) en una fase posterior sin
  tocar el modelo de datos.
- El logo del PDF es un placeholder ("PE" sobre un cuadro de color).
- La página de detalle de candidato del admin (`/admin/candidates/[id]`)
  lee el estado de cada batería directamente de la tabla, sin disparar la
  expiración perezosa por sí misma. Si un candidato abandona una prueba
  `in_progress` y nunca vuelve a abrir ni su dashboard ni la pantalla de
  examen, el admin puede ver esa batería como "En progreso" un rato más de
  lo real, hasta que algún endpoint del candidato la toque (ver "Diseño
  del motor de tiempo" arriba) o el candidato vuelva a intentar entrar. No
  afecta la seguridad ni corrompe datos, solo una etiqueta que se
  autocorrige la próxima vez que algo la revisa; se documenta aquí para
  que no se confunda con un bug si se nota en producción.

## Guía de actualización a v2 (IMPORTANTE, leer antes de aplicar)

Esta sección es para quien vaya a aplicar la v2 (login real de
candidatos + temporizador + panel admin ampliado) sobre un proyecto de
Supabase que **ya está en uso**, aunque sea solo con datos de prueba.
Está escrita paso a paso, pensada para alguien sin experiencia técnica
profunda. Sigue el orden exacto.

### a) ⚠️ ADVERTENCIA GRANDE: esto borra los candidatos y pruebas actuales

**Antes de continuar, entiende esto:** el paso 2 de esta guía ejecuta un
script que **borra permanentemente** todos los candidatos que existan hoy
en el sistema, junto con todas sus evaluaciones asignadas, respuestas,
puntajes y reportes generados. Esto es necesario porque la v2 le da a
cada candidato un usuario y contraseña reales, y los candidatos actuales
no tienen eso — no hay forma técnica de "convertirlos" sin volver a
crearlos.

**Lo que NO se borra:** tu cuenta de administrador (con la que entras a
`/admin`) queda intacta. Esto solo afecta candidatos y sus datos de
evaluación.

**Si en este momento tienes candidatos reales (no de prueba) cuyos datos
te importan:** ve primero al punto (e) de esta guía ("Si algo sale mal")
antes de tocar nada. No hay forma de deshacer el borrado después de
hecho.

### b) Orden exacto para correr los 3 archivos SQL en Supabase

Ve a tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor**
→ **New query**. Vas a correr 3 archivos, en este orden, y uno de ellos
en **dos pasos separados**. No los mezcles ni cambies el orden.

1. **`supabase/schema.sql`** — solo si tu proyecto es nuevo y nunca lo has
   corrido antes. Si ya tienes la plataforma funcionando (Fase 1/2), este
   paso ya está hecho: sáltalo.
2. **`supabase/migrations_v2.sql`** — este es el que borra los candidatos
   de prueba (ver aviso arriba). Se corre en **dos pasadas**, no en una:
   1. Abre el archivo, copia **solo** las dos líneas que están entre los
      comentarios `===== PASADA 1 =====` y `===== FIN PASADA 1 =====`
      (son dos líneas que empiezan con `alter type assessment_status add
      value`). Pégalas en una consulta nueva del SQL Editor y presiona
      **Run**. Espera a que termine (deberías ver "Success. No rows
      returned").
   2. **⚠️ No sigas hasta que el paso anterior haya terminado por
      completo.** Abre una consulta **nueva** (otra pestaña o "New
      query", no reutilices la anterior) y copia **todo el resto** del
      archivo, desde el comentario `===== PASADA 2 =====` hasta el final.
      Presiona **Run**.
      - Si corres las dos pasadas juntas en un solo Run, vas a ver el
        error `unsafe use of new value of enum type` — no es grave, solo
        significa que hay que separarlas como se explica arriba. Vuelve a
        empezar desde el punto (i).
3. **`supabase/migrations_v2_b.sql`** — este NO borra nada (solo agrega
   una tabla de bitácora y cierra el acceso al flujo viejo por link). Se
   corre completo, de una sola vez, en una consulta nueva.

Al terminar los 3 pasos, tu base de datos ya tiene todo lo necesario para
la v2.

### c) Volver a desplegar el código en Azure

El código en sí (todo lo que no es SQL) se actualiza automáticamente: el
pipeline de GitHub Actions ya configurado (`.github/workflows/azure-deploy.yml`)
se encarga de compilar y publicar en Azure cada vez que se sube (`push`)
al repositorio de GitHub conectado al proyecto. No tienes que hacer nada
manual en Azure — solo asegúrate de que el código con estos cambios
(incluyendo cualquier corrección de esta auditoría) esté subido a la rama
que el pipeline observa (normalmente `main`). Puedes confirmar que
terminó bien revisando la pestaña "Actions" del repositorio en GitHub:
debe verse una marca verde para el último commit.

No hace falta cambiar ninguna variable de entorno en Azure para esta
actualización (las mismas `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` de siempre
siguen sirviendo).

### d) Cómo crear un candidato de prueba para validar todo el flujo

Una vez que el SQL ya corrió y el sitio ya está desplegado con el código
nuevo:

1. Entra a `/admin/login` con tu cuenta de administrador de siempre.
2. Ve a **Candidatos → Nuevo candidato** y llena el formulario con un
   correo tuyo (o uno de prueba al que tengas acceso) — puede ser
   "Candidato de Prueba" con tu propio correo.
3. Al guardar, aparecerá un cuadro con el correo y una **contraseña
   temporal**. Cópiala ahora mismo (con el botón "Copiar mensaje
   completo") — Supabase no la vuelve a mostrar después de cerrar ese
   cuadro.
4. Desde la ficha de ese candidato, usa "Asignar evaluación", elige
   alguna batería corta (ej. "Comportamiento", 20 minutos por defecto) y
   guarda. Ya no aparece ningún link para copiar: el candidato entra con
   su sesión.
5. Abre una ventana de incógnito (o cierra tu sesión de admin) y entra a
   `/candidate/login` con el correo y la contraseña que copiaste en el
   paso 3.
6. Verifica, en orden: (i) el panel muestra solo esa batería asignada;
   (ii) el botón dice "Iniciar"; (iii) al presionarlo aparece un
   cronómetro corriendo hacia atrás; (iv) responde un par de preguntas y
   recarga la página — debe seguir en el mismo punto, sin reiniciar el
   tiempo; (v) completa la batería y confirma que el panel del candidato
   la muestra como completada sin que tengas que cerrar sesión ni
   refrescar manualmente.
7. Vuelve a `/admin/login` con tu cuenta y confirma que en la ficha de
   ese candidato ya aparece el puntaje calculado, y que puedes generar su
   reporte.

Si todo eso funciona, la actualización quedó bien aplicada.

### e) Si algo sale mal

- **No existe un "deshacer" automático** para el borrado de
  `migrations_v2.sql` (el paso 2-b de esta guía). Si te importan los
  datos de los candidatos/pruebas que existen ANTES de correr ese script,
  tu única opción es **exportarlos manualmente antes de correr nada**:
  entra a **Supabase → Table Editor**, abre cada tabla relevante
  (`candidates`, `candidate_assessments`, `responses`, `scores`,
  `reports`) y usa la opción de exportar (o simplemente copia los datos
  que necesites revisar a una hoja de cálculo) antes de tocar el SQL.
  Una vez corrido el `truncate`, esos datos ya no están en la base de
  datos.
- Si corriste `migrations_v2.sql` completo en un solo Run (sin separar
  las dos pasadas) y te salió un error: no pasa nada grave, ninguna parte
  destructiva llegó a aplicarse todavía si el error ocurrió en el bloque
  `alter type`. Vuelve a empezar desde el punto (b), respetando las dos
  pasadas por separado.
- Si algo en el sitio se ve roto después de desplegar (por ejemplo, el
  login de candidato da error): revisa primero que los 3 archivos SQL se
  hayan corrido en el orden y la forma indicada — la causa más común es
  saltarse la Pasada 1, o correr `migrations_v2_b.sql` antes que
  `migrations_v2.sql`. Puedes volver a correr `migrations_v2_b.sql` las
  veces que quieras sin riesgo (no es destructivo); `migrations_v2.sql`
  Pasada 2, en cambio, no debe volver a correrse sobre una base que ya la
  tiene aplicada (fallaría al intentar agregar de nuevo una restricción
  que ya existe, sin causar daño, pero sin necesidad de hacerlo).
- Para cualquier otra duda de una persona no técnica: no continúes solo,
  pide ayuda a quien mantiene el proyecto antes de correr comandos SQL
  adicionales "para probar" — los archivos de este repositorio son los
  únicos que deben ejecutarse contra la base de datos de producción.
