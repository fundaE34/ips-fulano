// netlify/functions/_utils.js
// Utilidades compartidas: DB, JWT, correo, respuestas

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// ── Pool de conexiones Neon ───────────────────────────────────────────────────
let pool;
function getDB() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

// ── JWT ───────────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';

function crearToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol_nombre, nombre: usuario.nombre },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function verificarToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function obtenerUsuarioDeRequest(event) {
  const auth = event.headers['authorization'] || event.headers['Authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  return verificarToken(token);
}

// ── Respuestas HTTP ───────────────────────────────────────────────────────────
function ok(data, status = 200) {
  return {
    statusCode: status,
    headers: cors(),
    body: JSON.stringify(data),
  };
}

function error(msg, status = 400) {
  return {
    statusCode: status,
    headers: cors(),
    body: JSON.stringify({ error: msg }),
  };
}

function noAutorizado() {
  return error('No autorizado', 401);
}

function cors() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}

function handleOptions() {
  return { statusCode: 204, headers: cors(), body: '' };
}

// ── Auditoría ─────────────────────────────────────────────────────────────────
async function registrarAuditoria(db, { usuario_id, usuario_email, accion, modulo, descripcion, ip, exitoso = true }) {
  try {
    await db.query(
      `INSERT INTO auditoria (usuario_id, usuario_email, accion, modulo, descripcion, ip_origen, exitoso)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [usuario_id || null, usuario_email || null, accion, modulo, descripcion, ip || null, exitoso]
    );
  } catch (e) {
    console.error('Error auditoría:', e.message);
  }
}

// ── Correo Gmail SMTP ─────────────────────────────────────────────────────────
function getMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function enviarCorreo({ to, subject, html, attachments = [] }) {
  const mailer = getMailer();
  await mailer.sendMail({
    from: `IPS Fulano <${process.env.GMAIL_USER}>`,
    to, subject, html, attachments,
  });
}

function htmlCorreoBase(titulo, contenido) {
  return `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  <div style="background:linear-gradient(135deg,#C0392B,#922B21);padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
    <h2 style="color:white;margin:0;font-size:22px;">🏥 IPS FULANO</h2>
    <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Sistema de Gestión en Salud</p>
  </div>
  ${contenido}
</div>`;
}

// ── Bcrypt ────────────────────────────────────────────────────────────────────
async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Código 2FA ────────────────────────────────────────────────────────────────
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Obtener IP ────────────────────────────────────────────────────────────────
function obtenerIP(event) {
  return (
    event.headers['x-forwarded-for'] ||
    event.headers['client-ip'] ||
    'desconocida'
  );
}

module.exports = {
  getDB, crearToken, verificarToken, obtenerUsuarioDeRequest,
  ok, error, noAutorizado, cors, handleOptions,
  registrarAuditoria, enviarCorreo, htmlCorreoBase,
  hashPassword, checkPassword, generarCodigo, obtenerIP,
};
