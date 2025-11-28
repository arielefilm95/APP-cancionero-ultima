# Documentación de Contextos

## Contextos de React

Los contextos manejan estado global accesible desde cualquier componente.

---

## AppContext

**Archivo:** `src/context/AppContext.tsx`

### Propósito
Mantener información de navegación global, específicamente el último ID de canción visitado para scroll automático en HomeScreen.

### Interfaz
```typescript
interface AppContextType {
  lastViewedSongId: number | null;
  setLastViewedSongId: (id: number | null) => void;
}
```

### Provider
```typescript
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastViewedSongId, setLastViewedSongId] = useState<number | null>(null);
  
  return (
    <AppContext.Provider value={{ lastViewedSongId, setLastViewedSongId }}>
      {children}
    </AppContext.Provider>
  );
};
```

### Hook
```typescript
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### Uso
```typescript
// En SongScreen - guardar ID al cargar
const appContext = useAppContext();
useEffect(() => {
  appContext?.setLastViewedSongId(songId);
}, [songId]);

// En HomeScreen - scrollear a último visitado
const { lastViewedSongId } = useAppContext();
useEffect(() => {
  if (lastViewedSongId) {
    const index = songs.findIndex(s => s.id === lastViewedSongId);
    if (index !== -1) {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    }
  }
}, [songs, lastViewedSongId]);
```

---

## AuthContext

**Archivo:** `src/context/AuthContext.tsx`

### Propósito
Maneja autenticación de usuarios con Supabase, incluyendo sesión actual y funciones de auth.

### Interfaz
```typescript
interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

### Setup de Supabase
```typescript
const supabaseUrl = 'https://nwdwdgldnwvmfcktgmjv.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Debe moverse a .env

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Provider
```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Listener de cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Hook
```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Uso
```typescript
// En AuthScreen
const { signUp, signOut, user } = useAuth();

const handleSignUp = async () => {
  try {
    await signUp(email, password);
    navigation.navigate('Home');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// En cualquier pantalla - verificar si está autenticado
const { user } = useAuth();
if (!user) {
  // Mostrar botón de login o redireccionar
}
```

### Nota sobre signInWithPassword
La interfaz de `AuthContextType` NO incluye `signInWithPassword`, pero se usa directamente con el cliente Supabase:

```typescript
// Workaround actual en AuthScreen
const { data, error } = await (supabase.auth as any).signInWithPassword({
  email,
  password
});
```

**Recomendación:** Añadir a la interfaz:
```typescript
signIn: (email: string, password: string) => Promise<void>;
```

---

## ThemeContext

**Archivo:** `src/context/ThemeContext.tsx`

### Propósito
Gestiona el tema de la app (claro/oscuro) con persistencia en AsyncStorage.

### Tipos
```typescript
export type Theme = 'light' | 'dark';

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

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}
```

### Definición de Temas
```typescript
const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  // ... resto de colores
};

const darkTheme: ThemeColors = {
  background: '#1C1C1E',
  surface: '#2C2C2E',
  // ... resto de colores
};
```

### Provider
```typescript
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  
  useEffect(() => {
    // Cargar tema desde AsyncStorage
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
      }
    });
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    AsyncStorage.setItem('theme', newTheme);
  };
  
  const colors = theme === 'light' ? lightTheme : darkTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Hook
```typescript
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### Uso
```typescript
// En cualquier componente
const { theme, colors, toggleTheme } = useTheme();

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textPrimary,
  }
});

// Toggle en SettingsModal
<Switch value={theme === 'dark'} onValueChange={toggleTheme} />
```

---

## FontContext

**Archivo:** `src/context/FontContext.tsx`

### Propósito
Gestiona la fuente seleccionada por el usuario con persistencia.

### Tipos
```typescript
export type FontOption = 'AppSono-Regular' | 'AppSono-Medium' | 'AppSono-SemiBold';

interface FontContextType {
  selectedFont: FontOption;
  setFont: (font: FontOption) => void;
}
```

### Provider
```typescript
export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFont, setSelectedFont] = useState<FontOption>('AppSono-Regular');
  
  useEffect(() => {
    AsyncStorage.getItem('selectedFont').then((saved) => {
      if (saved && ['AppSono-Regular', 'AppSono-Medium', 'AppSono-SemiBold'].includes(saved)) {
        setSelectedFont(saved as FontOption);
      }
    });
  }, []);
  
  const setFont = (font: FontOption) => {
    setSelectedFont(font);
    AsyncStorage.setItem('selectedFont', font);
  };
  
  return (
    <FontContext.Provider value={{ selectedFont, setFont }}>
      {children}
    </FontContext.Provider>
  );
};
```

### Hook
```typescript
export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within FontProvider');
  }
  return context;
};
```

### Uso
```typescript
// En SongScreen o EditSongScreen
const { selectedFont } = useFont();

<Text style={{ fontFamily: selectedFont }}>
  {pair.lyrics}
</Text>

// En SettingsModal
const { selectedFont, setFont } = useFont();

<Picker
  selectedValue={selectedFont}
  onValueChange={setFont}
>
  <Picker.Item label="Pequeña" value="AppSono-Regular" />
  <Picker.Item label="Mediana" value="AppSono-Medium" />
  <Picker.Item label="Grande" value="AppSono-SemiBold" />
</Picker>
```

---

## NotationContext

**Archivo:** `src/context/NotationContext.tsx`

### Propósito
Gestiona la notación de acordes (latina Do/Re/Mi vs americana C/D/E) con persistencia.

### Tipos
```typescript
export type Notation = 'latin' | 'american';

interface NotationContextType {
  notation: Notation;
  setNotation: (notation: Notation) => void;
}
```

### Provider
```typescript
export const NotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notation, setNotationState] = useState<Notation>('latin');
  
  useEffect(() => {
    AsyncStorage.getItem('notation').then((saved) => {
      if (saved === 'latin' || saved === 'american') {
        setNotationState(saved);
      }
    });
  }, []);
  
  const setNotation = (newNotation: Notation) => {
    setNotationState(newNotation);
    AsyncStorage.setItem('notation', newNotation);
  };
  
  return (
    <NotationContext.Provider value={{ notation, setNotation }}>
      {children}
    </NotationContext.Provider>
  );
};
```

### Hook
```typescript
export const useNotation = () => {
  const context = useContext(NotationContext);
  if (!context) {
    throw new Error('useNotation must be used within NotationProvider');
  }
  return context;
};
```

### Uso
```typescript
// En SongScreen - formatear acordes
const { notation } = useNotation();

const displayChord = formatChord(chord.name, notation);
// 'C' → 'Do' (si notation === 'latin')
// 'Do' → 'C' (si notation === 'american')

// Toggle en HeaderMenu
const { notation, setNotation } = useNotation();

const toggleNotation = () => {
  setNotation(notation === 'latin' ? 'american' : 'latin');
};

<Button 
  title={notation === 'latin' ? 'Cambiar a C/D/E' : 'Cambiar a Do/Re/Mi'}
  onPress={toggleNotation}
/>
```

---

## Orden de Providers en App.tsx

**Correcto:**
```typescript
<AppProvider>
  <AuthProvider>
    <ThemeProvider>
      <FontProvider>
        <NotationProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </NotationProvider>
      </FontProvider>
    </ThemeProvider>
  </AuthProvider>
</AppProvider>
```

**Por qué este orden:**
1. **AppProvider** - Primero porque no depende de nada
2. **AuthProvider** - Segundo para que esté disponible en toda la app
3. **ThemeProvider** - Puede depender de user preferences (futuro)
4. **FontProvider** - UI preference, puede depender de tema
5. **NotationProvider** - UI preference, independiente

---

## Variables de Entorno (Recomendadas)

**Archivo:** `.env` (en root del proyecto)
```
EXPO_PUBLIC_SUPABASE_URL=https://nwdwdgldnwvmfcktgmjv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**Uso en código:**
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
```

**Notas:**
- Variables DEBEN empezar con `EXPO_PUBLIC_` para Expo
- Añadir `.env` a `.gitignore`
- Crear `.env.example` con placeholders para otros devs
