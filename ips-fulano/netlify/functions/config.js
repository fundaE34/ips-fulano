const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  try {
    if (event.httpMethod === 'GET') {
      const tipo = event.queryStringParameters?.tipo;
      if (tipo === 'roles') {
        const { rows } = await query(`SELECT * FROM rol ORDER BY id`);
        return cors(rows);
      }
      if (tipo === 'especialidades') {
        const { rows } = await query(`SELECT * FROM especialidad WHERE activo=true ORDER BY nombre`);
        return cors(rows);
      }
      if (tipo === 'campos') {
        const { rows } = await query(`SELECT * FROM campo_personalizado WHERE activo=true ORDER BY orden`);
        return cors(rows);
      }
      if (tipo === 'sistema') {
        if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
        const { rows } = await query(`SELECT clave,valor FROM configuracion_sistema`);
        const cfg = {};
        rows.forEach(r => cfg[r.clave] = r.valor);
        return cors(cfg);
      }
      if (tipo === 'medicos') {
        const { rows } = await query(
          `SELECT u.id, u.nombre FROM usuario u JOIN rol r ON r.id=u.rol_id
           WHERE r.nombre='medico' AND u.activo=true ORDER BY u.nombre`
        );
        return cors(rows);
      }
      if (tipo === 'auditoria') {
        if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
        const { rows } = await query(
          `SELECT a.*, u.nombre as usuario_nombre FROM auditoria a
           LEFT JOIN usuario u ON u.id=a.usuario_id ORDER BY a.fecha_hora DESC LIMIT 200`
        );
        return cors(rows);
      }
      if (tipo === 'correos_backup') {
        if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
        const { rows } = await query(`SELECT * FROM correo_backup ORDER BY id`);
        return cors(rows);
      }
    }

    if (event.httpMethod === 'POST') {
      if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
      const d = JSON.parse(event.body || '{}');

      if (d.tipo === 'especialidad') {
        const { rows } = await query(
          `INSERT INTO especialidad(nombre) VALUES($1) RETURNING *`, [d.nombre]
        );
        return cors(rows[0], 201);
      }
      if (d.tipo === 'campo') {
        const { rows } = await query(
          `INSERT INTO campo_personalizado(nombre,clave,tipo,opciones,obligatorio,orden)
           VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
          [d.nombre, d.clave, d.tipo||'texto', d.opciones||null, d.obligatorio||false, d.orden||0]
        );
        return cors(rows[0], 201);
      }
      if (d.tipo === 'sistema') {
        for (const [clave, valor] of Object.entries(d.config)) {
          await query(
            `INSERT INTO configuracion_sistema(clave,valor) VALUES($1,$2)
             ON CONFLICT(clave) DO UPDATE SET valor=$2`, [clave, valor]
          );
        }
        return cors({ ok: true });
      }
      if (d.tipo === 'correo_backup') {
        const existe = await query(`SELECT id FROM correo_backup WHERE email=$1`, [d.email]);
        if (existe.rows.length) return cors({ error: 'Correo ya registrado' }, 409);
        // Enviar código de verificación
        const { enviarCodigoValidacion } = require('./_email');
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        const expira = new Date(Date.now() + 5 * 60000);
        await query(
          `INSERT INTO codigo_verificacion(email,codigo,tipo,expira_en) VALUES($1,$2,'validar_correo',$3)`,
          [d.email, codigo, expira]
        );
        await query(`INSERT INTO correo_backup(email) VALUES($1) ON CONFLICT DO NOTHING`, [d.email]);
        try { await enviarCodigoValidacion(d.email, codigo); } catch(e) {}
        return cors({ ok: true });
      }
      if (d.tipo === 'verificar_correo_backup') {
        const { rows } = await query(
          `SELECT * FROM codigo_verificacion WHERE email=$1 AND codigo=$2
           AND tipo='validar_correo' AND usado=false AND expira_en>NOW() ORDER BY id DESC LIMIT 1`,
          [d.email, d.codigo]
        );
        if (!rows.length) return cors({ error: 'Código inválido' }, 400);
        await query(`UPDATE codigo_verificacion SET usado=true WHERE id=$1`, [rows[0].id]);
        await query(`UPDATE correo_backup SET verificado=true WHERE email=$1`, [d.email]);
        return cors({ ok: true });
      }
    }

    if (event.httpMethod === 'DELETE') {
      if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
      const d = JSON.parse(event.body || '{}');
      if (d.tipo === 'especialidad') {
        await query(`UPDATE especialidad SET activo=false WHERE id=$1`, [d.id]);
        return cors({ ok: true });
      }
      if (d.tipo === 'correo_backup') {
        await query(`DELETE FROM correo_backup WHERE email=$1`, [d.email]);
        return cors({ ok: true });
      }
    }

    return cors({ error: 'Ruta no encontrada' }, 404);
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
