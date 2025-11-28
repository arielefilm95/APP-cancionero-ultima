# Documentación de Pantallas (Screens)

## HomeScreen.tsx

**Ruta:** `src/screens/HomeScreen.tsx`

### Propósito
Pantalla principal que lista todas las canciones con búsqueda, filtros y gestión de colecciones.

### Props
```typescript
type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};
```

### Estado Principal
```typescript
const [songs, setSongs] = useState<Song[]>([]);
const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [selectedKey, setSelectedKey] = useState<string | null>(null);
const [selectedTags, setselectedTags] = useState<string[]>([]);
const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
const [sortBy, setSortBy] = useState<'title' | 'id' | 'date'>('title');
```

### Funcionalidades Clave

**loadSongs():**
- Carga canciones desde SQLite
- Aplica overrides de usuario
- Actualiza estado `songs`

**applyFilters():**
- Se ejecuta en `useEffect` cuando cambian filtros
- Cadena de filtros: texto → tono → tags → favoritos → ordenamiento
- Actualiza `filteredSongs`

**handleSongPress(songId):**
- Guarda `lastViewedSongId` en AppContext
- Genera `songIds` array y `currentIndex`
- Navega a `SongScreen`

**createCollection(name):**
- Valida nombre (no vacío, no duplicado)
- Ejecuta SQL: `INSERT INTO collections (name) VALUES (?)`
- Refresca lista

### Componentes

**SearchBar:**
- TextInput con debounce de 300ms
- Ícono de lupa
- Botón X para limpiar

**FilterSection:**
- Dropdowns para tono y colección
- Chips multi-select para tags
-  Toggle para solo favoritos

**SongList:**
- `FlatList` con `renderItem={SongCard}`
- Pull to refresh
- Scroll to index (último visitado)
- Si es colección: `DraggableFlatList` para reordenar

**SongCard:**
- Título con ID
- Metadata (tono, compás, BPM)
- Tags como chips
- Ícono de favorito
- Tap → abrir canción
- Long press → opciones

---

## SongScreen.tsx

**Ruta:** `src/screens/SongScreen.tsx`

### Propósito
Visualizador de canciones con zoom, transposición, gestos y edición rápida.

### Props
```typescript
type SongScreenRouteProp = RouteProp<RootStackParamList, 'Song'>;

interface Props {
  route: SongScreenRouteProp;
  navigation: SongScreenNavigationProp;
}

// Params
route.params = {
  songId: number;
  songIds?: number[];
  currentIndex?: number;
  animationDirection?: 'push' | 'pop';
}
```

### Estado Principal
```typescript
const [song, setSong] = useState<Song | null>(null);
const [loading, setLoading] = useState(false);
const [isFavorite, setIsFavorite] = useState(false);
const [transposeValue, setTransposeValue] = useState(0);
const [songComment, setSongComment] = useState<string | null>(null);
const [showCommentArea, setShowCommentArea] = useState(false);
```

### Shared Values (Reanimated)
```typescript
const scale = useSharedValue(1);
const translateX = useSharedValue(0);
const translateY = useSharedValue(0);
const overlayOpacity = useSharedValue(0);
```

### Gestos

**pinchGesture:**
```typescript
Gesture.Pinch()
  .onUpdate((e) => {
    scale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 4));
  })
  .onEnd(() => {
    savedScale.value = scale.value;
  })
```

**panGesture:**
- Permite mover la vista cuando está ampliada
- Guarda posición en `savedTranslateX/Y`

**flingLeft/Right:**
- Detecta swipe rápido
- Llama `goToNextSong()` o `goToPrevSong()`
- Solo funciona si hay `songIds`
- En Web: usa callbacks directos (sin worklet)
- En Native: usa `runOnJS` con refs

**composedZoomPanGesture:**
```typescript
Gesture.Simultaneous(pinchGesture, panGesture)
```

### Funciones Clave

**loadSongData():**
- Resetea zoom/pan
- Carga canción con overrides
- Establece favorito, transposición, comentario

**toggleFavorite():**
- Cambia estado local
- Guarda en `user_overrides`
- Feedback háptico

**handleTransposeChange(newValue):**
- Actualiza estado
- Guarda override
- Re-renderiza con acordes transpuestos

**transposedSong (useMemo):**
- Si transposeValue === 0 → return song original
- Sino → crea copia con acordes transpuestos
- Optimizado con memoization

### Componente SongLine

**Función pura que renderiza una línea:**
```typescript
const SongLine = ({ pair, font, notation, styles, isFirst }) => (
  <View style={[styles.linePairContainer, isFirst && styles.firstLinePair]}>
    <View style={styles.lineContent}>
      <View style={styles.chordOverlay}>
        {pair.chords.map((chord, index) => (
          <View style={[styles.chordWrapper, { left: chord.at * CHAR_WIDTH }]}>
            <Text style={[styles.chordText, { fontFamily: font }]}>
              {formatChord(chord.name, notation)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.lyricLine, { fontFamily: font }]}>
        {pair.lyrics || ' '}
      </Text>
    </View>
  </View>
);
```

**Constantes:**
```typescript
const LYRIC_FONT_SIZE = 18;
const CHORD_FONT_SIZE = 14.5;
const CHAR_WIDTH = LYRIC_FONT_SIZE * 0.6; // ~10.8px
```

### Modales

- **ManageCollectionsModal:** Añadir/quitar de colecciones
- **TransposeModal:** Slider de transposición
- **SongCommentModal:** Editar/eliminar comentario
- **SettingsModal:** Cambiar fuente (visibleSections={['fonts']})

### Vista Landscape

**Características:**
- Header ocultado
- Gestos de swipe en bordes laterales (50px)
- Overlay temporal con título (fade in → espera 2s → fade out)
- Detecta con: `useWindowDimensions()` → `isLandscape = width > height`

---

## EditSongScreen.tsx

**Ruta:** `src/screens/EditSongScreen.tsx`

### Propósito
Editor completo de canciones con drag & drop de acordes, undo/redo y guardado.

### Props
```typescript
type EditSongScreenRouteProp = RouteProp<RootStackParamList, 'EditSong'>;

interface Props {
  route: EditSongScreenRouteProp;
  navigation: StackNavigationProp<RootStackParamList, 'EditSong'>;
}

// Params
route.params = {
  songId: number;
}
```

### Estado Principal
```typescript
const [song, setSong] = useState<Song | null>(null);
const [pairs, setPairs] = useState<Song['pairs']>([]);
const [hasChanges, setHasChanges] = useState(false);
const [history, setHistory] = useState<Song['pairs'][]>([]);
const [historyIndex, setHistoryIndex] = useState(0);
```

### Prevención de Navegación

**usePreventRemove:**
```typescript
usePreventRemove(hasChanges, ({ data }) => {
  Alert.alert(
    'Cambios sin guardar',
    '¿Deseas descartar los cambios?',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
      { text: 'Guardar', onPress: () => handleSave() }
    ]
  );
});
```

### Componentes Internos

#### DraggableChord

**Props:**
```typescript
interface DraggableChordProps {
  chord: { name: string; at: number };
  lineIndex: number;
  chordIndex: number;
  onTap: () => void;
  onDragEnd: (lineIndex: number, chordIndex: number, newAt: number) => void;
}
```

**Shared Values:**
```typescript
const translateX = useSharedValue(chord.at * CHAR_WIDTH);
const translateY = useSharedValue(0);
const isDragging = useSharedValue(false);
const startX = useSharedValue(0);
```

**Gestos:**

**longPressGesture:**
- minDuration: 300ms
- onStart → runOnJS(onTap) (en Native) o onTap() (en Web)

**panGesture:**
- minDistance: 10px
- onStart → haptic feedback, guardar posición inicial, elevar (translateY)
- onUpdate → actualizar translateX
- onEnd → calcular nueva posición `at`, animar a snap, llamar onDragEnd
- onFinalize → resetear elevación

**Condicional Web/Native:**
```typescript
const longPressGesture = useMemo(() => {
  const gesture = Gesture.LongPress().minDuration(300);
  if (Platform.OS === 'web') {
    return gesture.onStart(() => onTap());
  }
  return gesture.onStart(() => {
    'worklet';
    runOnJS(onTapRef.current)();
  });
}, [onTap]);
```

### Funciones Clave

**saveToHistory(newPairs):**
- Trunca history hasta `historyIndex + 1`
- Añade nuevo estado
- Incrementa índice
- Marca `hasChanges = true`

**undo():**
- Decrementa `historyIndex`
- Aplica estado anterior
- Disabled si `historyIndex === 0`

**redo():**
- Incrementa `historyIndex`
- Aplica siguiente estado
- Disabled si `historyIndex === history.length - 1`

**handleSave():**
- Normaliza pairs (elimina pares vacíos)
- Si es PRIMER edit → crea backup
- Guarda en `user_overrides.editedPairs`
- Guarda metadatos editados
- Marca `hasChanges = false`
- Muestra confirmación

**syncWithMasterFile() (opcional):**
- Normaliza canción completa
- POST a `http://localhost:3001/save-song`
- Actualiza `songs.json`
- **Requiere API running**

**addLine(index?):**
- Abre modal con TextInput
- Crea par: `{ lyrics: text, chords: [] }`
- Inserta en posición o al final
- Llama `saveToHistory`

**removeLine(index):**
- Confirmación Alert
- Filtra pairs para eliminar índice
- Llama `saveToHistory`

**addChord(lineIndex):**
- Modal pide: nombre y posición `at`
- Valida acorde con regex
- Inserta en `pairs[lineIndex].chords`
- Ordena por `at`
- Llama `saveToHistory`

**editChord(lineIndex, chordIndex):**
- Modal muestra nombre actual
- Valida nuevo nombre
- Actualiza `pairs[lineIndex].chords[chordIndex].name`
- Llama `saveToHistory`

**removeChord(lineIndex, chordIndex):**
- Confirmación Alert
- Filtra chord del array
- Llama `saveToHistory`

**handleChordDragEnd(lineIndex, chordIndex, newAt):**
- Clamp `newAt` a límites válidos
- Actualiza `pairs[lineIndex].chords[chordIndex].at = newAt`
- Re-ordena acordes por `at`
- Llama `saveToHistory`

### Modales

- **EditChordModal:** Editar nombre de acorde
- **EditLyricModal:** Editar letra de línea
- **MetadataModal:** Editar título, tono, compás, BPM, autor, tags

### Constantes de Layout

```typescript
const CHAR_WIDTH = 10.8;
const LIFT_Y = -8; // Elevación al drag
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150
};
```

---

## AuthScreen.tsx

**Ruta:** `src/screens/AuthScreen.tsx`

### Propósito
Pantalla de autenticación con login y registro usando Supabase.

### Estado
```typescript
const [isLogin, setIsLogin] = useState(true);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Funciones

**handleAuth():**
```typescript
const handleAuth = async () => {
  setLoading(true);
  setError(null);
  
  try {
    if (isLogin) {
      await (supabase.auth as any).signInWithPassword({ email, password });
    } else {
      await signUp(email, password);
    }
    // AuthContext actualiza user automáticamente
    navigation.navigate('Home');
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};
```

### UI

**Tabs:**
- Botones para toggle Login/Registro
- Cambia título y botón de acción

**Form:**
- TextInput para email (keyboardType="email-address")
- TextInput para password (secureTextEntry)
- Botón de acción (Ingresar/Registrarse)
- Loading indicator
- Mensaje de error (si aplica)

### Navegación

- Si `user` ya existe → auto-navega a Home (via `useEffect`)
- Después de auth exitosa → navega a Home

---

## GroupsScreen.tsx

**Ruta:** `src/screens/GroupsScreen.tsx`

### Propósito
Gestión de grupos de usuarios (feature de Supabase).

### Estado
```typescript
const [groups, setGroups] = useState<Group[]>([]);
const [loading, setLoading] = useState(false);
const [showCreateModal, setShowCreateModal] = useState(false);
const [newGroupName, setNewGroupName] = useState('');
```

### Tipos
```typescript
interface Group {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  role?: 'admin' | 'member'; // Del join con group_members
}
```

### Funciones

**loadGroups():**
```typescript
const loadGroups = async () => {
  if (!user) return;
  
  const { data } = await supabase
    .from('group_members')
    .select(`
      role,
      groups (
        id, name, owner_id, created_at
      )
    `)
    .eq('user_id', user.id);
    
  setGroups(data.map(item => ({ ...item.groups, role: item.role })));
};
```

**createGroup():**
```typescript
const createGroup = async () => {
  if (!newGroupName.trim()) return;
  
  const { data: group } = await supabase
    .from('groups')
    .insert({ name: newGroupName, owner_id: user.id })
    .select()
    .single();
    
  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'admin' });
    
  setShowCreateModal(false);
  setNewGroupName('');
  loadGroups();
};
```

**addMember() (planeado):**
- Modal para ingresar email
- Buscar user por email en `profiles`
- Insertar en `group_members`

### UI

**Lista de grupos:**
- FlatList
- Cada item muestra nombre y rol
- Tap → ver detalles (planeado)

**Botón crear:**
- FAB (Floating Action Button)
- Abre modal con TextInput

**Modal crear:**
- TextInput para nombre
- Botón Crear
- Botón Cancelar

---

## Resumen de Pantallas

| Pantalla | Archivo | Props | Modales Usados |
|----------|---------|-------|----------------|
| **Home** | HomeScreen.tsx | navigation | ManageCollectionsModal, CreateCollectionModal |
| **Song** | SongScreen.tsx | route, navigation (songId, songIds, currentIndex) | ManageCollectionsModal, TransposeModal, SongCommentModal, SettingsModal |
| **EditSong** | EditSongScreen.tsx | route, navigation (songId) | EditChordModal, EditLyricModal, MetadataModal |
| **Auth** | AuthScreen.tsx | navigation | Ninguno |
| **Groups** | GroupsScreen.tsx | navigation | CreateGroupModal (planeado) |

## Navegación entre Pantallas

```
Home → Song (tap en canción)
Home → Auth (si no está autenticado, planeado)

Song → EditSong (menú → Editar)
Song → Home (botón Volver)
Song → Song (swipe entre canciones, replace navigation)

EditSong → Song (Guardar, navigation.goBack())
EditSong → Home (si cancela sin guardar)

Auth → Home (después de login)

Groups → (stand-alone, acceso desde menú planeado)
```
