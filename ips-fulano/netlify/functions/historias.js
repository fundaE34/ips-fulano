const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  const parts = event.path.split('/').filter(Boolean);
  const historiaId = parts[parts.length - 1];
  const pacienteId = event.queryStringParameters?.paciente_id;

  try {
    if (event.httpMethod === 'GET') {
      if (pacienteId) {
        // Obtener historia de un paciente
        const { rows } = await query(
          `SELECT h.*, p.nombre as paciente_nombre, p.identificacion as paciente_id_doc,
           u.nombre as actualizado_por_nombre
           FROM historia_clinica h
           JOIN paciente p ON p.id = h.paciente_id
           LEFT JOIN usuario u ON u.id = h.actualizado_por_id
           WHERE h.paciente_id = $1`, [pacienteId]
        );
        if (!rows.length) return cors(null);
        const historia = rows[0];
        // Entradas
        const { rows: entradas } = await query(
          `SELECT e.*, u.nombre as autor_nombre, r.nombre as autor_rol
           FROM historia_entrada e
           JOIN usuario u ON u.id = e.autor_id
           JOIN rol r ON r.id = u.rol_id
           WHERE e.historia_id = $1 ORDER BY e.fecha DESC`, [historia.id]
        );
        historia.entradas = entradas;
        return cors(historia);
      }
      if (historiaId && !isNaN(historiaId)) {
        // Obtener historia por id
        const { rows } = await query(
          `SELECT h.*, p.nombre as paciente_nombre FROM historia_clinica h
           JOIN paciente p ON p.id = h.paciente_id WHERE h.id = $1`, [historiaId]
        );
        if (!rows.length) return cors({ error: 'No encontrada' }, 404);
        const historia = rows[0];
        const { rows: entradas } = await query(
          `SELECT e.*, u.nombre as autor_nombre, r.nombre as autor_rol
           FROM historia_entrada e JOIN usuario u ON u.id = e.autor_id
           JOIN rol r ON r.id = u.rol_id
           WHERE e.historia_id = $1 ORDER BY e.fecha DESC`, [historiaId]
        );
        historia.entradas = entradas;
        return cors(historia);
      }
    }

    // POST — crear historia o agregar entrada
    if (event.httpMethod === 'POST') {
      const d = JSON.parse(event.body || '{}');

      if (d.tipo === 'entrada') {
        // Verificar bloqueo
        const { rows: hRows } = await query(
          `SELECT * FROM historia_clinica WHERE id = $1`, [d.historia_id]
        );
        const h = hRows[0];
        if (h?.bloqueado_por_id && h.bloqueado_por_id !== user.id) {
          const exp = new Date(h.bloqueado_en);
          exp.setMinutes(exp.getMinutes() + 30);
          if (new Date() < exp) {
            return cors({ error: 'Historia bloqueada por otro usuario' }, 409);
          }
        }
        const { rows } = await query(
          `INSERT INTO historia_entrada(historia_id,autor_id,contenido,tipo_entrada)
           VALUES($1,$2,$3,$4) RETURNING *`,
          [d.historia_id, user.id, d.contenido, d.tipo_entrada || 'Consulta']
        );
        // Actualizar historia y guardar versión
        await query(
          `UPDATE historia_clinica SET ultima_actualizacion=NOW(),
           actualizado_por_id=$1, bloqueado_por_id=NULL, bloqueado_en=NULL WHERE id=$2`,
          [user.id, d.historia_id]
        );
        await query(
          `INSERT INTO historia_version(historia_id,contenido,actualizado_por_id)
           VALUES($1,$2,$3)`, [d.historia_id, d.contenido, user.id]
        );
        return cors(rows[0], 201);
      }

      // Crear historia nueva
      const { rows } = await query(
        `INSERT INTO historia_clinica(paciente_id,motivo_consulta,antecedentes,actualizado_por_id)
         VALUES($1,$2,$3,$4) RETURNING *`,
        [d.paciente_id, d.motivo_consulta || null, d.antecedentes || null, user.id]
      );
      return cors(rows[0], 201);
    }

    // PUT — bloquear/desbloquear o editar
    if (event.httpMethod === 'PUT' && historiaId && !isNaN(historiaId)) {
      const d = JSON.parse(event.body || '{}');
      if (d.accion === 'bloquear') {
        await query(
          `UPDATE historia_clinica SET bloqueado_por_id=$1, bloqueado_en=NOW() WHERE id=$2`,
          [user.id, historiaId]
        );
        return cors({ ok: true });
      }
      if (d.accion === 'liberar') {
        await query(
          `UPDATE historia_clinica SET bloqueado_por_id=NULL, bloqueado_en=NULL WHERE id=$1`,
          [historiaId]
        );
        return cors({ ok: true });
      }
      // Editar datos base
      await query(
        `UPDATE historia_clinica SET motivo_consulta=$1, antecedentes=$2,
         ultima_actualizacion=NOW(), actualizado_por_id=$3 WHERE id=$4`,
        [d.motivo_consulta, d.antecedentes, user.id, historiaId]
      );
      return cors({ ok: true });
    }

    return cors({ error: 'Ruta no encontrada' }, 404);
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
