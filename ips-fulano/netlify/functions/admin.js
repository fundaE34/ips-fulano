// netlify/functions/admin.js
// Configuración, backup, auditoría, Drive, especialidades, campos personalizados

const {
  getDB, ok, error, noAutorizado, handleOptions,
  obtenerUsuarioDeRequest, registrarAuditoria, obtenerIP,
  enviarCorreo, htmlCorreoBase, generarCodigo,
} = require('./_utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  const usuario = obtenerUsuarioDeRequest(event);
  if (!usuario) return noAutorizado();

  const db     = getDB();
  const ip     = obtenerIP(event);
  const path   = event.path.replace('/.netlify/functions/admin', '').replace('/api/admin', '');
  const method = event.httpMethod;

  // ── DASHBOARD STATS ───────────────────────────────────────────────────────
  if (path === '/stats' && method === 'GET') {
    const [total, citas, hoy, pendientes, recPacientes, recCitas] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM paciente WHERE activo=true`),
      db.query(`SELECT COUNT(*) FROM cita`),
      db.query(`SELECT COUNT(*) FROM cita WHERE DATE(fecha)=CURRENT_DATE`),
      db.query(`SELECT COUNT(*) FROM cita WHERE estado='Pendiente'`),
      db.query(`SELECT p.id, p.nombre, p.identificacion, p.creado_en FROM paciente p WHERE p.activo=true ORDER BY p.id DESC LIMIT 5`),
      db.query(`SELECT c.*, p.nombre as paciente_nombre, m.nombre as medico_nombre, e.nombre as especialidad_nombre
                FROM cita c JOIN paciente p ON c.paciente_id=p.id
                JOIN usuario m ON c.medico_id=m.id JOIN especialidad e ON c.especialidad_id=e.id
                ORDER BY c.fecha DESC LIMIT 5`),
    ]);
    return ok({
      total_pacientes: parseInt(total.rows[0].count),
      total_citas: parseInt(citas.rows[0].count),
      citas_hoy: parseInt(hoy.rows[0].count),
      citas_pendientes: parseInt(pendientes.rows[0].count),
      pacientes_recientes: recPacientes.rows,
      citas_recientes: recCitas.rows,
    });
  }

  // ── AUDITORÍA ────────────────────────────────────────────────────────────
  if (path === '/auditoria' && method === 'GET') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { rows } = await db.query(
      `SELECT a.*, u.nombre as usuario_nombre FROM auditoria a
       LEFT JOIN usuario u ON a.usuario_id=u.id
       ORDER BY a.fecha_hora DESC LIMIT 500`
    );
    return ok(rows);
  }

  // ── CONFIGURACIÓN ─────────────────────────────────────────────────────────
  if (path === '/config' && method === 'GET') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { rows } = await db.query(`SELECT clave, valor FROM configuracion_sistema`);
    const config = {};
    rows.forEach(r => { config[r.clave] = r.valor; });
    return ok(config);
  }

  if (path === '/config' && method === 'POST') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const b = JSON.parse(event.body || '{}');
    for (const [clave, valor] of Object.entries(b)) {
      await db.query(
        `INSERT INTO configuracion_sistema (clave, valor) VALUES ($1,$2)
         ON CONFLICT (clave) DO UPDATE SET valor=$2`,
        [clave, String(valor)]
      );
    }
    await registrarAuditoria(db, { usuario_id: usuario.id, usuario_email: usuario.email, accion: 'EDITAR_CONFIG', modulo: 'Admin', descripcion: 'Configuración actualizada', ip });
    return ok({ mensaje: 'Configuración guardada' });
  }

  // ── ESPECIALIDADES ────────────────────────────────────────────────────────
  if (path === '/especialidades' && method === 'GET') {
    const { rows } = await db.query(
      `SELECT e.*, COUNT(c.id) as total_citas FROM especialidad e
       LEFT JOIN cita c ON e.id=c.especialidad_id
       GROUP BY e.id ORDER BY e.nombre`
    );
    return ok(rows);
  }

  if (path === '/especialidades' && method === 'POST') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { nombre } = JSON.parse(event.body || '{}');
    if (!nombre) return error('Nombre requerido');
    const { rows } = await db.query(
      `INSERT INTO especialidad (nombre, activo) VALUES ($1, true) RETURNING *`, [nombre]
    );
    return ok(rows[0], 201);
  }

  const matchEsp = path.match(/^\/especialidades\/(\d+)$/);
  if (matchEsp && method === 'PUT') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { nombre, activo } = JSON.parse(event.body || '{}');
    await db.query(`UPDATE especialidad SET nombre=$1, activo=$2 WHERE id=$3`, [nombre, activo, matchEsp[1]]);
    return ok({ mensaje: 'Especialidad actualizada' });
  }

  if (matchEsp && method === 'DELETE') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    await db.query(`UPDATE especialidad SET activo=false WHERE id=$1`, [matchEsp[1]]);
    return ok({ mensaje: 'Especialidad desactivada' });
  }

  // ── CAMPOS PERSONALIZADOS ─────────────────────────────────────────────────
  if (path === '/campos' && method === 'GET') {
    const { rows } = await db.query(
      `SELECT * FROM campo_personalizado ORDER BY orden`
    );
    return ok(rows);
  }

  if (path === '/campos' && method === 'POST') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const b = JSON.parse(event.body || '{}');
    const { rows } = await db.query(
      `INSERT INTO campo_personalizado (nombre, clave, tipo, opciones, obligatorio, orden, activo)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING *`,
      [b.nombre, b.clave, b.tipo || 'texto', b.opciones || null, b.obligatorio || false, b.orden || 0]
    );
    return ok(rows[0], 201);
  }

  const matchCampo = path.match(/^\/campos\/(\d+)$/);
  if (matchCampo && method === 'DELETE') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    await db.query(`UPDATE campo_personalizado SET activo=false WHERE id=$1`, [matchCampo[1]]);
    return ok({ mensaje: 'Campo desactivado' });
  }

  // ── BACKUP ────────────────────────────────────────────────────────────────
  if (path === '/backup' && method === 'GET') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { rows } = await db.query(
      `SELECT br.*, u.nombre as solicitado_por_nombre FROM backup_registro br
       LEFT JOIN usuario u ON br.solicitado_por_id=u.id
       ORDER BY br.creado_en DESC LIMIT 20`
    );
    return ok(rows);
  }

  if (path === '/backup/generar' && method === 'POST') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    // Generar backup en background — retorna inmediatamente
    generarBackupAsync(db, usuario, ip).catch(console.error);
    return ok({ mensaje: 'Backup iniciado. Recibirás un correo cuando esté listo.' });
  }

  // ── CORREOS BACKUP ────────────────────────────────────────────────────────
  if (path === '/correos-backup' && method === 'GET') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { rows } = await db.query(`SELECT * FROM correo_backup ORDER BY creado_en`);
    return ok(rows);
  }

  if (path === '/correos-backup' && method === 'POST') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    const { email } = JSON.parse(event.body || '{}');
    if (!email) return error('Email requerido');

    const total = await db.query(`SELECT COUNT(*) FROM correo_backup`);
    if (parseInt(total.rows[0].count) >= 5) return error('Máximo 5 correos de backup');

    const { rows } = await db.query(
      `INSERT INTO correo_backup (email, verificado) VALUES ($1, false) RETURNING *`, [email]
    );
    // Enviar código de verificación
    const codigo = generarCodigo();
    const expira = new Date(); expira.setMinutes(expira.getMinutes() + 15);
    await db.query(
      `INSERT INTO codigo_verificacion (email, codigo, tipo, expira_en) VALUES ($1,$2,'validar_correo',$3)`,
      [email, codigo, expira]
    );
    try {
      await enviarCorreo({
        to: email,
        subject: `Verificación de correo backup: ${codigo}`,
        html: htmlCorreoBase('Verificar correo', `
          <p>Se está registrando este correo para recibir backups de IPS Fulano.</p>
          <div style="background:white;border:2px solid #C0392B;border-radius:12px;padding:24px;text-align:center;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C0392B;">${codigo}</span>
          </div>
          <p style="color:#e53935;text-align:center;">⏱️ Expira en 15 minutos</p>
        `),
      });
    } catch (e) { return error('No se pudo enviar el correo de verificación'); }
    return ok(rows[0], 201);
  }

  const matchVerificar = path.match(/^\/correos-backup\/verificar$/);
  if (matchVerificar && method === 'POST') {
    const { email, codigo } = JSON.parse(event.body || '{}');
    const { rows } = await db.query(
      `SELECT * FROM codigo_verificacion WHERE email=$1 AND tipo='validar_correo' AND usado=false AND expira_en>NOW() ORDER BY id DESC LIMIT 1`,
      [email]
    );
    if (!rows[0] || rows[0].codigo !== codigo) return error('Código incorrecto o expirado');
    await db.query(`UPDATE codigo_verificacion SET usado=true WHERE id=$1`, [rows[0].id]);
    await db.query(`UPDATE correo_backup SET verificado=true WHERE email=$1`, [email]);
    return ok({ mensaje: 'Correo verificado' });
  }

  const matchEliminarCorreo = path.match(/^\/correos-backup\/(\d+)$/);
  if (matchEliminarCorreo && method === 'DELETE') {
    if (usuario.rol !== 'admin') return error('Sin permisos', 403);
    await db.query(`DELETE FROM correo_backup WHERE id=$1`, [matchEliminarCorreo[1]]);
    return ok({ mensaje: 'Correo eliminado' });
  }

  // ── DRIVE STATUS ──────────────────────────────────────────────────────────
  if (path === '/drive/estado' && method === 'GET') {
    const tieneConfig = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN);
    return ok({ estado: tieneConfig ? 'autorizado' : 'sin_configurar' });
  }

  // ── VERSION ───────────────────────────────────────────────────────────────
  if (path === '/version' && method === 'GET') {
    const { rows } = await db.query(
      `SELECT * FROM version_sistema ORDER BY publicado_en DESC LIMIT 1`
    );
    return ok(rows[0] || { version: process.env.APP_VERSION || '2.0.0' });
  }

  return error('Ruta no encontrada', 404);
};

// ── Backup asíncrono ──────────────────────────────────────────────────────────
async function generarBackupAsync(db, usuario, ip) {
  const { enviarCorreo, htmlCorreoBase } = require('./_utils');
  const archiver = require('archiver');
  const { PassThrough } = require('stream');

  const registro = await db.query(
    `INSERT INTO backup_registro (tipo, solicitado_por_id, estado) VALUES ('manual',$1,'generando') RETURNING id`,
    [usuario.id]
  );
  const registroId = registro.rows[0].id;

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const nombre    = `backup_ips_fulano_${timestamp}.zip`;

    // Generar CSVs
    const tablas = [
      { nombre: 'pacientes.csv',    query: `SELECT id,nombre,identificacion,tipo_identificacion,telefono,email,direccion,fecha_nacimiento,sexo,activo,creado_en FROM paciente` },
      { nombre: 'citas.csv',        query: `SELECT id,paciente_id,medico_id,especialidad_id,fecha,estado,motivo_consulta,creado_en FROM cita` },
      { nombre: 'usuarios.csv',     query: `SELECT id,nombre,email,rol_id,activo FROM usuario` },
      { nombre: 'especialidades.csv', query: `SELECT id,nombre,activo FROM especialidad` },
      { nombre: 'auditoria.csv',    query: `SELECT id,usuario_email,accion,modulo,descripcion,ip_origen,fecha_hora,exitoso FROM auditoria ORDER BY fecha_hora DESC LIMIT 10000` },
      { nombre: 'historias.csv',    query: `SELECT e.id,e.historia_id,u.nombre as autor,e.tipo_entrada,e.contenido,e.fecha FROM historia_entrada e JOIN usuario u ON e.autor_id=u.id ORDER BY e.fecha DESC` },
    ];

    const chunks = [];
    const passThrough = new PassThrough();
    passThrough.on('data', chunk => chunks.push(chunk));

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(passThrough);

    for (const tabla of tablas) {
      const { rows } = await db.query(tabla.query);
      if (rows.length === 0) continue;
      const headers = Object.keys(rows[0]).join(',') + '\n';
      const csv     = headers + rows.map(r => Object.values(r).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')).join('\n');
      archive.append(csv, { name: `datos/${tabla.nombre}` });
    }

    archive.append(
      `IPS FULANO — BACKUP\nFecha: ${new Date().toLocaleString('es-CO')}\nGenerado por: ${usuario.email}\n`,
      { name: 'LEAME.txt' }
    );

    await archive.finalize();
    await new Promise(resolve => passThrough.on('end', resolve));

    const zipBytes = Buffer.concat(chunks);

    await db.query(
      `UPDATE backup_registro SET archivo_nombre=$1, archivo_datos=$2, tamano_bytes=$3, estado='exitoso' WHERE id=$4`,
      [nombre, zipBytes, zipBytes.length, registroId]
    );

    // Enviar a correos verificados
    const { rows: correos } = await db.query(`SELECT email FROM correo_backup WHERE verificado=true`);
    for (const c of correos) {
      try {
        await enviarCorreo({
          to: c.email,
          subject: `📦 Backup IPS Fulano — ${nombre}`,
          html: htmlCorreoBase('Backup', `
            <p>Se ha generado un backup del sistema.</p>
            <div style="background:white;border-radius:8px;padding:16px;">
              <p>📦 <strong>Archivo:</strong> ${nombre}</p>
              <p>📊 <strong>Tamaño:</strong> ${(zipBytes.length / 1024).toFixed(1)} KB</p>
            </div>
          `),
          attachments: [{ filename: nombre, content: zipBytes }],
        });
      } catch (e) { console.error(`Error enviando a ${c.email}:`, e.message); }
    }

    await registrarAuditoria(db, { usuario_id: usuario.id, usuario_email: usuario.email, accion: 'BACKUP_GENERADO', modulo: 'Admin', descripcion: `Backup generado: ${nombre}`, ip });
  } catch (e) {
    await db.query(
      `UPDATE backup_registro SET estado='fallido', error_mensaje=$1 WHERE id=$2`,
      [e.message, registroId]
    );
  }
}
