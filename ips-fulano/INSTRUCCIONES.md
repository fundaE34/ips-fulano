# IPS Fulano — Guía de despliegue

## ✅ Stack
- **Frontend:** HTML + CSS + JS puro
- **Backend:** Netlify Functions (Node.js serverless)
- **Base de datos:** Neon PostgreSQL (la misma que ya tienes)
- **Hosting:** Netlify (gratis)
- **Repositorio:** GitHub

---

## 🚀 Pasos para desplegar

### 1. Sube el proyecto a GitHub
```bash
cd ips-fulano
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ips-fulano.git
git push -u origin main
```

### 2. Conecta Netlify con GitHub
1. Ve a https://app.netlify.com → "Add new site" → "Import from Git"
2. Selecciona tu repositorio de GitHub
3. En **Build settings** deja todo vacío (no hay build)
4. Clic en **Deploy site**

### 3. Configura las variables de entorno en Netlify
Ve a: Site settings → Environment variables → Add a variable

```
DATABASE_URL   = (tu cadena de conexión de Neon)
JWT_SECRET     = (una clave secreta larga, ej: ips-fulano-prod-2024-abc123xyz)
GMAIL_USER     = tucorreo@gmail.com
GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx
```

### 4. Copia el logo
Pon tu logo (logo.png) en la carpeta `img/`

### 5. ¡Listo!
Tu app estará en: `https://TU-SITIO.netlify.app`

---

## 📁 Estructura del proyecto
```
ips-fulano/
├── index.html              ← Login con 2FA
├── dashboard.html          ← Dashboard
├── pacientes.html          ← Gestión de pacientes
├── historias.html          ← Historias clínicas + PDF
├── citas.html              ← Citas médicas
├── usuarios.html           ← Gestión de usuarios (solo admin)
├── configuracion.html      ← Config del sistema (solo admin)
├── cambiar-password.html   ← Cambio de contraseña
├── css/style.css           ← Estilos
├── js/
│   ├── api.js              ← Todas las llamadas a la API
│   └── app.js              ← Helpers (auth, modales, toast)
├── img/logo.png            ← Tu logo aquí
└── netlify/functions/
    ├── _db.js              ← Conexión Neon
    ├── _auth.js            ← JWT helpers
    ├── _email.js           ← Nodemailer (Gmail)
    ├── auth-login.js       ← POST /api/auth-login
    ├── auth-verify2fa.js   ← POST /api/auth-verify2fa
    ├── cambiar-password.js ← POST /api/cambiar-password
    ├── dashboard.js        ← GET /api/dashboard
    ├── pacientes.js        ← CRUD /api/pacientes
    ├── historias.js        ← CRUD /api/historias
    ├── citas.js            ← CRUD /api/citas
    ├── usuarios.js         ← CRUD /api/usuarios
    └── config.js           ← Config + auditoría
```

## 🔑 Funcionalidades incluidas
- ✅ Login con verificación en 2 pasos por email
- ✅ Bloqueo automático tras 5 intentos fallidos (30 min)
- ✅ Cambio obligatorio de contraseña en primer acceso
- ✅ Roles: admin / médico / enfermería / recepcionista
- ✅ CRUD completo de pacientes con campos personalizados
- ✅ Historias clínicas con entradas, bloqueo por edición concurrente
- ✅ Generación de PDF en el navegador (sin servidor)
- ✅ Citas médicas con filtros por estado y fecha
- ✅ Gestión de usuarios y correos de backup
- ✅ Auditoría de todas las acciones
- ✅ Configuración de Gmail, 2FA y especialidades
- ✅ Marca de agua y firma en PDFs
- ✅ Diseño responsive

## 🔐 Gmail App Password
1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una para "Correo" → copia las 16 letras
