// ═══════════════════════════════════════════════════════════════
//  CAPACIDAD DE PAGO — Versión indexOrigin.html
//  Extracción completa de lógica + diseño original
// ═══════════════════════════════════════════════════════════════

const LS_KEY_CAP = 'capPagoApp_v3';
const TODAY_CAP  = new Date();
const TODAY_STR_CAP = TODAY_CAP.toISOString().split('T')[0];

// ═══════════════════════════════════════════════════════════════
//  FORMATTERS
// ═══════════════════════════════════════════════════════════════
const fU = v => '$' + Math.round(v).toLocaleString('en-US');
const fR = v => 'RD$ ' + Math.round(v).toLocaleString('en-US');

function getNum(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseFloat((el.value || '0').replace(/[^0-9.]/g, '')) || 0;
}

function fmtField(el) {
  const v = parseFloat((el.value || '0').replace(/[^0-9.]/g, '')) || 0;
  el.value = v.toLocaleString('en-US');
}

function unFmt(el) {
  const v = parseFloat((el.value || '0').replace(/[^0-9.]/g, '')) || 0;
  el.value = v === 0 ? '' : v;
}

// ═══════════════════════════════════════════════════════════════
//  LOCAL STORAGE (save / load / clear)
// ═══════════════════════════════════════════════════════════════
function cap_saveState() {
  try {
    localStorage.setItem(LS_KEY_CAP, JSON.stringify({
      nombre:        document.getElementById('cap-nombre').value,
      nacionalidad:  document.getElementById('cap-nacionalidad').value,
      asesor:        document.getElementById('cap-asesor').value,
      fecha:         document.getElementById('cap-fecha').value,
      capital:       getNum('cap-capital'),
      flujoMensual:  getNum('cap-flujoMensual'),
      extraordinario:getNum('cap-extraordinario'),
      ventaInmueble: getNum('cap-ventaInmueble'),
      tasa:          parseFloat(document.getElementById('cap-tasa').value) || 61.4
    }));
    // Flash saved badge
    const b = document.getElementById('cap-savedBadge');
    if (b) {
      b.style.display = 'flex';
      clearTimeout(b._t);
      b._t = setTimeout(() => { b.style.display = 'none'; }, 2000);
    }
  } catch(e) {}
}

function cap_loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY_CAP));
    return s || null;
  } catch(e) { return null; }
}

function cap_populateForm(s) {
  if (!s) return;
  document.getElementById('cap-nombre').value       = s.nombre        || '';
  document.getElementById('cap-nacionalidad').value = s.nacionalidad  || '';
  document.getElementById('cap-asesor').value       = s.asesor        || '';
  document.getElementById('cap-fecha').value        = s.fecha         || TODAY_STR_CAP;

  const nums = { 
    'cap-capital': s.capital || 30000, 
    'cap-flujoMensual': s.flujoMensual || 1000,
    'cap-extraordinario': s.extraordinario || 6000, 
    'cap-ventaInmueble': s.ventaInmueble || 0 
  };
  Object.entries(nums).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val.toLocaleString('en-US');
  });
  const t = s.tasa || 61.4;
  document.getElementById('cap-tasa').value = t;
  document.getElementById('cap-tasaSlider').value = t;
}

function cap_clearForm() {
  if (!window.confirm('¿Deseas limpiar el formulario y comenzar un nuevo cliente?')) return;
  try { localStorage.removeItem(LS_KEY_CAP); } catch(e) {}
  
  document.getElementById('cap-nombre').value       = '';
  document.getElementById('cap-nacionalidad').value = '';
  document.getElementById('cap-asesor').value       = '';
  document.getElementById('cap-fecha').value        = TODAY_STR_CAP;
  
  const nums = { 
    'cap-capital': 30000, 
    'cap-flujoMensual': 1000, 
    'cap-extraordinario': 6000, 
    'cap-ventaInmueble': 0 
  };
  Object.entries(nums).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.value = v.toLocaleString('en-US');
  });
  
  document.getElementById('cap-tasa').value = '61.4';
  document.getElementById('cap-tasaSlider').value = '61.4';
  hideCuota();
  cap_calcular();
}

// ═══════════════════════════════════════════════════════════════
//  CUOTA ESTIMADA PANEL
// ═══════════════════════════════════════════════════════════════
let _activeCell = null;

function cellClick(el) {
  if (_activeCell) _activeCell.classList.remove('selected-cell');
  el.classList.add('selected-cell');
  _activeCell = el;

  const meses          = parseInt(el.dataset.meses);
  const pct            = parseFloat(el.dataset.pct);
  const acum           = parseFloat(el.dataset.acum) || 0;
  const label          = el.dataset.label;
  const tasa           = parseFloat(document.getElementById('cap-tasa').value) || 61.4;
  const extraordinario = getNum('cap-extraordinario');

  const propVal       = acum / pct;
  const reserva       = propVal * 0.10;
  const planPago      = acum;
  const contraEntrega = propVal - reserva - planPago;
  const extTotal      = extraordinario * (meses / 12);
  const cuota         = (acum - reserva - extTotal) / (meses - 1);

  document.getElementById('cqScenario').textContent    = label + ' de enganche  ·  ' + meses + ' meses de plan de pago';
  document.getElementById('cqEngancheLbl').textContent = 'Plan de Pago ' + label;
  document.getElementById('cqPropiedad').textContent   = fU(propVal);
  document.getElementById('cqPropiedadRD').textContent = fR(propVal * tasa);
  document.getElementById('cqReserva').textContent     = fU(reserva);
  document.getElementById('cqReservaRD').textContent   = fR(reserva * tasa);
  document.getElementById('cqEnganche').textContent    = fU(planPago);
  document.getElementById('cqEngancheRD').textContent  = fR(planPago * tasa);
  document.getElementById('cqPlan').textContent        = fU(contraEntrega);
  document.getElementById('cqPlanRD').textContent      = fR(contraEntrega * tasa);
  document.getElementById('cqCuotaUSD').textContent    = fU(cuota) + ' / mes';
  document.getElementById('cqCuotaRD').textContent     = fR(cuota * tasa) + ' / mes';
  document.getElementById('cqNota').textContent        =
    'Cuota durante construcción · ' + (meses - 1) + ' pagos mensuales · No incluye Contra Entrega ni saldo bancario';

  const panel = document.getElementById('cuotaPanel');
  if (panel) {
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function hideCuota() {
  const panel = document.getElementById('cuotaPanel');
  if (panel) panel.style.display = 'none';
  if (_activeCell) { 
    _activeCell.classList.remove('selected-cell'); 
    _activeCell = null; 
  }
}

// ═══════════════════════════════════════════════════════════════
//  CHARTS — Pure Canvas (no external library)
// ═══════════════════════════════════════════════════════════════

function drawBarChart(canvasId, groups, datasets, colors, legend) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const W0 = canvas.parentElement.clientWidth  || 420;
  const H0 = canvas.parentElement.clientHeight || 280;
  canvas.width  = W0 * (window.devicePixelRatio || 1);
  canvas.height = H0 * (window.devicePixelRatio || 1);
  canvas.style.width  = W0 + 'px';
  canvas.style.height = H0 + 'px';
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);
  const W = W0, H = H0;

  const pad = { l: 72, r: 12, t: 16, b: 56 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  const allVals = datasets.flatMap(d => d);
  const maxVal  = (Math.max(...allVals) || 1) * 1.12;

  // Grid lines & Y labels
  const nTicks = 5;
  ctx.font = '10px Arial, sans-serif';
  for (let i = 0; i <= nTicks; i++) {
    const v = (maxVal * i) / nTicks;
    const y = pad.t + cH - (v / maxVal) * cH;
    ctx.strokeStyle = '#eaecf0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle   = '#999'; ctx.textAlign = 'right';
    const label = v >= 1000 ? '$' + (v/1000).toFixed(0)+'K' : '$'+v.toFixed(0);
    ctx.fillText(label, pad.l - 5, y + 4);
  }

  // Bars
  const nGroups  = groups.length;
  const nSeries  = datasets.length;
  const groupW   = cW / nGroups;
  const innerPad = groupW * 0.13;
  const barsW    = groupW - innerPad * 2;
  const barW     = barsW / nSeries - 2;

  datasets.forEach((series, si) => {
    series.forEach((val, gi) => {
      const x  = pad.l + gi * groupW + innerPad + si * (barsW / nSeries);
      const bH = (val / maxVal) * cH;
      const y  = pad.t + cH - bH;
      ctx.fillStyle = colors[si];
      // Rounded top corners
      const r = Math.min(4, barW/2, bH);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + bH);
      ctx.lineTo(x, y + bH);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    });
  });

  // X axis labels
  ctx.fillStyle = '#666'; ctx.textAlign = 'center';
  ctx.font = '11px Arial, sans-serif';
  groups.forEach((lbl, i) => {
    const x = pad.l + i * groupW + groupW / 2;
    ctx.fillText(lbl, x, H - pad.b + 16);
  });

  // Legend
  let lx = pad.l;
  const legendY = H - 12;
  ctx.font = '10px Arial, sans-serif';
  legend.forEach((lbl, i) => {
    ctx.fillStyle = colors[i];
    ctx.fillRect(lx, legendY - 9, 12, 9);
    ctx.fillStyle = '#555'; ctx.textAlign = 'left';
    ctx.fillText(lbl, lx + 15, legendY);
    lx += ctx.measureText(lbl).width + 32;
  });

  // Axes
  ctx.strokeStyle = '#ccd0d9'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + cH);
  ctx.lineTo(W - pad.r, pad.t + cH); ctx.stroke();
}

function drawLineChart(canvasId, capital, flujoMensual, extraordinario, ventaInmueble) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const W0 = canvas.parentElement.clientWidth  || 800;
  const H0 = canvas.parentElement.clientHeight || 230;
  canvas.width  = W0 * (window.devicePixelRatio || 1);
  canvas.height = H0 * (window.devicePixelRatio || 1);
  canvas.style.width  = W0 + 'px';
  canvas.style.height = H0 + 'px';
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);
  const W = W0, H = H0;

  const pad = { l: 72, r: 18, t: 24, b: 38 };
  const cW  = W - pad.l - pad.r;
  const cH  = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Generate monthly data
  const pts = [];
  for (let m = 0; m <= 48; m++) {
    pts.push(capital + flujoMensual * m + extraordinario * (m / 12) + ventaInmueble);
  }
  const maxVal = (Math.max(...pts) || 1) * 1.12;

  const px = m => pad.l + (m / 48) * cW;
  const py = v => pad.t + cH - (v / maxVal) * cH;

  // Grid
  const nTicks = 5;
  ctx.font = '10px Arial, sans-serif';
  for (let i = 0; i <= nTicks; i++) {
    const v = (maxVal * i) / nTicks;
    const y = py(v);
    ctx.strokeStyle = '#eaecf0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#999'; ctx.textAlign = 'right';
    ctx.fillText('$' + (v/1000).toFixed(0) + 'K', pad.l - 5, y + 4);
  }

  // Area fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
  grad.addColorStop(0,   'rgba(26,58,92,.18)');
  grad.addColorStop(1,   'rgba(26,58,92,.02)');
  ctx.beginPath();
  ctx.moveTo(px(0), py(pts[0]));
  pts.forEach((v, m) => ctx.lineTo(px(m), py(v)));
  ctx.lineTo(px(48), pad.t + cH);
  ctx.lineTo(px(0),  pad.t + cH);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(px(0), py(pts[0]));
  pts.forEach((v, m) => ctx.lineTo(px(m), py(v)));
  ctx.strokeStyle = '#1a3a5c'; ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round'; ctx.stroke();

  // Key dots & labels
  const keyMonths = [0, 12, 24, 36, 48];
  keyMonths.forEach(m => {
    const x = px(m), y = py(pts[m]);
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI*2);
    ctx.fillStyle = '#c9973a'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    ctx.fillStyle = '#1a3a5c'; ctx.font = 'bold 10px Arial, sans-serif'; ctx.textAlign = 'center';
    const labelY = y > pad.t + 22 ? y - 12 : y + 20;
    ctx.fillText('$' + (pts[m]/1000).toFixed(0) + 'K', x, labelY);
  });

  // X labels
  ctx.fillStyle = '#666'; ctx.textAlign = 'center'; ctx.font = '11px Arial, sans-serif';
  keyMonths.forEach(m => {
    ctx.fillText(m === 0 ? 'Inicio' : m + ' m', px(m), H - pad.b + 15);
  });

  // Axes
  ctx.strokeStyle = '#ccd0d9'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + cH);
  ctx.lineTo(W - pad.r, pad.t + cH); ctx.stroke();
}

// ═══════════════════════════════════════════════════════════════
//  CÁLCULO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function acum(meses, capital, flujoMensual, extraordinario, ventaInmueble) {
  return capital + flujoMensual * meses + extraordinario * (meses / 12) + ventaInmueble;
}

function cap_calcular() {
  const capital        = getNum('cap-capital');
  const flujoMensual   = getNum('cap-flujoMensual');
  const extraordinario = getNum('cap-extraordinario');
  const ventaInmueble  = getNum('cap-ventaInmueble');
  const tasa           = parseFloat(document.getElementById('cap-tasa').value) || 61.4;
  const nombre         = document.getElementById('cap-nombre').value  || '— Nombre del Cliente —';
  const nacionalidad   = document.getElementById('cap-nacionalidad').value || '—';
  const asesor         = document.getElementById('cap-asesor').value  || '—';
  const fecha          = document.getElementById('cap-fecha').value   || '';

  const a12 = acum(12, capital, flujoMensual, extraordinario, ventaInmueble);
  const a24 = acum(24, capital, flujoMensual, extraordinario, ventaInmueble);
  const a36 = acum(36, capital, flujoMensual, extraordinario, ventaInmueble);
  const a48 = acum(48, capital, flujoMensual, extraordinario, ventaInmueble);
  const acs = [a12, a24, a36, a48];

  // Year projections
  const yr = TODAY_CAP.getFullYear();
  const yr12El = document.getElementById('yr12');
  const yr24El = document.getElementById('yr24');
  const yr36El = document.getElementById('yr36');
  const yr48El = document.getElementById('yr48');
  if (yr12El) yr12El.textContent = 'Proyección ' + (yr + 1);
  if (yr24El) yr24El.textContent = 'Proyección ' + (yr + 2);
  if (yr36El) yr36El.textContent = 'Proyección ' + (yr + 3);
  if (yr48El) yr48El.textContent = 'Proyección ' + (yr + 4);

  // Metric cards
  const ac12El = document.getElementById('ac12');
  const ac24El = document.getElementById('ac24');
  const ac36El = document.getElementById('ac36');
  const ac48El = document.getElementById('ac48');
  if (ac12El) ac12El.textContent = fU(a12);
  if (ac24El) ac24El.textContent = fU(a24);
  if (ac36El) ac36El.textContent = fU(a36);
  if (ac48El) ac48El.textContent = fU(a48);

  // Capacity table + data attributes for cuota calculation
  const periods    = [12, 24, 36, 48];
  const pcts       = [0.5, 0.4, 0.3];
  const pctPrefixes = ['50','40','30'];
  const acums      = [a12, a24, a36, a48];
  const acumIds    = ['ta12','ta24','ta36','ta48'];

  // Set acumulado row
  acumIds.forEach((id, i) => { 
    const el = document.getElementById(id);
    if (el) el.textContent = fU(acums[i]); 
  });

  // Set USD cells & data-acum for cuota calc
  pctPrefixes.forEach((prefix, pi) => {
    const pct = pcts[pi];
    periods.forEach((m, mi) => {
      const cap = acums[mi] / pct;
      const id  = 't' + prefix + '_' + m;
      const el  = document.getElementById(id);
      if (el) {
        el.textContent    = fU(cap);
        el.dataset.acum   = acums[mi];
      }
    });
  });

  // RD$ table
  pctPrefixes.forEach((prefix, pi) => {
    const pct = pcts[pi];
    periods.forEach((m, mi) => {
      const cap = acums[mi] / pct;
      const el  = document.getElementById('r' + prefix + '_' + m);
      if (el) el.textContent = fR(cap * tasa);
    });
  });

  // Summary strip
  const fechaStr = fecha
    ? new Date(fecha + 'T12:00:00').toLocaleDateString('es-DO', {day:'2-digit', month:'short', year:'numeric'})
    : '—';
  const sumNombreEl = document.getElementById('sumNombre');
  const sumMetaEl   = document.getElementById('sumMeta');
  const sumCapitalEl = document.getElementById('sumCapital');
  const sumFlujoEl  = document.getElementById('sumFlujo');
  const sumMaxEl    = document.getElementById('sumMax');
  
  if (sumNombreEl)  sumNombreEl.textContent  = nombre;
  if (sumMetaEl)    sumMetaEl.textContent    = nacionalidad + '  ·  Consulta: ' + fechaStr + '  ·  Asesor: ' + asesor;
  if (sumCapitalEl) sumCapitalEl.textContent = fU(capital + ventaInmueble);
  if (sumFlujoEl)   sumFlujoEl.textContent   = fU(flujoMensual);
  if (sumMaxEl)     sumMaxEl.textContent     = fU(a48 / 0.3);

  // If cuota panel is open, refresh it
  if (_activeCell && _activeCell.dataset.acum) {
    cellClick(_activeCell);
  }

  // Draw charts
  requestAnimationFrame(() => {
    drawBarChart(
      'chartCapacidad',
      ['12 meses','24 meses','36 meses','48 meses'],
      [
        acs.map(a => Math.round(a / 0.5)),
        acs.map(a => Math.round(a / 0.4)),
        acs.map(a => Math.round(a / 0.3)),
      ],
      ['rgba(13,110,253,.75)', 'rgba(40,167,69,.75)', 'rgba(253,126,20,.75)'],
      ['Al 50%', 'Al 40%', 'Al 30%']
    );
    drawLineChart('chartAcumulado', capital, flujoMensual, extraordinario, ventaInmueble);
  });

  // Save to localStorage
  cap_saveState();
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
function initCapacidad() {
  const hdrEl = document.getElementById('hdrDate');
  if (hdrEl) hdrEl.textContent = TODAY_CAP.toLocaleDateString('es-DO', { 
    day:'2-digit', month:'long', year:'numeric' 
  });

  // Load saved session or use defaults
  const saved = cap_loadState();
  if (saved) {
    cap_populateForm(saved);
    // Show hint that a session was restored
    const b = document.getElementById('cap-savedBadge');
    if (b) {
      b.textContent = '✓ Sesión anterior restaurada';
      b.style.display = 'flex';
      setTimeout(() => { 
        b.style.display = 'none'; 
        b.textContent = '✓ Sesión guardada automáticamente'; 
      }, 3000);
    }
  } else {
    const fechaEl = document.getElementById('cap-fecha');
    if (fechaEl) fechaEl.value = TODAY_STR_CAP;
  }

  // Initial calculation
  cap_calcular();

  // Redraw charts on window resize
  window.addEventListener('resize', () => {
    requestAnimationFrame(cap_calcular);
  });
}

// Auto-init cuando se carga el módulo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCapacidad);
} else {
  initCapacidad();
}
