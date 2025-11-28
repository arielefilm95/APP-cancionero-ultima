# Documentación Completa - Cancionero App

## Índice de Documentación

Esta documentación describe completamente la funcionalidad de la aplicación Cancionero, un visor/editor de canciones cristianas con soporte offline-first.

### Archivos de Documentación

1. **[01_RESUMEN_GENERAL.md](01_RESUMEN_GENERAL.md)** - Visión general de la app, tecnologías y características principales
2. **[02_ARQUITECTURA.md](02_ARQUITECTURA.md)** - Estructura de carpetas, archivos importantes y arquitectura del código
3. **[03_FUNCIONALIDADES.md](03_FUNCIONALIDADES.md)** - Descripción detallada de cada funcionalidad de la app
4. **[04_PANTALLAS.md](04_PANTALLAS.md)** - Documentación de cada pantalla (screens)
5. **[05_COMPONENTES.md](05_COMPONENTES.md)** - Componentes reutilizables y sus propósitos
6. **[06_CONTEXTOS.md](06_CONTEXTOS.md)** - Contextos de React y manejo de estado global
7. **[07_BASE_DE_DATOS.md](07_BASE_DE_DATOS.md)** - Estructura de la base de datos SQLite y modelos
8. **[08_ACORDES.md](08_ACORDES.md)** - Sistema de transposición y manejo de acordes
9. **[09_DESPLIEGUE.md](09_DESPLIEGUE.md)** - Guía completa de despliegue (Web, iOS, Android)

## Cómo Usar Esta Documentación

- **Para entender la app rápidamente:** Lee 01_RESUMEN_GENERAL.md
- **Para reconstruir la app:** Lee todos los documentos en orden
- **Para una funcionalidad específica:** Usa el índice de 03_FUNCIONALIDADES.md
- **Para desplegar:** Ve directamente a 09_DESPLIEGUE.md

## Notas Importantes

- Esta app usa **Expo 54** con **React Native 0.81**
- La base de datos es **SQLite** (expo-sqlite)
- Los gestos usan **react-native-gesture-handler** y **react-native-reanimated**
- El sistema es **offline-first** con planes de sincronización en la nube

## Advertencias

⚠️ **Problema conocido:** La versión Web tiene incompatibilidades con `react-native-reanimated` que causan `WorkletsError`. Se recomienda enfocarse en las versiones nativas (iOS/Android) o simplificar drásticamente la versión Web eliminando gestos avanzados.
