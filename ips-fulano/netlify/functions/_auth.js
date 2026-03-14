const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'ips-fulano-secret-2024';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

function getToken(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function requireAuth(event) {
  const token = getToken(event);
  if (!token) return null;
  return verifyToken(token);
}

function cors(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

module.exports = { signToken, verifyToken, requireAuth, cors };
