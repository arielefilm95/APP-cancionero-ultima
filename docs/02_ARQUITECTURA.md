# Arquitectura y Estructura de Archivos

## Estructura de Carpetas (PWA Vite)

```
cancionero-pwa/
├── public/
│   ├── db/
│   │   └── cancionero-v3.db       # Base de datos SQLite (opcional/backup)
│   ├── data/
│   │   └── songs.json             # FUENTE DE VERDAD (Todas las canciones)
│   ├── fonts/                     # Fuentes Sono (AppSono-*.ttf)
│   └── manifest.webmanifest       # Configuración PWA
├── src/
│   ├── assets/                   # Imágenes, SVGs
│   ├── components/               # Componentes React (UI)
│   │   ├── ui/                  # Botones, Inputs, Cards
│   │   └── features/            # Componentes complejos (SongViewer)
│   ├── core/                     # Lógica de Negocio (Agnóstica de UI)
│   │   ├── chords/              # Sistema de transposición (Migrado)
│   │   └── parsers/             # Parsers de formato de canción
│   ├── db/                       # Capa de Datos
│   │   ├── client.ts            # Cliente wa-sqlite
│   │   └── dao/                 # Data Access Objects
│   ├── hooks/                    # Custom React Hooks
│   ├── layouts/                  # Layouts de página (MainLayout)
│   ├── pages/                    # Vistas (Rutas)
│   │   ├── Home.tsx
│   │   ├── SongDetail.tsx
│   │   └── EditSong.tsx
│   ├── styles/                   # CSS Global / Tailwind config
│   ├── App.tsx                   # Root Component + Providers
│   └── main.tsx                  # Entry Point
├── index.html                    # Entry Point HTML
├── vite.config.ts                # Configuración de Vite + Plugins
├── tailwind.config.js            # Configuración de Tailwind
└── package.json
```

## Archivos Críticos

### Configuración

#### `vite.config.ts`
- Configuración de plugins: `vite-plugin-pwa`, `react`.
- Configuración de alias (`@/` -> `src/`).
- Configuración de headers para `SharedArrayBuffer` (necesario para SQLite optimizado).

#### `tailwind.config.js`
- Definición de tema (colores, fuentes).
- Configuración de content paths.

#### `package.json`
- Scripts: `dev`, `build`, `preview`.
- Dependencias clave: `react`, `react-router-dom`, `wa-sqlite`.

### Entrada de la App

#### `index.html`
- Punto de montaje del DOM (`<div id="root">`).
- Carga de fuentes y meta tags para PWA.

#### `src/main.tsx`
- Inicialización de React.
- Setup de Service Workers (PWA).
- Montaje de `RouterProvider`.

## Flujo de Datos (PWA)

```
Usuario → Página (React Router) → Hook (useSongs) → DAO → wa-sqlite → SQLite DB (WASM)
                                        ↓
                                  Estado Local (React Query / Context)
```

## Base de Datos

### `assets/db/cancionero-v3.db`
Base de datos SQLite con las siguientes tablas:

**Tabla: `songs`**
```sql
CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  key TEXT,           -- Tono original (ej: "C", "Am")
  timeSignature TEXT, -- Compás (ej: "4/4")
  bpm INTEGER,
  tags TEXT,          -- JSON array de strings
  author TEXT,
  body TEXT NOT NULL  -- JSON con pares {lyrics, chords}
);
```

**Tabla: `collections`**
```sql
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

**Tabla: `collection_songs`**
```sql
CREATE TABLE collection_songs (
  collection_id INTEGER,
  song_id INTEGER,
  order_index INTEGER,  -- Para ordenar canciones
  FOREIGN KEY (collection_id) REFERENCES collections(id),
  FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

**Tabla: `user_overrides`**
```sql
CREATE TABLE user_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER UNIQUE,
  override_data TEXT,  -- JSON con todos los cambios del usuario
  FOREIGN KEY (song_id) REFERENCES songs(id)
);
```

### `assets/data/songs.json`
- JSON maestro con todas las canciones
- Usado por scripts de import/export
- Sincronizado con la API local

## Capa de Base de Datos

### `src/db/database.ts`
**Funciones principales:**
- `getDb()` - Abre/copia la base de datos
- `initializeWebDb()` - Inicializa DB en Web desde seed
- `getSongById(db, id)` - Obtiene canción con overrides aplicados
- `getUserOverride(db, songId)` - Obtiene overrides de una canción
- `saveUserOverride(db, songId, data)` - Guarda cambios del usuario

**Interfaces TypeScript:**
```typescript
interface Song {
  id: number;
  title: string;
  key: string;
  timeSignature: string;
  bpm: number;
  tags: string[];
  author: string;
  pairs: {
    lyrics: string;
    chords: { name: string; at: number }[];
  }[];
  // Campos de overrides (opcionales)
  favorite?: boolean;
  transpose?: number;
  songComment?: string;
  // ... más campos editados
}

interface UserOverrideData {
  favorite?: boolean;
  transpose?: number;
  songComment?: string;
  editedPairs?: Song['pairs'];
  // ... metadatos editados
  backup?: Song['pairs']; // Backup del body original
}
```

### `src/db/songsDao.ts`
**Funciones de consulta:**
- `getAllSongs(db)` - Obtiene todas las canciones
- `searchSongs(db, query)` - Búsqueda por texto
- `getSongsByKey(db, key)` - Filtra por tono
- `getSongsByTags(db, tags)` - Filtra por tags
- `getFavoriteSongs(db)` - Canciones favoritas
- `getCollections(db)` - Obtiene colecciones
- `getSongsInCollection(db, collectionId)` - Canciones de una colección
- `insertSongs(db, songs)` - Inserta canciones masivamente

### `src/db/songs-seed.json`
- Seed para inicializar la DB en Web
- Subset de canciones del JSON maestro

## Navegación

### `src/navigation/AppNavigator.tsx`
Stack Navigator con rutas:

```typescript
type RootStackParamList = {
  Home: undefined;
  Song: {
    songId: number;
    songIds?: number[];
    currentIndex?: number;
    animationDirection?: 'push' | 'pop';
  };
  EditSong: {
    songId: number;
  };
  Auth: undefined;
  Groups: undefined;
};
```

**Configuración:**
- Header personalizado (con tema)
- Transiciones animadas
- Deep linking support (scheme: `cancionero://`)

## Contextos

### `src/context/AppContext.tsx`
- `lastViewedSongId` - Último ID de canción visitada (para scroll en Home)

### `src/context/AuthContext.tsx`
- Cliente de Supabase
- `signUp(email, password)`
- `signOut()`
- `user` - Usuario actual (o null)

### `src/context/ThemeContext.tsx`
- `theme` - 'light' | 'dark'
- `toggleTheme()`
- `colors` - Objeto con todos los colores del tema
- Persiste en AsyncStorage

### `src/context/FontContext.tsx`
- `selectedFont` - Tamaño de fuente actual
- Opciones: 'AppSono-Regular', 'AppSono-Medium', 'AppSono-SemiBold'
- Persiste en AsyncStorage

### `src/context/NotationContext.tsx`
- `notation` - 'latin' | 'american'
- `setNotation(notation)`
- Persiste en AsyncStorage

## Sistema de Acordes

### `src/core/chords/transposition.ts`
**Funciones principales:**

```typescript
// Transponer un acorde
transposeChord(chord: string, semitones: number, notation: Notation): string

// Formatear acorde según notación
formatChord(chord: string, notation: Notation): string

// Convertir a notación latina
toLatin(chord: string): string
```

**Reconoce:**
- Acordes básicos: C, D, Em, F#
- Sostenidos/bemoles: C#, Db
- Acordes con bajo: C/E, Am/G
- Complejos: Cmaj7, Am7b5, Dsus4

### `src/core/chords/transpose.ts`
- Versión legacy/simple de transposición
- Menos features que `transposition.ts`

## API Local

### `api/server.js`
Servidor Express en puerto 3001:

**Endpoint:**
- `POST /save-song` - Guarda una canción en `songs.json`

**Uso:**
```javascript
// En EditSongScreen.tsx
const syncWithMasterFile = async () => {
  await fetch('http://localhost:3001/save-song', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalizedSong)
  });
};
```

**Nota:** Debe levantarse manualmente con `node api/server.js`

## Scripts de Utilidad

### `scripts/import-songs.js`
- Importa canciones específicas desde TXT
- Lee metadata de `../Canciones/metadata_cancionero.tsv`
- Actualiza SQLite y JSON

**Uso:**
```bash
node scripts/import-songs.js 1 2 3  # Importa canciones 1, 2 y 3
```

### `scripts/export-songs.js`
- Reconstruye archivos TXT desde DB + overrides

### `scripts/export-songs-json.js`
- Genera `assets/data/songs.json` desde SQLite

### `scripts/import-from-json.js`
- Llena SQLite desde `assets/data/songs.json`

### `scripts/clear-overrides.js`
- Limpia tabla `user_overrides`

## Dependencias Externas Críticas

### Carpeta Externa: `../Canciones/`
**Requerida por scripts** (no versionada):
```
../Canciones/
├── canciones_txt/          # TXTs de canciones
└── metadata_cancionero.tsv # Metadatos (tono, compás, etc.)
```

## Archivos de Configuración Web

### `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```
- **Headers críticos para:** expo-sqlite en Web (WASM support)

## Build Outputs

### `dist/` (Web)
- Generado por `npx expo export --platform web`
- Contiene el bundle optimizado
- Desplegado en Vercel

### `.expo/` (Cache)
- Cache de Metro bundler
- Borrar si hay problemas: `rm -rf .expo`

## Archivos de Documentación Existentes

- `README1.md` - Especificación MVP original
- `AGENT.md` - Visión y playbook extenso
- `DEPLOYMENT.md` - Guía de despliegue
- `VERCEL_SETUP.md` - Setup específico de Vercel
- `AI_OVERVIEW.md` - Resumen para IAs (este archivo que leíste)
- `EDICION_LETRAS_GUIA.md` - Guía de edición de letras
- `GUIA_REORDENAMIENTO_COLECCIONES.md` - Guía de reordenamiento
- `BOTONES_VERIFICADOS.md` - Botones verificados en UI
