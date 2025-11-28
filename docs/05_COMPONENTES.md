# Documentación de Componentes

## Componentes Reutilizables

### HeaderMenu.tsx

**Ubicación:** `src/components/HeaderMenu.tsx`

**Propósito:** Menú hamburguesa con acciones contextuales según la pantalla.

**Props:**
```typescript
interface HeaderMenuProps {
  type: 'home' | 'song';
  colors: ThemeColors;
  notation?: Notation;
  toggleNotation?: () => void;
  commentsVisible?: boolean;
  onToggleComments?: () => void;
  onEdit?: () => void;
  onAddToCollection?: () => void;
  onTranspose?: () => void;
  onChangeFont?: () => void;
}
```

**Funcionalidad:**
- Botón con ícono de 3 puntos verticales
- Al tap → muestra menú (BottomSheet o Modal)
- Opciones diferentes según `type`:

**Type: 'home':**
- Configuración (tema, fuente, notación)
- Acerca de
- Cerrar sesión (si está auth)

**Type: 'song':**
- Editar canción
- Transponer
- Añadir a colección
- Toggle comentarios
- Cambiar notación (Do/C)
- Cambiar fuente
- Tema

### ManageCollectionsModal.tsx

**Ubicación:** `src/components/ManageCollectionsModal.tsx`

**Props:**
```typescript
interface ManageCollectionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  songId: number;
}
```

**Estado Interno:**
```typescript
const [collections, setCollections] = useState<Collection[]>([]);
const [songCollections, setSongCollections] = useState<number[]>([]);
const [showCreateModal, setShowCreateModal] = useState(false);
const [newCollectionName, setNewCollectionName] = useState('');
```

**Funciones:**
- `loadCollections()` - Carga colecciones y checkea cuáles contienen la canción
- `toggleCollection(collectionId)` - Añade/quita canción de colección
- `createCollection(name)` - Crea nueva colección
- `renameCollection(id, newName)` - Renombra colección existente
- `deleteCollection(id)` - Elimina colección (con confirmación)

**UI:**
- FlatList de colecciones con checkboxes
- Botón "+" para crear nueva
- Long press en nombre para renombrar
- Ícono basura para eliminar

### TransposeModal.tsx

**Ubicación:** `src/components/TransposeModal.tsx`

**Props:**
```typescript
interface TransposeModalProps {
  isVisible: boolean;
  onClose: () => void;
  transposeValue: number;
  onTransposeChange: (value: number) => void;
}
```

**UI:**
- Slider de -11 a +11
- Label mostrando valor actual (+2, -5, etc.)
- Vista previa del tono resultante (opcional)
- Botón "Reset" (vuelve a 0)
- Botón "Aplicar" (cierra modal)

### SongCommentModal.tsx

**Ubicación:** `src/components/SongCommentModal.tsx`

**Props:**
```typescript
interface SongCommentModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialComment: string | null;
  onSave: (comment: string) => void;
  onDelete: () => void;
}
```

**Estado:**
```typescript
const [comment, setComment] = useState(initialComment || '');
```

**UI:**
- TextInput multiline (altura automática)
- Botón "Guardar"
- Botón "Eliminar" (si ya existe comentario)
- Botón "Cancelar"

### SettingsModal.tsx

**Ubicación:** `src/components/SettingsModal.tsx`

**Props:**
```typescript
interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  visibleSections?: ('theme' | 'fonts' | 'notation')[];
}
```

**Secciones (condicionales por `visibleSections`):**

**Theme:**
- Toggle switch Light/Dark
- Usa `useTheme()` hook

**Fonts:**
- Selector con 3 opciones:
  - Regular (pequeña)
  - Medium (mediana)
  - SemiBold (grande)
- Usa `useFont()` hook

**Notation:**
- Toggle Do/C (latino/americano)
- Usa `useNotation()` hook

### EditChordModal.tsx

**Ubicación:** `src/components/EditChordModal.tsx`

**Props:**
```typescript
interface EditChordModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialChordName: string;
  onSave: (newName: string) => void;
  onDelete?: () => void;
}
```

**Estado:**
```typescript
const [chordName, setChordName] = useState(initialChordName);
const [error, setError] = useState<string | null>(null);
```

**Validación:**
```typescript
const validateChord = (name: string) => {
  const chordRegex = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]?(\/[A-G](#|b)?)?$/;
  return chordRegex.test(name);
};
```

**UI:**
- TextInput para nombre de acorde
- Validación en tiempo real
- Botón "Guardar" (disabled si inválido)
- Botón "Eliminar" (opcional, si es edición)
- Botón "Cancelar"

### EditLyricModal.tsx

**Ubicación:** `src/components/EditLyricModal.tsx`

**Props:**
```typescript
interface EditLyricModalProps {
  isVisible: boolean;
  onClose: () => void;
  initialLyric: string;
  onSave: (newLyric: string) => void;
}
```

**UI:**
- TextInput multiline
- Auto-focus al abrir
- Botón "Guardar"
- Botón "Cancelar"

### DraggableSongItem.tsx

**Ubicación:** `src/components/DraggableSongItem.tsx`

**Props:**
```typescript
interface DraggableSongItemProps {
  song: Song;
  onPress: () => void;
  onLongPress?: () => void; // Para iniciar drag
  isDragging?: boolean;
  drag?: () => void; // Del DraggableFlatList
}
```

**Funcionalidad:**
- Renderiza un SongCard con info de la canción
- Si tiene `drag` prop → long press inicia drag to reorder
- Swipe actions (opcional): editar, eliminar, favorito
- Elevación visual cuando `isDragging`

**Swipe Actions (react-native-swipe-list-view o similar):**
- Swipe left → Eliminar (rojo)
- Swipe right → Editar (azul)

### TagSelector.tsx

**Ubicación:** `src/components/TagSelector.tsx`

**Props:**
```typescript
interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}
```

**Tags Predefinidas:**
```typescript
const AVAILABLE_TAGS = [
  'Adoración',
  'Alabanza',
  'Navidad',
  'Pascua',
  'Infantil',
  'Congregacional',
  'Especial',
  'Comunión'
];
```

**UI:**
- Lista de chips
- Tap para toggle selección
- Chips seleccionados con color accent
- Wrap para multi-línea

---

## Componentes Internos de Pantallas

### SongLine (en SongScreen.tsx)

**Tipo:** Componente funcional puro

**Props:**
```typescript
{
  pair: Song['pairs'][number];
  font: string;
  notation: Notation;
  styles: ReturnType<typeof createStyles>;
  isFirst?: boolean;
}
```

**Renderiza:**
- Container con padding
- Vista de contenido con posición relativa
- Overlay de acordes (absoluto, encima)
- Cada acorde posicionado con `left: chord.at * CHAR_WIDTH`
- Letra en Text con fuente monospace

### DraggableChord (en EditSongScreen.tsx)

**Tipo:** Componente con Reanimated y Gestures

**Props:**
```typescript
{
  chord: { name: string; at: number };
  lineIndex: number;
  chordIndex: number;
  onTap: () => void;
  onDragEnd: (lineIndex: number, chordIndex: number, newAt: number) => void;
}
```

**Shared Values:**
- `translateX` - Posición horizontal
- `translateY` - Elevación (lift effect)
- `isDragging` - Estado de drag
- `startX` - Posición inicial del drag

**Gestos:**
- `longPressGesture` - Tap para editar
- `panGesture` - Drag para mover
- `composedGesture` - Combina ambos

**Estilos Animados:**
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: translateX.value },
    { translateY: translateY.value }
  ]
}));
```

### SongCard (en HomeScreen.tsx)

**Tipo:** Componente de presentación

**Props:**
```typescript
{
  song: Song;
  onPress: () => void;
  onLongPress?: () => void;
}
```

**UI:**
- Touchable container
- Título con ID (ej: "1. Sublime Gracia")
- Metadata row (tono, compás, BPM)
- Tags como chips pequeños
- Ícono de favorito (si aplica)
- Divider al final

---

## Utilidades de UI

### ThemeColors (Type)

**Ubicación:** `src/context/ThemeContext.tsx`

**Definición:**
```typescript
export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  error: string;
  success: string;
  chordBackground: string;
  highlight: string;
  overlay: string;
}
```

**Temas:**

**Light:**
```typescript
{
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  textPrimary: '#000000',
  textSecondary: '#666666',
  accent: '#007AFF',
  border: '#E0E0E0',
  error: '#FF3B30',
  success: '#34C759',
  chordBackground: 'rgba(0, 122, 255, 0.1)',
  highlight: 'rgba(0, 122, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.7)'
}
```

**Dark:**
```typescript
{
  background: '#1C1C1E',
  surface: '#2C2C2E',
  card: '#2C2C2E',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
  accent: '#0A84FF',
  border: '#38383A',
  error: '#FF453A',
  success: '#32D74B',
  chordBackground: 'rgba(10, 132, 255, 0.2)',
  highlight: 'rgba(10, 132, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.9)'
}
```

### Fuentes Sono

**Archivos:**
- `assets/fonts/Sono-Light.ttf`
- `assets/fonts/Sono-Regular.ttf`
- `assets/fonts/Sono-Medium.ttf`
- `assets/fonts/Sono-SemiBold.ttf`

**Configuración en App.tsx:**
```typescript
const [fontsLoaded] = useFonts({
  'AppSono-Light': require('./assets/fonts/Sono-Light.ttf'),
  'AppSono-Regular': require('./assets/fonts/Sono-Regular.ttf'),
  'AppSono-Medium': require('./assets/fonts/Sono-Medium.ttf'),
  'AppSono-SemiBold': require('./assets/fonts/Sono-SemiBold.ttf'),
  'AppSono-Bold': require('./assets/fonts/Sono-SemiBold.ttf'), // Alias
});
```

**Uso:**
```typescript
<Text style={{ fontFamily: selectedFont }}>...</Text>
```

---

## Resumen de Componentes

| Componente | Tipo | Uso Principal | Dependencias Clave |
|------------|------|---------------|-------------------|
| HeaderMenu | Reutilizable | Menú contextual | - |
| ManageCollectionsModal | Reutilizable | Gestión de colecciones | SQLite |
| TransposeModal | Reutilizable | Transposición | - |
| SongCommentModal | Reutilizable | Comentarios | - |
| SettingsModal | Reutilizable | Configuración | Contexts |
| EditChordModal | Reutilizable | Editar acorde | - |
| EditLyricModal | Reutilizable | Editar letra | - |
| DraggableSongItem | Reutilizable | Item de lista con drag | react-native-gesture-handler |
| TagSelector | Reutilizable | Selector de tags | - |
| SongLine | Interno | Renderiza línea con acordes | - |
| DraggableChord | Interno | Acorde draggable | Reanimated, Gestures |
| SongCard | Interno | Card de canción en lista | - |
