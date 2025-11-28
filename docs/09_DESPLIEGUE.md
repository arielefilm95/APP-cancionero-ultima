# Guía de Despliegue (PWA Vite)

Esta guía describe el proceso de despliegue para la nueva versión PWA construida con **Vite + React**.

## 1. Despliegue Web (Vercel)

Vercel es la plataforma recomendada por su integración nativa con Vite y su red global de Edge Network.

### Requisitos Previos
- Cuenta en Vercel
- Repositorio en GitHub/GitLab
- Node.js 18+

### Configuración del Proyecto

**1. `vercel.json` (Optimizado para SQLite):**
Si usamos `wa-sqlite` con soporte de `SharedArrayBuffer` (para mayor rendimiento), necesitamos headers específicos.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Nota:** Estos headers son estrictos. Si causan problemas con imágenes externas (CORS), se pueden relajar si se usa una versión de `wa-sqlite` que no dependa de `SharedArrayBuffer` (aunque será más lenta).

### Deploy Automático

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar repositorio de GitHub
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Click en "Deploy"

### Variables de Entorno
Configurar en Vercel > Settings > Environment Variables:

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Key pública de Supabase

---

## 2. Instalación PWA

Al ser una Progressive Web App, no se "despliega" en tiendas de aplicaciones tradicionales (aunque es posible empaquetarla con TWA). El usuario la instala directamente desde el navegador.

### Requisitos para Instalabilidad
El plugin `vite-plugin-pwa` debe estar configurado correctamente en `vite.config.ts` para generar:
- `manifest.webmanifest` (Nombre, iconos, colores)
- Service Worker (para funcionamiento offline)

### Experiencia de Usuario
1. Usuario visita `https://tu-app.vercel.app`
2. Navegador muestra icono de "Instalar" en la barra de direcciones.
3. Al instalar, la app aparece en el Home Screen (iOS/Android) o Escritorio (PC/Mac).
4. La app se abre sin barra de navegación del browser (standalone).

---

## 3. Desarrollo Local

### Iniciar Servidor
```bash
npm run dev
```
Abre `http://localhost:5173`

### Probar Build de Producción
Es importante probar el build localmente para verificar que el Service Worker y los assets carguen bien.

```bash
npm run build
npm run preview
```
Abre `http://localhost:4173`

---

## 4. Checklist Pre-Launch

### PWA
- [ ] `manifest.webmanifest` tiene iconos de todos los tamaños (192, 512).
- [ ] `theme_color` y `background_color` coinciden con el diseño.
- [ ] Service Worker cachea los assets críticos (fuentes, DB, JS).
- [ ] La app funciona en "Modo Avión" después de la primera carga.

### Performance
- [ ] Lighthouse Score > 90 en Performance, Accessibility, Best Practices, SEO.
- [ ] La base de datos carga rápido (< 1s).

### Base de Datos
- [ ] El archivo `.db` en `public/` es la versión correcta y optimizada (VACUUM).
