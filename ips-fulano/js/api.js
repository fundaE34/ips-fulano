const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('usuario') || 'null'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/';
}

function requireAuth() {
  if (!localStorage.getItem('token')) {
    window.location.href = '/';
    return false;
  }
  return true;
}

async function req(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) { logout(); return null; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

const api = {
  // Auth
  login:         (email, password)   => req('POST', '/auth-login',       { email, password }),
  verify2fa:     (userId, codigo)    => req('POST', '/auth-verify2fa',   { userId, codigo }),
  cambiarPass:   (body)              => req('POST', '/cambiar-password',  body),

  // Dashboard
  dashboard:     ()                  => req('GET',  '/dashboard'),

  // Pacientes
  getPacientes:  (q = '')            => req('GET',  `/pacientes${q ? '?q=' + encodeURIComponent(q) : ''}`),
  getPaciente:   (id)                => req('GET',  `/pacientes/${id}`),
  crearPaciente: (data)              => req('POST', '/pacientes',         data),
  editarPaciente:(id, data)          => req('PUT',  `/pacientes/${id}`,   data),
  borrarPaciente:(id)                => req('DELETE',`/pacientes/${id}`),

  // Historias
  getHistoria:       (pacienteId)    => req('GET',  `/historias?paciente_id=${pacienteId}`),
  getHistoriaById:   (id)            => req('GET',  `/historias/${id}`),
  crearHistoria:     (data)          => req('POST', '/historias',         data),
  agregarEntrada:    (data)          => req('POST', '/historias',         { ...data, tipo: 'entrada' }),
  bloquearHistoria:  (id)            => req('PUT',  `/historias/${id}`,   { accion: 'bloquear' }),
  liberarHistoria:   (id)            => req('PUT',  `/historias/${id}`,   { accion: 'liberar' }),

  // Citas
  getCitas:      (params = {})       => req('GET',  '/citas?' + new URLSearchParams(params)),
  getCita:       (id)                => req('GET',  `/citas/${id}`),
  crearCita:     (data)              => req('POST', '/citas',             data),
  editarCita:    (id, data)          => req('PUT',  `/citas/${id}`,       data),
  borrarCita:    (id)                => req('DELETE',`/citas/${id}`),

  // Usuarios
  getUsuarios:   ()                  => req('GET',  '/usuarios'),
  crearUsuario:  (data)              => req('POST', '/usuarios',          data),
  editarUsuario: (id, data)          => req('PUT',  `/usuarios/${id}`,    data),

  // Config
  getRoles:          ()              => req('GET',  '/config?tipo=roles'),
  getEspecialidades: ()              => req('GET',  '/config?tipo=especialidades'),
  getMedicos:        ()              => req('GET',  '/config?tipo=medicos'),
  getCampos:         ()              => req('GET',  '/config?tipo=campos'),
  getConfigSistema:  ()              => req('GET',  '/config?tipo=sistema'),
  getAuditoria:      ()              => req('GET',  '/config?tipo=auditoria'),
  getCorreosBackup:  ()              => req('GET',  '/config?tipo=correos_backup'),
  guardarConfig:     (config)        => req('POST', '/config',            { tipo: 'sistema', config }),
  crearEspecialidad: (nombre)        => req('POST', '/config',            { tipo: 'especialidad', nombre }),
  crearCampo:        (data)          => req('POST', '/config',            { tipo: 'campo', ...data }),
  agregarCorreo:     (email)         => req('POST', '/config',            { tipo: 'correo_backup', email }),
  verificarCorreo:   (email, codigo) => req('POST', '/config',            { tipo: 'verificar_correo_backup', email, codigo }),
};

// Guardar en window para uso global
window.api = api;
window.getUser = getUser;
window.logout = logout;
window.requireAuth = requireAuth;
window.API = { usuario: getUser, logout: logout };
