const bcrypt = require('bcryptjs');
const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  if (event.httpMethod !== 'POST') return cors({ error: 'Método no permitido' }, 405);
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  try {
    const { password_actual, password_nueva } = JSON.parse(event.body || '{}');
    const { rows } = await query(`SELECT * FROM usuario WHERE id=$1`, [user.id]);
    const u = rows[0];

    if (u.password_cambiada) {
      const ok = await bcrypt.compare(password_actual, u.password);
      if (!ok) return cors({ error: 'Contraseña actual incorrecta' }, 401);
    }
    const igual = await bcrypt.compare(password_nueva, u.password);
    if (igual) return cors({ error: 'La nueva contraseña debe ser diferente' }, 400);

    const hash = await bcrypt.hash(password_nueva, 10);
    await query(`UPDATE usuario SET password=$1, password_cambiada=true WHERE id=$2`, [hash, user.id]);
    return cors({ ok: true });
  } catch(e) {
    return cors({ error: e.message }, 500);
  }
};
