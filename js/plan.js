// ══════════════════════════════════════════════════════════════
//  PLAN DE PAGO — J&V Tools
//  Versión: 2.0 — Integrado desde indexOrigin.html
// ══════════════════════════════════════════════════════════════

import { showToast } from './app.js';
import { saveQuote } from './db.js';

// ══════════════════════════════════════════════════════════════
//  CONSTANTES
// ══════════════════════════════════════════════════════════════
const CASA_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAQMAAAEaCAYAAAAVCDKYAAAACXBIWXMAAAsSAAALEgHS3X78AAAMgUlEQVR4nO3dz3VT1xbH8a/eypxUIEwFOBXgV0F4M81QKoBUgKggTgURM80CFcRUELuC2KoAV3Df4G4IJDaWdO/Vvufc72etrAwS7L0A/3T+7XNmTdMgSf/JLkDSOBgGkgDDQFIwDCQBhoGkYBhIAgwDScEwkAQYBpKCYSAJMAwkBcNAEmAYSAqGgSTAMJAUDANJgGEgKRgGkgDDQFIwDCQBhoGkYBhIAgwDScEwkAQYBpKCYSAJMAwkBcNAEmAYSAqGgSTAMJAUDANJgGEgKRgGkgDDQFIwDCQBhoGkYBhIAgwDScEwkAQYBpKCYSAJMAwkBcNAEmAYSAqGgSTAMJAUDANJgGEgKXyXXYAON9tsT4FT4AQ4u+N/uQSugctmMb84Vl0q06xpmuwatIfZZnsGLIHnwKM9f/l74F2zmK97LUpVMAwKMdtsl8Ar4GkPX+4GWDeL+aqHr6VKGAYjF1OBc+DZAF/+BnjVLObvBvjaKoxhMGKzzfYV8MsRvtV72lC4PsL30kgZBiM122zXwIsjfstb4Nypw3QZBiMz22y/By7oZ23gEDfA0t2H6fGcwfisyQsCgMfAH7PNdh3BpIkwDEZkttmeAz9m1xFeANexbqEJcJowErPN9jnwe3Yd97iiXWC8yC5EwzEMRiCG45e0Q/Qx+xVYNYv5x+xC1D+nCeOwYvxBAPCSduqwzC5E/XNkkCwOFf2ZXccBPtBOHS6zC1E/HBnkO88u4EDPgD9nm+25uw51MAwSxUr9EMeMj+klcBkLoCqY04Qk8Wl6zf6dh2P2gfbA0nV2IdqfI4M859QVBNCOcv6abbar7EK0P0cGCeJOgj+Syxiax5oL48ggR6mLhvv4dKz53WyzPckuRg8zDI4shtCZvQfH9iPtAuMquxB9m9OEI4pPyEvqWivYlceaR8yRwXHVuGi4j6fYETlahsGRxKLhWDoSs9kROUJOE46goEakDFe0uw4ea07myOA4XmEQ3OcpHmseBUcGA4tFw7+y6yjELe0C4zq7kClyZDC8dXYBBXkE/DbbbC88m3B8jgwGNPLbi0rwhvbGZi9TOQLDYCCVNiJl8KGXI3GaMJwVBkEfHgO/O3UYniODARR8e9HY+dDLgAyDAcw220um1X9wbHZEDsAw6NkR30eUb0T2yjDokYuGKW5pr2+fQlv4oFxA7NfUG5EyPAJ+mW22l9H/oQM5MujJRG4vKsFb2qmDZxP25MigP+vsAgT83RG5zC6kNI4MehC3+LzOrkP/4kMvezAMOvL2oiL4RuQOnCZ056Lh+H16I9KHXr7BkUEHNiIVyYde7mEYHMjbi4pnR+Q/OE04nLcXle01vhH5FUcGB/D2oup4rBlHBodaZxegXvnQC44M9haHWX7LrkODmVxHpGGwBxuRJmVyx5qdJuxnhUEwFZN76MWRwY5sRJq0SbwR6chgd/bLT9enNyKrfujFMNhBDBW9xkxVH2t2mvAAFw11jze1XczqyOBhawwC/dvr2Wa7zi6iT4bBN/iMuh7woqbdBsPg29bZBWj0fqnl7kXD4B5xNNVGJO2iip0mw+AO0YhUzfBPg3taw52LhsHd1rhoqP0sswvoyq3Ff/D2InXwpOQ2aEcGX4gzBVXM/5TiLLuALgyDr3l7kbo4yy6gC8MgxDPqvn2gLk6yC+jCMPib0wN1dZpdQBeGAZ9vL3qWXYeKV/QO1OTDwEVDqTX5MMAXkSRg4mEQZ8pfJJchjcKkwwCnB9Jnkw0Dby+SvjbJMIhGpFVyGdKoTDIMcNFQ+pfJhYG3F2lAt9kFdDG5MMDbizScy+wCuphUGHh7kXS/yYRBLBraiCTdYzJhgNMDDc9pwtjF7UU2IoVS9BPKQ4bBrsTcoFy/BzxBjBwKIAAAAABJRU5ErkJggg==';

// ══════════════════════════════════════════════════════════════
//  ESTADO GLOBAL
// ══════════════════════════════════════════════════════════════
let metodo = 'Mensual';
let fechaCuota1Override = null;

// ══════════════════════════════════════════════════════════════
//  INICIALIZACIÓN
// ══════════════════════════════════════════════════════════════
export function initPlan() {
  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  
  document.getElementById('plan-fechaInicio').value = hoyStr;
  document.getElementById('plan-fechaFirma').value = firmaDefault(hoyStr);
  
  const ent = new Date(hoy);
  ent.setFullYear(ent.getFullYear() + 3);
  document.getElementById('plan-fechaEntrega').value = ent.toISOString().split('T')[0];
  
  attachEventListeners();
  onPctChange();
  recalcularCuotas();
  fetchTasaCambio();
}

// ══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
function attachEventListeners() {
  // Inputs generales
  document.getElementById('plan-cliente').addEventListener('input', recalcular);
  document.getElementById('plan-nacionalidad').addEventListener('change', recalcular);
  document.getElementById('plan-flujoMensual').addEventListener('blur', e => {
    fmtNum(e.target);
    recalcular();
  });
  document.getElementById('plan-dineroMano').addEventListener('blur', e => {
    fmtNum(e.target);
    recalcular();
  });
  document.getElementById('plan-inmueble').addEventListener('input', recalcular);
  document.getElementById('plan-proyecto').addEventListener('input', recalcular);
  document.getElementById('plan-unidad').addEventListener('input', recalcular);
  document.getElementById('plan-precioUSD').addEventListener('blur', e => {
    fmtNum(e.target);
    recalcular();
  });
  document.getElementById('plan-tasaCambio').addEventListener('input', recalcular);
  document.getElementById('plan-fechaInicio').addEventListener('input', recalcular);
  document.getElementById('plan-fechaFirma').addEventListener('input', recalcularCuotas);
  document.getElementById('plan-fechaEntrega').addEventListener('input', recalcularCuotas);
  
  // Pagos extraordinarios
  document.getElementById('plan-extra-hom-monto').addEventListener('blur', e => fmtNum(e.target));
  document.getElementById('plan-extra-hom-cuotas').addEventListener('input', recalcular);
  
  // Esquema de pago
  document.getElementById('plan-reservaFija').addEventListener('input', onPctChange);
  document.getElementById('plan-pctInicial').addEventListener('input', onPctChange);
  document.getElementById('plan-pctPlan').addEventListener('input', onPctChange);
  
  // Banco
  document.getElementById('plan-tasaBanco').addEventListener('change', recalcular);
  document.getElementById('plan-anosBanco').addEventListener('change', recalcular);
  
  // Botones
  document.getElementById('plan-btn-actualizar-tasa').addEventListener('click', fetchTasaCambio);
  document.getElementById('plan-btn-agregar-extra').addEventListener('click', () => agregarPagoExtra());
  document.getElementById('plan-btn-exportar-mrhome').addEventListener('click', exportarMrhome);
  document.getElementById('plan-btn-imprimir').addEventListener('click', () => window.print());
  
  // Presets
  document.querySelectorAll('.plan-preset-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const ini = parseInt(btn.dataset.ini);
      const plan = parseInt(btn.dataset.plan);
      aplicarPreset(ini, plan, btn);
    });
  });
  
  // Método de pago
  document.getElementById('plan-btn-mensual').addEventListener('click', () => setMetodo('Mensual'));
  document.getElementById('plan-btn-trimestral').addEventListener('click', () => setMetodo('Trimestral'));
}

// ══════════════════════════════════════════════════════════════
//  MÉTODO DE PAGO
// ══════════════════════════════════════════════════════════════
function setMetodo(m) {
  metodo = m;
  fechaCuota1Override = null;
  document.getElementById('plan-btn-mensual').classList.toggle('active', m === 'Mensual');
  document.getElementById('plan-btn-trimestral').classList.toggle('active', m === 'Trimestral');
  recalcularCuotas();
}

// ══════════════════════════════════════════════════════════════
//  PRESETS
// ══════════════════════════════════════════════════════════════
function aplicarPreset(ini, plan, btn) {
  document.getElementById('plan-pctInicial').value = ini;
  document.getElementById('plan-pctPlan').value = plan;
  document.querySelectorAll('.plan-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  onPctChange();
}

function onPctChange() {
  const ini = parseFloat(document.getElementById('plan-pctInicial').value) || 0;
  const plan = parseFloat(document.getElementById('plan-pctPlan').value) || 0;
  const entr = Math.max(0, 100 - ini - plan);
  document.getElementById('plan-pctEntrega').value = entr.toFixed(2);
  recalcular();
}

// ══════════════════════════════════════════════════════════════
//  PAGOS EXTRAORDINARIOS
// ══════════════════════════════════════════════════════════════
function agregarPagoExtra(cuotaN, montoV) {
  const lista = document.getElementById('plan-lista-extras');
  document.getElementById('plan-extras-empty').style.display = 'none';
  
  const row = document.createElement('div');
  row.className = 'extra-row';
  row.innerHTML = `
    <div class="er-cuota">
      <span>Cuota N°</span>
      <input type="number" class="extra-cuota" min="1" step="1" placeholder="—"
        value="${cuotaN || ''}" style="width:56px;text-align:center">
    </div>
    <div class="pw" style="position:relative">
      <span class="pfx" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:13px;pointer-events:none">$</span>
      <input type="number" class="extra-monto" min="0" step="100" placeholder="0"
        value="${montoV || ''}" style="padding-left:22px;width:100%">
    </div>
    <button class="btn-del-extra" title="Eliminar">×</button>
  `;
  
  row.querySelector('.extra-cuota').addEventListener('input', recalcular);
  row.querySelector('.extra-monto').addEventListener('input', recalcular);
  row.querySelector('.btn-del-extra').addEventListener('click', () => eliminarExtra(row));
  
  lista.appendChild(row);
  recalcular();
}

function eliminarExtra(row) {
  row.remove();
  const lista = document.getElementById('plan-lista-extras');
  if (!lista.querySelector('.extra-row')) {
    document.getElementById('plan-extras-empty').style.display = 'block';
  }
  recalcular();
}

function leerExtras() {
  const map = new Map();
  
  // Homogéneos
  const homMontoRaw = (document.getElementById('plan-extra-hom-monto').value || '0').replace(/,/g, '');
  const homMonto = parseFloat(homMontoRaw) || 0;
  const homCuotasStr = document.getElementById('plan-extra-hom-cuotas').value || '';
  let homCuotasArr = [];
  
  if (homMonto > 0 && homCuotasStr.trim()) {
    homCuotasStr.split(',').forEach(s => {
      const c = parseInt(s.trim());
      if (!isNaN(c) && c >= 1) {
        homCuotasArr.push(c);
        map.set(c, (map.get(c) || 0) + homMonto);
      }
    });
  }
  
  // Resumen homogéneo
  const homSumEl = document.getElementById('plan-hom-summary');
  if (homSumEl) {
    if (homMonto > 0 && homCuotasArr.length > 0) {
      homSumEl.innerHTML = `✅ ${homCuotasArr.length} cuota(s): ${homCuotasArr.sort((a,b) => a - b).join(', ')} &nbsp;·&nbsp; ${usd(homMonto)} c/u &nbsp;·&nbsp; <strong>Total: ${usd(homMonto * homCuotasArr.length)}</strong>`;
    } else {
      homSumEl.textContent = '';
    }
  }
  
  // No homogéneos
  document.querySelectorAll('.extra-row').forEach(row => {
    const c = parseInt(row.querySelector('.extra-cuota').value);
    const m = parseFloat(row.querySelector('.extra-monto').value) || 0;
    if (!isNaN(c) && c >= 1 && m > 0) {
      map.set(c, (map.get(c) || 0) + m);
    }
  });
  
  return map;
}

function usarExcedente(monto) {
  agregarPagoExtra(1, monto.toFixed(2));
}

// ══════════════════════════════════════════════════════════════
//  HELPERS NUMÉRICOS Y FECHA
// ══════════════════════════════════════════════════════════════
function cleanNum(el) {
  el.value = el.value.replace(/[^0-9.]/g, '');
}

function fmtNum(el) {
  const n = parseFloat(el.value.replace(/,/g, '')) || 0;
  el.value = n > 0 ? n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '';
}

function getN(id) {
  const val = document.getElementById(id).value || '0';
  return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

const usd = n => (isNaN(n) || n == null) ? '—' : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const rd = n => (isNaN(n) || n == null) ? '—' : 'RD$ ' + n.toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

function fmtFecha(d) {
  return d.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function cuotaBanco(capital, tasaA, anos) {
  const r = tasaA / 100 / 12;
  const n = anos * 12;
  if (r === 0) return capital / n;
  return capital * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function firmaDefault(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  if (d.getDate() < 15) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  } else {
    const nx = new Date(d);
    nx.setMonth(nx.getMonth() + 1);
    return nx.toISOString().split('T')[0];
  }
}

// ══════════════════════════════════════════════════════════════
//  GENERAR CUOTAS
// ══════════════════════════════════════════════════════════════
function generarCuotas(firmaDate, entregaDate, modoMetodo) {
  const mesesPer = modoMetodo === 'Mensual' ? 1 : 3;
  const primeraCuota = fechaCuota1Override ? new Date(fechaCuota1Override) : addMeses(firmaDate, mesesPer);
  const limiteUltima = addMeses(entregaDate, -1);
  
  let fechas = [], i = 0;
  while (true) {
    const d = addMeses(primeraCuota, i * mesesPer);
    if (d > limiteUltima) break;
    fechas.push(d);
    i++;
  }
  if (fechas.length === 0) fechas.push(new Date(limiteUltima));
  
  let ultimaEsPartial = false, mesesPartial = 0;
  if (modoMetodo === 'Trimestral') {
    const lastD = fechas[fechas.length - 1];
    const diff = monthDiff(lastD, limiteUltima);
    if (diff > 0) {
      fechas[fechas.length - 1] = new Date(limiteUltima);
      ultimaEsPartial = true;
      mesesPartial = diff;
    }
  }
  
  return { fechas, n: fechas.length, ultimaEsPartial, mesesPartial };
}

function calcularMontos(n, ultimaEsPartial, mesesPartial, montoBase) {
  if (n <= 0) return { regularAmt: 0, lastAmt: 0 };
  
  if (ultimaEsPartial && mesesPartial > 0) {
    const ratio = mesesPartial / 3;
    const regularAmt = montoBase / (n - 1 + ratio);
    return { regularAmt, lastAmt: regularAmt * ratio };
  }
  
  const regularAmt = montoBase / n;
  return { regularAmt, lastAmt: regularAmt };
}

function recalcularCuotas() {
  fechaCuota1Override = null;
  const firmaStr = document.getElementById('plan-fechaFirma').value;
  const entregaStr = document.getElementById('plan-fechaEntrega').value;
  
  if (!firmaStr || !entregaStr) {
    document.getElementById('plan-cantCuotas').value = 0;
    recalcular();
    return;
  }
  
  const { n } = generarCuotas(
    new Date(firmaStr + 'T12:00:00'),
    new Date(entregaStr + 'T12:00:00'),
    metodo
  );
  
  document.getElementById('plan-cantCuotas').value = n;
  recalcular();
}

function cambiarFechaCuota1(dateStr) {
  fechaCuota1Override = dateStr ? new Date(dateStr + 'T12:00:00') : null;
  recalcular();
}

function activarEditFecha(el, isoDate) {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = isoDate;
  input.style.cssText = 'border:1.5px solid var(--celeste);border-radius:5px;font-size:12px;padding:3px 6px;color:var(--navy);background:#eff6ff;outline:none;font-family:inherit;';
  input.onchange = (e) => { cambiarFechaCuota1(e.target.value); };
  input.onblur = () => { recalcular(); };
  el.replaceWith(input);
  input.focus();
  try { if (input.showPicker) input.showPicker(); } catch(e) {}
}

function getExtrasForCuota(extrasMap, cuotaIdx, metodoPago) {
  if (metodoPago === 'Mensual') {
    return extrasMap.get(cuotaIdx + 1) || 0;
  } else {
    const targetMonth = (cuotaIdx + 1) * 3;
    return extrasMap.get(targetMonth) || 0;
  }
}

// ══════════════════════════════════════════════════════════════
//  TASA DE CAMBIO
// ══════════════════════════════════════════════════════════════
async function fetchTasaCambio() {
  const badge = document.getElementById('plan-tasa-badge');
  const fuente = document.getElementById('plan-tasa-fuente');
  
  badge.className = 'tasa-badge loading';
  badge.textContent = '⏳ Consultando...';
  
  const target = 'https://www.infodolar.com.do/';
  const proxies = [
    'https://api.allorigins.win/get?url=' + encodeURIComponent(target),
    'https://corsproxy.io/?' + encodeURIComponent(target)
  ];
  
  let html = null;
  for (const p of proxies) {
    try {
      const r = await fetch(p, { signal: AbortSignal.timeout(8000) });
      const d = await r.json();
      html = d.contents || d;
      if (typeof html === 'string' && html.length > 500) break;
    } catch(e) {
      html = null;
    }
  }
  
  if (!html || typeof html !== 'string') {
    badge.className = 'tasa-badge error';
    badge.textContent = '❌ Sin conexión';
    fuente.textContent = 'No se pudo obtener la tasa. Ingrese manualmente.';
    return;
  }
  
  const tasa = parsearBanreservas(html);
  if (tasa) {
    document.getElementById('plan-tasaCambio').value = tasa.toFixed(2);
    badge.className = 'tasa-badge';
    badge.textContent = '✅ Actualizado';
    fuente.textContent = `Tasa venta Banreservas: RD$ ${tasa.toFixed(2)} · ${new Date().toLocaleTimeString('es-DO')}`;
    recalcular();
    setTimeout(() => { badge.textContent = '🔄 Actualizar'; }, 3000);
  } else {
    badge.className = 'tasa-badge error';
    badge.textContent = '⚠️ No encontrado';
    fuente.textContent = 'No se pudo leer la tasa de Banreservas.';
  }
}

function parsearBanreservas(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    for (const row of doc.querySelectorAll('tr, .row, [class*="row"]')) {
      if (/banreservas/i.test(row.textContent)) {
        const nums = row.textContent.match(/\b\d{2,3}[.,]\d{2}\b/g);
        if (nums) {
          const v = nums.map(s => parseFloat(s.replace(',', '.'))).filter(v => v > 50 && v < 100);
          if (v.length) return Math.max(...v);
        }
      }
    }
  } catch(e) {}
  
  const idx = html.toLowerCase().indexOf('banreservas');
  if (idx >= 0) {
    const nums = html.substring(idx, idx + 600).match(/\b(\d{2,3}[.,]\d{2})\b/g);
    if (nums) {
      const v = nums.map(s => parseFloat(s.replace(',', '.'))).filter(v => v > 50 && v < 100);
      if (v.length) return Math.max(...v);
    }
  }
  
  return null;
}

// ══════════════════════════════════════════════════════════════
//  RECALCULAR PRINCIPAL
// ══════════════════════════════════════════════════════════════
function recalcular() {
  const precio = getN('plan-precioUSD');
  const tasa = parseFloat(document.getElementById('plan-tasaCambio').value) || 60.75;
  const reserva = parseFloat(document.getElementById('plan-reservaFija').value) || 0;
  const pctInicial = parseFloat(document.getElementById('plan-pctInicial').value) || 0;
  const pctPlan = parseFloat(document.getElementById('plan-pctPlan').value) || 0;
  const pctEntr = parseFloat(document.getElementById('plan-pctEntrega').value) || 0;
  const cuotas = parseInt(document.getElementById('plan-cantCuotas').value) || 0;
  const tasaB = parseFloat(document.getElementById('plan-tasaBanco').value) || 14.6;
  const anosB = parseInt(document.getElementById('plan-anosBanco').value) || 20;
  const flujoM = getN('plan-flujoMensual');
  const dineroM = getN('plan-dineroMano');
  const inm = parseFloat(document.getElementById('plan-inmueble').value) || 0;
  const fechaIStr = document.getElementById('plan-fechaInicio').value;
  const fechaFStr = document.getElementById('plan-fechaFirma').value;
  const fechaEStr = document.getElementById('plan-fechaEntrega').value;
  
  const fechaBase = fechaIStr ? new Date(fechaIStr + 'T12:00:00') : new Date();
  const fechaFirma = fechaFStr ? new Date(fechaFStr + 'T12:00:00') : addMeses(fechaBase, 1);
  const fechaEntrega = fechaEStr ? new Date(fechaEStr + 'T12:00:00') : null;
  
  // Montos base
  const resPct = precio > 0 ? reserva / precio * 100 : 0;
  const montoSep = Math.max(0, precio * pctInicial / 100 - reserva);
  const montoPlan = precio * pctPlan / 100;
  const montoEntr = precio * pctEntr / 100;
  const montoIni = reserva + montoSep;
  
  // Validación de porcentajes
  const totalPct = pctInicial + pctPlan + pctEntr;
  const diffPct = Math.abs(100 - totalPct);
  const badge = document.getElementById('plan-pct-total');
  badge.textContent = totalPct.toFixed(2) + '%';
  badge.className = 'pct-badge ' + (diffPct < 0.05 ? 'ok' : 'err');
  document.getElementById('plan-alert-pct').style.display = diffPct >= 0.05 ? 'flex' : 'none';
  
  // Labels de porcentajes
  document.getElementById('plan-lbl-res-pct').textContent = resPct.toFixed(2) + '% del precio';
  document.getElementById('plan-lbl-sep-usd').textContent = usd(montoSep);
  document.getElementById('plan-lbl-plan-usd').textContent = usd(montoPlan);
  document.getElementById('plan-lbl-entr-usd').textContent = usd(montoEntr);
  
  // Generar cuotas
  let cuotaInfo = { fechas: [], n: cuotas, ultimaEsPartial: false, mesesPartial: 0 };
  if (fechaFirma && fechaEntrega) {
    cuotaInfo = generarCuotas(fechaFirma, fechaEntrega, metodo);
  }
  
  const { fechas: cuotaFechas, ultimaEsPartial, mesesPartial } = cuotaInfo;
  const nCuotas = cuotaFechas.length || cuotas;
  
  // Extras
  const extrasMap = leerExtras();
  const totalExtras = Array.from(extrasMap.values()).reduce((a, b) => a + b, 0);
  const montoBase = Math.max(0, montoPlan - totalExtras);
  const { regularAmt, lastAmt } = calcularMontos(nCuotas, ultimaEsPartial, mesesPartial, montoBase);
  
  // Excedente de capital
  const excedente = dineroM - reserva - montoSep;
  const exEl = document.getElementById('plan-excedente-box');
  
  if (dineroM > 0 || reserva > 0) {
    exEl.style.display = 'flex';
    if (excedente > 0) {
      exEl.className = 'excedente-box positivo';
      exEl.innerHTML = `💰 <span>Excedente disponible: <strong>${usd(excedente)}</strong> &nbsp;<span style="font-weight:400">(Dinero en mano − Reserva − Separación)</span></span>
        <button class="btn-usar-excedente">Agregar como pago extra</button>`;
      exEl.querySelector('.btn-usar-excedente').addEventListener('click', () => usarExcedente(excedente));
    } else if (excedente < 0) {
      exEl.className = 'excedente-box negativo';
      exEl.innerHTML = `⚠️ <span>Capital insuficiente: faltan <strong>${usd(-excedente)}</strong> para cubrir Reserva + Separación</span>`;
    } else {
      exEl.className = 'excedente-box neutro';
      exEl.innerHTML = `✔️ <span>Capital en mano cubre exactamente Reserva + Separación</span>`;
    }
  } else {
    exEl.style.display = 'none';
  }
  
  // Resumen extras
  const sumEl = document.getElementById('plan-extras-summary');
  if (extrasMap.size > 0) {
    const cuotaOriginal = nCuotas > 0 ? montoPlan / nCuotas : 0;
    sumEl.innerHTML = `<span style="color:var(--navy);font-weight:600">${extrasMap.size} cuota(s) con pago extra · Total extras: ${usd(totalExtras)}</span>
      &nbsp;→&nbsp; Cuota regular: <strong style="color:var(--verde)">${usd(regularAmt)}</strong>
      <span style="color:#94a3b8">(sin extras sería ${usd(cuotaOriginal)})</span>`;
  } else {
    sumEl.innerHTML = '';
  }
  
  // Cards resumen
  document.getElementById('plan-sv-ini').textContent = usd(montoIni);
  document.getElementById('plan-ss-ini').textContent = rd(montoIni * tasa);
  document.getElementById('plan-lbl-cuota-tipo').textContent = 'Cuota ' + metodo;
  document.getElementById('plan-sv-cuota').textContent = usd(regularAmt);
  document.getElementById('plan-ss-cuota').textContent = rd(regularAmt * tasa) + ' / ' + metodo.toLowerCase();
  document.getElementById('plan-sv-obra').textContent = usd(montoPlan);
  document.getElementById('plan-ss-obra').textContent = rd(montoPlan * tasa);
  document.getElementById('plan-sv-entr').textContent = usd(montoEntr);
  document.getElementById('plan-ss-entr').textContent = rd(montoEntr * tasa);
  
  // Banco
  const cb = cuotaBanco(montoEntr, tasaB, anosB);
  document.getElementById('plan-bv-usd').textContent = usd(cb);
  document.getElementById('plan-bv-rd').textContent = rd(cb * tasa);
  document.getElementById('plan-bs-info').textContent = `Capital: ${usd(montoEntr)} · ${tasaB}% · ${anosB} años`;
  
  // Header plan
  document.getElementById('plan-ph-cliente').textContent = document.getElementById('plan-cliente').value || '—';
  document.getElementById('plan-ph-proyecto').textContent = document.getElementById('plan-proyecto').value || '—';
  document.getElementById('plan-ph-unidad').textContent = document.getElementById('plan-unidad').value || '—';
  document.getElementById('plan-ph-precio').textContent = usd(precio) + ' USD$';
  document.getElementById('plan-ph-esquema').textContent = 
    pctInicial.toFixed(0) + '% – ' + pctPlan.toFixed(0) + '% – ' + pctEntr.toFixed(0) + '%';
  
  // Capacidad
  const capIni = dineroM + inm;
  document.getElementById('plan-cap-wrap').innerHTML = `
    <div class="cap-item">
      <div class="cl">Capacidad Inicial</div>
      <div class="cv" style="color:${capIni >= montoIni ? 'var(--verde)' : 'var(--rojo)'}">${usd(capIni)}</div>
      <div class="cs">Dinero + Inmueble propio (USD$)</div>
    </div>
    <div class="cap-item">
      <div class="cl">Flujo Mensual</div>
      <div class="cv" style="color:${flujoM >= regularAmt ? 'var(--verde)' : 'var(--rojo)'}">${usd(flujoM)}</div>
      <div class="cs">vs. cuota ${usd(regularAmt)}</div>
    </div>
  `;
  
  // TABLA
  generarTabla({
    precio, tasa, reserva, montoSep, montoPlan, montoEntr, montoIni,
    fechaBase, fechaFirma, fechaEntrega, cuotaFechas, nCuotas,
    ultimaEsPartial, mesesPartial, regularAmt, lastAmt,
    extrasMap, totalExtras
  });
}

// ══════════════════════════════════════════════════════════════
//  GENERACIÓN DE TABLA
// ══════════════════════════════════════════════════════════════
function generarTabla(data) {
  const {
    precio, tasa, reserva, montoSep, montoPlan, montoEntr, montoIni,
    fechaBase, fechaFirma, fechaEntrega, cuotaFechas, nCuotas,
    ultimaEsPartial, mesesPartial, regularAmt, lastAmt,
    extrasMap, totalExtras
  } = data;
  
  const tbody = document.getElementById('plan-tabla-body');
  tbody.innerHTML = '';
  
  if (nCuotas === 0 && !fechaEntrega) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:28px;color:#94a3b8">Ingrese la fecha de entrega para generar el cronograma</td></tr>';
    return;
  }
  
  let saldo = precio, acum = 0, num = 0;
  
  const seccion = txt => {
    const tr = document.createElement('tr');
    tr.className = 'tr-section';
    tr.innerHTML = `<td colspan="9">${txt}</td>`;
    tbody.appendChild(tr);
  };
  
  const subtotal = (lbl, base, ext, tot, rdV, acumPct, saldoV) => {
    const tr = document.createElement('tr');
    tr.className = 'tr-subtotal';
    tr.innerHTML = `<td colspan="3">${lbl}</td><td>${usd(base)}</td><td>${ext > 0 ? usd(ext) : '—'}</td><td>${usd(tot)}</td><td>${rd(rdV)}</td><td>${(acumPct * 100).toFixed(2)}%</td><td>${usd(Math.max(saldoV, 0))}</td>`;
    tbody.appendChild(tr);
  };
  
  const fila = (n, fecha, concepto, base, ext, tot, rdV, acumPct, saldoV, tagClass, editableDate = false) => {
    const tr = document.createElement('tr');
    const fechaCell = editableDate
      ? `<span class="editable-fecha" data-iso="${fecha.toISOString().split('T')[0]}">${fmtFecha(fecha)}</span>`
      : fmtFecha(fecha);
    
    tr.innerHTML = `<td>${n}</td><td>${fechaCell}</td><td><span class="tag ${tagClass}">${concepto}</span></td>
      <td>${usd(base)}</td><td>${ext > 0 ? usd(ext) : '—'}</td><td><strong>${usd(tot)}</strong></td>
      <td>${rd(rdV)}</td><td>${(acumPct * 100).toFixed(2)}%</td><td>${usd(Math.max(saldoV, 0))}</td>`;
    
    tbody.appendChild(tr);
    
    if (editableDate) {
      const span = tr.querySelector('.editable-fecha');
      span.addEventListener('click', () => activarEditFecha(span, span.dataset.iso));
    }
  };
  
  // Sección 1: Reserva/Separación
  seccion('1. Reserva / Separación (Firma de Contrato)');
  num++; saldo -= reserva; acum += reserva / precio;
  fila(num, fechaBase, 'Reserva', reserva, 0, reserva, reserva * tasa, acum, saldo, 't-blue');
  num++; saldo -= montoSep; acum += montoSep / precio;
  fila(num, fechaFirma, 'Firma de Contrato', montoSep, 0, montoSep, montoSep * tasa, acum, saldo, 't-blue');
  subtotal('Subtotal Inicial', reserva, 0, montoIni, montoIni * tasa, acum, saldo);
  
  // Sección 2: Plan de Pago
  const partialLabel = ultimaEsPartial ? ` · última parcial (${mesesPartial}/3 mes)` : '';
  seccion(`2. Plan de Pago Durante Obra (${metodo}) — ${nCuotas} cuota${nCuotas !== 1 ? 's' : ''}${partialLabel}`);
  
  let totalPlanAcum = 0, totalExtraAcum = 0;
  
  // Extras no alineados en trimestral
  let nonAlignedExtras = [];
  if (metodo === 'Trimestral' && cuotaFechas.length > 0 && fechaEntrega) {
    const mensualFechas = generarCuotas(fechaFirma, fechaEntrega, 'Mensual').fechas;
    const mensualMap = new Map();
    mensualFechas.forEach((f, i) => mensualMap.set(i + 1, f));
    
    for (const [cuotaN, monto] of extrasMap) {
      if (cuotaN % 3 !== 0) {
        const fechaExtra = mensualMap.has(cuotaN)
          ? new Date(mensualMap.get(cuotaN))
          : addMeses(fechaFirma, cuotaN);
        nonAlignedExtras.push({ monthNum: cuotaN, monto, fecha: fechaExtra });
      }
    }
    nonAlignedExtras.sort((a, b) => a.fecha - b.fecha);
  }
  
  if (cuotaFechas.length > 0) {
    let naeIdx = 0;
    for (let i = 0; i < cuotaFechas.length; i++) {
      // Insertar extras no alineados ANTES de esta cuota
      while (naeIdx < nonAlignedExtras.length && nonAlignedExtras[naeIdx].fecha < cuotaFechas[i]) {
        const nae = nonAlignedExtras[naeIdx++];
        num++;
        saldo -= nae.monto; acum += nae.monto / precio;
        totalExtraAcum += nae.monto;
        fila(num, nae.fecha, 'Cuota Extra', 0, nae.monto, nae.monto, nae.monto * tasa, acum, saldo, 't-extra');
      }
      
      num++;
      const esUltima = i === cuotaFechas.length - 1;
      const amt = esUltima ? lastAmt : regularAmt;
      const ext = getExtrasForCuota(extrasMap, i, metodo);
      const tot = amt + ext;
      saldo -= tot; acum += tot / precio;
      totalPlanAcum += amt; totalExtraAcum += ext;
      
      const tagClass = ext > 0 ? 't-extra' : (esUltima && ultimaEsPartial ? 't-partial' : 't-green');
      const label = ext > 0
        ? `Cuota ${i + 1} + Extra`
        : (esUltima && ultimaEsPartial ? `Cuota ${i + 1} (parcial)` : `Cuota ${i + 1}`);
      
      fila(num, cuotaFechas[i], label, amt, ext, tot, tot * tasa, acum, saldo, tagClass, i === 0);
    }
    
    // Insertar extras no alineados DESPUÉS de la última cuota
    while (naeIdx < nonAlignedExtras.length) {
      const nae = nonAlignedExtras[naeIdx++];
      num++;
      saldo -= nae.monto; acum += nae.monto / precio;
      totalExtraAcum += nae.monto;
      fila(num, nae.fecha, 'Cuota Extra', 0, nae.monto, nae.monto, nae.monto * tasa, acum, saldo, 't-extra');
    }
  } else {
    // Fallback sin fechas
    for (let i = 0; i < nCuotas; i++) {
      num++;
      const fecha = addMeses(fechaFirma, (i + 1) * (metodo === 'Mensual' ? 1 : 3));
      const ext = getExtrasForCuota(extrasMap, i, metodo);
      const tot = regularAmt + ext;
      saldo -= tot; acum += tot / precio;
      totalPlanAcum += regularAmt; totalExtraAcum += ext;
      const tagClass = ext > 0 ? 't-extra' : 't-green';
      fila(num, fecha, ext > 0 ? `Cuota ${i + 1} + Extra` : `Cuota ${i + 1}`, regularAmt, ext, tot, tot * tasa, acum, saldo, tagClass, i === 0);
    }
  }
  
  const totalPlan = totalPlanAcum + totalExtraAcum;
  subtotal('Subtotal Plan de Pago', totalPlanAcum, totalExtraAcum, totalPlan, totalPlan * tasa, acum, saldo);
  
  // Sección 3: Contra Entrega
  seccion('3. Saldo Contra Entrega');
  num++;
  const fEntrega = fechaEntrega || addMeses(fechaFirma, (nCuotas + 3) * (metodo === 'Mensual' ? 1 : 3));
  saldo -= montoEntr; acum += montoEntr / precio;
  
  const trE = document.createElement('tr');
  trE.className = 'tr-entrega';
  trE.innerHTML = `<td>${num}</td><td>${fmtFecha(fEntrega)}</td><td><span class="tag t-gold">Contra Entrega</span></td>
    <td>${usd(montoEntr)}</td><td>—</td><td><strong>${usd(montoEntr)}</strong></td>
    <td>${rd(montoEntr * tasa)}</td><td>${(acum * 100).toFixed(2)}%</td><td>${usd(0)}</td>`;
  tbody.appendChild(trE);
  
  // Total general
  const totalPagado = montoIni + totalPlan + montoEntr;
  const trTot = document.createElement('tr');
  trTot.className = 'tr-total';
  trTot.innerHTML = `<td colspan="3">TOTAL GENERAL</td>
    <td>${usd(precio)}</td><td>${totalExtraAcum > 0 ? usd(totalExtraAcum) : '—'}</td>
    <td>${usd(totalPagado)}</td><td>${rd(totalPagado * tasa)}</td>
    <td>${(acum * 100).toFixed(2)}%</td><td>${usd(0)}</td>`;
  tbody.appendChild(trTot);
}

// ══════════════════════════════════════════════════════════════
//  EXPORTAR PDF MRHOME
// ══════════════════════════════════════════════════════════════
function exportarMrhome() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    showToast('La librería PDF no está disponible', 'error');
    return;
  }
  
  // Extraer datos del formulario
  const cliente = document.getElementById('plan-cliente').value || '________________';
  const proyecto = document.getElementById('plan-proyecto').value || '________________';
  const unidad = document.getElementById('plan-unidad').value || '________________';
  const precio = getN('plan-precioUSD');
  const reserva = parseFloat(document.getElementById('plan-reservaFija').value) || 0;
  const pctInicial = parseFloat(document.getElementById('plan-pctInicial').value) || 0;
  const pctPlan = parseFloat(document.getElementById('plan-pctPlan').value) || 0;
  const pctEntrega = parseFloat(document.getElementById('plan-pctEntrega').value) || 0;
  const fechaIStr = document.getElementById('plan-fechaInicio').value;
  const fechaFStr = document.getElementById('plan-fechaFirma').value;
  const fechaEStr = document.getElementById('plan-fechaEntrega').value;
  
  const montoSep = Math.max(0, precio * pctInicial / 100 - reserva);
  const montoPlan = precio * pctPlan / 100;
  const montoEntr = precio * pctEntrega / 100;
  const montoIni = reserva + montoSep;
  
  const fechaBase = fechaIStr ? new Date(fechaIStr + 'T12:00:00') : new Date();
  const fechaFirma = fechaFStr ? new Date(fechaFStr + 'T12:00:00') : addMeses(fechaBase, 1);
  const fechaEntrega = fechaEStr ? new Date(fechaEStr + 'T12:00:00') : null;
  
  const cuotaInfo = (fechaFirma && fechaEntrega)
    ? generarCuotas(fechaFirma, fechaEntrega, metodo)
    : { fechas: [], n: 0, ultimaEsPartial: false, mesesPartial: 0 };
  
  const { fechas: cuotaFechas, ultimaEsPartial, mesesPartial } = cuotaInfo;
  const nCuotas = cuotaFechas.length;
  const extrasMap = leerExtras();
  const totalExtras = Array.from(extrasMap.values()).reduce((a, b) => a + b, 0);
  const montoBase = Math.max(0, montoPlan - totalExtras);
  const { regularAmt, lastAmt } = calcularMontos(nCuotas, ultimaEsPartial, mesesPartial, montoBase);
  
  const fmtU = n => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD = d => d.toLocaleDateString('es-DO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const fmtP = n => (n || 0).toFixed(1) + '%';
  
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 14;
  let y = margin;
  const AZUL = [26, 58, 92], DORADO = [201, 168, 76], GRIS = [244, 246, 249], BLANCO = [255, 255, 255], NEGRO = [30, 41, 59];
  
  // Header
  doc.setFillColor(...AZUL);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...DORADO);
  doc.rect(0, 26, W, 2, 'F');
  try {
    doc.addImage('data:image/png;base64,' + CASA_B64, 'PNG', margin, 3, 20, 20);
  } catch(e) {}
  doc.setTextColor(...BLANCO);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MrHome', margin + 24, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Plan de Pagos Oficial', margin + 24, 19);
  doc.setFillColor(...DORADO);
  doc.roundedRect(W - margin - 40, 7, 40, 14, 2, 2, 'F');
  doc.setTextColor(...BLANCO);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Plan ' + metodo, W - margin - 20, 15, { align: 'center' });
  y = 34;
  
  // Bloques info + resumen
  const lw = 105, rw = W - margin - margin - lw - 4, rx = margin + lw + 4;
  doc.setFillColor(...GRIS);
  doc.roundedRect(margin, y, lw, 36, 2, 2, 'F');
  
  const infoItems = [
    ['CLIENTE:', cliente],
    ['PROYECTO:', proyecto],
    ['UNIDAD:', unidad],
    ['PRECIO DE CIERRE:', fmtU(precio) + ' USD'],
    ['FECHA RESERVA:', fechaIStr || '—'],
    ['FECHA ENTREGA:', fechaEStr || '—']
  ];
  
  doc.setFontSize(7);
  infoItems.forEach(([lbl, val], i) => {
    const iy = y + 6 + i * 5;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(lbl, margin + 3, iy);
    doc.setTextColor(...NEGRO);
    doc.setFont('helvetica', 'bold');
    doc.text(String(val), margin + 40, iy);
  });
  
  doc.setFillColor(...AZUL);
  doc.roundedRect(rx, y, rw, 36, 2, 2, 'F');
  doc.setTextColor(...DORADO);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DEL PLAN', rx + rw / 2, y + 6, { align: 'center' });
  doc.setFillColor(...DORADO);
  doc.rect(rx + 4, y + 8, rw - 8, 0.3, 'F');
  
  [
    ['Cuotas:', nCuotas + ' cuotas'],
    ['Inicial / Reserva:', fmtP(pctInicial) + '  (' + fmtU(montoIni) + ')'],
    ['Durante la obra:', fmtP(pctPlan) + '  (' + fmtU(montoPlan) + ')'],
    ['Saldo contraentrega:', fmtP(pctEntrega) + '  (' + fmtU(montoEntr) + ')'],
    ['Totalidad:', fmtU(precio)]
  ].forEach(([lbl, val], i) => {
    const ry2 = y + 13 + i * 5;
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(lbl, rx + 3, ry2);
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'bold');
    doc.text(val, rx + rw - 3, ry2, { align: 'right' });
  });
  
  y += 42;
  
  // Tabla separación
  const cw = [22, 12, 28, 36, 28, 24];
  const hLabels = ['ETAPA', 'NO.', 'FECHA', 'CUOTAS USD$', 'PAGOS EXTRAS', 'TOTAL USD$'];
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...AZUL);
  doc.text('RESERVA / SEPARACIÓN', margin, y);
  y += 2;
  
  doc.autoTable({
    startY: y,
    head: [hLabels],
    body: [
      ['Sep. / Reserva', '1', fmtD(fechaBase), fmtU(reserva), '—', fmtU(reserva)],
      ['Firma de Contrato', '2', fmtD(fechaFirma), fmtU(montoSep), '—', fmtU(montoSep)],
      ['SUBTOTAL', '', '', fmtU(montoIni), '—', fmtU(montoIni)]
    ],
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 6.5, textColor: NEGRO },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: cw[0] },
      1: { halign: 'center', cellWidth: cw[1] },
      2: { halign: 'center', cellWidth: cw[2] },
      3: { halign: 'right', cellWidth: cw[3] },
      4: { halign: 'right', cellWidth: cw[4] },
      5: { halign: 'right', cellWidth: cw[5], fontStyle: 'bold' }
    },
    didParseCell: d => {
      if (d.row.index === 2) {
        d.cell.styles.fillColor = AZUL;
        d.cell.styles.textColor = BLANCO;
        d.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 5;
  
  // Tabla cuotas
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...AZUL);
  doc.text(`PLAN DE PAGO — ${metodo.toUpperCase()} (${nCuotas} cuotas · cuota regular ${fmtU(regularAmt)})`, margin, y);
  y += 2;
  
  // Extras no alineados para PDF
  let nonAlignedPDF = [];
  if (metodo === 'Trimestral' && cuotaFechas.length > 0 && fechaEntrega) {
    const mensFechasPDF = generarCuotas(fechaFirma, fechaEntrega, 'Mensual').fechas;
    const mensFechasMapPDF = new Map();
    mensFechasPDF.forEach((f, i) => mensFechasMapPDF.set(i + 1, f));
    
    for (const [cuotaN, monto] of extrasMap) {
      if (cuotaN % 3 !== 0) {
        const fechaExtra = mensFechasMapPDF.has(cuotaN)
          ? new Date(mensFechasMapPDF.get(cuotaN))
          : addMeses(fechaFirma, cuotaN);
        nonAlignedPDF.push({ monto, fecha: fechaExtra });
      }
    }
    nonAlignedPDF.sort((a, b) => a.fecha - b.fecha);
  }
  
  const bodyRows = [];
  let tPA = 0, tEA = 0, naePDF = 0, rowNum = 0;
  
  for (let i = 0; i < cuotaFechas.length; i++) {
    while (naePDF < nonAlignedPDF.length && nonAlignedPDF[naePDF].fecha < cuotaFechas[i]) {
      const nae = nonAlignedPDF[naePDF++];
      rowNum++;
      tEA += nae.monto;
      bodyRows.push(['Cuota Extra', String(rowNum), fmtD(nae.fecha), '—', fmtU(nae.monto), fmtU(nae.monto)]);
    }
    
    rowNum++;
    const esUlt = i === cuotaFechas.length - 1;
    const amt = esUlt ? lastAmt : regularAmt;
    const ext = getExtrasForCuota(extrasMap, i, metodo);
    tPA += amt;
    tEA += ext;
    bodyRows.push([
      esUlt && ultimaEsPartial ? 'Cuota (parcial)' : 'Cuota',
      String(rowNum),
      fmtD(cuotaFechas[i]),
      fmtU(amt),
      ext > 0 ? fmtU(ext) : '—',
      fmtU(amt + ext)
    ]);
  }
  
  while (naePDF < nonAlignedPDF.length) {
    const nae = nonAlignedPDF[naePDF++];
    rowNum++;
    tEA += nae.monto;
    bodyRows.push(['Cuota Extra', String(rowNum), fmtD(nae.fecha), '—', fmtU(nae.monto), fmtU(nae.monto)]);
  }
  
  bodyRows.push(['SUBTOTAL', '', '', fmtU(tPA), tEA > 0 ? fmtU(tEA) : '—', fmtU(tPA + tEA)]);
  
  doc.autoTable({
    startY: y,
    head: [hLabels],
    body: bodyRows,
    theme: 'striped',
    headStyles: { fillColor: AZUL, textColor: BLANCO, fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 6.5, textColor: NEGRO },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: cw[0] },
      1: { halign: 'center', cellWidth: cw[1] },
      2: { halign: 'center', cellWidth: cw[2] },
      3: { halign: 'right', cellWidth: cw[3] },
      4: { halign: 'right', cellWidth: cw[4] },
      5: { halign: 'right', cellWidth: cw[5], fontStyle: 'bold' }
    },
    didParseCell: d => {
      if (d.row.index === bodyRows.length - 1) {
        d.cell.styles.fillColor = AZUL;
        d.cell.styles.textColor = BLANCO;
        d.cell.styles.fontStyle = 'bold';
      }
    },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 5;
  
  // Contra entrega
  const fEnt = fechaEntrega || addMeses(fechaFirma, (nCuotas + 3) * (metodo === 'Mensual' ? 1 : 3));
  
  doc.autoTable({
    startY: y,
    head: [['SALDO CONTRA ENTREGA', 'FECHA ESTIMADA', 'MONTO USD$', '% DEL PRECIO']],
    body: [['Contra Entrega', fmtD(fEnt), fmtU(montoEntr), fmtP(pctEntrega)]],
    theme: 'grid',
    headStyles: { fillColor: DORADO, textColor: BLANCO, fontSize: 6.5, fontStyle: 'bold', halign: 'center' },
    bodyStyles: { fontSize: 7.5, textColor: NEGRO, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 36 },
      2: { halign: 'right', cellWidth: 44 },
      3: { halign: 'right', cellWidth: 22 }
    },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 5;
  
  // Totales
  const totalPagado = montoIni + (tPA + tEA) + montoEntr;
  
  doc.autoTable({
    startY: y,
    body: [
      ['Inicial (Reserva + Separación)', fmtU(montoIni), fmtP(pctInicial)],
      ['Plan de Pago durante obra', fmtU(tPA + tEA), fmtP(pctPlan)],
      ['Saldo contra entrega', fmtU(montoEntr), fmtP(pctEntrega)],
      ['TOTAL GENERAL', fmtU(totalPagado), '100%']
    ],
    theme: 'plain',
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 44 },
      2: { halign: 'right', cellWidth: 22 }
    },
    didParseCell: d => {
      if (d.row.index === 3) {
        d.cell.styles.fillColor = AZUL;
        d.cell.styles.textColor = BLANCO;
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.fontSize = 8;
      }
    },
    margin: { left: margin, right: margin }
  });
  
  y = doc.lastAutoTable.finalY + 10;
  
  // Firmas
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  
  doc.setDrawColor(200, 210, 220);
  doc.line(margin, y + 10, margin + 68, y + 10);
  doc.line(W / 2, y + 10, W / 2 + 68, y + 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Elaborado por: Victor Andujar / Juan Jose Abreu', margin, y + 15);
  doc.text('Firma del Cliente', W / 2 + 34, y + 15, { align: 'center' });
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('MrHome · Plan de Pagos Oficial · Generado el ' + new Date().toLocaleDateString('es-DO'), W / 2, 290, { align: 'center' });
  
  const cli = (cliente || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const pro = (proyecto || 'Proyecto').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  const esc = pctInicial.toFixed(0) + '-' + pctPlan.toFixed(0) + '-' + pctEntrega.toFixed(0);
  
  doc.save(`Mrhome_Plan_${cli}_${pro}_${metodo}_${esc}.pdf`);
  showToast('PDF generado exitosamente', 'success');
}
