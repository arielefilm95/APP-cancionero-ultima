# Funcionalidades Detalladas

## 1. Visualización de Canciones

### Pantalla: `SongScreen.tsx`

#### Funcionalidades Base

**Visualización de letras y acordes:**
- Letras con acordes posicionados exactamente sobre las sílabas
- Acordes usan posición `at` (índice de carácter) para ubicación precisa
- Monospace font (Sono) para alineación consistente
- Acordes en color accent con fondo semi-transparente

**Zoom y Pan:**
- Pinch-to-zoom (escala 0.5x a 4x)
- Pan (arrastrar) para mover la vista cuando está ampliada
- Valores guardados entre gestos
- Reset automático al cambiar de canción

**Navegación por gestos:**
- **Swipe izquierda:** Canción siguiente
- **Swipe derecha:** Canción anterior
- Solo funciona si hay lista de IDs (`songIds` y `currentIndex`)
- Feedback háptico al cambiar
- En landscape: áreas táctiles en bordes (50px cada lado)

**Vista Landscape:**
- Header oculto
- Overlay temporal con título (2 segundos, luego fade out)
- Gestos de sw

ipe habilitados en bordes laterales

#### Transposición en Vivo

**Modal de transposición:**
- Slider de -11 a +11 semitonos
- Vista previa del tono resultante
- Botón de reset
- Guardado automático en `user_overrides`

**Aplicación de transposición:**
- Todos los acordes transpuestos en tiempo real
- Tono mostrado en el header actualizado
- useMemo para optimizar re-renders
- No modifica la canción original, solo el override

#### Favoritos

**Marcar/Desmarcar:**
- Ícono de estrella en header (rellena si es favorito)
- Toggle con feedback háptico
- Guardado en `user_overrides.favorite`
- Visible en lista de Home con ícono

#### Comentarios de Canción

**Agregar comentario:**
- Botón "Comentarios" en menú hamburguesa
- Abre área de comentario en la parte inferior
- Modal para editar/crear comentario
- Guardado en `user_overrides.songComment`

**Visualizar comentario:**
- Área expandible en la parte inferior
- Tap en el texto para editar
- Botón X para cerrar el área
- Eliminar comentario desde el modal

#### Cambio de Notación

**Toggle latino/americano:**
- Opción en menú hamburguesa
- Aplica a todos los acordes de la canción
- Persistente via `NotationContext`
- Conversión en tiempo real

#### Colecciones

**Gestionar colecciones:**
- Modal "Añadir a colección"
- Lista de colecciones existentes con checkboxes
- Toggle para añadir/quitar de colección
- Crear nueva colección desde el modal

#### Edición Rápida

**Botón Editar:**
- En menú hamburguesa
- Navega a `EditSongScreen` con el ID de la canción

---

## 2. Búsqueda y Filtrado

### Pantalla: `HomeScreen.tsx`

#### Búsqueda de Texto

**Campo de búsqueda:**
- Búsqueda en tiempo real (debounced 300ms)
- Busca en: título, letra, ID
- Case-insensitive
- Ícono de lupa
- Botón X para limpiar

**Algoritmo:**
```typescript
// Busca en título
if (song.title.toLowerCase().includes(query.toLowerCase())) return true;

// Busca en ID (exacto)
if (song.id.toString() === query) return true;

// Busca en letras
return song.pairs.some(pair => 
  pair.lyrics.toLowerCase().includes(query.toLowerCase())
);
```

#### Filtros

**Por Tono:**
- Dropdown con todos los tonos disponibles
- Muestra solo canciones en ese tono original
- "Todos" para mostrar todas

**Por Etiquetas (Tags):**
- Chips multi-seleccionables
- Tags disponibles: Adoración, Alabanza, Navidad, etc.
- Canciones que contengan AL MENOS UNA tag seleccionada

**Por Colección:**
- Dropdown con colecciones del usuario
- Muestra canciones de esa colección en su orden específico
- "Todas" para mostrar todo el repertorio

**Solo Favoritos:**
- Toggle switch
- Filtra canciones con `favorite: true` en overrides

**Combinación de filtros:**
- Los filtros son acumulativos (AND)
- Primero aplica texto, luego tono, luego tags, luego favoritos

#### Ordenamiento

**Opciones:**
- **Por Título** (A-Z)
- **Por ID** (numérico)
- **Por Fecha** (últimas añadidas primero, basado en ID)
- **Por Colección** (orden definido en `collection_songs.order_index`)

**Persistencia:**
- El orden se mantiene entre sesiones
- Excepto en colecciones (siempre respeta el orden de la colección)

#### Vista de Lista

**FlatList optimizada:**
- `windowSize={10}` para performance
- `removeClippedSubviews={true}`
- Bottom refresh para actualizar

**Item de canción:**
- Título (con ID al inicio)
- Tono, compás y BPM
- Ícono de favorito si aplica
- Tags como chips
- Tap para abrir `SongScreen`
- Long press para opciones (editar, favorito)

#### Scroll Persistente

**Funcionamiento:**
- Al volver de `SongScreen`, scroll automático al último visitado
- Usa `AppContext.lastViewedSongId`
- `scrollToIndex` con animación
- Timeout de seguridad para evitar crashes

---

## 3. Edición de Canciones

### Pantalla: `EditSongScreen.tsx`

#### Navegación de Confirmación

**Prevención de pérdida de cambios:**
- Hook `usePreventRemove` de React Navigation
- Detecta si hay cambios sin guardar
- Alert al usuario antes de salir
- Opciones: Descartar, Cancelar, Guardar

#### Edición de Metadatos

**Modal de metadatos:**
- Título
- Tono original
- Compás (ej: 4/4, 3/4, 6/8)
- BPM (número)
- Autor
- Tags (selector múltiple con chips)

**Guardado:**
- Inmediato al cerrar modal
- Se guarda en `user_overrides.editedTitle`, etc.

#### Edición de Pares (Líneas)

**Estructura de pares:**
```typescript
{
  lyrics: string,
  chords: [{ name: string, at: number }]
}
```

**Añadir línea:**
- Botón "+" en la parte superior
- Abre modal para ingresar letra
- Crea par con letra y sin acordes
- Añade al final o en posición específica

**Editar letra:**
- Tap en la letra
- Modal con TextInput
- Actualiza inmediatamente
- Los acordes se mantienen en sus posiciones `at`

**Eliminar línea:**
- Botón "-" al lado de cada línea
- Confirmación via Alert
- Elimina el par completo

#### Edición de Acordes

**DraggableChord Component:**
Cada acorde es draggable:
- Long press (300ms) para activar drag
- Feedback háptico al start
- Visual: elevación (translateY) al drag
- Horizontal drag para cambiar posición
- Snap a posición de carácter más cercana
- `onDragEnd` actualiza el `at` del acorde

**Añadir acorde:**
- Botón "+" al lado de cada línea
- Modal pregunta: nombre de acorde y posición `at`
- Validación de nombre (acordes válidos)
- Añade a la lista de acordes del par, ordenado por `at`

**Editar acorde:**
- Tap en el acorde
- Modal para cambiar nombre
- Validación de acorde válido
- Guarda y re-renderiza

**Eliminar acorde:**
- Botón X en modal de edición
- Confirmación
- Elimina del array de acordes

#### Sistema Undo/Redo

**Implementación:**
```typescript
const [history, setHistory] = useState<Song['pairs'][]>([initialPairs]);
const [historyIndex, setHistoryIndex] = useState(0);

// Guardar estado en history
const saveToHistory = (newPairs) => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(newPairs);
  setHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
};

// Undo
const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1);
    setPairs(history[historyIndex - 1]);
  }
};

// Redo
const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1);
    setPairs(history[historyIndex + 1]);
  }
};
```

**Botones:**
- Disabled cuando no hay acción disponible
- Feedback visual (opacidad)
- Posicionados en el header

#### Backups Automáticos

**Creación de backup:**
- Al PRIMER edit (cuando no existe `user_overrides.backup`)
- Guarda copia del `body` original en `backup`
- Permite restaurar la versión original

**Restaurar:**
- Opción en menú (planeada, no implementada)

#### Guardado

**Guardado local:**
- Botón "Guardar" en header
- Guarda en `user_overrides.editedPairs`
- También guarda metadatos editados
- Confirmación visual (Toast o Alert)

**Sincronización con API local:**
- Botón "Sincronizar" (opcional)
- POST a `http://localhost:3001/save-song`
- Normaliza la canción antes de enviar
- Actualiza `assets/data/songs.json`
- **Requiere servidor corriendo**

---

## 4. Gestión de Colecciones

### Componente: `ManageCollectionsModal`

#### Listar Colecciones

**Vista:**
- FlatList de colecciones
- Checkbox al lado de cada nombre
- Checked si la canción está en esa colección
- Scroll si hay muchas colecciones

#### Toggle Canción en Colección

**Añadir:**
```sql
INSERT INTO collection_songs (collection_id, song_id, order_index)
VALUES (?, ?, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM collection_songs WHERE collection_id = ?))
```
- Añade al final de la colección
- `order_index` auto-incrementado

**Quitar:**
```sql
DELETE FROM collection_songs 
WHERE collection_id = ? AND song_id = ?
```
- Remueve de la colección
- No elimina la colección si queda vacía

#### Crear Nueva Colección

**Modal anidado:**
- TextInput para nombre
- Validación: no vacío, no duplicado
- `INSERT INTO collections (name) VALUES (?)`
- Se añade a la lista inmediatamente
- La canción NO se añade automáticamente, debe checkear

#### Renombrar Colección

**Funcionalidad:**
- Long press en nombre de colección
- Modal con TextInput (valor inicial = nombre actual)
- Validación de duplicados
- `UPDATE collections SET name = ? WHERE id = ?`

#### Eliminar Colección

**Funcionalidad:**
- Botón basura al lado de cada colección
- Confirmación Alert
- Elimina primero relaciones: `DELETE FROM collection_songs WHERE collection_id = ?`
- Luego elimina colección: `DELETE FROM collections WHERE id = ?`

---

## 5. Reordenamiento de Colecciones

### Pantalla: Dentro de `HomeScreen` cuando filtra por colección

#### Drag to Reorder

**Componente: `react-native-draggable-flatlist`:**
```typescript
<DraggableFlatList
  data={songs}
  onDragEnd={({ data }) => reorderCollection(data)}
  renderItem={({ item, drag }) => (
    <DraggableSongItem
      song={item}
      onLongPress={drag}
    />
  )}
/>
```

**Actualización de orden:**
```typescript
const reorderCollection = (newOrder: Song[]) => {
  newOrder.forEach((song, index) => {
    db.run(
      `UPDATE collection_songs 
       SET order_index = ? 
       WHERE collection_id = ? AND song_id = ?`,
      [index, collectionId, song.id]
    );
  });
};
```

**Visual:**
- Long press inicia drag
- Ítem se eleva visualmente
- Swipe actions disabled durante drag
- Haptic feedback al soltar

---

## 6. Personalización

### Temas (Claro/Oscuro)

**ThemeContext y ThemeProvider:**
```typescript
const lightTheme = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  textPrimary: '#000000',
  textSecondary: '#666666',
  accent: '#007AFF',
  border: '#E0E0E0',
  // ... más colores
};

const darkTheme = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  accent: '#0A84FF',
  border: '#38383A',
  // ... más colores
};
```

**Toggle:**
- Botón en `SettingsModal`
- Solo cambia `theme` state
- Todos los componentes usan `useTheme()` hook
- Persistido en AsyncStorage

### Fuentes

**FontContext y FontProvider:**
- **Opciones:** 'AppSono-Regular', 'AppSono-Medium', 'AppSono-SemiBold'
- Cambia solo familia de fuente, no tamaño
- Selector en `SettingsModal`
- Persistido en AsyncStorage
- Carga fuentes desde `assets/fonts/` en App.tsx

**Fuentes incluidas:**
- Sono-Light.ttf
- Sono-Regular.ttf
- Sono-Medium.ttf
- Sono-SemiBold.ttf

### Notación de Acordes

**NotationContext:**
- **latina:** Do, Re, Mi, Fa, Sol, La, Si
- **american:** C, D, E, F, G, A, B

**Toggle:**
- Opción en header menu de `SongScreen`
- Conversión instantánea de todos los acordes
- Usa `formatChord()` de `transposition.ts`
- Persistido en AsyncStorage

**Conversión:**
```typescript
const toAmerican = {
  'Do': 'C', 'Re': 'D', 'Mi': 'E',
  'Fa': 'F', 'Sol': 'G', 'La': 'A', 'Si': 'B'
};

const toLatin = {
  'C': 'Do', 'D': 'Re', 'E': 'Mi',
  'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si'
};
```

---

## 7. Autenticación (Supabase)

### AuthContext y Supabase

**Setup:**
```typescript
const supabase = createClient(
  'https://nwdwdgldnwvmfcktgmjv.supabase.co',
  'ANON_KEY_PLACEHOLDER'
);
```

**Funciones:**

**Sign Up:**
```typescript
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
};
```

**Sign In:**
- NO está en la interfaz del contexto, pero se usa como:
```typescript
const { data } = await (supabase.auth as any).signInWithPassword({
  email, password
});
```

**Sign Out:**
```typescript
const signOut = async () => {
  await supabase.auth.signOut();
  setUser(null);
};
```

**Session Listener:**
```typescript
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null);
  });
}, []);
```

### Pantalla: `AuthScreen.tsx`

**UI:**
- Tabs: Login / Registro
- Campos: Email, Password
- Botón de acción (Ingresar / Registrarse)
- Manejo de errores visual

**Flujo:**
1. Usuario ingresa credenciales
2. Llama a `signUp()` o `signIn()`
3. Si éxito → `user` se actualiza en contexto
4. Navega automáticamente a Home

---

## 8. Grupos (Supabase)

### Pantalla: `GroupsScreen.tsx`

**Listar grupos:**
- Obtiene grupos del usuario actual
- Muestra nombre y rol (admin/member)
- FlatList

**Crear grupo:**
- Modal con TextInput para nombre
- Llama a `groupService.createGroup(name, userId)`
- Inserta en tabla `groups`
- Añade creador como miembro con rol 'admin'

**Gestionar miembros:**
- Ver lista actual de miembros
- Añadir por email via `groupService.addMember(groupId, email)`
- Solo admins pueden añadir/eliminar

**Servicio: `groupService.ts`**
```typescript
export const createGroup = async (name: string, userId: string) => {
  const { data: group } = await supabase
    .from('groups')
    .insert({ name, owner_id: userId })
    .select()
    .single();
    
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' });
    
  return group;
};
```

---

## 9. Transposición de Acordes (Detalle Técnico)

### Algoritmo de `transposeChord()`

**Pasos:**
1. Parse el acorde (base, alteración, tipo, bajo)
2. Encuentra índice en círculo cromático
3. Suma semitonos (con wraparound en 12)
4. Reconstruye el acorde con nueva base
5. Mantiene alteraciones, tipo y bajo

**Círculo cromático:**
```typescript
const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
```

**Ejemplo:**
```typescript
transposeChord('Am', 2, 'american')
// Am → Bm

transposeChord('C/E', 5, 'american')
// C/E → F/A

transposeChord('Gmaj7', -3, 'latin')
// Gmaj7 → Mibmaj7
```

**Casos especiales:**
- Acordes con bajo: transpone ambos (acorde y bajo)
- Sostenidos/bemoles: intenta mantener la alteración original
- Notación latina: convierte a americana, transpone, vuelve a latina

---

## 10. Offline-First y Sincronización

### Concepto

**Toda la app funciona offline:**
- Base de datos SQLite local
- No requiere conexión para ver/editar canciones
- Cambios se guardan inmediatamente en local

### User Overrides

**Propósito:**
- Separar cambios del usuario de la DB original
- Permite restaurar versión original
- Facilita sincronización futura

**Estructura de `override_data` (JSON):**
```json
{
  "favorite": true,
  "transpose": 2,
  "songComment": "Usar en tono G para María",
  "editedTitle": "Título Editado",
  "editedKey": "G",
  "editedPairs": [
    { "lyrics": "...", "chords": [...] }
  ],
  "backup": [
    { "lyrics": "original...", "chords": [...] }
  ],
  "collectionOrders": { "1": 0, "2": 5 }
}
```

### Sincronización Planeda (No Implementada)

**Componentes necesarios:**
1. **Backend:** Supabase o Firebase
2. **Tabla remota:** `user_songs` con columna `override_data`
3. **Conflict resolution:** Last-write-wins o manual
4. **Cola offline:** Guardar cambios locales para subir cuando vuelva conexión
5. **Merge logic:** Aplicar cambios remotos sin perder locales

**Flujo propuesto:**
```
User edits → Local SQLite → Sync queue
                ↓
        When online → Backend API
                ↓
        Fetch latest → Merge → Update local
```

---

## 11. Importación de Canciones

### Parser: `src/core/import/parser.js`

**Formatos soportados:**
- **TXT:** Letras con acordes en líneas separadas
- **TSV:** Metadata (ID, título, tono, compás, etc.)

**Parsing de acordes:**
```javascript
// Detecta líneas de acordes (solo acordes, sin letras)
const isChordLine = (line) => {
  const words = line.trim().split(/\s+/);
  return words.every(word => isChord(word));
};

// Parse acordes con posiciones
const parseChordLine = (chordLine, lyricLine) => {
  const chords = [];
  let currentPos = 0;
  
  chordLine.split(/\s+/).forEach(chord => {
    const at = chordLine.indexOf(chord, currentPos);
    chords.push({ name: chord, at });
    currentPos = at + chord.length;
  });
  
  return { lyrics: lyricLine, chords };
};
```

**Uso:**
```javascript
const songs = parseTextFile(fileContent, metadata);
await insertSongs(db, songs);
```

### Scripts de Importación

**`scripts/import-songs.js`:**
- Lee TSV de metadata
- Lee archivos TXT correspondientes
- Parsea y normaliza
- Inserta en SQLite
- Actualiza JSON maestro

**Ejemplo de metadata TSV:**
```
id	title	key	timeSignature	bpm	author
1	Sublime Gracia	G	4/4	80	John Newton
2	Cuán Grande Es Él	C	3/4	90	Carl Boberg
```

---

## Resumen de Funcionalidades por Pantalla

### HomeScreen
- ✅ Búsqueda de texto
- ✅ Filtros (tono, tags, colección, favoritos)
- ✅ Ordenamiento (título, ID, fecha)
- ✅ Scroll persistente
- ✅ Crear/editar/eliminar colecciones
- ✅ Reordenar canciones en colecciones

### SongScreen
- ✅ Visualización con acordes
- ✅ Zoom y pan
- ✅ Navegación por swipe
- ✅ Transposición
- ✅ Favoritos
- ✅ Comentarios
- ✅ Toggle notación
- ✅ Gestionar colecciones
- ✅ Navegar a editar

### EditSongScreen
- ✅ Editar metadatos (título, tono, etc.)
- ✅ Añadir/editar/eliminar líneas
- ✅ Drag & drop acordes
- ✅ Editar/eliminar acordes
- ✅ Undo/Redo
- ✅ Backups automáticos
- ✅ Guardar local
- ⏳ Sincronizar con API (opcional)

### AuthScreen
- ✅ Login
- ✅ Registro
- ✅ Logout

### GroupsScreen
- ✅ Listar grupos
- ✅ Crear grupo
- ⏳ Gestionar miembros
