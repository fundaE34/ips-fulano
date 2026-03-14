const { query } = require('./_db');
const { requireAuth, cors } = require('./_auth');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors({});
  const user = requireAuth(event);
  if (!user) return cors({ error: 'No autorizado' }, 401);

  try {
    const hoy = new Date().toISOString().split('T')[0];
    const [pac, citas, citasHoy, pendientes, pacRecientes, citasRecientes] = await Promise.all([
      query(`SELECT COUNT(*) FROM paciente WHERE activo=true`),
      query(`SELECT COUNT(*) FROM cita`),
      query(`SELECT COUNT(*) FROM cita WHERE DATE(fecha)=$1`, [hoy]),
      query(`SELECT COUNT(*) FROM cita WHERE estado='Pendiente'`),
      query(`SELECT id,nombre,identificacion,telefono,creado_en FROM paciente WHERE activo=true ORDER BY id DESC LIMIT 5`),
      query(`SELECT c.id,c.fecha,c.estado,p.nombre as paciente_nombre,u.nombre as medico_nombre,e.nombre as especialidad_nombre
             FROM cita c JOIN paciente p ON p.id=c.paciente_id JOIN usuario u ON u.id=c.medico_id
             JOIN especialidad e ON e.id=c.especialidad_id ORDER BY c.fecha DESC LIMIT 5`),
    ]);
    return cors({
      stats: {
        total_pacientes: parseInt(pac.rows[0].count),
        total_citas: parseInt(citas.rows[0].count),
        citas_hoy: parseInt(citasHoy.rows[0].count),
        citas_pendientes: parseInt(pendientes.rows[0].count),
      },
      pacientes_recientes: pacRecientes.rows,
      citas_recientes: citasRecientes.rows,
    });
  } catch(e) {
    console.error(e);
    return cors({ error: e.message }, 500);
  }
};
