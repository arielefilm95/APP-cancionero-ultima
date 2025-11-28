# Plan de Migración a PWA (Vite + React)

Este documento detalla el plan para reconstruir la aplicación "Cancionero" desde cero como una **Progressive Web App (PWA)** nativa, abandonando la arquitectura de React Native/Expo para la versión web.

## 1. Justificación del Cambio

La versión actual en Expo/React Native tiene limitaciones importantes en la web:
- **Problemas de compatibilidad:** Librerías como `react-native-reanimated` causan errores (`WorkletsError`).
- **Rendimiento:** El bundle de React Native Web es más pesado que una app React nativa.
- **Experiencia de Usuario:** Los gestos y la navegación nativa no siempre se traducen bien al navegador.

**Solución:** Reconstruir usando **Vite + React**, un stack estándar, ligero y optimizado para la web.

## 2. Stack Tecnológico Propuesto

- **Build Tool:** [Vite](https://vitejs.dev/) (Rapidísimo, estándar moderno).
- **Framework:** [React 19](https://react.dev/) (Aprovechando las últimas features).
- **Lenguaje:** TypeScript (Strict mode).
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (Para desarrollo rápido y responsive) o CSS Modules.
- **Base de Datos (Offline):** 
  - Opción A (Recomendada): **`wa-sqlite`** (SQLite en WebAssembly, compatible con la DB actual).
  - Opción B: **`sql.js`** (Más simple, pero carga toda la DB en memoria).
- **PWA:** `vite-plugin-pwa` (Manejo automático de Service Workers y manifiesto).
- **Routing:** `react-router-dom` (Estándar para navegación web).
- **Iconos:** `lucide-react` o `react-icons`.

## 3. Estrategia de Migración de Datos

La estructura de la base de datos actual (`assets/db/cancionero-v3.db`) es sólida y **se mantendrá**.

1. **Reutilización de DB:** La nueva PWA cargará el archivo `.db` existente en el navegador usando `wa-sqlite`.
2. **Esquema:** Las tablas `songs`, `collections`, `user_overrides` se mantienen idénticas.
3. **Lógica de Negocio:** Se migrarán los algoritmos de transposición (`src/core/chords/`) de TypeScript a la nueva app (copiar y pegar, son compatibles).

## 4. Pasos para la Reconstrucción

### Fase 1: Configuración Inicial y Assets
1. Crear proyecto: `npm create vite@latest cancionero-pwa -- --template react-ts`
2. Instalar dependencias: `npm install react-router-dom wa-sqlite vite-plugin-pwa tailwindcss ...`
3. **MIGRACIÓN DE ASSETS CRÍTICOS (IMPORTANTE):**
   - Copiar `cancionero-app/assets/fonts/` -> `cancionero-pwa/public/fonts/`
     - *Fuentes requeridas:* `appSono_proportional-*.ttf` (Regular, Medium, SemiBold).
   - Copiar `cancionero-app/assets/data/songs.json` -> `cancionero-pwa/public/data/songs.json`
     - *Nota:* Este archivo es la **fuente de verdad** de las canciones.
   - Copiar `cancionero-app/assets/db/cancionero-v3.db` -> `cancionero-pwa/public/db/` (opcional si se hidrata desde JSON).

4. **Configuración de Fuentes (CSS):**
   - Configurar `@font-face` en `index.css` para usar la familia "AppSono".
   - Asegurar que Tailwind use "AppSono" como fuente principal (`font-sans`).

### Fase 2: Capa de Datos (Core)
1. Implementar servicio de base de datos (`src/db/client.ts`) usando `wa-sqlite`.
2. **Implementar Hidratación:** Crear script para leer `public/data/songs.json` e insertar las canciones en SQLite si la base de datos está vacía. Esto asegura que siempre tengamos la última versión de las canciones.
3. Migrar `src/core/chords/` (lógica de acordes) al nuevo proyecto.

### Fase 3: Componentes UI
1. Crear Layout principal (Header, Navegación).
2. Implementar **Lista de Canciones** (virtualizada para performance).
3. Implementar **Visor de Canciones** (renderizado de letra + acordes).
   - *Mejora:* Usar HTML/CSS grid para alinear acordes en lugar de posición absoluta si es posible.
4. Implementar **Transposición** (usando la lógica migrada).

### Fase 4: Funcionalidades Avanzadas
1. Implementar **Búsqueda y Filtros**.
2. Implementar **Colecciones** (CRUD local).
3. Implementar **Edición** (guardar en `user_overrides`).

### Fase 5: Despliegue
1. Configurar `vercel.json` (simple, sin headers complejos de SharedArrayBuffer si usamos `wa-sqlite` en modo básico, o configurarlos si usamos modo optimizado).
2. Desplegar a Vercel.

## 5. Estructura de Carpetas Sugerida (Nuevo Proyecto)

```
src/
├── assets/          # Fuentes, imágenes
├── components/      # Botones, Inputs, Cards
├── core/            # Lógica de negocio (Acordes, Parsers) - MIGRADO
├── db/              # Cliente SQLite y DAOs
├── hooks/           # useSongs, useSettings
├── layouts/         # MainLayout
├── pages/           # Home, SongDetail, EditSong, Settings
├── styles/          # Global CSS / Tailwind
├── App.tsx
└── main.tsx
```

## 6. Ventajas de este enfoque
- **Cero dependencias nativas:** No más errores de compilación de Android/iOS.
- **Offline real:** La PWA se instala y funciona sin internet igual que la app nativa.
- **Desarrollo rápido:** Hot Module Replacement (HMR) de Vite es instantáneo.
