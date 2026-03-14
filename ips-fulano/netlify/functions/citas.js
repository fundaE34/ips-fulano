const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  const id = event.path.split('/').pop();
  const isId = id && !isNaN(id);

  try {
    if (event.httpMethod === 'GET') {
      if (isId) {
        const { rows } = await query(
          `SELECT c.*, p.nombre as paciente_nombre, p.identificacion as paciente_doc,
           u.nombre as medico_nombre, e.nombre as especialidad_nombre
           FROM cita c JOIN paciente p ON p.id=c.paciente_id
           JOIN usuario u ON u.id=c.medico_id
           JOIN especialidad e ON e.id=c.especialidad_id
           WHERE c.id=$1`, [id]
        );
        if (!rows.length) return cors({ error: 'No encontrada' }, 404);
        return cors(rows[0]);
      }
      const { estado, medico_id, fecha } = event.queryStringParameters || {};
      let sql = `SELECT c.*, p.nombre as paciente_nombre, u.nombre as medico_nombre, e.nombre as especialidad_nombre
                 FROM cita c JOIN paciente p ON p.id=c.paciente_id
                 JOIN usuario u ON u.id=c.medico_id
                 JOIN especialidad e ON e.id=c.especialidad_id WHERE 1=1`;
      const params = [];
      if (estado) { params.push(estado); sql += ` AND c.estado=$${params.length}`; }
      if (medico_id) { params.push(medico_id); sql += ` AND c.medico_id=$${params.length}`; }
      if (fecha) { params.push(fecha); sql += ` AND DATE(c.fecha)=$${params.length}`; }
      sql += ' ORDER BY c.fecha DESC';
      const { rows } = await query(sql, params);
      return cors(rows);
    }

    if (event.httpMethod === 'POST') {
      const d = JSON.parse(event.body || '{}');
      const { rows } = await query(
        `INSERT INTO cita(paciente_id,medico_id,especialidad_id,fecha,estado,motivo_consulta,creado_por_id)
         VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [d.paciente_id,d.medico_id,d.especialidad_id,d.fecha,d.estado||'Pendiente',d.motivo_consulta||null,user.id]
      );
      return cors(rows[0], 201);
    }

    if (event.httpMethod === 'PUT' && isId) {
      const d = JSON.parse(event.body || '{}');
      const { rows } = await query(
        `UPDATE cita SET paciente_id=$1,medico_id=$2,especialidad_id=$3,
         fecha=$4,estado=$5,motivo_consulta=$6 WHERE id=$7 RETURNING *`,
        [d.paciente_id,d.medico_id,d.especialidad_id,d.fecha,d.estado,d.motivo_consulta||null,id]
      );
      return cors(rows[0]);
    }

    if (event.httpMethod === 'DELETE' && isId) {
      if (user.rol !== 'admin') return cors({ error: 'Sin permisos' }, 403);
      await query(`DELETE FROM cita WHERE id=$1`, [id]);
      return cors({ ok: true });
    }

    return cors({ error: 'Ruta no encontrada' }, 404);
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
