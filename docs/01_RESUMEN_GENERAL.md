# Resumen General - Cancionero App

## ¿Qué es esta aplicación?

**Cancionero** es una aplicación móvil (con soporte Web experimental) diseñada como un cancionero digital cristiano. Permite a los usuarios:

- **Visualizar** letras de canciones con acordes superpuestos
- **Transponer** canciones a diferentes tonalidades
- **Editar** letras y acordes de manera granular
- **Organizar** canciones en colecciones personalizadas
- **Buscar** canciones por título, letra, tono o etiquetas
- **Marcar favoritos** y añadir comentarios
- **Funcionar offline** con base de datos local SQLite

## Stack Tecnológico

### Nueva Versión PWA (En Desarrollo)
- **Core:** Vite + React 19 + TypeScript
- **Estilos:** Tailwind CSS
- **Base de Datos:** SQLite (via `wa-sqlite` en navegador)
- **Routing:** React Router DOM
- **PWA:** vite-plugin-pwa (Offline support)

### Versión Legacy (Móvil Nativo)
- **Framework:** Expo 54 + React Native 0.81
- **Navegación:** React Navigation
- **Base de Datos:** expo-sqlite
- **Estado:** En proceso de migración a PWA pura para mejor compatibilidad web.

## Características Principales

### 1. Visualizador de Canciones
- Letras con acordes posicionados exactamente sobre las sílabas correctas
- Zoom con pinch-to-zoom
- Pan para mover la vista
- Navegación por gestos (swipe izquierda/derecha entre canciones)
- Vista landscape optimizada

### 2. Transposición de Acordes
- Transponer a cualquier tono (+/- 11 semitonos)
- Soporte para notación latina (Do, Re, Mi) y americana (C, D, E)
- Reconocimiento de acordes complejos (sostenidos, bemoles, bajos con slash)
- Conversión automática entre notaciones

### 3. Editor de Canciones
- Edición granular: mover acordes carácter por carácter
- Drag & drop de acordes
- Insertar/eliminar acordes y líneas
- Editar metadatos (título, tono, compás, BPM, autor, tags)
- Sistema de undo/redo
- Backups automáticos en el primer edit

### 4. Organización
- Búsqueda por texto, tono, tags, ID
- Filtros por tono, colecciones, favoritos
- Colecciones personalizadas (crear, renombrar, eliminar)
- Reordenar canciones dentro de colecciones (drag & drop)
- Marcar favoritos

### 5. Personalización
- Tema claro/oscuro
- Cambio de fuente (3 tamaños: pequeña, mediana, grande)
- Notación latina/americana persistente
- Comentarios por canción
- Overrides de usuario (transposición, favoritos, ediciones locales)

### 6. Offline-First
- Toda la funcionalidad disponible sin conexión
- Base de datos SQLite local
- Cambios almacenados en `user_overrides`
- Sistema de sincronización planeado (no implementado)

## Arquitectura General

La app sigue una arquitectura **offline-first** con:

1. **Base de datos local** (SQLite) como fuente de verdad
2. **Contextos de React** para estado global (tema, fuente, notación)
3. **Navegación por Stack** (React Navigation)
4. **User Overrides** para cambios del usuario sin modificar la DB original
5. **API local opcional** (servidor Express en puerto 3001) para sincronizar con archivo JSON maestro

## Flujo de Datos

```
Usuario → Pantalla → Contexto/DB → DAO → SQLite
                ↓
        User Overrides (cambios locales)
                ↓
        API Local (opcional) → songs.json
```

## Estructura de Navegación

```
App.tsx (Root)
  └─ AppNavigator
      ├─ Home (Lista de canciones)
      ├─ Song (Visualizador)
      ├─ EditSong (Editor)
      ├─ Auth (Login/Registro)
      └─ Groups (Grupos de Supabase)
```

## Limitaciones Conocidas

### Versión Web
- ❌ `react-native-reanimated` tiene problemas de serialización (`WorkletsError`)
- ❌ Gestos avanzados (pinch, drag) no funcionan bien
- ℹ️ Se recomienda versión nativa

### Funcionalidades Planeadas (No Implementadas)
- ⏳ Sincronización en la nube (Google OAuth + backend)
- ⏳ Compartir canciones entre usuarios
- ⏳ Modo presentación (pantalla completa, auto-scroll)
- ⏳ Metrónomo integrado
- ⏳ Importación masiva desde archivos

## Público Objetivo

- **Músicos cristianos** que necesitan un cancionero digital
- **Líderes de alabanza** que transponen canciones según la voz del cantante
- **Iglesias** que quieren un repertorio centralizado
- **Usuarios offline** en áreas con conectividad limitada

## Próximos Pasos Recomendados

1. **Si reconstruyes la app:** Considera usar **Expo Router** en lugar de React Navigation
2. **Para Web:** Elimina `react-native-reanimated` o simplifica drásticamente los gestos
3. **Para despliegue nativo:** Usa **EAS Build** de Expo
4. **Para sincronización:** Implementa el backend con Supabase o Firebase
