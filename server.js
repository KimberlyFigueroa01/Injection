/**
 * server.js — Servidor Express para el Laboratorio de Inyección SQL
 * 
 * Este servidor contiene INTENCIONALMENTE endpoints vulnerables con fines
 * educativos. NO debe desplegarse en producción ni exponerse a Internet.
 * 
 * ⚠️ USO EXCLUSIVAMENTE EDUCATIVO — Solo para localhost
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';
import { initDatabase, execRaw, execSafe, getAllUsers } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// ─── Middleware ───────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

app.use((req, res, next) => {
  res.setHeader('X-Educational-Purpose', 'SQL Injection Lab - OWASP Demo');
  next();
});

// ─────────────────────────────────────────────────────────────────────
// 🔴 LOGIN VULNERABLE — SQL Injection por concatenación
// ─────────────────────────────────────────────────────────────────────
app.post('/api/login/vulnerable', (req, res) => {
  const { username, password } = req.body;

  // ⚠️ INSEGURO: Concatenación directa
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const results = execRaw(query);
    const safe = results.map(u => ({
      id: u.id, username: u.username, email: u.email,
      role: u.role, full_name: u.full_name,
    }));

    res.json({
      success: results.length > 0,
      mode: 'vulnerable',
      query,
      results: safe,
      rowCount: results.length,
      message: results.length > 0
        ? `✅ Acceso concedido — ${results.length} usuario(s) encontrado(s)`
        : '❌ Credenciales inválidas',
      explanation: {
        vulnerability: 'SQL Injection por concatenación de strings',
        risk: 'Bypass de autenticación, extracción de datos, modificación de BD',
        payload_used: { username, password },
      }
    });
  } catch (error) {
    res.json({
      success: false, mode: 'vulnerable', query,
      error: error.message,
      message: '⚠️ Error SQL — Posible inyección mal formada',
      explanation: { note: 'En producción NUNCA mostrar errores SQL al usuario' }
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🟢 LOGIN SEGURO — Prepared Statements
// ─────────────────────────────────────────────────────────────────────
app.post('/api/login/secure', (req, res) => {
  const { username, password } = req.body;

  const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
  const displayQuery = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const results = execSafe(query, [username, password]);
    const safe = results.map(u => ({
      id: u.id, username: u.username, email: u.email,
      role: u.role, full_name: u.full_name,
    }));

    res.json({
      success: results.length > 0,
      mode: 'secure',
      query: query + ` → Parámetros: ['${username}', '${password}']`,
      displayQuery,
      results: safe,
      rowCount: results.length,
      message: results.length > 0
        ? '✅ Acceso concedido de forma segura'
        : '❌ Credenciales inválidas — La inyección NO funcionó',
      explanation: {
        protection: 'Prepared Statements (Consultas Parametrizadas)',
        how_it_works: 'Los valores se pasan como parámetros separados del SQL',
        payload_treated_as: `Texto literal: "${username}"`,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, mode: 'secure', message: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🔴 BÚSQUEDA VULNERABLE
// ─────────────────────────────────────────────────────────────────────
app.post('/api/search/vulnerable', (req, res) => {
  const { searchTerm } = req.body;
  const query = `SELECT id, username, email, role, full_name FROM users WHERE username LIKE '%${searchTerm}%' OR email LIKE '%${searchTerm}%' OR full_name LIKE '%${searchTerm}%'`;

  try {
    const results = execRaw(query);
    res.json({ success: true, mode: 'vulnerable', query, results, rowCount: results.length });
  } catch (error) {
    res.json({ success: false, mode: 'vulnerable', query, error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🟢 BÚSQUEDA SEGURA
// ─────────────────────────────────────────────────────────────────────
app.post('/api/search/secure', (req, res) => {
  const { searchTerm } = req.body;
  const query = `SELECT id, username, email, role, full_name FROM users WHERE username LIKE ? OR email LIKE ? OR full_name LIKE ?`;
  const param = `%${searchTerm}%`;

  try {
    const results = execSafe(query, [param, param, param]);
    res.json({ success: true, mode: 'secure', query: query + ` → Parámetro: '${param}'`, results, rowCount: results.length });
  } catch (error) {
    res.status(500).json({ success: false, mode: 'secure', message: 'Error interno' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🔴 COMMAND INJECTION — VULNERABLE
// ─────────────────────────────────────────────────────────────────────
app.post('/api/command/vulnerable', (req, res) => {
  const { host } = req.body;
  const command = process.platform === 'win32'
    ? `ping -n 1 ${host}`
    : `ping -c 1 ${host}`;

  try {
    const output = execSync(command, {
      timeout: 5000, encoding: 'utf-8',
      env: { PATH: process.env.PATH },
    });
    res.json({
      success: true, mode: 'vulnerable', command,
      output: output.substring(0, 2000),
      message: '✅ Comando ejecutado',
      explanation: {
        vulnerability: 'Command Injection',
        risk: 'Ejecución arbitraria de comandos en el servidor',
      }
    });
  } catch (error) {
    res.json({
      success: false, mode: 'vulnerable', command,
      error: error.message?.substring(0, 500),
      message: '⚠️ Error al ejecutar el comando',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────
// 🟢 COMMAND — SEGURO (con validación)
// ─────────────────────────────────────────────────────────────────────
app.post('/api/command/secure', (req, res) => {
  const { host } = req.body;
  const validHostRegex = /^[a-zA-Z0-9.\-]+$/;

  if (!host || !validHostRegex.test(host)) {
    return res.json({
      success: false, mode: 'secure',
      message: '❌ Input rechazado — Solo letras, números, puntos y guiones',
      explanation: {
        protection: 'Validación con whitelist (regex)',
        regex_used: validHostRegex.toString(),
        input_rejected: host,
      }
    });
  }

  const command = process.platform === 'win32'
    ? `ping -n 1 ${host}`
    : `ping -c 1 ${host}`;

  try {
    const output = execSync(command, {
      timeout: 5000, encoding: 'utf-8',
      env: { PATH: process.env.PATH },
    });
    res.json({
      success: true, mode: 'secure', command,
      output: output.substring(0, 2000),
      message: '✅ Comando ejecutado de forma segura',
    });
  } catch (error) {
    res.json({
      success: false, mode: 'secure', command,
      error: error.message?.substring(0, 500),
      message: '⚠️ Error al ejecutar el comando',
    });
  }
});

// ─── Lista de usuarios ──────────────────────────────────────────────
app.get('/api/users', (req, res) => {
  res.json({ users: getAllUsers() });
});

// ─── Servir frontend ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// ─── Iniciar servidor ────────────────────────────────────────────────
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║   🔬 Laboratorio de Inyección SQL — OWASP Education    ║');
    console.log('║                                                        ║');
    console.log(`║   🌐 http://localhost:${PORT}                            ║`);
    console.log('║                                                        ║');
    console.log('║   ⚠️  USO EXCLUSIVAMENTE EDUCATIVO                     ║');
    console.log('║   ⚠️  NO exponer a Internet                            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

start();
