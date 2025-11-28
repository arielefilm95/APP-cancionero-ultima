# Base de Datos y Modelos

## Esquema SQLite

### Tabla: `songs`

**Estructura:**
```sql
CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  key TEXT,
  timeSignature TEXT,
  bpm INTEGER,
  tags TEXT,
  author TEXT,
  body TEXT NOT NULL
);
```

**Campos:**
- `id` - ID único de la canción (manual, no auto-increment)
- `title` - Título de la canción
- `key` - Tono original (ej: "C", "Am", "Fa", "Rem")
- `timeSignature` - Compás (ej: "4/4", "3/4", "6/8")
- `bpm` - Beats por minuto
- `tags` - JSON array de strings (ej: `["Adoración", "Navidad"]`)
- `author` - Autor/compositor
- `body` - JSON con pares de letra/acordes

**Formato de `body`:**
```json
[
  {
    "lyrics": "Sublime gracia del Señor",
    "chords": [
      { "name": "C", "at": 0 },
      { "name": "Am", "at": 8 },
      { "name": "F", "at": 16 }
    ]
  },
  {
    "lyrics": "Que un pecador pudo salvar",
    "chords": [
      { "name": "C", "at": 0 },
      { "name": "G", "at": 12 }
    ]
  }
]
```

**Índices:**
```sql
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_key ON songs(key);
```

### Tabla: `collections`

**Estructura:**
```sql
CREATE TABLE collections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
```

**Campos:**
- `id` - ID auto-generado
- `name` - Nombre de la colección (único)

**Ejemplos:**
- "Alabanza - Domingos"
- "Navidad 2024"
- "Canciones Infantiles"

### Tabla: `collection_songs`

**Estructura:**
```sql
CREATE TABLE collection_songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

**Campos:**
- `collection_id` - Referencia a `collections.id`
- `song_id` - Referencia a `songs.id`
- `order_index` - Posición en la colección (0, 1, 2, ...)

**Índices:**
```sql
CREATE INDEX idx_collection_songs_collection ON collection_songs(collection_id);
CREATE INDEX idx_collection_songs_song ON collection_songs(song_id);
CREATE UNIQUE INDEX idx_collection_songs_unique ON collection_songs(collection_id, song_id);
```

**Query para obtener canciones de una colección:**
```sql
SELECT songs.* 
FROM songs
INNER JOIN collection_songs ON songs.id = collection_songs.song_id
WHERE collection_songs.collection_id = ?
ORDER BY collection_songs.order_index ASC
```

### Tabla: `user_overrides`

**Estructura:**
```sql
CREATE TABLE user_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER UNIQUE NOT NULL,
  override_data TEXT NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);
```

**Campos:**
- `song_id` - Referencia a `songs.id` (único, solo un override por canción)
- `override_data` - JSON con todos los cambios del usuario

**Formato de `override_data`:**
```json
{
  "favorite": true,
  "transpose": 2,
  "songComment": "Cantar en G para María",
  "editedTitle": "Título Modificado",
  "editedKey": "G",
  "editedTimeSignature": "3/4",
  "editedBpm": 85,
  "editedAuthor": "Autor Modificado",
  "editedTags": ["Tag1", "Tag2"],
  "editedPairs": [
    {
      "lyrics": "Letra modificada",
      "chords": [
        { "name": "Em", "at": 0 }
      ]
    }
  ],
  "backup": [
    {
      "lyrics": "Letra original",
      "chords": [
        { "name": "C", "at": 0 }
      ]
    }
  ],
  "collectionOrders": {
    "1": 0,
    "2": 5
  }
}
```

**Campos opcionales:**
- `favorite` - Boolean, si es favorito
- `transpose` - Number, semitonos de transposición (-11 a +11)
- `songComment` - String, comentario del usuario
- `editedTitle` - String, título editado
- `editedKey` - String, tono editado
- `editedTimeSignature` - String, compás editado
- `editedBpm` - Number, BPM editado
- `editedAuthor` - String, autor editado
- `editedTags` - Array, tags editados
- `editedPairs` - Array, body editado
- `backup` - Array, copia del body original (antes del primer edit)
- `collectionOrders` - Object, posiciones en colecciones específicas

---

## Interfaces TypeScript

### Song
```typescript
export interface Song {
  id: number;
  title: string;
  key: string;
  timeSignature: string;
  bpm: number;
  tags: string[];
  author: string;
  pairs: {
    lyrics: string;
    chords: {
      name: string;
      at: number;
    }[];
  }[];
  
  // Campos de overrides (opcionales, añadidos al merge)
  favorite?: boolean;
  transpose?: number;
  songComment?: string;
  editedTitle?: string;
  editedKey?: string;
  // ... resto de campos editables
}
```

### Collection
```typescript
export interface Collection {
  id: number;
  name: string;
}
```

### UserOverrideData
```typescript
export interface UserOverrideData {
  favorite?: boolean;
  transpose?: number;
  songComment?: string;
  editedTitle?: string;
  editedKey?: string;
  editedTimeSignature?: string;
  editedBpm?: number;
  editedAuthor?: string;
  editedTags?: string[];
  editedPairs?: Song['pairs'];
  backup?: Song['pairs'];
  collectionOrders?: { [collectionId: number]: number };
}
```

---

## Funciones de Acceso a Datos

### database.ts (Estrategia PWA)

En la nueva arquitectura PWA, usamos **`wa-sqlite`** para interactuar con la base de datos SQLite directamente en el navegador.

**Inicialización (Web):**
```typescript
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';

let db: SQLiteAPI | null = null;

export async function getDb() {
  if (db) return db;

  const module = await SQLiteESMFactory();
  const sqlite3 = SQLite.Factory(module);
  
  // Usar IndexedDB como backend de almacenamiento (persistente)
  const vfs = new IDBBatchAtomicVFS('cancionero-db');
  sqlite3.vfs_register(vfs, true);

  db = await sqlite3.open_v2('cancionero-v3.db');
  
  // Cargar DB inicial si está vacía
  await initializeDbIfNeeded(db);
  
  return db;
}
```

**Diferencias con Expo:**
- No usamos `expo-sqlite`.
- La base de datos vive en IndexedDB (a través del VFS de wa-sqlite).
- Es necesario copiar el archivo `.db` inicial desde `public/` a IndexedDB en la primera carga.

**Ventajas:**
- Compatibilidad total con el archivo `.db` existente.
- Performance nativa (WASM).
- Persistencia real offline.

**getSongById():**
```typescript
export function getSongById(db: SQLite.SQLiteDatabase, id: number): Song | null {
  const result = db.getFirstSync<any>(
    'SELECT * FROM songs WHERE id = ?',
    [id]
  );
  
  if (!result) return null;
  
  const song: Song = {
    ...result,
    tags: JSON.parse(result.tags || '[]'),
    pairs: JSON.parse(result.body)
  };
  
  // Aplicar overrides
  const override = getUserOverride(db, id);
  if (override) {
    if (override.favorite !== undefined) song.favorite = override.favorite;
    if (override.transpose !== undefined) song.transpose = override.transpose;
    if (override.songComment) song.songComment = override.songComment;
    if (override.editedTitle) song.title = override.editedTitle;
    if (override.editedPairs) song.pairs = override.editedPairs;
    // ... resto de overrides
  }
  
  return song;
}
```

**getUserOverride():**
```typescript
export function getUserOverride(
  db: SQLite.SQLiteDatabase,
  songId: number
): UserOverrideData | null {
  const result = db.getFirstSync<{ override_data: string }>(
    'SELECT override_data FROM user_overrides WHERE song_id = ?',
    [songId]
  );
  
  if (!result) return null;
  
  return JSON.parse(result.override_data);
}
```

**saveUserOverride():**
```typescript
export function saveUserOverride(
  db: SQLite.SQLiteDatabase,
  songId: number,
  data: Partial<UserOverrideData>
) {
  // Obtener override existente (si hay)
  const existing = getUserOverride(db, songId) || {};
  
  // Mergear cambios
  const updated = { ...existing, ...data };
  
  // Upsert
  db.runSync(
    `INSERT INTO user_overrides (song_id, override_data) 
     VALUES (?, ?) 
     ON CONFLICT(song_id) DO UPDATE SET override_data = excluded.override_data`,
    [songId, JSON.stringify(updated)]
  );
}
```

### songsDao.ts

**getAllSongs():**
```typescript
export function getAllSongs(db: SQLite.SQLiteDatabase): Song[] {
  const results = db.getAllSync<any>('SELECT * FROM songs ORDER BY id');
  
  return results.map(row => {
    const song: Song = {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      pairs: JSON.parse(row.body)
    };
    
    // Aplicar overrides
    const override = getUserOverride(db, row.id);
    // ... merge logic
    
    return song;
  });
}
```

**searchSongs():**
```typescript
export function searchSongs(
  db: SQLite.SQLiteDatabase,
  query: string
): Song[] {
  const allSongs = getAllSongs(db);
  
  const lowerQuery = query.toLowerCase();
  
  return allSongs.filter(song => {
    // Buscar en título
    if (song.title.toLowerCase().includes(lowerQuery)) return true;
    
    // Buscar por ID exacto
    if (song.id.toString() === query) return true;
    
    // Buscar en letras
    return song.pairs.some(pair => 
      pair.lyrics.toLowerCase().includes(lowerQuery)
    );
  });
}
```

**getFavoriteSongs():**
```typescript
export function getFavoriteSongs(db: SQLite.SQLiteDatabase): Song[] {
  const allSongs = getAllSongs(db);
  return allSongs.filter(song => song.favorite === true);
}
```

**getCollections():**
```typescript
export function getCollections(db: SQLite.SQLiteDatabase): Collection[] {
  return db.getAllSync<Collection>(
    'SELECT * FROM collections ORDER BY name'
  );
}
```

**getSongsInCollection():**
```typescript
export function getSongsInCollection(
  db: SQLite.SQLiteDatabase,
  collectionId: number
): Song[] {
  const results = db.getAllSync<any>(
    `SELECT songs.* 
     FROM songs
     INNER JOIN collection_songs ON songs.id = collection_songs.song_id
     WHERE collection_songs.collection_id = ?
     ORDER BY collection_songs.order_index ASC`,
    [collectionId]
  );
  
  return results.map(row => {
    // Parse y merge overrides
    // ...
  });
}
```

**insertSongs():**
```typescript
export function insertSongs(
  db: SQLite.SQLiteDatabase,
  songs: Omit<Song, 'favorite' | 'transpose'...>[]
) {
  db.withTransactionSync(() => {
    for (const song of songs) {
      db.runSync(
        `INSERT OR REPLACE INTO songs 
         (id, title, key, timeSignature, bpm, tags, author, body)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          song.id,
          song.title,
          song.key,
          song.timeSignature,
          song.bpm,
          JSON.stringify(song.tags),
          song.author,
          JSON.stringify(song.pairs)
        ]
      );
    }
  });
}
```

---

## Migraciones y Versionado

### Estrategia Actual
- No hay sistema de migraciones formal
- La DB se copia de `assets/db/` en primera instalación
- Cambios de esquema requieren:
  1. Actualizar `cancionero-v3.db`
  2. Incrementar versión (ej: `cancionero-v4.db`)
  3. Actualizar referencia en `getDb()`

### Recomendación para Futuro
Implementar migraciones con:
```typescript
const CURRENT_VERSION = 3;

async function migrateDb(db: SQLite.SQLiteDatabase, fromVersion: number) {
  if (fromVersion < 2) {
    await db.execAsync('ALTER TABLE songs ADD COLUMN bpm INTEGER');
  }
  if (fromVersion < 3) {
    await db.execAsync('CREATE TABLE user_overrides (...)');
  }
  // ...
  await AsyncStorage.setItem('db_version', CURRENT_VERSION.toString());
}
```

---

## Seeds y Datos de Prueba

### songs-seed.json
- Ubicación: `src/db/songs-seed.json`
- Subset de 100 canciones para Web
- Usado por `initializeWebDb()`

**Formato:**
```json
[
  {
    "id": 1,
    "title": "Sublime Gracia",
    "key": "G",
    "timeSignature": "4/4",
    "bpm": 80,
    "tags": ["Adoración"],
    "author": "John Newton",
    "body": [...]
  },
  ...
]
```

### JSON Maestro
- Ubicación: `assets/data/songs.json`
- Todas las canciones (~600)
- Sincronizado con API local
- Generado con `scripts/export-songs-json.js`

---

## Esquema Supabase (Planificado)

### Tabla: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trigger para crear perfil al registrarse
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Tabla: `groups`
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they belong to"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );
```

### Tabla: `group_members`
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );
```

### Tabla: `user_songs` (Planeada para Sync)
```sql
CREATE TABLE user_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  song_id INTEGER NOT NULL,
  override_data JSONB,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- RLS
CREATE POLICY "Users can manage their own song data"
  ON user_songs
  USING (user_id = auth.uid());
```
