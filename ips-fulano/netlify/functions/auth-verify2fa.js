const { query } = require('./_db');
const { signToken, cors } = require('./_auth');
const { enviarNotificacionLogin } = require('./_email');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Método no permitido' }, 405);

  try {
    const { userId, codigo } = JSON.parse(event.body || '{}');

    const { rows: userRows } = await query(
      `SELECT u.*, r.nombre as rol_nombre FROM usuario u
       JOIN rol r ON u.rol_id = r.id WHERE u.id = $1`, [userId]
    );
    const user = userRows[0];
    if (!user) return cors({ error: 'Usuario no encontrado' }, 404);

    const { rows } = await query(
      `SELECT * FROM codigo_verificacion
       WHERE email=$1 AND codigo=$2 AND tipo='2fa' AND usado=false
       AND expira_en > (NOW() AT TIME ZONE 'UTC')
       ORDER BY id DESC LIMIT 1`,
      [user.email, codigo]
    );

    if (!rows.length) return cors({ error: 'Código inválido o expirado' }, 401);

    await query(`UPDATE codigo_verificacion SET usado=true WHERE id=$1`, [rows[0].id]);
    await query(
      `UPDATE usuario SET intentos_fallidos=0, bloqueado_hasta=NULL,
       ultimo_acceso=NOW(), ip_ultimo_acceso=$1 WHERE id=$2`,
      [event.headers['x-forwarded-for'] || '', user.id]
    );
    await query(
      `INSERT INTO auditoria(usuario_id,usuario_email,accion,modulo,descripcion,ip_origen)
       VALUES($1,$2,'LOGIN','Auth','Acceso exitoso con 2FA',$3)`,
      [user.id, user.email, event.headers['x-forwarded-for'] || '']
    );
    try {
      await enviarNotificacionLogin(user.email, user.nombre,
        event.headers['x-forwarded-for'] || 'desconocida',
        new Date().toLocaleString('es-CO'));
    } catch(e) {}

    const token = signToken({ id: user.id, email: user.email, rol: user.rol_nombre, nombre: user.nombre });
    return cors({
      token, passwordCambiada: user.password_cambiada,
      usuario: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol_nombre }
    });
  } catch(e) {
    console.error(e);
    return cors({ error: 'Error del servidor' }, 500);
  }
};
