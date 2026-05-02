/**
 * database.js — Configuración de la base de datos SQLite (sql.js)
 * 
 * Crea la base de datos en memoria con una tabla 'users' y datos de prueba.
 * Se usa SQLite en memoria para que no se persistan datos sensibles.
 * 
 * ⚠️ NOTA EDUCATIVA: Las contraseñas están en texto plano intencionalmente
 * para facilitar la demostración. En producción SIEMPRE se deben usar
 * funciones de hash como bcrypt o argon2.
 */

import initSqlJs from 'sql.js';

let db;

/**
 * Inicializa la base de datos en memoria con la tabla de usuarios
 * y datos de prueba. Debe llamarse antes de usar la BD.
 */
export async function initDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database(); // Base de datos en memoria

  // ─── Crear tabla de usuarios ─────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      full_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ─── Insertar usuarios de prueba ─────────────────────────────────
  const testUsers = [
    ['admin', 'admin123', 'admin@empresa.com', 'admin', 'Administrador del Sistema'],
    ['user', 'user123', 'user@empresa.com', 'user', 'Usuario Estándar'],
    ['maria', 'maria456', 'maria@empresa.com', 'user', 'María García López'],
    ['carlos', 'carlos789', 'carlos@empresa.com', 'editor', 'Carlos Rodríguez'],
    ['ana', 'ana321', 'ana@empresa.com', 'user', 'Ana Martínez Ruiz'],
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, email, role, full_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const u of testUsers) {
    stmt.run(u);
  }
  stmt.free();

  console.log('✅ Base de datos inicializada con', testUsers.length, 'usuarios de prueba');
  return db;
}

/**
 * Ejecuta una consulta SQL directa (usada por el endpoint vulnerable).
 * ⚠️ INSEGURO: Solo para demostración educativa.
 * @param {string} sql - Consulta SQL completa
 * @returns {Array} Resultados como array de objetos
 */
export function execRaw(sql) {
  const results = [];
  const stmt = db.prepare(sql);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Ejecuta una consulta parametrizada (usada por el endpoint seguro).
 * ✅ SEGURO: Usa prepared statements.
 * @param {string} sql - Consulta SQL con placeholders ?
 * @param {Array} params - Parámetros a bindear
 * @returns {Array} Resultados como array de objetos
 */
export function execSafe(sql, params) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

/**
 * Obtiene todos los usuarios (sin contraseñas).
 * @returns {Array} Lista de usuarios
 */
export function getAllUsers() {
  return execRaw('SELECT id, username, email, role, full_name, created_at FROM users');
}

export default db;
