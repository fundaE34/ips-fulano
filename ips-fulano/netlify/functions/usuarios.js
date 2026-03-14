const bcrypt = require('bcryptjs');
const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');
const { enviarCodigoValidacion } = require('./_email');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);
  if (user.rol !== 'admin') return cors({ error: 'Solo administradores' }, 403);

  const id = event.path.split('/').pop();
  const isId = id && !isNaN(id);

  try {
    if (event.httpMethod === 'GET') {
      const { rows } = await query(
        `SELECT u.id,u.nombre,u.email,u.activo,u.password_cambiada,u.ultimo_acceso,
         u.ip_ultimo_acceso,r.nombre as rol_nombre, r.id as rol_id
         FROM usuario u JOIN rol r ON r.id=u.rol_id ORDER BY u.id`
      );
      return cors(rows);
    }

    if (event.httpMethod === 'POST') {
      const d = JSON.parse(event.body || '{}');
      // Verificar email único
      const existe = await query(`SELECT id FROM usuario WHERE email=$1`, [d.email]);
      if (existe.rows.length) return cors({ error: 'El correo ya existe' }, 409);

      // Validar correo con código
      if (d.accion === 'verificar_email') {
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = new Date(Date.now() + 5 * 60000);
        await query(
          `INSERT INTO codigo_verificacion(email,codigo,tipo,expira_en) VALUES($1,$2,'validar_correo',$3)`,
          [d.email, codigo, expira]
        );
        try { await enviarCodigoValidacion(d.email, codigo); } catch(e) {}
        return cors({ ok: true });
      }

      const hash = await bcrypt.hash(d.password || 'cambiar123', 10);
      const { rows } = await query(
        `INSERT INTO usuario(nombre,email,password,rol_id,activo,password_cambiada)
         VALUES($1,$2,$3,$4,true,false) RETURNING id,nombre,email,activo`,
        [d.nombre, d.email, hash, d.rol_id]
      );
      await query(
        `INSERT INTO auditoria(usuario_id,usuario_email,accion,modulo,descripcion)
         VALUES($1,$2,'CREAR','Usuarios',$3)`,
        [user.id, user.email, `Usuario creado: ${d.email}`]
      );
      return cors(rows[0], 201);
    }

    if (event.httpMethod === 'PUT' && isId) {
      const d = JSON.parse(event.body || '{}');
      if (d.accion === 'cambiar_password') {
        const hash = await bcrypt.hash(d.password, 10);
        await query(`UPDATE usuario SET password=$1, password_cambiada=false WHERE id=$2`, [hash, id]);
        return cors({ ok: true });
      }
      const { rows } = await query(
        `UPDATE usuario SET nombre=$1,email=$2,rol_id=$3,activo=$4 WHERE id=$5 RETURNING id,nombre,email`,
        [d.nombre, d.email, d.rol_id, d.activo !== false, id]
      );
      return cors(rows[0]);
    }

    if (event.httpMethod === 'DELETE' && isId) {
      await query(`UPDATE usuario SET activo=false WHERE id=$1`, [id]);
      return cors({ ok: true });
    }

    return cors({ error: 'Ruta no encontrada' }, 404);
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
