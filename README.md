# 🔬 Laboratorio de Inyección SQL — OWASP Education

> **⚠️ USO EXCLUSIVAMENTE EDUCATIVO** — Esta aplicación contiene vulnerabilidades intencionales. Solo debe ejecutarse en `localhost` con fines académicos.

## 📋 Descripción

Aplicación web educativa que demuestra de forma controlada vulnerabilidades de tipo **SQL Injection** y **Command Injection**, según la clasificación OWASP Top 10 (A03:2021 — Injection).

## 🚀 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor
npm start

# 3. Abrir en el navegador
# http://localhost:3000
```

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol    |
|---------|-----------|--------|
| admin   | admin123  | admin  |
| user    | user123   | user   |
| maria   | maria456  | user   |
| carlos  | carlos789 | editor |
| ana     | ana321    | user   |

## 💉 Payloads de Prueba (SQL Injection)

| Payload (Usuario)      | Payload (Contraseña) | Efecto                              |
|------------------------|---------------------|--------------------------------------|
| `admin' --`            | (cualquiera)        | Bypass de contraseña del admin       |
| `' OR '1'='1`          | `' OR '1'='1`       | Retorna todos los usuarios           |
| `' UNION SELECT 1,2,3,4,5,6,7 --` | x    | Union-based injection               |

## 🏗️ Estructura del Proyecto

```
Injection/
├── server.js          # Servidor Express (endpoints vulnerables y seguros)
├── database.js        # Base de datos SQLite en memoria (sql.js)
├── package.json       # Dependencias
├── README.md          # Documentación
└── public/
    ├── index.html     # Frontend principal
    ├── css/
    │   └── styles.css # Estilos (glassmorphism, dark theme)
    └── js/
        └── app.js     # Lógica del frontend
```

## 🔴 Dónde Está la Vulnerabilidad

### SQL Injection (server.js)

**Código vulnerable** — Concatenación directa:
```javascript
// ⚠️ INSEGURO
const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
```

**Código seguro** — Prepared Statements:
```javascript
// ✅ SEGURO
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.prepare(query).all(username, password);
```

### Command Injection (server.js)

**Código vulnerable** — Input directo en execSync:
```javascript
// ⚠️ INSEGURO
const command = `ping -n 1 ${host}`; // host viene del usuario
execSync(command);
```

**Código seguro** — Validación con whitelist:
```javascript
// ✅ SEGURO
const validHostRegex = /^[a-zA-Z0-9.\-]+$/;
if (!validHostRegex.test(host)) { /* rechazar */ }
```

## 🛡️ Mitigaciones Implementadas

1. **Prepared Statements** — Separan código SQL de datos del usuario
2. **Validación de entrada** — Regex whitelist para Command Injection
3. **Parametrización** — Los valores se pasan como parámetros, no concatenados
4. **Limitación de output** — Respuestas truncadas para evitar data exfiltration masiva

## ⚠️ Restricciones

- Solo para uso educativo en localhost
- No contiene malware ni persistencia maliciosa
- No automatiza ataques
- No realiza ataques a sistemas externos
- Base de datos en memoria (se reinicia con el servidor)
