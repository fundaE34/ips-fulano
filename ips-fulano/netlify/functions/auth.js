// netlify/functions/auth.js
// Maneja: login, verificar 2FA, reenviar código, logout, cambiar password

const {
  getDB, ok, error, noAutorizado, handleOptions, cors,
  crearToken, obtenerUsuarioDeRequest,
  checkPassword, hashPassword,
  registrarAuditoria, enviarCorreo, htmlCorreoBase,
  generarCodigo, obtenerIP,
} = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();

  const path   = event.path.replace('/.netlify/functions/auth', '').replace('/api/auth', '');
  const method = event.httpMethod;
  const db     = getDB();
  const ip     = obtenerIP(event);

  // ── POST /auth/login ──────────────────────────────────────────────────────
  if (path === '/login' && method === 'POST') {
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password) return error('Email y contraseña requeridos');

    const { rows } = await db.query(
      `SELECT u.*, r.nombre as rol_nombre
       FROM usuario u JOIN rol r ON u.rol_id = r.id
       WHERE u.email = $1`, [email.toLowerCase()]
    );
    const u = rows[0];

    if (!u) {
      await registrarAuditoria(db, { accion: 'LOGIN_FALLIDO', modulo: 'Auth', descripcion: `Email no encontrado: ${email}`, ip, exitoso: false });
      return error('Correo o contraseña incorrectos', 401);
    }

    // Verificar bloqueo
    if (u.bloqueado_hasta && new Date() < new Date(u.bloqueado_hasta)) {
      const mins = Math.ceil((new Date(u.bloqueado_hasta) - new Date()) / 60000);
      return error(`Cuenta bloqueada. Intenta en ${mins} minuto(s).`, 423);
    }

    const passOk = await checkPassword(password, u.password);
    if (!passOk) {
      const intentos = (u.intentos_fallidos || 0) + 1;
      let bloqueadoHasta = null;
      if (intentos >= 5) {
        const t = new Date(); t.setMinutes(t.getMinutes() + 30);
        bloqueadoHasta = t;
      }
      await db.query(
        `UPDATE usuario SET intentos_fallidos=$1, bloqueado_hasta=$2 WHERE id=$3`,
        [bloqueadoHasta ? 0 : intentos, bloqueadoHasta, u.id]
      );
      await registrarAuditoria(db, { usuario_id: u.id, usuario_email: u.email, accion: 'LOGIN_FALLIDO', modulo: 'Auth', descripcion: 'Contraseña incorrecta', ip, exitoso: false });
      if (bloqueadoHasta) return error('Cuenta bloqueada por 30 minutos.', 423);
      return error(`Contraseña incorrecta. Intentos restantes: ${5 - intentos}`, 401);
    }

    if (!u.activo) return error('Cuenta inactiva. Contacta al administrador.', 403);

    // Verificar si 2FA está activo
    const cfg = await db.query(`SELECT valor FROM configuracion_sistema WHERE clave='2fa_activo'`);
    const dosFA = (cfg.rows[0]?.valor || 'true') === 'true';

    if (dosFA) {
      const codigo  = generarCodigo();
      const expira  = new Date(); expira.setMinutes(expira.getMinutes() + 5);
      await db.query(
        `INSERT INTO codigo_verificacion (email, codigo, tipo, expira_en) VALUES ($1,$2,'2fa',$3)`,
        [u.email, codigo, expira]
      );
      // Enviar correo
      try {
        await enviarCorreo({
          to: u.email,
          subject: `Código: ${codigo} — IPS Fulano`,
          html: htmlCorreoBase('Código 2FA', `
            <p style="color:#333;font-size:15px;">Hola <strong>${u.nombre}</strong>,</p>
            <p style="color:#555;font-size:14px;">Tu código de verificación es:</p>
            <div style="background:white;border:2px solid #C0392B;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
              <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#C0392B;">${codigo}</span>
            </div>
            <p style="color:#e53935;font-size:13px;text-align:center;">⏱️ Expira en <strong>5 minutos</strong></p>
          `),
        });
      } catch (e) {
        console.error('Error enviando 2FA:', e.message);
      }
      return ok({ requiere2fa: true, userId: u.id });
    }

    // Login directo sin 2FA
    await db.query(
      `UPDATE usuario SET intentos_fallidos=0, bloqueado_hasta=NULL, ultimo_acceso=NOW(), ip_ultimo_acceso=$1 WHERE id=$2`,
      [ip, u.id]
    );
    await registrarAuditoria(db, { usuario_id: u.id, usuario_email: u.email, accion: 'LOGIN', modulo: 'Auth', descripcion: 'Acceso exitoso', ip });

    // Notificación de login
    try {
      await enviarCorreo({
        to: u.email,
        subject: 'Inicio de sesión — IPS Fulano',
        html: htmlCorreoBase('Login', `
          <p>Hola <strong>${u.nombre}</strong>, se registró un inicio de sesión.</p>
          <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;">
            <p>📅 <strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
            <p>🌐 <strong>IP:</strong> ${ip}</p>
          </div>
          <p style="color:#e53935;font-size:13px;">Si no fuiste tú, contacta al administrador.</p>
        `),
      });
    } catch (e) { /* no bloquear */ }

    const token = crearToken(u);
    return ok({ token, usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol_nombre, password_cambiada: u.password_cambiada } });
  }

  // ── POST /auth/verificar-2fa ───────────────────────────────────────────────
  if (path === '/verificar-2fa' && method === 'POST') {
    const { userId, codigo } = JSON.parse(event.body || '{}');
    if (!userId || !codigo) return error('Datos incompletos');

    const { rows: uRows } = await db.query(
      `SELECT u.*, r.nombre as rol_nombre FROM usuario u JOIN rol r ON u.rol_id=r.id WHERE u.id=$1`, [userId]
    );
    const u = uRows[0];
    if (!u) return error('Usuario no encontrado', 404);

    const { rows: cRows } = await db.query(
      `SELECT * FROM codigo_verificacion
       WHERE email=$1 AND tipo='2fa' AND usado=false AND expira_en > NOW()
       ORDER BY id DESC LIMIT 1`,
      [u.email]
    );
    const cv = cRows[0];
    if (!cv || cv.codigo !== codigo) {
      await registrarAuditoria(db, { usuario_id: u.id, usuario_email: u.email, accion: 'LOGIN_2FA_FALLIDO', modulo: 'Auth', descripcion: 'Código incorrecto', ip, exitoso: false });
      return error('Código incorrecto o expirado', 401);
    }

    await db.query(`UPDATE codigo_verificacion SET usado=true WHERE id=$1`, [cv.id]);
    await db.query(
      `UPDATE usuario SET intentos_fallidos=0, bloqueado_hasta=NULL, ultimo_acceso=NOW(), ip_ultimo_acceso=$1 WHERE id=$2`,
      [ip, u.id]
    );
    await registrarAuditoria(db, { usuario_id: u.id, usuario_email: u.email, accion: 'LOGIN', modulo: 'Auth', descripcion: 'Acceso exitoso con 2FA', ip });

    const token = crearToken(u);
    return ok({ token, usuario: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol_nombre, password_cambiada: u.password_cambiada } });
  }

  // ── POST /auth/reenviar-codigo ────────────────────────────────────────────
  if (path === '/reenviar-codigo' && method === 'POST') {
    const { userId } = JSON.parse(event.body || '{}');
    const { rows } = await db.query(`SELECT * FROM usuario WHERE id=$1`, [userId]);
    const u = rows[0];
    if (!u) return error('Usuario no encontrado', 404);

    const codigo = generarCodigo();
    const expira = new Date(); expira.setMinutes(expira.getMinutes() + 5);
    await db.query(
      `INSERT INTO codigo_verificacion (email, codigo, tipo, expira_en) VALUES ($1,$2,'2fa',$3)`,
      [u.email, codigo, expira]
    );
    try {
      await enviarCorreo({
        to: u.email,
        subject: `Nuevo código: ${codigo} — IPS Fulano`,
        html: htmlCorreoBase('Código 2FA', `
          <p>Hola <strong>${u.nombre}</strong>, tu nuevo código es:</p>
          <div style="background:white;border:2px solid #C0392B;border-radius:12px;padding:24px;text-align:center;">
            <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#C0392B;">${codigo}</span>
          </div>
          <p style="color:#e53935;text-align:center;">⏱️ Expira en <strong>5 minutos</strong></p>
        `),
      });
    } catch (e) { return error('No se pudo enviar el correo'); }
    return ok({ mensaje: 'Código reenviado' });
  }

  // ── POST /auth/cambiar-password ───────────────────────────────────────────
  if (path === '/cambiar-password' && method === 'POST') {
    const usuario = obtenerUsuarioDeRequest(event);
    if (!usuario) return noAutorizado();

    const { password_actual, password_nueva } = JSON.parse(event.body || '{}');
    if (!password_nueva || password_nueva.length < 8)
      return error('La nueva contraseña debe tener al menos 8 caracteres');

    const { rows } = await db.query(`SELECT * FROM usuario WHERE id=$1`, [usuario.id]);
    const u = rows[0];

    if (u.password_cambiada && password_actual) {
      const ok2 = await checkPassword(password_actual, u.password);
      if (!ok2) return error('La contraseña actual es incorrecta');
    }

    const igual = await checkPassword(password_nueva, u.password);
    if (igual) return error('La nueva contraseña debe ser diferente a la actual');

    const hash = await hashPassword(password_nueva);
    await db.query(`UPDATE usuario SET password=$1, password_cambiada=true WHERE id=$2`, [hash, u.id]);
    await registrarAuditoria(db, { usuario_id: u.id, usuario_email: u.email, accion: 'CAMBIO_PASSWORD', modulo: 'Perfil', descripcion: 'Contraseña actualizada', ip });
    return ok({ mensaje: 'Contraseña actualizada' });
  }

  // ── POST /auth/logout ────────────────────────────────────────────────────
  if (path === '/logout' && method === 'POST') {
    const usuario = obtenerUsuarioDeRequest(event);
    if (usuario) {
      await registrarAuditoria(db, { usuario_id: usuario.id, usuario_email: usuario.email, accion: 'LOGOUT', modulo: 'Auth', descripcion: 'Cierre de sesión', ip });
    }
    return ok({ mensaje: 'Sesión cerrada' });
  }

  return error('Ruta no encontrada', 404);
};
