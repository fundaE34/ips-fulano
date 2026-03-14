// ── Auth guard ──────────────────────────────────────────────────────────────
function authGuard(rolesPermitidos = []) {
  const token = localStorage.getItem('token');
  const user  = getUser();
  if (!token || !user) { window.location.href = '/'; return false; }
  if (rolesPermitidos.length && !rolesPermitidos.includes(user.rol)) {
    window.location.href = '/dashboard.html'; return false;
  }
  return user;
}

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}
// Cerrar modal al click fuera
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ── Render sidebar ──────────────────────────────────────────────────────────
function renderSidebar(activePage) {
  const user = getUser();
  if (!user) return;

  const isAdmin = user.rol === 'admin';
  const nav = [
    { label: 'MENÚ', sep: true },
    { href: 'dashboard.html',   icon: '📊', label: 'Dashboard' },
    { href: 'pacientes.html',   icon: '👥', label: 'Pacientes' },
    { href: 'historias.html',   icon: '📋', label: 'Historias Clínicas' },
    { href: 'citas.html',       icon: '📅', label: 'Citas' },
    ...(isAdmin ? [
      { label: 'ADMINISTRACIÓN', sep: true },
      { href: 'usuarios.html',      icon: '👤', label: 'Usuarios' },
      { href: 'configuracion.html', icon: '⚙️', label: 'Configuración' },
    ] : []),
  ];

  const initials = user.nombre.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  sidebarEl.innerHTML = `
    <div class="sidebar-logo">
      <img src="img/logo.png" onerror="this.style.display='none'" alt="">
      <div class="sidebar-logo-text">
        <h2>IPS FULANO</h2>
        <span>Sistema de Salud</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${nav.map(item => item.sep
        ? `<div class="nav-section">${item.label}</div>`
        : `<a href="${item.href}" class="nav-item ${item.href === activePage ? 'active' : ''}">
             <span class="icon">${item.icon}</span>${item.label}
           </a>`
      ).join('')}
    </nav>
    <div class="sidebar-footer">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div class="user-avatar">${initials}</div>
        <div>
          <div style="color:rgba(255,255,255,.75);font-size:12px;font-weight:600;">${user.nombre}</div>
          <div style="color:rgba(255,255,255,.35);font-size:11px;">${user.rol}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="logout()" style="width:100%;">Cerrar sesión</button>
    </div>`;
}

// ── Format helpers ───────────────────────────────────────────────────────────
function fmtFecha(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric' });
}
function fmtFechaHora(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function estadoBadge(estado) {
  const map = { Pendiente:'warning', Realizada:'success', Cancelada:'danger', Activo:'success', Inactivo:'danger' };
  return `<span class="badge badge-${map[estado]||'info'}">${estado}</span>`;
}
function rolBadge(rol) {
  const map = { admin:'danger', medico:'info', enfermeria:'success', recepcionista:'warning' };
  return `<span class="badge badge-${map[rol]||'info'}">${rol}</span>`;
}

window.toast = toast;
window.openModal = openModal;
window.closeModal = closeModal;
window.renderSidebar = renderSidebar;
window.authGuard = authGuard;
window.fmtFecha = fmtFecha;
window.fmtFechaHora = fmtFechaHora;
window.estadoBadge = estadoBadge;
window.rolBadge = rolBadge;
