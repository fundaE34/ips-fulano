// js/layout.js — Genera el sidebar y topbar en cada página

function renderLayout(pageTitle) {
  const u = API.usuario();
  if (!u) return;

  document.body.insertAdjacentHTML('afterbegin', `
    <div class="overlay-sidebar"></div>
    <div class="app-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="/img/logo.png" alt="IPS Fulano" onerror="this.style.display='none'">
          <div>
            <span>IPS FULANO</span>
            <small>Sistema de Salud</small>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">Principal</div>
          <a class="nav-item" href="/dashboard.html">
            <i>📊</i> Dashboard
          </a>
          <a class="nav-item" href="/pacientes.html">
            <i>👥</i> Pacientes
          </a>
          <a class="nav-item" href="/citas.html">
            <i>📅</i> Citas médicas
          </a>

          <div class="nav-section" data-rol="admin">Administración</div>
          <a class="nav-item" href="/usuarios.html" data-rol="admin">
            <i>👤</i> Usuarios
          </a>
          <a class="nav-item" href="/especialidades.html" data-rol="admin">
            <i>🏥</i> Especialidades
          </a>
          <a class="nav-item" href="/reportes.html" data-rol="admin">
            <i>📋</i> Reportes
          </a>
          <a class="nav-item" href="/backup.html" data-rol="admin">
            <i>💾</i> Backup
          </a>
          <a class="nav-item" href="/auditoria.html" data-rol="admin">
            <i>🔍</i> Auditoría
          </a>
          <a class="nav-item" href="/configuracion.html" data-rol="admin">
            <i>⚙️</i> Configuración
          </a>
        </nav>

        <div class="sidebar-user">
          <div class="avatar">${u.nombre.charAt(0).toUpperCase()}</div>
          <div class="info">
            <span>${u.nombre}</span>
            <small>${u.rol}</small>
          </div>
          <button class="logout-btn" title="Cerrar sesión">⏏</button>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="main-content">
        <header class="topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button class="hamburger">☰</button>
            <span class="topbar-title">${pageTitle}</span>
          </div>
          <div class="topbar-actions" id="topbar-actions"></div>
        </header>
        <main class="page-content" id="page-content"></main>
      </div>
    </div>
  `);

  initSidebar();
}

window.renderLayout = renderLayout;

function initSidebar() {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.overlay-sidebar');
  const logoutBtn = document.querySelector('.logout-btn');

  if (hamburger) hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  if (overlay) overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Marcar nav item activo
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Ocultar items de admin si no es admin
  const user = getUser();
  if (user && user.rol !== 'admin') {
    document.querySelectorAll('[data-rol="admin"]').forEach(el => el.style.display = 'none');
  }
}
window.initSidebar = initSidebar;
