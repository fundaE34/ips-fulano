const nodemailer = require('nodemailer');

function getTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

const headerHtml = `
<div style="background:linear-gradient(135deg,#C0392B,#922B21);padding:20px;border-radius:8px 8px 0 0;text-align:center;">
  <h2 style="color:white;margin:0;font-size:22px;">🏥 IPS FULANO</h2>
  <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Sistema de Gestión en Salud</p>
</div>`;

async function enviarCodigo2FA(email, nombre, codigo) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  ${headerHtml}
  <div style="padding:20px;">
    <p style="color:#333;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:#555;">Tu código de verificación de dos pasos:</p>
    <div style="background:white;border:2px solid #C0392B;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#C0392B;">${codigo}</span>
    </div>
    <p style="color:#e53935;text-align:center;">⏱️ Expira en <strong>5 minutos</strong></p>
    <p style="color:#999;font-size:12px;">Si no intentaste iniciar sesión, ignora este correo.</p>
  </div>
</div>`;
  await getTransport().sendMail({
    from: `IPS Fulano <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `Código: ${codigo} — IPS Fulano`,
    html,
  });
}

async function enviarNotificacionLogin(email, nombre, ip, fecha) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  ${headerHtml}
  <div style="padding:20px;">
    <p>Hola <strong>${nombre}</strong>, se registró un <strong>inicio de sesión</strong>.</p>
    <div style="background:white;border-radius:8px;padding:16px;">
      <p>📅 <strong>Fecha:</strong> ${fecha}</p>
      <p>🌐 <strong>IP:</strong> ${ip}</p>
    </div>
    <p style="color:#e53935;">Si no fuiste tú, contacta al administrador.</p>
  </div>
</div>`;
  await getTransport().sendMail({
    from: `IPS Fulano <${process.env.GMAIL_USER}>`,
    to: email, subject: 'Inicio de sesión — IPS Fulano', html,
  });
}

async function enviarCodigoValidacion(email, codigo) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  ${headerHtml}
  <div style="padding:20px;">
    <p>Código de verificación de correo:</p>
    <div style="background:white;border:2px solid #C0392B;border-radius:12px;padding:24px;text-align:center;">
      <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#C0392B;">${codigo}</span>
    </div>
    <p style="color:#e53935;text-align:center;">⏱️ Expira en 5 minutos</p>
  </div>
</div>`;
  await getTransport().sendMail({
    from: `IPS Fulano <${process.env.GMAIL_USER}>`,
    to: email, subject: `Verificación: ${codigo} — IPS Fulano`, html,
  });
}

async function enviarBackup(email, zipBuffer, nombreZip) {
  const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  ${headerHtml}
  <div style="padding:20px;">
    <p>Se generó un <strong>backup automático</strong> del sistema.</p>
    <div style="background:white;border-radius:8px;padding:16px;">
      <p>📦 <strong>Archivo:</strong> ${nombreZip}</p>
    </div>
  </div>
</div>`;
  await getTransport().sendMail({
    from: `IPS Fulano <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `📦 Backup IPS Fulano — ${nombreZip}`,
    html,
    attachments: [{ filename: nombreZip, content: zipBuffer }],
  });
}

module.exports = { enviarCodigo2FA, enviarNotificacionLogin, enviarCodigoValidacion, enviarBackup };
