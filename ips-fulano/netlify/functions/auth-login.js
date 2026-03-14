const bcrypt = require('bcryptjs');
const { query } = require('./_db');
const { signToken, cors } = require('./_auth');
const { enviarCodigo2FA, enviarNotificacionLogin } = require('./_email');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Método no permitido' }, 405);

  try {
    const { email, password } = JSON.parse(event.body || '{}');
    if (!email || !password) return cors({ error: 'Email y contraseña requeridos' }, 400);

    const { rows } = await query(
      `SELECT u.*, r.nombre as rol_nombre FROM usuario u
       JOIN rol r ON u.rol_id = r.id WHERE u.email = $1`, [email]
    );
    const user = rows[0];

    if (!user) {
      await query(
        `INSERT INTO auditoria(usuario_email,accion,modulo,descripcion,ip_origen,exitoso)
         VALUES($1,'LOGIN_FALLIDO','Auth','Email no encontrado',$2,false)`,
        [email, event.headers['x-forwarded-for'] || '']
      );
      return cors({ error: 'Correo o contraseña incorrectos' }, 401);
    }

    // Verificar bloqueo
    if (user.bloqueado_hasta && new Date() < new Date(user.bloqueado_hasta)) {
      const mins = Math.ceil((new Date(user.bloqueado_hasta) - new Date()) / 60000);
      return cors({ error: `Cuenta bloqueada. Intenta en ${mins} minuto(s).` }, 403);
    }

    // Verificar contraseña
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const intentos = (user.intentos_fallidos || 0) + 1;
      let bloqueado_hasta = null;
      if (intentos >= 5) {
        bloqueado_hasta = new Date(Date.now() + 30 * 60000);
      }
      await query(
        `UPDATE usuario SET intentos_fallidos=$1, bloqueado_hasta=$2 WHERE id=$3`,
        [bloqueado_hasta ? 0 : intentos, bloqueado_hasta, user.id]
      );
      await query(
        `INSERT INTO auditoria(usuario_id,usuario_email,accion,modulo,descripcion,ip_origen,exitoso)
         VALUES($1,$2,'LOGIN_FALLIDO','Auth','Contraseña incorrecta',$3,false)`,
        [user.id, email, event.headers['x-forwarded-for'] || '']
      );
      if (bloqueado_hasta) return cors({ error: 'Cuenta bloqueada por 30 minutos.' }, 403);
      return cors({ error: `Contraseña incorrecta. Intentos restantes: ${5 - intentos}` }, 401);
    }

    if (!user.activo) return cors({ error: 'Cuenta inactiva. Contacta al administrador.' }, 403);

    // Verificar si 2FA está activo
    const cfg = await query(`SELECT valor FROM configuracion_sistema WHERE clave='2fa_activo'`);
    const dosfa = cfg.rows[0]?.valor !== 'false';

    if (dosfa) {
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 5 * 60000);
      await query(
        `INSERT INTO codigo_verificacion(email,codigo,tipo,expira_en) VALUES($1,$2,'2fa',$3)`,
        [email, codigo, expira]
      );
      try { await enviarCodigo2FA(email, user.nombre, codigo); } catch(e) { console.error(e); }
      return cors({ requiere2fa: true, userId: user.id });
    }

    // Login directo sin 2FA
    await query(
      `UPDATE usuario SET intentos_fallidos=0, bloqueado_hasta=NULL,
       ultimo_acceso=NOW(), ip_ultimo_acceso=$1 WHERE id=$2`,
      [event.headers['x-forwarded-for'] || '', user.id]
    );
    await query(
      `INSERT INTO auditoria(usuario_id,usuario_email,accion,modulo,descripcion,ip_origen)
       VALUES($1,$2,'LOGIN','Auth','Acceso exitoso',$3)`,
      [user.id, email, event.headers['x-forwarded-for'] || '']
    );
    try {
      await enviarNotificacionLogin(email, user.nombre,
        event.headers['x-forwarded-for'] || 'desconocida',
        new Date().toLocaleString('es-CO'));
    } catch(e) {}

    const token = signToken({ id: user.id, email: user.email, rol: user.rol_nombre, nombre: user.nombre });
    return cors({
      token, passwordCambiada: user.password_cambiada,
      usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol_nombre }
    });

  } catch (e) {
    console.error(e);
    return cors({ error: 'Error del servidor' }, 500);
  }
};
