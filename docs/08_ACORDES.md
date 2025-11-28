# Sistema de Acordes y Transposición

## Módulo de Tran

sposición

**Ubicación:** `src/core/chords/transposition.ts`

### Funciones Principales

#### transposeChord()

**Firma:**
```typescript
export function transposeChord(
  chord: string,
  semitones: number,
  notation: Notation
): string
```

**Propósito:** Transpone un acorde la cantidad de semitonos especificada.

**Algoritmo:**

1. **Parse del acorde:**
   - Extrae la base (C, D, E, etc.)
   - Identifica alteración (♯, ♭, #, b)
   - Captura el tipo/extensión (m, 7, maj7, sus4, etc.)
   - Detecta bajo slash (ej: C/E)

2. **Conversión a notación americana:**
   - Si está en latina (Do, Re, Mi), convierte a americana (C, D, E)

3. **Normalización a sostenidos:**
   - Mapea bemoles a sostenidos equivalentes (Db → C#)

4. **Transposición:**
   - Encuentra índice en círculo cromático
   - Suma semitonos (con wraparound: mod 12)
   - Obtiene nueva nota

5. **Reconstrucción:**
   - Reconstruye con nueva base + tipo + bajo (si había)
   - Si notation === 'latin', convierte resultado a latina

**Ejemplo:**
```typescript
transposeChord('Am', 2, 'american')
// 'A' → index 9
// 9 + 2 = 11 → 'B'
// Resultado: 'Bm'

transposeChord('C/E', 5, 'american')
// Base 'C' → 'F'
// Bajo 'E' → 'A'
// Resultado: 'F/A'

transposeChord('Gmaj7', -3, 'latin')
// 'G' → 'Sol' → 'G' → index 7
// 7 - 3 = 4 → 'E' → 'Mi'
// Resultado: 'Mimaj7'
```

**Círculo Cromático:**
```typescript
const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
```

**Mapeo de bemoles a sostenidos:**
```typescript
const flatToSharp = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};
```

---

#### formatChord()

**Firma:**
```typescript
export function formatChord(
  chord: string,
  notation: Notation
): string
```

**Propósito:** Formatea un acorde según la notación preferida del usuario.

**Lógica:**
- Si `notation === 'latin'` → convierte C/D/E a Do/Re/Mi
- Si `notation === 'american'` → mantiene o convierte a C/D/E
- Preserva tipo y bajo

**Ejemplo:**
```typescript
formatChord('C', 'latin') // 'Do'
formatChord('Am7', 'latin') // 'Lam7'
formatChord('Do', 'american') // 'C'
formatChord('Fa/La', 'american') // 'F/A'
```

---

#### toLatin()

**Firma:**
```typescript
export function toLatin(chord: string): string
```

**Propósito:** Convierte un acorde de notación americana a latina.

**Mapeo:**
```typescript
const americanToLatin = {
  'C': 'Do',
  'D': 'Re',
  'E': 'Mi',
  'F': 'Fa',
  'G': 'Sol',
  'A': 'La',
  'B': 'Si'
};
```

**Preserva:**
- Alteraciones: C# → Do#, Db → Reb
- Tipo: Cm → Dom, Cmaj7 → Domaj7
- Bajo: C/E → Do/Mi

---

### Patrones de Acordes Soportados

#### Acordes Básicos
- Mayores: C, D, E, F, G, A, B
- Menores: Cm, Dm, Em, Am, etc.
- Con alteración: C#, Db, F#m, Bbm

#### Extensiones
- Séptimas: C7, Cmaj7, Cm7, Cdim7, C7sus4
- Novenas: C9, Cmaj9, Cm9, Cadd9
- Otras: C6, C13, C11

#### Tipos Especiales
- Suspended: Csus2, Csus4, C7sus4
- Aumentados: Caug, C+
- Disminuidos: Cdim, C°, Cdim7
- Power chords: C5

#### Acordes con Bajo (Slash Chords)
- C/E, Am/G, F/A, D/F#
- Soporte completo: ambos (base y bajo) se transponen

#### Notación Latina
- Do, Re, Mi, Fa, Sol, La, Si
- Dom, Rem, Mim, Fam, Solm, Lam, Sim
- Do#, Reb, Sol7, Lam7, etc.

---

### Regex para Validación

**Patrón completo:**
```typescript
const chordPattern = /^([A-G]|Do|Re|Mi|Fa|Sol|La|Si)(#|♯|b|♭)?(m|M|maj|min|dim|aug|sus|add|\+|°)?([0-9]*)?(\/([A-G]|Do|Re|Mi|Fa|Sol|La|Si)(#|♯|b|♭)?)?$/;
```

**Grupos de captura:**
1. Base note (A-G o Do-Si)
2. Alteración (#, b, ♯, ♭)
3. Tipo (m, maj, min, dim, etc.)
4. Extensión numérica (7, 9, 11, 13)
5. Slash completo
6. Bajo note
7. Alteración del bajo

**Ejemplos válidos:**
- C, Cm, C7, Cmaj7, C7sus4, Cadd9
- C#, Db, F#m, Bbmaj7
- C/E, Am/G, D/F#
- Do, Dom, Re7, Fa#m, Solmaj7, Do/Mi

---

### Casos Especiales

#### Enarmónicos
El sistema prefiere sostenidos (#) internamente:
- Db → C#
- Eb → D#
- Gb → F#
- Ab → G#
- Bb → A#

Pero RESPETA la alteración original si es posible al output.

#### Notas Naturales
E y B no tienen sostenido "simple":
- E# es lo mismo que F
- B# es lo mismo que C

El sistema maneja esto correctamente en el círculo cromático.

#### Transformaciones Complejas
```typescript
transposeChord('Ebm7/Bb', 3, 'latin')
// Eb → Reb
// Bb → Lab
// Resultado: 'Rebm7/Lab'
```

---

### Uso en la Aplicación

#### En SongScreen

**Transposición en vivo:**
```typescript
const transposedSong = useMemo(() => {
  if (!song || transposeValue === 0) return song;
  
  return {
    ...song,
    key: formatChord(song.key, notation),
    pairs: song.pairs.map(pair => ({
      ...pair,
      chords: pair.chords.map(chord => ({
        ...chord,
        name: transposeChord(chord.name, transposeValue, notation)
      }))
    }))
  };
}, [song, transposeValue, notation]);
```

**Aplicación al renderizar:**
```typescript
{pair.chords.map((chord, index) => (
  <Text key={index}>
    {formatChord(chord.name, notation)}
  </Text>
))}
```

#### En TransposeModal

**Preview de tono resultante:**
```typescript
const newKey = transposeChord(originalKey, transposeValue, notation);

<Text>Tono actual: {formatChord(originalKey, notation)}</Text>
<Text>Nuevo tono: {formatChord(newKey, notation)}</Text>
```

---

### Tests

**Ubicación:** `src/core/chords/transposition.test.ts`

**Casos de prueba:**
```typescript
describe('transposeChord', () => {
  it('transposes major chords', () => {
    expect(transposeChord('C', 2, 'american')).toBe('D');
    expect(transposeChord('C', 12, 'american')).toBe('C');
  });
  
  it('transposes minor chords', () => {
    expect(transposeChord('Am', 3, 'american')).toBe('Cm');
  });
  
  it('handles sharps and flats', () => {
    expect(transposeChord('C#', 1, 'american')).toBe('D');
    expect(transposeChord('Db', 1, 'american')).toBe('D');
  });
  
  it('preserves chord extensions', () => {
    expect(transposeChord('Cmaj7', 5, 'american')).toBe('Fmaj7');
    expect(transposeChord('Am7', 2, 'american')).toBe('Bm7');
  });
  
  it('transposes slash chords', () => {
    expect(transposeChord('C/E', 5, 'american')).toBe('F/A');
    expect(transposeChord('Am/G', 2, 'american')).toBe('Bm/A');
  });
  
  it('converts to latin notation', () => {
    expect(transposeChord('C', 0, 'latin')).toBe('Do');
    expect(transposeChord('Am', 0, 'latin')).toBe('Lam');
  });
});

describe('formatChord', () => {
  it('formats to american', () => {
    expect(formatChord('Do', 'american')).toBe('C');
    expect(formatChord('Lam', 'american')).toBe('Am');
  });
  
  it('formats to latin', () => {
    expect(formatChord('C', 'latin')).toBe('Do');
    expect(formatChord('Am', 'latin')).toBe('Lam');
  });
});
```

**Ejecutar tests:**
```bash
npm test
```

---

### Módulo Legacy

**Ubicación:** `src/core/chords/transpose.ts`

**Diferencias con `transposition.ts`:**
- Menos completo
- No soporta slash chords bien
- No maneja enarmónicos
- **Recomendación:** Migrar todo a `transposition.ts`

---

### Optimizaciones

**Memoization:**
- `transposedSong` usa `useMemo` para evitar re-calcular
- Dependencias: `[song, transposeValue, notation]`

**Performance:**
- Transposición es O(n) donde n = número de acordes
- Para 50 líneas con 3 acordes c/u = ~150 operaciones
- Imperceptible para el usuario

**Estrategia de caché (futura):**
```typescript
const transposeCache = new Map<string, string>();

function cachedTranspose(chord: string, semitones: number, notation: Notation) {
  const key = `${chord}|${semitones}|${notation}`;
  if (transposeCache.has(key)) {
    return transposeCache.get(key)!;
  }
  const result = transposeChord(chord, semitones, notation);
  transposeCache.set(key, result);
  return result;
}
```

---

### Mejoras Futuras

1. **Detección de tonalidad:** Analizar acordes para sugerir tono óptimo
2. **Capotraste virtual:** Calcular posición de capo para un tono objetivo
3. **Sugerencias de transposición:** "Esta canción suena mejor en G para voz femenina"
4. **Análisis armónico:** Mostrar progresión (I-IV-V-I, etc.)
5. **Simplificación de acordes:** Opciones para simplificar acordes complejos
