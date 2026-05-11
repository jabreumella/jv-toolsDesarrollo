/* ════════════════════════════════════════════════════════════════
   J&V Tools — App Shell
   Navegación, PWA, splash, toast, modal
   ════════════════════════════════════════════════════════════════ */

const APP_VERSION = '2.0.0';
const APP_CONFIG_KEY = 'jv_app_config';

// ── Configuración del asesor (personalizable) ──
const DEFAULT_CONFIG = {
  asesorNombre: 'Juan José',
  asesorPartner: 'Víctor Andújar',
  empresa: 'MR. Home',
  team: 'J&V',
  telefono: '+1 (809) 000-0000',
  email: 'asesor@mrhome.do',
  logoColor: '#00A7E1'
};

let APP_CONFIG = loadConfig();

function loadConfig() {
  try {
    const saved = localStorage.getItem(APP_CONFIG_KEY);
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : { ...DEFAULT_CONFIG };
  } catch (e) {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(cfg) {
  APP_CONFIG = { ...APP_CONFIG, ...cfg };
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(APP_CONFIG));
}

// ════════════════════════════════════════════════════════════════
//  NAVEGACIÓN
// ════════════════════════════════════════════════════════════════
const SCREENS = ['menu', 'plan', 'capacidad', 'prestamo', 'comision',
                 'comparador', 'historial', 'inversion', 'calendario', 'config'];

function showScreen(name) {
  if (!SCREENS.includes(name)) name = 'menu';

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const screen = document.getElementById('screen-' + name);
  if (screen) screen.classList.add('active');

  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');

  const nav = document.getElementById('bottomNav');
  if (nav) nav.style.display = (name === 'menu') ? 'none' : 'flex';

  // Actualizar URL sin recargar
  const url = new URL(window.location);
  url.searchParams.set('screen', name);
  window.history.replaceState({}, '', url);

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Disparar evento custom para que cada módulo se inicialice cuando se muestre
  document.dispatchEvent(new CustomEvent('screenchange', { detail: { screen: name } }));
}

// ════════════════════════════════════════════════════════════════
//  SPLASH → APP TRANSITION
// ════════════════════════════════════════════════════════════════
function launchApp() {
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');

  splash.classList.add('fade-out');

  setTimeout(() => {
    splash.style.display = 'none';
    app.style.display = 'block';

    // Inicializar módulos
    safeInit('initPlan', () => typeof initPlan === 'function' && initPlan());
    safeInit('initCap', () => typeof initCap === 'function' && initCap());
    safeInit('initPrestamo', () => typeof initPrestamo === 'function' && initPrestamo());
    safeInit('initComision', () => typeof initComision === 'function' && initComision());
    safeInit('initComparador', () => typeof initComparador === 'function' && initComparador());
    safeInit('initHistorial', () => typeof initHistorial === 'function' && initHistorial());
    safeInit('initInversion', () => typeof initInversion === 'function' && initInversion());
    safeInit('initCalendario', () => typeof initCalendario === 'function' && initCalendario());

    // Poblar saludo en el menú
    const greetEl = document.getElementById('welcome-name');
    if (greetEl) greetEl.textContent = APP_CONFIG.asesorNombre;

    // Saludo según hora
    const greetingEl = document.getElementById('welcome-greeting');
    if (greetingEl) {
      const h = new Date().getHours();
      const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
      greetingEl.textContent = saludo + ',';
    }

    // Estadísticas del menú
    updateMenuStats();

    // Pantalla inicial: menú o la indicada en URL
    const params = new URLSearchParams(window.location.search);
    const initScreen = params.get('screen') || 'menu';
    showScreen(initScreen);
  }, 500);
}

function safeInit(name, fn) {
  try { fn(); } catch (e) { console.error('[Init error]', name, e); }
}

let _launched = false;
function safeLaunch() {
  if (_launched) return;
  _launched = true;
  setTimeout(launchApp, 1800);
}

document.addEventListener('DOMContentLoaded', safeLaunch);
window.addEventListener('load', safeLaunch);

// ════════════════════════════════════════════════════════════════
//  ESTADÍSTICAS DEL MENÚ
// ════════════════════════════════════════════════════════════════
async function updateMenuStats() {
  if (typeof DB === 'undefined') return;
  try {
    const cotizaciones = await DB.getAll('cotizaciones');
    const total = cotizaciones.length;

    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
    const monthCount = cotizaciones.filter(c => new Date(c.createdAt) >= thisMonth).length;

    const totalUSD = cotizaciones.reduce((sum, c) => sum + (c.precio || 0), 0);

    setText('stat-total', total);
    setText('stat-month', monthCount);
    setText('stat-volume', formatCompact(totalUSD));
  } catch (e) {
    console.warn('Stats error:', e);
  }
}

function formatCompact(n) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + Math.round(n);
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

// ════════════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════════════
function toast(msg, type = '', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);

  setTimeout(() => t.remove(), duration);
}

// ════════════════════════════════════════════════════════════════
//  MODAL
// ════════════════════════════════════════════════════════════════
function showModal(opts) {
  const { title, body, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false } = opts;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close">×</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">
        <button class="btn btn-ghost btn-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-dark' : 'btn-celeste'} btn-confirm" style="${danger ? 'background:linear-gradient(135deg,#dc2626,#991b1b)' : ''}">${confirmText}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.addEventListener('click', close);
  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.querySelector('.btn-cancel').addEventListener('click', close);
  overlay.querySelector('.btn-confirm').addEventListener('click', () => {
    close();
    if (onConfirm) onConfirm();
  });
}

function showAlert(title, body) {
  showModal({
    title,
    body: `<p style="font-size:14px;color:var(--gray-700);line-height:1.5">${body}</p>`,
    confirmText: 'Entendido',
    cancelText: ''
  });
  // Ocultar cancel
  setTimeout(() => {
    const c = document.querySelector('.modal-actions .btn-cancel');
    if (c) c.style.display = 'none';
  }, 0);
}

// ════════════════════════════════════════════════════════════════
//  HELPERS GLOBALES
// ════════════════════════════════════════════════════════════════
function fmtUSD(n) {
  if (isNaN(n) || n == null) return '—';
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtUSDInt(n) {
  if (isNaN(n) || n == null) return '—';
  return '$' + Math.round(Number(n)).toLocaleString('en-US');
}

function fmtRD(n) {
  if (isNaN(n) || n == null) return '—';
  return 'RD$ ' + Number(n).toLocaleString('es-DO', { maximumFractionDigits: 0 });
}

function fmtPct(n, dec = 2) {
  if (isNaN(n) || n == null) return '—';
  return Number(n).toFixed(dec) + '%';
}

function fmtFecha(d) {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtFechaCorta(d) {
  if (!(d instanceof Date)) d = new Date(d);
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function cleanNum(el) {
  el.value = el.value.replace(/[^0-9.]/g, '');
}

function fmtNum(el) {
  const n = parseFloat(el.value.replace(/,/g, '')) || 0;
  el.value = n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '';
  if (typeof recalcular === 'function') recalcular();
}

function getN(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseFloat((el.value || '0').toString().replace(/,/g, '')) || 0;
}

function addMeses(date, n) {
  const d = new Date(date);
  const diaOriginal = d.getDate();
  const mesDestino = d.getMonth() + n;
  const anioDestino = d.getFullYear() + Math.floor(mesDestino / 12);
  const mesReal = ((mesDestino % 12) + 12) % 12;
  const ultimoDia = new Date(anioDestino, mesReal + 1, 0).getDate();
  d.setFullYear(anioDestino, mesReal, Math.min(diaOriginal, ultimoDia));
  return d;
}

function monthDiff(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

function calcCuotaHipoteca(capital, tasaA, anos) {
  const r = tasaA / 100 / 12;
  const n = anos * 12;
  if (r === 0) return capital / n;
  return capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

// Iniciales para avatar
function getIniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ════════════════════════════════════════════════════════════════
//  PWA: SERVICE WORKER + INSTALL PROMPT
// ════════════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PWA] Service Worker registrado:', reg.scope);

        // Detectar actualizaciones
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateAvailable(newWorker);
            }
          });
        });
      })
      .catch(err => console.warn('[PWA] SW falló:', err));
  });
}

function showUpdateAvailable(worker) {
  const banner = document.createElement('div');
  banner.className = 'install-prompt show';
  banner.innerHTML = `
    <div class="install-prompt-icon">🔄</div>
    <div class="install-prompt-text">
      <strong>Nueva versión disponible</strong>
      <span>Actualiza para obtener las últimas mejoras</span>
    </div>
    <button class="install-prompt-btn">Actualizar</button>
    <button class="install-prompt-close">×</button>
  `;
  document.body.appendChild(banner);

  banner.querySelector('.install-prompt-btn').addEventListener('click', () => {
    worker.postMessage({ action: 'skipWaiting' });
    window.location.reload();
  });
  banner.querySelector('.install-prompt-close').addEventListener('click', () => banner.remove());
}

// Capturar evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallPrompt();
});

function showInstallPrompt() {
  // Solo mostrar si nunca lo cerró
  if (localStorage.getItem('install_dismissed')) return;

  // Esperar a que la app esté visible
  setTimeout(() => {
    if (document.getElementById('app').style.display !== 'block') return;

    const banner = document.createElement('div');
    banner.className = 'install-prompt show';
    banner.innerHTML = `
      <div class="install-prompt-icon">📲</div>
      <div class="install-prompt-text">
        <strong>Instalar J&V Tools</strong>
        <span>Acceso rápido desde tu pantalla de inicio</span>
      </div>
      <button class="install-prompt-btn">Instalar</button>
      <button class="install-prompt-close">×</button>
    `;
    document.body.appendChild(banner);

    banner.querySelector('.install-prompt-btn').addEventListener('click', async () => {
      banner.remove();
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          toast('¡Aplicación instalada! 🎉', 'success');
        }
        deferredInstallPrompt = null;
      }
    });
    banner.querySelector('.install-prompt-close').addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('install_dismissed', '1');
    });
  }, 5000);
}

// ════════════════════════════════════════════════════════════════
//  CONFIG SCREEN
// ════════════════════════════════════════════════════════════════
function renderConfigScreen() {
  const screen = document.getElementById('screen-config');
  if (!screen) return;

  screen.innerHTML = `
    <div class="back-bar">
      <button class="btn-back" onclick="showScreen('menu')">‹ Menú</button>
      <h2>Configuración</h2>
    </div>
    <div class="container">
      <div class="card">
        <div class="card-title">👤 Datos del Asesor</div>
        <div class="field">
          <label>Tu Nombre</label>
          <input type="text" id="cfg-asesor" value="${escapeHtml(APP_CONFIG.asesorNombre)}">
        </div>
        <div class="field">
          <label>Nombre del Partner (J&V)</label>
          <input type="text" id="cfg-partner" value="${escapeHtml(APP_CONFIG.asesorPartner)}">
        </div>
        <div class="field">
          <label>Teléfono</label>
          <input type="text" id="cfg-tel" value="${escapeHtml(APP_CONFIG.telefono)}">
        </div>
        <div class="field">
          <label>Email</label>
          <input type="email" id="cfg-email" value="${escapeHtml(APP_CONFIG.email)}">
        </div>
      </div>

      <div class="card">
        <div class="card-title">💾 Datos & Privacidad</div>
        <p style="font-size:13px;color:var(--gray-600);line-height:1.5;margin-bottom:14px">
          Todos tus datos se guardan localmente en este dispositivo. Nada se envía a servidores externos.
        </p>
        <div class="action-bar" style="justify-content:flex-start">
          <button class="btn btn-outline" onclick="exportarDatos()">📤 Exportar Backup</button>
          <button class="btn btn-outline" onclick="importarDatos()">📥 Importar Backup</button>
        </div>
        <hr class="dash">
        <button class="btn btn-block" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white" onclick="confirmarBorrado()">
          🗑 Borrar todos los datos
        </button>
      </div>

      <div class="card">
        <div class="card-title">ℹ️ Acerca de</div>
        <div style="font-size:13px;line-height:1.7;color:var(--gray-700)">
          <strong>J&V Tools</strong> v${APP_VERSION}<br>
          MR. Home Asesores Inmobiliarios<br>
          República Dominicana<br>
          <br>
          <span style="color:var(--gray-500);font-size:12px">Hecho con ❤️ para asesores que valoran la eficiencia.</span>
        </div>
      </div>

      <button class="btn btn-celeste btn-block btn-lg" onclick="guardarConfig()">💾 Guardar Cambios</button>
    </div>
  `;
}

function guardarConfig() {
  saveConfig({
    asesorNombre: document.getElementById('cfg-asesor').value.trim() || 'Asesor',
    asesorPartner: document.getElementById('cfg-partner').value.trim(),
    telefono: document.getElementById('cfg-tel').value.trim(),
    email: document.getElementById('cfg-email').value.trim()
  });
  toast('Configuración guardada', 'success');
  setTimeout(() => showScreen('menu'), 800);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function exportarDatos() {
  if (typeof DB === 'undefined') return toast('DB no disponible', 'error');
  try {
    const data = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      config: APP_CONFIG,
      cotizaciones: await DB.getAll('cotizaciones'),
      unidades: await DB.getAll('unidades').catch(() => [])
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jv-tools-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup descargado', 'success');
  } catch (e) {
    toast('Error al exportar', 'error');
  }
}

function importarDatos() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.cotizaciones) throw new Error('Backup inválido');

      showModal({
        title: 'Importar backup',
        body: `<p style="font-size:13px;line-height:1.5">¿Importar <strong>${data.cotizaciones.length}</strong> cotizaciones del ${fmtFechaCorta(data.exportedAt)}? Se agregarán a las existentes.</p>`,
        confirmText: 'Importar',
        onConfirm: async () => {
          for (const c of data.cotizaciones) {
            await DB.put('cotizaciones', c);
          }
          if (data.config) saveConfig(data.config);
          toast('Backup restaurado', 'success');
          setTimeout(() => location.reload(), 1000);
        }
      });
    } catch (e) {
      toast('Archivo inválido', 'error');
    }
  };
  input.click();
}

function confirmarBorrado() {
  showModal({
    title: '⚠️ Borrar todos los datos',
    body: '<p style="font-size:14px;line-height:1.5;color:var(--gray-700)">Esta acción <strong>no se puede deshacer</strong>. Se eliminarán todas las cotizaciones, unidades guardadas y configuración. ¿Continuar?</p>',
    confirmText: 'Sí, borrar todo',
    danger: true,
    onConfirm: async () => {
      if (typeof DB !== 'undefined') {
        await DB.clear('cotizaciones');
        await DB.clear('unidades').catch(() => {});
      }
      localStorage.clear();
      toast('Datos borrados', 'success');
      setTimeout(() => location.reload(), 800);
    }
  });
}

// Listener para repoblar config cuando se entra a esa pantalla
document.addEventListener('screenchange', e => {
  if (e.detail.screen === 'config') renderConfigScreen();
  if (e.detail.screen === 'menu') updateMenuStats();
  if (e.detail.screen === 'historial' && typeof renderHistorial === 'function') renderHistorial();
});
