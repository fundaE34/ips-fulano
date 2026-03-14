const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  const id = event.path.split('/').pop();
  const isId = id && !isNaN(id);

  try {
    // GET /api/pacientes  o  GET /api/pacientes/:id
    if (event.httpMethod === 'GET') {
      if (isId) {
        const { rows } = await query(
          `SELECT p.*, u.nombre as creado_por_nombre,
           array_agg(json_build_object('campo_id',v.campo_id,'nombre',c.nombre,'valor',v.valor,'tipo',c.tipo)) FILTER (WHERE v.id IS NOT NULL) as campos_extra
           FROM paciente p
           LEFT JOIN usuario u ON p.creado_por_id = u.id
           LEFT JOIN valor_campo_personalizado v ON v.paciente_id = p.id
           LEFT JOIN campo_personalizado c ON c.id = v.campo_id
           WHERE p.id = $1 GROUP BY p.id, u.nombre`, [id]
        );
        if (!rows.length) return cors({ error: 'No encontrado' }, 404);
        return cors(rows[0]);
      }

      const q = event.queryStringParameters?.q || '';
      const sql = q
        ? `SELECT p.*, array_agg(json_build_object('nombre',c.nombre,'valor',v.valor)) FILTER (WHERE v.id IS NOT NULL) as campos_extra
           FROM paciente p LEFT JOIN valor_campo_personalizado v ON v.paciente_id=p.id LEFT JOIN campo_personalizado c ON c.id=v.campo_id
           WHERE p.activo=true AND (p.nombre ILIKE $1 OR p.identificacion ILIKE $1)
           GROUP BY p.id ORDER BY p.id DESC`
        : `SELECT p.*, array_agg(json_build_object('nombre',c.nombre,'valor',v.valor)) FILTER (WHERE v.id IS NOT NULL) as campos_extra
           FROM paciente p LEFT JOIN valor_campo_personalizado v ON v.paciente_id=p.id LEFT JOIN campo_personalizado c ON c.id=v.campo_id
           WHERE p.activo=true GROUP BY p.id ORDER BY p.id DESC`;
      const params = q ? [`%${q}%`] : [];
      const { rows } = await query(sql, params);
      return cors(rows);
    }

    // POST — crear paciente
    if (event.httpMethod === 'POST') {
      const d = JSON.parse(event.body || '{}');
      const { rows } = await query(
        `INSERT INTO paciente(nombre,identificacion,tipo_identificacion,telefono,email,direccion,fecha_nacimiento,sexo,creado_por_id)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [d.nombre,d.identificacion,d.tipo_identificacion||'CC',d.telefono||null,d.email||null,
         d.direccion||null,d.fecha_nacimiento||null,d.sexo||null,user.id]
      );
      const pac = rows[0];
      // Campos extra
      if (d.campos_extra) {
        for (const [campo_id, valor] of Object.entries(d.campos_extra)) {
          await query(
            `INSERT INTO valor_campo_personalizado(paciente_id,campo_id,valor) VALUES($1,$2,$3)`,
            [pac.id, campo_id, valor]
          );
        }
      }
      await query(
        `INSERT INTO auditoria(usuario_id,usuario_email,accion,modulo,descripcion)
         VALUES($1,$2,'CREAR','Pacientes',$3)`,
        [user.id, user.email, `Paciente creado: ${pac.nombre}`]
      );
      return cors(pac, 201);
    }

    // PUT — editar paciente
    if (event.httpMethod === 'PUT' && isId) {
      const d = JSON.parse(event.body || '{}');
      const { rows } = await query(
        `UPDATE paciente SET nombre=$1,identificacion=$2,tipo_identificacion=$3,telefono=$4,
         email=$5,direccion=$6,fecha_nacimiento=$7,sexo=$8 WHERE id=$9 RETURNING *`,
        [d.nombre,d.identificacion,d.tipo_identificacion||'CC',d.telefono||null,d.email||null,
         d.direccion||null,d.fecha_nacimiento||null,d.sexo||null,id]
      );
      // Actualizar campos extra
      if (d.campos_extra) {
        for (const [campo_id, valor] of Object.entries(d.campos_extra)) {
          await query(
            `INSERT INTO valor_campo_personalizado(paciente_id,campo_id,valor) VALUES($1,$2,$3)
             ON CONFLICT(paciente_id,campo_id) DO UPDATE SET valor=$3`,
            [id, campo_id, valor]
          );
        }
      }
      return cors(rows[0]);
    }

    // DELETE — desactivar paciente
    if (event.httpMethod === 'DELETE' && isId) {
      if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
      await query(`UPDATE paciente SET activo=false WHERE id=$1`, [id]);
      return cors({ ok: true });
    }

    return cors({ error: 'No encontrado' }, 404);
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
