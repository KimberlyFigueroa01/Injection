/**
 * app.js — Lógica del Frontend para el Laboratorio de Inyección SQL
 * 
 * Maneja:
 *  - Login con modo vulnerable/seguro
 *  - Navegación por tabs
 *  - Comparaciones interactivas
 *  - Command Injection demo
 *  - Búsqueda vulnerable/segura
 */

// ─── Estado Global ───────────────────────────────────────────────────
let currentMode = 'vulnerable';
let lastLoginResult = null;

// ─── Elementos DOM ───────────────────────────────────────────────────
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const loginSubmitBtn = document.getElementById('login-submit-btn');

// ─── Mode Toggle (Login) ────────────────────────────────────────────
document.querySelectorAll('#login-mode-toggle .mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#login-mode-toggle .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    // Update button style
    loginSubmitBtn.className = `login-btn ${currentMode}`;
    loginSubmitBtn.textContent = currentMode === 'vulnerable'
      ? 'Iniciar Sesión — Modo Vulnerable'
      : 'Iniciar Sesión — Modo Seguro';
  });
});

// ─── Tab Navigation ──────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ─── Login Handler ───────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (!username) {
    showLoginMessage('Por favor ingresa un usuario', 'error');
    return;
  }

  loginSubmitBtn.textContent = 'Procesando...';
  loginSubmitBtn.disabled = true;

  try {
    const endpoint = currentMode === 'vulnerable'
      ? '/api/login/vulnerable'
      : '/api/login/secure';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    lastLoginResult = data;

    if (data.success) {
      showLoginMessage(data.message, 'success');
      setTimeout(() => showDashboard(data), 800);
    } else {
      showLoginMessage(data.message || 'Acceso denegado', 'error');
      // Still show dashboard for educational purposes if in vulnerable mode
      if (currentMode === 'vulnerable') {
        setTimeout(() => showDashboard(data), 1200);
      }
    }
  } catch (err) {
    showLoginMessage('Error de conexión con el servidor', 'error');
  } finally {
    loginSubmitBtn.textContent = currentMode === 'vulnerable'
      ? 'Iniciar Sesión — Modo Vulnerable'
      : 'Iniciar Sesión — Modo Seguro';
    loginSubmitBtn.disabled = false;
  }
});

// ─── Show Login Message ──────────────────────────────────────────────
function showLoginMessage(text, type) {
  loginMessage.textContent = text;
  loginMessage.className = `login-message visible ${type}`;
}

// ─── Fill Payload Helper ─────────────────────────────────────────────
function fillPayload(user, pass) {
  document.getElementById('username').value = user;
  document.getElementById('password').value = pass;
}

// ─── Show Dashboard ──────────────────────────────────────────────────
function showDashboard(data) {
  loginScreen.classList.add('hidden');
  dashboardScreen.style.display = 'block';

  // Update nav user info
  const user = data.results && data.results[0];
  if (user) {
    document.getElementById('nav-username').textContent = user.full_name || user.username;
    document.getElementById('nav-role').textContent = user.role || 'user';
    document.getElementById('nav-avatar').textContent = (user.username || 'U')[0].toUpperCase();
  } else {
    document.getElementById('nav-username').textContent = 'Sin autenticación';
    document.getElementById('nav-role').textContent = 'demo mode';
    document.getElementById('nav-avatar').textContent = '?';
  }

  // Update stats
  updateStats(data);

  // Update results
  updateResults(data);

  // Load users list
  loadUsersForStats();
}

// ─── Update Stats ────────────────────────────────────────────────────
function updateStats(data) {
  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${data.rowCount || 0}</div>
      <div class="stat-label">Registros Retornados</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.success ? '✓' : '✗'}</div>
      <div class="stat-label">Autenticación</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.mode === 'vulnerable' ? '🔴' : '🟢'}</div>
      <div class="stat-label">Modo Actual</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${data.error ? '⚠️' : '—'}</div>
      <div class="stat-label">Errores SQL</div>
    </div>
  `;
}

// ─── Update Results Tab ──────────────────────────────────────────────
function updateResults(data) {
  // Mode badge
  const badge = document.getElementById('result-mode-badge');
  badge.textContent = data.mode === 'vulnerable' ? '🔴 Vulnerable' : '🟢 Seguro';
  badge.className = `badge ${data.mode === 'vulnerable' ? 'danger' : 'safe'}`;

  // SQL query
  const sqlDisplay = document.getElementById('sql-query-display');
  sqlDisplay.textContent = data.query || 'N/A';

  // Results table
  const container = document.getElementById('results-table-container');
  if (data.results && data.results.length > 0) {
    let html = '<table class="results-table"><thead><tr>';
    html += '<th>ID</th><th>Usuario</th><th>Email</th><th>Rol</th><th>Nombre</th>';
    html += '</tr></thead><tbody>';
    data.results.forEach(u => {
      html += `<tr>
        <td>${u.id}</td>
        <td>${escapeHtml(u.username)}</td>
        <td>${escapeHtml(u.email || '')}</td>
        <td><span class="badge info">${escapeHtml(u.role || '')}</span></td>
        <td>${escapeHtml(u.full_name || '')}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } else {
    container.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center">No se encontraron usuarios</p>';
  }

  // Full server response
  document.getElementById('server-response').textContent = JSON.stringify(data, null, 2);
}

// ─── Load Users For Stats ────────────────────────────────────────────
async function loadUsersForStats() {
  try {
    const res = await fetch('/api/users');
    const data = await res.json();
    // Update total users stat if we have it
    const cards = document.querySelectorAll('.stat-card');
    if (cards.length >= 4) {
      const lastCard = cards[3];
      if (!lastLoginResult?.error) {
        lastCard.querySelector('.stat-value').textContent = data.users.length;
        lastCard.querySelector('.stat-label').textContent = 'Total Usuarios en BD';
      }
    }
  } catch (e) { /* ignore */ }
}

// ─── Comparison (Interactive Test) ───────────────────────────────────
async function runComparison(mode) {
  const username = document.getElementById('compare-username').value;
  const password = document.getElementById('compare-password').value;

  const endpoint = mode === 'vulnerable'
    ? '/api/login/vulnerable'
    : '/api/login/secure';

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (mode === 'vulnerable') {
      document.getElementById('compare-vuln-query').textContent = data.query || 'N/A';
      document.getElementById('compare-vuln-result').textContent =
        data.success
          ? `✅ Inyección exitosa — ${data.rowCount} usuario(s) retornados:\n${data.results.map(u => `  • ${u.username} (${u.role})`).join('\n')}`
          : `❌ Sin resultados${data.error ? '\nError: ' + data.error : ''}`;
    } else {
      document.getElementById('compare-safe-query').textContent = data.query || 'N/A';
      document.getElementById('compare-safe-result').textContent =
        data.success
          ? `✅ Login válido — ${data.results.map(u => u.username).join(', ')}`
          : `❌ Inyección BLOQUEADA — El payload se trató como texto literal`;
    }
  } catch (err) {
    const el = mode === 'vulnerable' ? 'compare-vuln-result' : 'compare-safe-result';
    document.getElementById(el).textContent = 'Error de conexión';
  }
}

// ─── Command Injection ───────────────────────────────────────────────
async function runCommand(mode) {
  const inputId = mode === 'vulnerable' ? 'cmd-vuln-input' : 'cmd-safe-input';
  const outputId = mode === 'vulnerable' ? 'cmd-vuln-output' : 'cmd-safe-output';
  const host = document.getElementById(inputId).value;

  document.getElementById(outputId).textContent = '⏳ Ejecutando...';

  try {
    const res = await fetch(`/api/command/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host }),
    });
    const data = await res.json();

    let output = '';
    if (data.command) output += `$ ${data.command}\n\n`;
    if (data.output) output += data.output;
    if (data.error) output += `\n⚠️ Error: ${data.error}`;
    if (data.message) output += `\n\n${data.message}`;
    if (data.explanation) {
      output += `\n\n📋 ${JSON.stringify(data.explanation, null, 2)}`;
    }

    document.getElementById(outputId).textContent = output || 'Sin salida';
  } catch (err) {
    document.getElementById(outputId).textContent = 'Error de conexión con el servidor';
  }
}

// ─── Search ──────────────────────────────────────────────────────────
async function runSearch(mode) {
  const inputId = mode === 'vulnerable' ? 'search-vuln-input' : 'search-safe-input';
  const queryId = mode === 'vulnerable' ? 'search-vuln-query' : 'search-safe-query';
  const resultsId = mode === 'vulnerable' ? 'search-vuln-results' : 'search-safe-results';
  const searchTerm = document.getElementById(inputId).value;

  try {
    const res = await fetch(`/api/search/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm }),
    });
    const data = await res.json();

    document.getElementById(queryId).textContent = data.query || 'N/A';

    if (data.results && data.results.length > 0) {
      let html = `<p style="color:${mode === 'vulnerable' ? 'var(--accent-red)' : 'var(--accent-green)'}">
        ${data.rowCount} resultado(s) encontrados</p>`;
      html += '<table class="results-table"><thead><tr>';
      html += '<th>ID</th><th>Usuario</th><th>Email</th><th>Rol</th>';
      html += '</tr></thead><tbody>';
      data.results.forEach(u => {
        html += `<tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.email || '')}</td>
          <td>${escapeHtml(u.role || '')}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById(resultsId).innerHTML = html;
    } else {
      document.getElementById(resultsId).innerHTML = `<p style="color:var(--text-muted)">Sin resultados${data.error ? ' — Error: ' + escapeHtml(data.error) : ''}</p>`;
    }
  } catch (err) {
    document.getElementById(resultsId).innerHTML = '<p style="color:var(--accent-red)">Error de conexión</p>';
  }
}

// ─── Logout ──────────────────────────────────────────────────────────
function logout() {
  dashboardScreen.style.display = 'none';
  loginScreen.classList.remove('hidden');
  loginMessage.className = 'login-message';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  lastLoginResult = null;
}

// ─── Utility: Escape HTML ────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
