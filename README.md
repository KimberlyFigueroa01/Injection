# 🔬 Laboratorio de Inyección SQL — OWASP Education

> **⚠️ USO EXCLUSIVAMENTE EDUCATIVO** — Esta aplicación contiene vulnerabilidades intencionales de tipo inyección (A03:2021). Solo debe ejecutarse en `localhost` con fines académicos para comprender los riesgos y aprender a mitigarlos.

## 📋 Descripción del Proyecto

Este laboratorio es una aplicación web interactiva diseñada para demostrar de forma práctica y visual las vulnerabilidades de **SQL Injection** y **OS Command Injection**. A través de una interfaz moderna basada en *Glassmorphism*, el usuario puede alternar entre modos **Vulnerables** y **Seguros**, observando en tiempo real cómo se construyen las consultas en el servidor y cuál es el impacto de diferentes tipos de ataques.

### 👤 Autores
*   **Kimberly Natalia Figueroa Zapata**
*   **Edwin David Martinez Gomez**

---

## ✨ Características Principales

- **Login Interactivo**: Demostración de bypass de autenticación mediante SQLi.
- **Búsqueda Avanzada**: Visualización de ataques `UNION-based` y bypass de filtros.
- **Command Injection**: Laboratorio de ejecución remota de comandos (RCE) simulado.
- **Modo Educativo**: Secciones integradas que explican la teoría detrás de cada vulnerabilidad.
- **Comparativa de Código**: Vista lado a lado de implementaciones inseguras (concatenación) vs. seguras (parametrización).
- **Consola de Resultados**: Visualización en vivo de las consultas SQL generadas por el servidor y las respuestas JSON de la API.

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js con Express.
- **Base de Datos**: `sql.js` (SQLite compilado a WebAssembly) ejecutándose totalmente en memoria.
- **Frontend**: HTML5, CSS3 (Vanilla con variables modernas y Glassmorphism), Javascript (ES6+).
- **Seguridad**: Demostración de OWASP Top 10.

---

## 🚀 Instalación y Ejecución

### Requisitos
- [Node.js](https://nodejs.org/) (v16 o superior recomendado)

### Pasos
1. **Clonar el repositorio o descargar los archivos.**
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Iniciar el servidor**:
   ```bash
   npm start
   ```
4. **Acceder a la aplicación**:
   Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Estructura del Proyecto

```text
Injection/
├── server.js          # Lógica del servidor (Endpoints vulnerables y protegidos)
├── database.js        # Configuración de SQLite en memoria e inicialización de datos
├── package.json       # Manifiesto del proyecto y dependencias
├── README.md          # Documentación técnica
└── public/            # Archivos estáticos del frontend
    ├── index.html     # Interfaz principal (Dashboard y Login)
    ├── css/
    │   └── styles.css # Estilos modernos y responsivos
    └── js/
        └── app.js     # Lógica de interacción y consumo de API
```

---

## 💉 Vectores de Ataque Demostrados

### 1. SQL Injection (Bypass de Autenticación)
- **Vulnerable**: `SELECT * FROM users WHERE user = '${user}' AND pass = '${pass}'`
- **Payload**: `admin' --` (Comenta la verificación de contraseña)

### 2. SQL Injection (Extracción de Datos)
- **Vulnerable**: Uso de `LIKE` con concatenación.
- **Payload**: `%' OR '1'='1' --` (Retorna todos los registros de la tabla)

### 3. Command Injection
- **Vulnerable**: `execSync(`ping ${host}`)`
- **Payload**: `127.0.0.1 & whoami` (Ejecuta un segundo comando arbitrario)

---

## 🛡️ Mitigaciones Implementadas

El proyecto enseña a implementar las siguientes capas de defensa:
1. **Consultas Parametrizadas (Prepared Statements)**: Separa el código de los datos.
2. **Sanitización de Entrada**: Limpieza de caracteres especiales (%; -- ') antes de procesar.
3. **Validación con Whitelist (Regex)**: Solo permitir caracteres alfanuméricos en comandos del sistema.
4. **Manejo Seguro de Errores**: Evitar la exposición de detalles técnicos de la base de datos al usuario final.

## ⚠️ Descargo de Responsabilidad

Este software ha sido creado con fines estrictamente académicos. Los autores no se hacen responsables del uso indebido de las técnicas aquí demostradas. Nunca utilices estos conocimientos en sistemas de los que no tengas autorización explícita.
