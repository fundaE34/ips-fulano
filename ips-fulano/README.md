# IPS Fulano — Sistema de Gestión en Salud
## Stack: HTML + Netlify Functions + Neon PostgreSQL

---

## 📁 Estructura del proyecto

```
ips-fulano/
├── index.html              ← Login + 2FA
├── dashboard.html          ← Panel principal
├── pacientes.html          ← Gestión de pacientes
├── historia.html           ← Historia clínica + PDF
├── citas.html              ← Citas médicas
├── usuarios.html           ← Gestión de usuarios (admin)
├── especialidades.html     ← Especialidades (admin)
├── backup.html             ← Backups (admin)
├── auditoria.html          ← Auditoría (admin)
├── configuracion.html      ← Configuración del sistema
├── cambiar-password.html   ← Cambio de contraseña
├── css/app.css             ← Estilos principales
├── js/api.js               ← Cliente API + utilidades
├── js/layout.js            ← Sidebar y topbar
├── img/logo.png            ← Logo IPS (pon tu logo aquí)
├── netlify/functions/
│   ├── _utils.js           ← DB, JWT, correo, helpers
│   ├── auth.js             ← Login, 2FA, password
│   ├── pacientes.js        ← CRUD pacientes
│   ├── historias.js        ← Historias clínicas
│   ├── citas.js            ← Citas médicas
│   ├── usuarios.js         ← Gestión usuarios
│   └── admin.js            ← Config, backup, auditoría
├── netlify.toml            ← Configuración Netlify
└── package.json
```

---

## 🚀 Cómo desplegarlo (paso a paso)

### 1. Requisitos previos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Netlify](https://netlify.com) (gratis)
- Tu base de datos Neon (ya la tienes)

### 2. Subir a GitHub
```bash
git init
git add .
git commit -m "IPS Fulano v2.0 - Netlify + Neon"
git remote add origin https://github.com/TU_USUARIO/ips-fulano.git
git push -u origin main
```

### 3. Conectar Netlify
1. Ve a [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
2. Selecciona tu repositorio
3. Build settings: dejar vacío (sin comando de build)
4. Click "Deploy site"

### 4. Variables de entorno en Netlify
Ve a: **Site settings → Environment variables** y agrega:

```
DATABASE_URL     = tu-url-neon (la misma de Flask)
JWT_SECRET       = genera uno con: openssl rand -hex 32
GMAIL_USER       = tu-correo@gmail.com
GMAIL_APP_PASSWORD = tu-app-password-gmail
```

### 5. Poner tu logo
Copia tu logo como: `img/logo.png`

### 6. ¡Listo!
Tu app estará en: `https://ips-fulano.netlify.app`

---

## 🔌 Rutas API (Netlify Functions)

| Método | Ruta              | Función         |
|--------|-------------------|-----------------|
| POST   | /api/auth/login   | Login + 2FA     |
| POST   | /api/auth/verificar-2fa | Verificar código |
| GET    | /api/pacientes    | Listar pacientes |
| POST   | /api/pacientes    | Crear paciente  |
| GET    | /api/historias/paciente/:id | Historia |
| POST   | /api/historias/paciente/:id | Guardar entrada |
| GET    | /api/citas        | Listar citas    |
| POST   | /api/citas        | Crear cita      |
| GET    | /api/usuarios     | Listar usuarios |
| GET    | /api/admin/stats  | Stats dashboard |
| POST   | /api/admin/backup/generar | Generar backup |

---

## 📊 Base de datos
Usa la misma base de datos Neon que tienes en Flask.
**No necesitas migrar nada** — las tablas ya existen.

---

## 💡 Diferencias vs Flask

| Flask (antes) | Netlify (ahora) |
|---|---|
| Servidor Render (duerme) | Netlify (siempre activo) |
| PostgreSQL Neon | Mismo Neon ✅ |
| Flask sessions | JWT en localStorage |
| Weasyprint PDF | jsPDF en navegador |
| APScheduler | Netlify Scheduled Functions (opcional) |
| Costo: plan pago | Costo: $0 |

---

## 📧 Gmail App Password
1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Seguridad → Verificación en 2 pasos → Contraseñas de aplicación
3. Selecciona "Correo" → Genera contraseña
4. Úsala como `GMAIL_APP_PASSWORD`

---

## 🆘 Soporte
Sistema desarrollado para IPS Fulano — Fundación Eudes
