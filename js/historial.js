/* ════════════════════════════════════════════════════════════════
   J&V Tools — Historial de Cotizaciones
   Lista de cotizaciones guardadas con búsqueda y acciones
   ════════════════════════════════════════════════════════════════ */

let _historialCache = [];
let _historialFilter = '';

async function renderHistorial() {
  const cont = document.getElementById('historial-list');
  if (!cont) return;

  if (typeof DB === 'undefined') {
    cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Base de datos no disponible</div></div>';
    return;
  }

  try {
    _historialCache = await DB.getAll('cotizaciones');
    _historialCache.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  } catch (e) {
    cont.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-title">Error al cargar</div></div>';
    return;
  }

  historial_filtrar(_historialFilter);
  historial_actualizarStats();
}

function historial_filtrar(q) {
  _historialFilter = (q || '').toLowerCase().trim();
  const cont = document.getElementById('historial-list');
  if (!cont) return;

  const filtradas = _historialCache.filter(c => {
    if (!_historialFilter) return true;
    const txt = `${c.cliente || ''} ${c.proyecto || ''} ${c.unidad || ''}`.toLowerCase();
    return txt.includes(_historialFilter);
  });

  if (filtradas.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${_historialFilter ? '🔍' : '📋'}</div>
        <div class="empty-state-title">${_historialFilter ? 'Sin resultados' : 'Aún no hay cotizaciones'}</div>
        <div class="empty-state-desc">${_historialFilter ? 'Intenta otra búsqueda' : 'Las cotizaciones que guardes aparecerán aquí'}</div>
      </div>`;
    return;
  }

  cont.innerHTML = filtradas.map(c => {
    const fecha = new Date(c.updatedAt || c.createdAt);
    const iniciales = getIniciales(c.cliente);
    return `
      <div class="history-item">
        <div class="history-item-avatar">${iniciales}</div>
        <div class="history-item-content">
          <div class="history-item-name">${escapeHtml(c.cliente || 'Sin nombre')}</div>
          <div class="history-item-meta">${escapeHtml(c.proyecto || 'Sin proyecto')}${c.unidad ? ' · ' + escapeHtml(c.unidad) : ''}</div>
        </div>
        <div class="history-item-amount">
          <div class="amt">${fmtUSDInt(c.precio || 0)}</div>
          <div class="date">${fmtFechaCorta(fecha)}</div>
        </div>
        <div class="history-item-actions">
          <button onclick="historial_cargar(${c.id})" title="Cargar">📂</button>
          <button onclick="historial_duplicar(${c.id})" title="Duplicar">📋</button>
          <button onclick="historial_eliminar(${c.id})" title="Eliminar" style="background:var(--danger-bg);color:var(--danger)">🗑</button>
        </div>
      </div>`;
  }).join('');
}

function historial_actualizarStats() {
  const total = _historialCache.length;
  const totalUSD = _historialCache.reduce((s, c) => s + (c.precio || 0), 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const enMes = _historialCache.filter(c => new Date(c.createdAt) >= thisMonth).length;

  setText('hist-total', total);
  setText('hist-mes', enMes);
  setText('hist-volumen', formatCompact(totalUSD));
}

async function historial_cargar(id) {
  const cot = await DB.get('cotizaciones', id);
  if (!cot) return toast('No encontrada', 'error');
  if (typeof cargarCotizacion === 'function') {
    cargarCotizacion(cot);
  }
}

async function historial_duplicar(id) {
  const cot = await DB.get('cotizaciones', id);
  if (!cot) return;
  const nueva = { ...cot };
  delete nueva.id;
  nueva.cliente = cot.cliente + ' (copia)';
  nueva.createdAt = new Date().toISOString();
  await DB.add('cotizaciones', nueva);
  toast('Cotización duplicada', 'success');
  renderHistorial();
}

function historial_eliminar(id) {
  const cot = _historialCache.find(c => c.id === id);
  if (!cot) return;
  showModal({
    title: 'Eliminar cotización',
    body: `<p style="font-size:14px;color:var(--gray-700);line-height:1.5">¿Eliminar la cotización de <strong>${escapeHtml(cot.cliente)}</strong>? Esta acción no se puede deshacer.</p>`,
    confirmText: 'Sí, eliminar',
    danger: true,
    onConfirm: async () => {
      await DB.remove('cotizaciones', id);
      toast('Eliminada', 'success');
      renderHistorial();
    }
  });
}

async function historial_pdf(id) {
  const cot = await DB.get('cotizaciones', id);
  if (!cot) return;
  if (typeof generarFichaPDF === 'function') {
    generarFichaPDF(cot);
  } else {
    toast('PDF no disponible', 'error');
  }
}

function initHistorial() {
  renderHistorial();
  const search = document.getElementById('hist-search');
  if (search) search.addEventListener('input', e => historial_filtrar(e.target.value));
}
