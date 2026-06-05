# 📱 Gasto Fácil — Gestión Inteligente de Gastos Personales

Aplicación móvil/web desarrollada con **Ionic + Angular 20** que permite registrar, visualizar y analizar gastos personales. Integra **Supabase** como base de datos en la nube y **Google Gemini AI** para escanear tickets de compra y extraer datos automáticamente.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura General](#-arquitectura-general)
- [Estructura de Archivos](#-estructura-de-archivos)
- [Base de Datos — Supabase](#-base-de-datos--supabase)
- [Configuración del Entorno](#-configuración-del-entorno)
- [Servicios](#-servicios)
  - [SupabaseService](#supabaseservice)
  - [GeminiService](#geminiservice)
- [Páginas y Componentes](#-páginas-y-componentes)
  - [Tabs (Navegación)](#tabs--navegación)
  - [Home (Inicio)](#home--inicio)
  - [Gastos (Lista de Gastos)](#gastos--lista-de-gastos)
  - [Nuevo Gasto (Formulario)](#nuevo-gasto--formulario)
  - [Escanear (Cámara + IA)](#escanear--cámara--ia)
  - [Resumen (Estadísticas)](#resumen--estadísticas)
- [Rutas de la Aplicación](#-rutas-de-la-aplicación)
- [Flujos Principales](#-flujos-principales)
- [Instalación y Ejecución](#-instalación-y-ejecución)

---

## 🛠 Stack Tecnológico

| Tecnología | Versión | Propósito |
|---|---|---|
| **Angular** | 20.x | Framework frontend principal |
| **Ionic Framework** | 8.x | Componentes UI móvil y sistema de tabs |
| **Capacitor** | 8.x | Acceso nativo (cámara, galería) |
| **Supabase** | 2.x | Base de datos PostgreSQL en la nube (BaaS) |
| **Google Gemini AI** | 2.5 Flash | Análisis de imágenes de tickets con visión artificial |
| **TypeScript** | 5.9 | Lenguaje de programación |

---

## 🏗 Arquitectura General

```
┌──────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
│  (interactúa con la UI de Ionic en navegador o dispositivo)  │
└─────────────────────────────┬────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Home    │ │  Gastos  │ │ Escanear │ │    Resumen     │  │
│  │  Page    │ │Component │ │Component │ │   Component    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘  │
│       │             │            │                │           │
│       ▼             ▼            ▼                ▼           │
│  ┌──────────────────────┐  ┌────────────────────────────┐    │
│  │   NuevogastoComponent│  │     TabsPage (navegación)  │    │
│  └──────────┬───────────┘  └────────────────────────────┘    │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────┐
│                     CAPA DE SERVICIOS                        │
│  ┌─────────────────────┐    ┌──────────────────────────────┐ │
│  │  SupabaseService    │    │      GeminiService           │ │
│  │  (CRUD de gastos)   │    │  (Análisis de tickets con IA)│ │
│  └──────────┬──────────┘    └──────────────┬───────────────┘ │
└─────────────┼──────────────────────────────┼─────────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────┐    ┌──────────────────────────────────┐
│    Supabase Cloud    │    │     Google Gemini API             │
│   (PostgreSQL DB)    │    │  (generativelanguage.googleapis)  │
│   Tabla: gastos      │    │  Modelo: gemini-2.5-flash         │
└──────────────────────┘    └──────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

```
practica4/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Componente raíz (carga IonApp + RouterOutlet)
│   │   ├── app.routes.ts             # Definición de todas las rutas
│   │   ├── home/
│   │   │   ├── home.page.ts          # Lógica del dashboard principal
│   │   │   ├── home.page.html        # Plantilla del dashboard
│   │   │   └── home.page.scss        # Estilos del dashboard
│   │   ├── tabs/
│   │   │   └── tabs.page.ts          # Barra de navegación inferior
│   │   ├── pages/
│   │   │   ├── gastos/
│   │   │   │   ├── gastos.component.ts     # Lista de gastos con búsqueda/filtros
│   │   │   │   ├── gastos.component.html   # Plantilla de lista
│   │   │   │   └── gastos.component.scss   # Estilos de lista
│   │   │   ├── nuevogasto/
│   │   │   │   ├── nuevogasto.component.ts   # Formulario crear/editar gasto
│   │   │   │   ├── nuevogasto.component.html # Plantilla del formulario
│   │   │   │   └── nuevogasto.component.scss # Estilos del formulario
│   │   │   ├── escanear/
│   │   │   │   ├── escanear.component.ts     # Captura de tickets con cámara + IA
│   │   │   │   ├── escanear.component.html   # Plantilla del escáner
│   │   │   │   └── escanear.component.scss   # Estilos del escáner
│   │   │   └── resumen/
│   │   │       ├── resumen.component.ts      # Estadísticas y gráfico donut
│   │   │       ├── resumen.component.html    # Plantilla de resumen
│   │   │       └── resumen.component.scss    # Estilos de resumen
│   │   └── services/
│   │       ├── supabase.service.ts   # Servicio CRUD: comunicación con Supabase
│   │       └── gemini.service.ts     # Servicio IA: análisis de tickets con Gemini
│   └── environments/
│       └── environment.ts            # Claves de API y configuración
├── package.json
├── angular.json
├── capacitor.config.ts
└── ionic.config.json
```

---

## 🗃 Base de Datos — Supabase

### Conexión

La aplicación se conecta a **Supabase** (PostgreSQL como servicio) mediante el cliente JavaScript `@supabase/supabase-js`. La conexión se establece en el constructor de `SupabaseService`:

```typescript
this.supabase = createClient(environment.supabaseurl, environment.supabasekey);
```

- **`supabaseurl`**: URL del proyecto Supabase (`https://ucboptqvvhbbikqfujve.supabase.co`)
- **`supabasekey`**: Clave pública anon/publishable para acceso desde el cliente

### Tabla: `gastos`

La tabla principal de la base de datos almacena todos los gastos registrados. Su esquema corresponde a la interfaz TypeScript `Gasto`:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `integer` (auto) | Clave primaria, auto-incrementable |
| `concepto` | `string` | Nombre del gasto o establecimiento |
| `establecimiento` | `string?` | Nombre del comercio (opcional) |
| `monto` | `number` | Cantidad gastada en moneda local |
| `fecha_gasto` | `string` (date) | Fecha del gasto en formato `YYYY-MM-DD` |
| `categoria_id` | `integer` | ID de categoría (ver tabla de mapeo abajo) |
| `metodo_pago_id` | `integer` | ID del método de pago (ver tabla de mapeo abajo) |
| `notas` | `string?` | Notas adicionales (opcional) |
| `imagen_ticket_url` | `string?` | URL de imagen del ticket (opcional) |
| `procesado_por_ia` | `boolean?` | Indica si fue procesado por Gemini AI |
| `fecha_creacion` | `string` (timestamp) | Timestamp de creación del registro (auto) |

### Mapeo de Categorías

| `categoria_id` | Nombre | Icono |
|---|---|---|
| 1 | Comida | `cafe-outline` |
| 2 | Transporte | `car-outline` |
| 3 | Servicios | `receipt-outline` |
| 4 | Entretenimiento | `film-outline` |
| 5 | Otros | `cog-outline` |

### Mapeo de Métodos de Pago

| `metodo_pago_id` | Nombre |
|---|---|
| 1 | Efectivo |
| 2 | Tarjeta |
| 3 | Transferencia |

---

## ⚙ Configuración del Entorno

Archivo: `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  supabaseurl: 'https://ucboptqvvhbbikqfujve.supabase.co',
  supabasekey: '<clave_publica_supabase>',
  geminiApiKey: '<clave_api_gemini>',
};
```

| Variable | Descripción |
|---|---|
| `supabaseurl` | URL del proyecto en Supabase |
| `supabasekey` | Clave pública (anon key) de Supabase para acceso desde el cliente |
| `geminiApiKey` | Clave de API de Google Gemini para análisis de imágenes |

---

## 🔧 Servicios

### SupabaseService

**Archivo:** `src/app/services/supabase.service.ts`

Servicio singleton (`providedIn: 'root'`) que encapsula todas las operaciones CRUD contra la tabla `gastos` en Supabase.

#### Constructor

```typescript
constructor() {
  this.supabase = createClient(environment.supabaseurl, environment.supabasekey);
}
```

Crea una instancia del cliente Supabase usando las credenciales del entorno. Esta instancia se reutiliza en todos los métodos.

---

#### `insertarGasto(gasto: Gasto): Promise<Gasto[]>`

**Propósito:** Insertar un nuevo gasto en la base de datos.

**Parámetros:**
- `gasto`: Objeto con los campos del gasto (concepto, monto, fecha_gasto, categoria_id, metodo_pago_id, notas)

**Flujo:**
1. Ejecuta `INSERT INTO gastos` a través del cliente Supabase
2. Usa `.select()` para devolver el registro insertado
3. Si hay error, lo lanza como excepción

**Operación Supabase equivalente (SQL):**
```sql
INSERT INTO gastos (concepto, monto, fecha_gasto, categoria_id, metodo_pago_id, notas)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

**Usado por:** `NuevogastoComponent.guardar()` — cuando el usuario crea un gasto nuevo

---

#### `obtenerGastosRecientes(): Promise<Gasto[]>`

**Propósito:** Obtener los últimos 5 gastos registrados, sin importar el mes.

**Flujo:**
1. Ejecuta `SELECT * FROM gastos ORDER BY fecha_creacion DESC LIMIT 5`
2. Retorna los datos o un arreglo vacío

**Operación Supabase equivalente (SQL):**
```sql
SELECT * FROM gastos
ORDER BY fecha_creacion DESC
LIMIT 5;
```

**Usado por:** `HomePage.cargarDatos()` — para la sección "Gastos recientes" del dashboard

---

#### `obtenerGastosDelMes(): Promise<Gasto[]>`

**Propósito:** Obtener todos los gastos del mes actual para cálculos estadísticos.

**Flujo:**
1. Calcula el primer y último día del mes actual usando `Date`
2. Ejecuta un `SELECT` con filtros `gte` (≥) y `lte` (≤) sobre `fecha_gasto`
3. Ordena por `fecha_creacion` descendente

**Operación Supabase equivalente (SQL):**
```sql
SELECT * FROM gastos
WHERE fecha_gasto >= '2026-06-01'
  AND fecha_gasto <= '2026-06-30'
ORDER BY fecha_creacion DESC;
```

**Usado por:**
- `HomePage.cargarDatos()` — para calcular total del mes, total de hoy, conteo y categoría top
- `ResumenComponent.cargarDatos()` — para el desglose por categorías y gráfico donut

---

#### `obtenerTodosLosGastos(): Promise<Gasto[]>`

**Propósito:** Obtener el historial completo de gastos, ordenados por fecha más reciente primero.

**Flujo:**
1. Ejecuta `SELECT * FROM gastos ORDER BY fecha_gasto DESC`
2. Retorna todos los registros

**Operación Supabase equivalente (SQL):**
```sql
SELECT * FROM gastos
ORDER BY fecha_gasto DESC;
```

**Usado por:**
- `GastosComponent.cargarGastos()` — para la lista completa con búsqueda y filtros
- `ResumenComponent.obtenerGastosMesPasado()` — obtiene todos y filtra en el cliente los del mes anterior

---

#### `obtenerGastoPorId(id: number): Promise<Gasto | null>`

**Propósito:** Obtener un gasto específico por su ID (para edición).

**Flujo:**
1. Ejecuta `SELECT * FROM gastos WHERE id = $1` con `.single()` para obtener un solo registro
2. Retorna el gasto o `null`

**Operación Supabase equivalente (SQL):**
```sql
SELECT * FROM gastos
WHERE id = 42
LIMIT 1;
```

**Usado por:** `NuevogastoComponent.cargarGasto()` — cuando se navega a `/nuevogasto/:id` para editar

---

#### `actualizarGasto(id: number, gasto: Partial<Gasto>): Promise<Gasto[]>`

**Propósito:** Actualizar los campos de un gasto existente.

**Parámetros:**
- `id`: ID del gasto a actualizar
- `gasto`: Objeto parcial con solo los campos a modificar

**Flujo:**
1. Ejecuta `UPDATE gastos SET ... WHERE id = $1`
2. Usa `.select()` para devolver el registro actualizado

**Operación Supabase equivalente (SQL):**
```sql
UPDATE gastos
SET concepto = $2, monto = $3, fecha_gasto = $4, ...
WHERE id = $1
RETURNING *;
```

**Usado por:** `NuevogastoComponent.guardar()` — cuando `modoEdicion` es `true`

---

#### `eliminarGasto(id: number): Promise<void>`

**Propósito:** Eliminar permanentemente un gasto de la base de datos.

**Flujo:**
1. Ejecuta `DELETE FROM gastos WHERE id = $1`
2. Si hay error, lo lanza como excepción

**Operación Supabase equivalente (SQL):**
```sql
DELETE FROM gastos WHERE id = 42;
```

**Usado por:** `GastosComponent.eliminarGasto()` — tras confirmación del usuario con un diálogo de alerta

---

### GeminiService

**Archivo:** `src/app/services/gemini.service.ts`

Servicio singleton que se comunica con la **API de Google Gemini** (modelo `gemini-2.5-flash`) para analizar imágenes de tickets de compra mediante visión artificial.

#### Interfaz `TicketData`

Define la estructura de datos que Gemini debe extraer de un ticket:

```typescript
export interface TicketData {
  concepto: string;      // Nombre del establecimiento
  monto: number | null;  // Monto total pagado
  fecha: string;         // Fecha en formato YYYY-MM-DD
  categoria: string;     // comida | transporte | servicios | entretenimiento | otros
  metodoPago: string;    // efectivo | tarjeta | transferencia
  notas: string;         // Datos adicionales del ticket
}
```

---

#### `analizarTicket(base64Image: string): Promise<TicketData>`

**Propósito:** Enviar una imagen de ticket en base64 a Gemini AI y obtener los datos del gasto extraídos automáticamente.

**Parámetros:**
- `base64Image`: Imagen del ticket codificada en Base64 (sin prefijo `data:image`)

**Flujo detallado:**

1. **Construye el prompt:** Un texto instruccional preciso que le dice a Gemini exactamente qué campos extraer y en qué formato JSON responder. Incluye la fecha actual como fallback.

2. **Arma el cuerpo de la petición:**
   ```typescript
   {
     contents: [{
       parts: [
         { text: prompt },              // Instrucciones
         { inlineData: { mimeType: 'image/jpeg', data: base64Image } }  // Imagen
       ]
     }],
     generationConfig: {
       temperature: 0.1,                // Baja creatividad, alta precisión
       maxOutputTokens: 2048,
       responseMimeType: 'application/json',
       thinkingConfig: { thinkingBudget: 1024 }  // Presupuesto de "pensamiento"
     }
   }
   ```

3. **Envía la petición** con reintentos automáticos (ver `fetchWithRetry`)

4. **Procesa la respuesta:**
   - Filtra las "partes de pensamiento" (`thought: true`) del modelo
   - Toma la última parte de texto que no sea pensamiento
   - Limpia posibles bloques de código markdown (`` ```json ``)
   - Parsea el JSON resultante a la interfaz `TicketData`

5. **Manejo de errores:** Si el parsing falla, devuelve un objeto `TicketData` con valores vacíos/por defecto

**Usado por:** `EscanearComponent.analizarConIA()` — cuando el usuario pulsa "Analizar con IA"

---

#### `fetchWithRetry(url: string, body: any): Promise<Response>` (privado)

**Propósito:** Ejecutar un `fetch` HTTP con reintentos automáticos cuando la API responde con error 429 (rate limit).

**Lógica:**
1. Intenta la petición hasta `MAX_RETRIES` (3) veces
2. Si recibe un 429:
   - Busca `retryDelay` en el cuerpo de la respuesta de error (`RetryInfo`)
   - Si no lo encuentra, usa backoff exponencial: 30s → 60s → 120s
   - Espera el tiempo calculado y reintenta
3. Tras agotar los reintentos, hace un último intento sin manejar el 429

---

## 📄 Páginas y Componentes

### Tabs — Navegación

**Archivo:** `src/app/tabs/tabs.page.ts`

Componente que define la **barra de navegación inferior** con 4 pestañas:

| Pestaña | Icono | Ruta |
|---|---|---|
| Inicio | `home-outline` | `/home` |
| Gastos | `wallet-outline` | `/gastos` |
| Escanear | `qr-code-outline` | `/escanear` |
| Resumen | `stats-chart-outline` | `/resumen` |

Usa `<ion-tabs>` con `<ion-tab-bar>` y registra los iconos en el constructor con `addIcons()`.

---

### Home — Inicio

**Archivo:** `src/app/home/home.page.ts`

Dashboard principal que muestra un resumen rápido del estado financiero del usuario.

#### Signals y Computed Properties

| Propiedad | Tipo | Descripción |
|---|---|---|
| `gastosDelMes` | `signal<Gasto[]>` | Todos los gastos del mes actual |
| `gastosRecientes` | `signal<Gasto[]>` | Últimos 5 gastos registrados |
| `totalMes` | `computed` | Suma total de montos del mes |
| `totalHoy` | `computed` | Suma de gastos de hoy (filtra por `fecha_gasto === hoy`) |
| `conteoGastos` | `computed` | Cantidad de gastos en el mes |
| `topCategoria` | `computed` | Nombre de la categoría más frecuente |
| `topCategoriaIcon` | `computed` | Icono de la categoría más frecuente |

#### Métodos

##### `ionViewWillEnter()`
Hook del ciclo de vida de Ionic. Se ejecuta cada vez que la página está a punto de ser visible. Llama a `cargarDatos()`.

##### `cargarDatos()`
Carga datos en paralelo usando `Promise.all`:
1. `obtenerGastosDelMes()` → alimenta el card de resumen (total mes, total hoy, conteo, top categoría)
2. `obtenerGastosRecientes()` → alimenta la lista de "Gastos recientes"

##### `getIconForCategory(categoryId: number): string`
Mapea un `categoria_id` numérico a un nombre de icono de Ionicons:
- 1 → `cafe-outline`, 2 → `car-outline`, 3 → `receipt-outline`, 4 → `film-outline`, 5 → `cog-outline`

##### `getCategoryName(categoryId: number): string`
Mapea un `categoria_id` a su nombre legible:
- 1 → "Comida", 2 → "Transporte", 3 → "Servicios", 4 → "Entretenimiento", default → "Otros"

##### `formatDate(dateString?: string): string`
Formatea un timestamp a texto legible en español: `"4 jun, 22:30"`.

##### `addGasto()`
Navega a `/nuevogasto` para crear un nuevo gasto.

#### Template (`home.page.html`)

- **Card de resumen:** Muestra total del mes y conteo de gastos
- **Mini cards:** Total de hoy, conteo de gastos, categoría top
- **Botón "Escanear ticket":** Navega a `/escanear`
- **Lista "Gastos recientes":** Los últimos 5 gastos con icono, concepto, fecha y monto
- **FAB button (+):** Botón flotante para agregar gasto nuevo
- **Ilustración motivacional:** Elemento visual decorativo con frase

---

### Gastos — Lista de Gastos

**Archivo:** `src/app/pages/gastos/gastos.component.ts`

Página que muestra **todos los gastos** con funcionalidades de búsqueda y filtrado por categoría.

#### Signals y Computed Properties

| Propiedad | Tipo | Descripción |
|---|---|---|
| `todosLosGastos` | `signal<Gasto[]>` | Todos los gastos cargados |
| `terminoBusqueda` | `signal<string>` | Texto de búsqueda actual |
| `categoriaFiltro` | `signal<number>` | ID de categoría seleccionada (0 = todos) |
| `gastosFiltrados` | `computed` | Gastos filtrados según búsqueda y categoría |

#### Métodos

##### `ionViewWillEnter()`
Se ejecuta cada vez que se muestra la página. Llama a `cargarGastos()`.

##### `cargarGastos()`
Llama a `supabase.obtenerTodosLosGastos()` y almacena el resultado en `todosLosGastos`.

##### `onBuscar(event: any)`
Actualiza el signal `terminoBusqueda` con el valor del `<ion-searchbar>`. Esto dispara la recomputación de `gastosFiltrados`.

##### `seleccionarCategoria(id: number)`
Cambia el filtro de categoría activo. `id = 0` significa "Todos".

##### `editarGasto(gasto: Gasto)`
Navega a `/nuevogasto/:id` pasando el ID del gasto para editarlo.

##### `confirmarEliminar(gasto: Gasto)`
Muestra un **AlertController** de Ionic con confirmación ("¿Estás seguro de eliminar X?"). Si el usuario confirma, llama a `eliminarGasto()`.

##### `eliminarGasto(gasto: Gasto)`
Llama a `supabase.eliminarGasto(gasto.id)` y recarga la lista completa.

##### `agregarGasto()`
Navega a `/nuevogasto` para crear un nuevo gasto.

##### `getIconForCategory()`, `getCategoryName()`, `getCategoryColor()`
Funciones de mapeo para iconos, nombres y colores de categoría (misma lógica que en Home pero con colores hex).

##### `formatDate(dateString?: string): string`
Formatea fecha a `"dd/MM"` en español.

#### Template (`gastos.component.html`)

- **Barra de búsqueda:** `<ion-searchbar>` con debounce de 300ms
- **Chips de categoría:** Botones para filtrar (Todos, Comida, Transporte, etc.)
- **Lista de gastos:** Cards con icono de categoría (con color), concepto, monto, badge de categoría, fecha, y botones de editar/eliminar
- **Estado vacío:** Icono de wallet con mensaje cuando no hay gastos
- **FAB button (+):** Botón flotante para agregar

---

### Nuevo Gasto — Formulario

**Archivo:** `src/app/pages/nuevogasto/nuevogasto.component.ts`

Formulario reactivo que permite **crear un gasto nuevo** o **editar uno existente**. También recibe datos pre-llenados desde el escáner de IA.

#### Propiedades

| Propiedad | Tipo | Descripción |
|---|---|---|
| `gastoForm` | `FormGroup` | Formulario reactivo con validaciones |
| `modoEdicion` | `boolean` | `true` si se está editando un gasto existente |
| `gastoId` | `number \| null` | ID del gasto en edición |
| `desdeIA` | `boolean` | `true` si los datos vienen del escáner de IA |

#### Formulario Reactivo

```typescript
this.gastoForm = this.fb.group({
  concepto:   ['', Validators.required],
  monto:      [null, [Validators.required, Validators.min(0.01)]],
  fecha:      [new Date().toISOString().split('T')[0], Validators.required],
  categoria:  ['', Validators.required],
  metodoPago: ['efectivo', Validators.required],
  notas:      ['']
});
```

#### Métodos

##### `ngOnInit()`
Revisa si la ruta contiene un parámetro `:id`:
- **Si existe:** Activa `modoEdicion = true` y llama a `cargarGasto(id)` para pre-llenar el formulario
- **Si no existe:** Queda en modo creación

##### `ionViewDidEnter()`
Hook que se ejecuta cuando la página está completamente visible y los componentes `<ion-input>` están inicializados. Aquí se procesan los **query params del escáner de IA**:

1. Verifica si `desde_ia === 'true'` en los query params
2. Si es así, activa `desdeIA = true` y muestra un banner informativo
3. Usa `setTimeout(100ms)` + `patchValue()` para llenar el formulario con los datos extraídos por Gemini
4. Llama a `markAllAsTouched()` y `detectChanges()` para forzar la actualización visual

> **¿Por qué setTimeout?** Los componentes `<ion-input>` de Ionic se renderizan asincrónicamente. Si se hace `patchValue` antes de que estén listos, los valores no se reflejan visualmente.

##### `cargarGasto(id: number)`
Para modo edición:
1. Llama a `supabase.obtenerGastoPorId(id)`
2. Hace un **mapeo inverso** de `categoria_id` (número) → string del formulario y de `metodo_pago_id` → string
3. Pre-llena el formulario con `patchValue()`

##### `guardar()`
Método principal del formulario. Se ejecuta al hacer submit:

1. **Valida** que el formulario sea válido. Si no, marca todos los campos como tocados para mostrar errores
2. **Mapea strings a IDs numéricos:**
   - `'comida'` → 1, `'transporte'` → 2, `'servicios'` → 3, `'entretenimiento'` → 4, `'otros'` → 5
   - `'efectivo'` → 1, `'tarjeta'` → 2, `'transferencia'` → 3
3. **Construye el objeto `gastoData`** con los campos que espera la tabla de Supabase
4. **Decide la operación:**
   - Si `modoEdicion && gastoId`: llama a `supabase.actualizarGasto(id, gastoData)` → **UPDATE**
   - Si no: llama a `supabase.insertarGasto(gastoData)` → **INSERT**
5. **Navega a `/gastos`** tras guardar exitosamente
6. Si hay error, muestra un `alert()` con mensaje de error

##### `cancelar()`
Navega de vuelta:
- Si está en modo edición → `/gastos`
- Si está en modo creación → `/home`

#### Template (`nuevogasto.component.html`)

- **Banner IA:** Se muestra solo cuando `desdeIA = true`, con un ícono ✨ y el texto "Datos extraídos automáticamente"
- **Campos del formulario:** Concepto, Monto (con símbolo $), Fecha y Categoría (en fila), Método de pago (chips), Notas (textarea)
- **Botones de acción:** "Guardar/Actualizar" y "Cancelar"
- **Banner de escaneo:** Solo en modo creación, sugiere usar el escáner de IA

---

### Escanear — Cámara + IA

**Archivo:** `src/app/pages/escanear/escanear.component.ts`

Página que permite **capturar una foto de un ticket** usando la cámara o galería del dispositivo, y luego **enviarla a Gemini AI** para extraer los datos automáticamente.

#### Propiedades

| Propiedad | Tipo | Descripción |
|---|---|---|
| `scannerZone` | `ElementRef` | Referencia al div donde se renderiza la cámara |
| `isCameraActive` | `boolean` | Si la vista previa de cámara está activa |
| `capturedImage` | `string \| null` | Base64 de la imagen capturada (sin prefijo) |
| `capturedImageSrc` | `string \| null` | Data URI completo para mostrar en `<img>` |
| `isAnalyzing` | `boolean` | Estado de carga mientras Gemini analiza |
| `errorMsg` / `successMsg` | `string \| null` | Mensajes de estado para el usuario |

#### Métodos

##### `ngAfterViewInit()`
Hook del ciclo de vida de Angular. Espera 300ms y luego inicializa el escáner de cámara.

##### `initializeScanner()`
Inicializa la vista previa de cámara nativa:
1. Obtiene las dimensiones del `#scannerZone` con `getBoundingClientRect()`
2. Configura opciones de CameraPreview (posición, tamaño, cámara trasera)
3. Llama a `CameraPreview.start(options)` para iniciar la vista en vivo
4. Si falla (navegador de escritorio), no hace nada — se usará el fallback de `@capacitor/camera`

##### `tomarFoto()`
Captura una foto del ticket:

**Flujo en dispositivo nativo (cámara activa):**
1. Llama a `CameraPreview.capture({ quality: 90 })`
2. Limpia el prefijo `data:image` si viene incluido
3. Almacena el base64 puro en `capturedImage` y el data URI en `capturedImageSrc`
4. Detiene la cámara con `CameraPreview.stop()` para no superponer

**Flujo en navegador (fallback):**
1. Usa `Camera.getPhoto()` con `CameraSource.Camera`, lo cual abre un selector de archivos en web
2. Almacena el base64 resultante

Muestra un mensaje de éxito durante 2 segundos si la captura fue exitosa.

##### `seleccionarDeGaleria()`
Abre la galería de fotos del dispositivo:
1. Usa `Camera.getPhoto()` con `CameraSource.Photos`
2. Almacena el base64 de la imagen seleccionada
3. Si el usuario cancela, no muestra error

##### `descartarFoto()`
Descarta la imagen capturada:
1. Limpia `capturedImage` y `capturedImageSrc`
2. Limpia mensajes de error/éxito
3. Reinicia la cámara con `initializeScanner()` tras 100ms

##### `analizarConIA()`
**Método central del flujo de IA.** Envía la imagen a Gemini y navega al formulario:

1. Verifica que hay una imagen capturada
2. Activa el indicador de carga (`isAnalyzing = true`)
3. Llama a `gemini.analizarTicket(capturedImage)` — envía la imagen a la API de Gemini
4. **Valida la fecha:** Si la fecha extraída no es del mes actual, la reemplaza con la fecha de hoy
5. **Navega a `/nuevogasto`** con query params:
   ```
   /nuevogasto?concepto=Walmart&monto=45.50&fecha=2026-06-04&categoria=comida&metodoPago=tarjeta&notas=Despensa&desde_ia=true
   ```
6. Si hay error, muestra un mensaje de error al usuario

##### `ngOnDestroy()`
Detiene la cámara cuando el componente se destruye para liberar recursos.

#### Template (`escanear.component.html`)

- **Visor de cámara:** Zona rectangular con esquinas decorativas donde se renderiza la vista previa
- **Imagen capturada:** Se superpone sobre el visor con un badge "Foto lista"
- **Mensajes de estado:** Éxito (verde) y error (rojo)
- **Botones de control:** "Tomar foto" y "Galería" (se deshabilitan si ya hay captura)
- **Previsualización:** Miniatura de la imagen con botón de descartar
- **Botón "Analizar con IA":** Botón principal con icono ✨, muestra spinner mientras analiza
- **Overlay de carga:** Pantalla oscura con spinner y texto "Gemini IA está leyendo los datos"

---

### Resumen — Estadísticas

**Archivo:** `src/app/pages/resumen/resumen.component.ts`

Página de **análisis financiero** que muestra un gráfico donut SVG y desglose por categorías.

#### Interfaz `CategoriaResumen`

```typescript
export interface CategoriaResumen {
  id: number;
  nombre: string;
  icono: string;
  color: string;
  total: number;
  porcentaje: number;
}
```

#### Signals y Computed Properties

| Propiedad | Tipo | Descripción |
|---|---|---|
| `gastosDelMes` | `signal<Gasto[]>` | Gastos del mes actual |
| `gastosDelMesPasado` | `signal<Gasto[]>` | Gastos del mes anterior (para comparación) |
| `totalAcumulado` | `computed` | Suma total del mes actual |
| `totalMesPasado` | `computed` | Suma total del mes anterior |
| `cambioMensual` | `computed` | Porcentaje de cambio mes a mes: `((actual - pasado) / pasado) * 100` |
| `gastoAumento` | `computed` | `true` si el gasto aumentó vs. mes pasado |
| `conteoGastos` | `computed` | Cantidad de gastos del mes |
| `categoriasResumen` | `computed` | Array de `CategoriaResumen` con totales y porcentajes por categoría, ordenados de mayor a menor |
| `topCategoria` | `computed` | La categoría con mayor gasto |
| `donutSegments` | `computed` | Segmentos SVG para el gráfico donut (offset, length, color) |

#### Métodos

##### `ionViewWillEnter()`
Carga datos cada vez que se muestra la página.

##### `cargarDatos()`
Carga en paralelo con `Promise.all`:
1. `obtenerGastosDelMes()` — gastos del mes actual
2. `obtenerGastosMesPasado()` — gastos del mes anterior

##### `obtenerGastosMesPasado(): Promise<Gasto[]>` (privado)
Calcula las fechas del mes pasado, obtiene todos los gastos con `obtenerTodosLosGastos()`, y filtra en el cliente los que están en el rango del mes anterior.

##### `getNombreMes(): string`
Devuelve el nombre del mes actual en español: `"junio"`.

#### Computed: `categoriasResumen`
Lógica de cálculo del desglose por categoría:
1. Define las 5 categorías con su nombre, icono y color
2. Para cada categoría, filtra los gastos con ese `categoria_id` y suma los montos
3. Calcula el porcentaje: `totalCategoria / totalGeneral`
4. Filtra categorías con total > 0
5. Ordena de mayor a menor gasto

#### Computed: `donutSegments`
Genera los datos para un gráfico donut SVG:
1. Circunferencia: `2π × 40` (radio = 40)
2. Para cada categoría, calcula la longitud del arco: `porcentaje × circunferencia`
3. Acumula el offset para que cada segmento empiece donde termina el anterior

#### Template (`resumen.component.html`)

- **Card de total acumulado:** Muestra el total del mes con badge de cambio porcentual
- **Gráfico donut SVG:** Círculos SVG con `stroke-dasharray` para representar cada categoría
- **Badge de categoría top:** "Categoría con más gastos: Comida (45%)"
- **Desglose por categoría:** Lista con icono, nombre, porcentaje y monto por cada categoría
- **Tip motivacional:** Tarjeta con consejo basado en la categoría principal

---

## 🗺 Rutas de la Aplicación

Archivo: `src/app/app.routes.ts`

Todas las rutas son hijas del componente `TabsPage` (la barra de navegación inferior):

| Ruta | Componente | Descripción |
|---|---|---|
| `/home` | `HomePage` | Dashboard principal |
| `/gastos` | `GastosComponent` | Lista de gastos con búsqueda/filtros |
| `/escanear` | `EscanearComponent` | Captura de tickets con cámara + IA |
| `/resumen` | `ResumenComponent` | Estadísticas y gráfico donut |
| `/nuevogasto` | `NuevogastoComponent` | Formulario para crear gasto nuevo |
| `/nuevogasto/:id` | `NuevogastoComponent` | Formulario para editar gasto existente |
| `/` | Redirige a `/home` | Ruta por defecto |

Todos los componentes usan **lazy loading** con `loadComponent`.

---

## 🔄 Flujos Principales

### Flujo 1: Agregar un Gasto Manual

```
[Home/Gastos] → Toca botón FAB (+)
    → Navega a /nuevogasto
    → Usuario llena el formulario (concepto, monto, fecha, categoría, método)
    → Toca "Guardar"
    → NuevogastoComponent.guardar()
        → Mapea categoría string → categoria_id
        → Mapea metodoPago string → metodo_pago_id
        → supabase.insertarGasto(gastoData)
            → INSERT INTO gastos ... RETURNING *
    → Navega a /gastos (lista actualizada)
```

### Flujo 2: Escanear un Ticket con IA

```
[Home/Tabs] → Toca "Escanear"
    → Navega a /escanear
    → EscanearComponent inicializa cámara
    → Usuario toma foto o selecciona de galería
    → Toca "Analizar con IA"
    → EscanearComponent.analizarConIA()
        → gemini.analizarTicket(base64Image)
            → POST a Gemini API con imagen + prompt
            → Gemini analiza la imagen y devuelve JSON
            → Parsea respuesta → TicketData
        → Valida fecha (si no es del mes actual, usa hoy)
        → Navega a /nuevogasto?concepto=...&monto=...&desde_ia=true
    → NuevogastoComponent.ionViewDidEnter()
        → Lee query params
        → Pre-llena formulario con patchValue()
        → Muestra banner "Datos extraídos automáticamente"
    → Usuario revisa/ajusta datos → "Guardar"
    → supabase.insertarGasto(gastoData) → INSERT
```

### Flujo 3: Editar un Gasto Existente

```
[Gastos] → Toca icono de editar (lápiz) en un gasto
    → GastosComponent.editarGasto(gasto)
    → Navega a /nuevogasto/42 (donde 42 es el gasto.id)
    → NuevogastoComponent.ngOnInit()
        → Detecta parámetro :id → modoEdicion = true
        → cargarGasto(42)
            → supabase.obtenerGastoPorId(42)
                → SELECT * FROM gastos WHERE id = 42
            → Mapeo inverso: categoria_id → string, metodo_pago_id → string
            → patchValue() → pre-llena formulario
    → Usuario modifica datos → "Actualizar"
    → supabase.actualizarGasto(42, gastoData) → UPDATE
    → Navega a /gastos
```

### Flujo 4: Eliminar un Gasto

```
[Gastos] → Toca icono de eliminar (basura) en un gasto
    → GastosComponent.confirmarEliminar(gasto)
        → Muestra AlertController: "¿Eliminar 'Walmart'?"
        → [Cancelar] → cierra el diálogo
        → [Eliminar] → eliminarGasto(gasto)
            → supabase.eliminarGasto(gasto.id)
                → DELETE FROM gastos WHERE id = 42
            → cargarGastos() → recarga la lista
```

### Flujo 5: Ver Resumen Estadístico

```
[Tabs] → Toca "Resumen"
    → Navega a /resumen
    → ResumenComponent.ionViewWillEnter()
        → cargarDatos()
            → Promise.all:
                → supabase.obtenerGastosDelMes() → gastos mes actual
                → obtenerGastosMesPasado() → filtra gastos del mes anterior
        → Signals se actualizan → Computed properties recalculan:
            → totalAcumulado: suma de montos
            → cambioMensual: % vs. mes pasado
            → categoriasResumen: desglose por categoría con %
            → donutSegments: segmentos SVG para gráfico
    → Template renderiza gráfico donut + desglose + tip motivacional
```

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd ionicPractica4/practica4

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo (navegador)
ionic serve

# 4. (Opcional) Ejecutar en dispositivo con Capacitor
ionic cap add android
ionic cap sync
ionic cap open android
```

### Requisitos

- Node.js 18+
- npm 9+
- Ionic CLI (`npm install -g @ionic/cli`)
- Cuenta de Supabase con la tabla `gastos` configurada
- Clave de API de Google Gemini con acceso al modelo `gemini-2.5-flash`
