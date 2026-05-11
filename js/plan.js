/* ════════════════════════════════════════════════════════════════
   J&V Tools — Plan de Pago
   Cronograma completo de pagos para clientes
   ════════════════════════════════════════════════════════════════ */

let metodo = 'Mensual';
let fechaCuota1Override = null;

function setMetodo(m) {
  metodo = m;
  fechaCuota1Override = null;
  document.getElementById('btn-m').classList.toggle('active', m === 'Mensual');
  document.getElementById('btn-t').classList.toggle('active', m === 'Trimestral');
  recalcularCuotas();
}

function cambiarFechaCuota1(dateStr) {
  fechaCuota1Override = dateStr ? new Date(dateStr + 'T12:00:00') : null;
  recalcular();
}

function activarEditFecha(el, isoDate) {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = isoDate;
  input.style.cssText = 'border:1.5px solid var(--celeste);border-radius:6px;font-size:12px;padding:4px 8px;color:var(--navy);background:#eff6ff;outline:none;font-family:inherit;font-weight:600';
  input.onchange = e => cambiarFechaCuota1(e.target.value);
  input.onblur = () => recalcular();
  el.replaceWith(input);
  input.focus();
  try { if (input.showPicker) input.showPicker(); } catch (e) {}
}

function getExtrasForCuota(extrasMap, cuotaIdx, metodoPago) {
  if (metodoPago === 'Mensual') {
    return extrasMap.get(cuotaIdx + 1) || 0;
  } else {
    const targetMonth = (cuotaIdx + 1) * 3;
    return extrasMap.get(targetMonth) || 0;
  }
}

function aplicarPreset(ini, plan, btn) {
  document.getElementById('pctInicial').value = ini;
  document.getElementById('pctPlan').value = plan;
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  onPctChange();
}

function onPctChange() {
  const ini = parseFloat(document.getElementById('pctInicial').value) || 0;
  const plan = parseFloat(document.getElementById('pctPlan').value) || 0;
  const entr = Math.max(0, 100 - ini - plan);
  document.getElementById('pctEntrega').value = entr.toFixed(2);
  recalcular();
}

// ════════════════════════════════════════════════════════════════
//  PAGOS EXTRAORDINARIOS
// ════════════════════════════════════════════════════════════════
function agregarPagoExtra(cuotaN, montoV) {
  const lista = document.getElementById('lista-extras');
  document.getElementById('extras-empty').style.display = 'none';

  const row = document.createElement('div');
  row.className = 'extra-row';
  row.innerHTML = `
    <div class="er-cuota">
      <span>Cuota N°</span>
      <input type="number" class="extra-cuota" min="1" step="1" placeholder="—"
        value="${cuotaN || ''}" oninput="recalcular()" style="width:56px;text-align:center">
    </div>
    <div class="pw">
      <span class="pfx">$</span>
      <input type="number" class="extra-monto" min="0" step="100" placeholder="0"
        value="${montoV || ''}" oninput="recalcular()">
    </div>
    <button class="btn-del-extra" onclick="eliminarExtra(this)" title="Eliminar">×</button>`;
  lista.appendChild(row);
  recalcular();
}

function eliminarExtra(btn) {
  btn.closest('.extra-row').remove();
  const lista = document.getElementById('lista-extras');
  if (!lista.querySelector('.extra-row')) {
    document.getElementById('extras-empty').style.display = 'block';
  }
  recalcular();
}

function leerExtras() {
  const map = new Map();

  // Pagos homogéneos
  const homMontoRaw = (document.getElementById('extra-hom-monto').value || '0').replace(/,/g, '');
  const homMonto = parseFloat(homMontoRaw) || 0;
  const homCuotasStr = document.getElementById('extra-hom-cuotas').value || '';
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

  const homSumEl = document.getElementById('hom-summary');
  if (homSumEl) {
    if (homMonto > 0 && homCuotasArr.length > 0) {
      homSumEl.innerHTML = `<div style="margin-top:8px;font-size:12px;color:#0369A1;font-weight:500">✅ ${homCuotasArr.length} cuota(s): ${homCuotasArr.sort((a, b) => a - b).join(', ')} · ${fmtUSD(homMonto)} c/u · <strong>Total: ${fmtUSD(homMonto * homCuotasArr.length)}</strong></div>`;
    } else {
      homSumEl.innerHTML = '';
    }
  }

  // Pagos no homogéneos
  document.querySelectorAll('.extra-row').forEach(row => {
    const c = parseInt(row.querySelector('.extra-cuota').value);
    const m = parseFloat(row.querySelector('.extra-monto').value) || 0;
    if (!isNaN(c) && c >= 1 && m > 0) map.set(c, (map.get(c) || 0) + m);
  });

  return map;
}

function usarExcedente(monto) {
  agregarPagoExtra(1, monto.toFixed(2));
}

// ════════════════════════════════════════════════════════════════
//  GENERACIÓN DE CUOTAS
// ════════════════════════════════════════════════════════════════
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

function generarCuotas(firmaDate, entregaDate, modoMetodo) {
  const mesesPer = modoMetodo === 'Mensual' ? 1 : 3;
  const primeraCuota = fechaCuota1Override
    ? new Date(fechaCuota1Override)
    : addMeses(firmaDate, mesesPer);
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
  const firmaStr = document.getElementById('fechaFirma').value;
  const entregaStr = document.getElementById('fechaEntrega').value;
  if (!firmaStr || !entregaStr) {
    document.getElementById('cantCuotas').value = 0;
    recalcular();
    return;
  }
  const { n } = generarCuotas(
    new Date(firmaStr + 'T12:00:00'),
    new Date(entregaStr + 'T12:00:00'),
    metodo
  );
  document.getElementById('cantCuotas').value = n;
  recalcular();
}

// ════════════════════════════════════════════════════════════════
//  TASA DE CAMBIO (live)
// ════════════════════════════════════════════════════════════════
async function fetchTasaCambio() {
  const badge = document.getElementById('tasa-badge');
  const fuente = document.getElementById('tasa-fuente');
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
    } catch (e) {
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
    document.getElementById('tasaCambio').value = tasa.toFixed(2);
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
  } catch (e) {}
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

// ════════════════════════════════════════════════════════════════
//  RECALCULAR (motor principal)
// ════════════════════════════════════════════════════════════════
function recalcular() {
  const precio = getN('precioUSD');
  const tasa = parseFloat(document.getElementById('tasaCambio').value) || 60.75;
  const reserva = parseFloat(document.getElementById('reservaFija').value) || 0;
  const pctInicial = parseFloat(document.getElementById('pctInicial').value) || 0;
  const pctPlan = parseFloat(document.getElementById('pctPlan').value) || 0;
  const pctEntr = parseFloat(document.getElementById('pctEntrega').value) || 0;
  const cuotas = parseInt(document.getElementById('cantCuotas').value) || 0;
  const tasaB = parseFloat(document.getElementById('tasaBanco').value) || 14.6;
  const anosB = parseInt(document.getElementById('anosBanco').value) || 20;
  const flujoM = getN('flujoMensual');
  const dineroM = getN('dineroMano');
  const inm = parseFloat(document.getElementById('inmueble').value) || 0;
  const fechaIStr = document.getElementById('fechaInicio').value;
  const fechaFStr = document.getElementById('fechaFirma').value;
  const fechaEStr = document.getElementById('fechaEntrega').value;

  const fechaBase = fechaIStr ? new Date(fechaIStr + 'T12:00:00') : new Date();
  const fechaFirma = fechaFStr ? new Date(fechaFStr + 'T12:00:00') : addMeses(fechaBase, 1);
  const fechaEntrega = fechaEStr ? new Date(fechaEStr + 'T12:00:00') : null;

  const resPct = precio > 0 ? reserva / precio * 100 : 0;
  const montoSep = Math.max(0, precio * pctInicial / 100 - reserva);
  const montoPlan = precio * pctPlan / 100;
  const montoEntr = precio * pctEntr / 100;
  const montoIni = reserva + montoSep;

  const totalPct = pctInicial + pctPlan + pctEntr;
  const diffPct = Math.abs(100 - totalPct);
  const badge = document.getElementById('pct-total');
  badge.textContent = totalPct.toFixed(2) + '%';
  badge.className = 'pct-badge ' + (diffPct < 0.05 ? 'ok' : 'err');
  document.getElementById('alert-pct').style.display = diffPct >= 0.05 ? 'flex' : 'none';

  document.getElementById('lbl-res-pct').textContent = resPct.toFixed(2) + '% del precio';
  document.getElementById('lbl-sep-usd').textContent = fmtUSD(montoSep);
  document.getElementById('lbl-plan-usd').textContent = fmtUSD(montoPlan);
  document.getElementById('lbl-entr-usd').textContent = fmtUSD(montoEntr);

  let cuotaInfo = { fechas: [], n: cuotas, ultimaEsPartial: false, mesesPartial: 0 };
  if (fechaFirma && fechaEntrega) {
    cuotaInfo = generarCuotas(fechaFirma, fechaEntrega, metodo);
  }
  const { fechas: cuotaFechas, ultimaEsPartial, mesesPartial } = cuotaInfo;
  const nCuotas = cuotaFechas.length || cuotas;

  const extrasMap = leerExtras();
  const totalExtras = Array.from(extrasMap.values()).reduce((a, b) => a + b, 0);
  const montoBase = Math.max(0, montoPlan - totalExtras);
  const { regularAmt, lastAmt } = calcularMontos(nCuotas, ultimaEsPartial, mesesPartial, montoBase);

  const excedente = dineroM - reserva - montoSep;
  const exEl = document.getElementById('excedente-box');
  if (dineroM > 0 || reserva > 0) {
    exEl.style.display = 'flex';
    if (excedente > 0) {
      exEl.className = 'excedente-box positivo';
      exEl.innerHTML = `💰 <span>Excedente disponible: <strong>${fmtUSD(excedente)}</strong> <span style="font-weight:400">(Dinero en mano − Reserva − Separación)</span></span>
        <button class="btn-usar-excedente" onclick="usarExcedente(${excedente.toFixed(2)})">Agregar como pago extra</button>`;
    } else if (excedente < 0) {
      exEl.className = 'excedente-box negativo';
      exEl.innerHTML = `⚠️ <span>Capital insuficiente: faltan <strong>${fmtUSD(-excedente)}</strong> para cubrir Reserva + Separación</span>`;
    } else {
      exEl.className = 'excedente-box neutro';
      exEl.innerHTML = `✔️ <span>Capital en mano cubre exactamente Reserva + Separación</span>`;
    }
  } else {
    exEl.style.display = 'none';
  }

  const sumEl = document.getElementById('extras-summary');
  if (extrasMap.size > 0) {
    const cuotaOriginal = nCuotas > 0 ? montoPlan / nCuotas : 0;
    sumEl.innerHTML = `<div style="margin-top:10px;padding:10px;background:#F8FAFC;border-radius:8px;font-size:12px;line-height:1.6">
      <span style="color:var(--info);font-weight:600">${extrasMap.size} cuota(s) con pago extra · Total extras: ${fmtUSD(totalExtras)}</span>
      → Cuota regular: <strong style="color:var(--success)">${fmtUSD(regularAmt)}</strong>
      <span style="color:var(--gray-400)">(sin extras sería ${fmtUSD(cuotaOriginal)})</span>
    </div>`;
  } else {
    sumEl.innerHTML = '';
  }

  // Cards resumen
  setText('sv-ini', fmtUSD(montoIni));
  setText('ss-ini', fmtRD(montoIni * tasa));
  setText('lbl-cuota-tipo', 'Cuota ' + metodo);
  setText('sv-cuota', fmtUSD(regularAmt));
  setText('ss-cuota', fmtRD(regularAmt * tasa) + ' / ' + metodo.toLowerCase());
  setText('sv-obra', fmtUSD(montoPlan));
  setText('ss-obra', fmtRD(montoPlan * tasa));
  setText('sv-entr', fmtUSD(montoEntr));
  setText('ss-entr', fmtRD(montoEntr * tasa));

  // Banco
  const cb = calcCuotaHipoteca(montoEntr, tasaB, anosB);
  setText('bv-usd', fmtUSD(cb));
  setText('bv-rd', fmtRD(cb * tasa));
  setText('bs-info', `Capital: ${fmtUSD(montoEntr)} · ${tasaB}% · ${anosB} años`);

  // Capacidad
  const capIni = dineroM + inm;
  const capWrap = document.getElementById('cap-wrap');
  if (capWrap) {
    capWrap.innerHTML = `
      <div class="cap-item"><div class="cl">Capacidad Inicial</div>
        <div class="cv" style="color:${capIni >= montoIni ? 'var(--success)' : 'var(--danger)'}">${fmtUSD(capIni)}</div>
        <div class="cs">Dinero + Inmueble propio (USD$)</div></div>
      <div class="cap-item"><div class="cl">Flujo Mensual</div>
        <div class="cv" style="color:${flujoM >= regularAmt ? 'var(--success)' : 'var(--danger)'}">${fmtUSD(flujoM)}</div>
        <div class="cs">vs. cuota ${fmtUSD(regularAmt)}</div></div>`;
  }

  // Tabla de cuotas
  generarTablaCuotas({
    cuotaFechas, fechaFirma, ultimaEsPartial, mesesPartial,
    precio, reserva, montoSep, montoEntr, regularAmt, lastAmt,
    extrasMap, tasa, fechaEStr
  });
}

function generarTablaCuotas(p) {
  const tbody = document.getElementById('tabla-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!p.fechaEStr) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--gray-400)">Ingrese la fecha de entrega para generar el cronograma</td></tr>';
    return;
  }

  let saldo = p.precio, acum = 0, num = 0;

  // Sección INICIAL
  const trSec1 = document.createElement('tr');
  trSec1.className = 'tr-section';
  trSec1.innerHTML = '<td colspan="9">💰 Inicial</td>';
  tbody.appendChild(trSec1);

  // Reserva
  num++;
  acum += p.reserva;
  saldo -= p.reserva;
  const trRes = document.createElement('tr');
  trRes.innerHTML = `<td>${num}</td><td>${fmtFecha(p.fechaFirma)}</td><td><span class="tag t-gold">Reserva</span></td>
    <td>${fmtUSD(p.reserva)}</td><td>—</td><td>${fmtUSD(p.reserva)}</td><td>${fmtRD(p.reserva * p.tasa)}</td>
    <td>${(acum / p.precio * 100).toFixed(2)}%</td><td>${fmtUSD(saldo)}</td>`;
  tbody.appendChild(trRes);

  // Separación
  if (p.montoSep > 0) {
    num++;
    acum += p.montoSep;
    saldo -= p.montoSep;
    const trSep = document.createElement('tr');
    trSep.innerHTML = `<td>${num}</td><td>${fmtFecha(p.fechaFirma)}</td><td><span class="tag t-blue">Separación</span></td>
      <td>${fmtUSD(p.montoSep)}</td><td>—</td><td>${fmtUSD(p.montoSep)}</td><td>${fmtRD(p.montoSep * p.tasa)}</td>
      <td>${(acum / p.precio * 100).toFixed(2)}%</td><td>${fmtUSD(saldo)}</td>`;
    tbody.appendChild(trSep);
  }

  // Sección PLAN
  if (p.cuotaFechas.length > 0) {
    const trSec2 = document.createElement('tr');
    trSec2.className = 'tr-section';
    trSec2.innerHTML = `<td colspan="9">🏗️ Plan de Pago — ${p.cuotaFechas.length} cuotas ${metodo.toLowerCase()}es</td>`;
    tbody.appendChild(trSec2);

    p.cuotaFechas.forEach((fecha, idx) => {
      num++;
      const isLast = idx === p.cuotaFechas.length - 1;
      const baseAmt = (isLast && p.ultimaEsPartial) ? p.lastAmt : p.regularAmt;
      const extra = getExtrasForCuota(p.extrasMap, idx, metodo);
      const total = baseAmt + extra;
      acum += total;
      saldo -= total;

      const tag = extra > 0
        ? '<span class="tag t-extra">+ Extra</span>'
        : (isLast && p.ultimaEsPartial ? '<span class="tag t-partial">Parcial</span>' : `<span class="tag t-blue">Cuota ${idx + 1}</span>`);

      const fechaCell = idx === 0
        ? `<span style="cursor:pointer;text-decoration:underline dotted;color:var(--celeste)" onclick="activarEditFecha(this,'${fecha.toISOString().split('T')[0]}')">${fmtFecha(fecha)}</span>`
        : fmtFecha(fecha);

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${num}</td><td>${fechaCell}</td><td>${tag}</td>
        <td>${fmtUSD(baseAmt)}</td><td>${extra > 0 ? fmtUSD(extra) : '—'}</td>
        <td><strong>${fmtUSD(total)}</strong></td><td>${fmtRD(total * p.tasa)}</td>
        <td>${(acum / p.precio * 100).toFixed(2)}%</td><td>${fmtUSD(Math.max(saldo, 0))}</td>`;
      tbody.appendChild(tr);
    });
  }

  // CONTRA ENTREGA
  if (p.montoEntr > 0) {
    num++;
    const trEntr = document.createElement('tr');
    trEntr.className = 'tr-entrega';
    trEntr.innerHTML = `<td>${num}</td><td>—</td><td><span class="tag t-gold">Contra Entrega</span></td>
      <td>${fmtUSD(p.montoEntr)}</td><td>—</td><td><strong>${fmtUSD(p.montoEntr)}</strong></td>
      <td>${fmtRD(p.montoEntr * p.tasa)}</td><td>100.00%</td><td>$0</td>`;
    tbody.appendChild(trEntr);
  }

  // TOTAL
  const trTotal = document.createElement('tr');
  trTotal.className = 'tr-total';
  trTotal.innerHTML = `<td colspan="3">TOTAL</td>
    <td colspan="2">—</td><td>${fmtUSD(p.precio)}</td><td>${fmtRD(p.precio * p.tasa)}</td>
    <td>100%</td><td>$0</td>`;
  tbody.appendChild(trTotal);
}

// ════════════════════════════════════════════════════════════════
//  GUARDAR EN HISTORIAL
// ════════════════════════════════════════════════════════════════
async function guardarCotizacion() {
  if (typeof DB === 'undefined') {
    return toast('Base de datos no disponible', 'error');
  }

  const cliente = document.getElementById('cliente').value.trim();
  if (!cliente) {
    toast('Ingrese el nombre del cliente', 'warning');
    document.getElementById('cliente').focus();
    return;
  }

  const cot = {
    cliente,
    proyecto: document.getElementById('proyecto').value.trim() || 'Sin proyecto',
    unidad: document.getElementById('unidad').value.trim(),
    nacionalidad: document.getElementById('nacionalidad').value,
    flujoMensual: getN('flujoMensual'),
    dineroMano: getN('dineroMano'),
    inmueble: parseFloat(document.getElementById('inmueble').value) || 0,
    precio: getN('precioUSD'),
    tasaCambio: parseFloat(document.getElementById('tasaCambio').value) || 60.75,
    fechaInicio: document.getElementById('fechaInicio').value,
    fechaFirma: document.getElementById('fechaFirma').value,
    fechaEntrega: document.getElementById('fechaEntrega').value,
    notas: document.getElementById('notas').value,
    reservaFija: parseFloat(document.getElementById('reservaFija').value) || 0,
    pctInicial: parseFloat(document.getElementById('pctInicial').value) || 0,
    pctPlan: parseFloat(document.getElementById('pctPlan').value) || 0,
    pctEntrega: parseFloat(document.getElementById('pctEntrega').value) || 0,
    metodo,
    tasaBanco: parseFloat(document.getElementById('tasaBanco').value) || 14.6,
    anosBanco: parseInt(document.getElementById('anosBanco').value) || 20,
    homMonto: getN('extra-hom-monto'),
    homCuotas: document.getElementById('extra-hom-cuotas').value,
    extras: Array.from(document.querySelectorAll('.extra-row')).map(r => ({
      cuota: parseInt(r.querySelector('.extra-cuota').value) || 0,
      monto: parseFloat(r.querySelector('.extra-monto').value) || 0
    })).filter(e => e.cuota > 0 && e.monto > 0)
  };

  // Si ya tenía ID (estaba editando), conservarlo
  if (window._cotizacionEditId) {
    cot.id = window._cotizacionEditId;
  }

  try {
    const id = await DB.put('cotizaciones', cot);
    window._cotizacionEditId = id;
    toast('Cotización guardada ✓', 'success');
  } catch (e) {
    console.error(e);
    toast('Error al guardar', 'error');
  }
}

function cargarCotizacion(cot) {
  window._cotizacionEditId = cot.id;

  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el && v != null) el.value = v;
  };

  setVal('cliente', cot.cliente);
  setVal('proyecto', cot.proyecto);
  setVal('unidad', cot.unidad);
  setVal('nacionalidad', cot.nacionalidad);
  setVal('flujoMensual', cot.flujoMensual ? cot.flujoMensual.toLocaleString('en-US') : '');
  setVal('dineroMano', cot.dineroMano ? cot.dineroMano.toLocaleString('en-US') : '');
  setVal('inmueble', cot.inmueble);
  setVal('precioUSD', cot.precio ? cot.precio.toLocaleString('en-US') : '');
  setVal('tasaCambio', cot.tasaCambio);
  setVal('fechaInicio', cot.fechaInicio);
  setVal('fechaFirma', cot.fechaFirma);
  setVal('fechaEntrega', cot.fechaEntrega);
  setVal('notas', cot.notas);
  setVal('reservaFija', cot.reservaFija);
  setVal('pctInicial', cot.pctInicial);
  setVal('pctPlan', cot.pctPlan);
  setVal('pctEntrega', cot.pctEntrega);
  setVal('tasaBanco', cot.tasaBanco);
  setVal('anosBanco', cot.anosBanco);
  setVal('extra-hom-monto', cot.homMonto ? cot.homMonto.toLocaleString('en-US') : '');
  setVal('extra-hom-cuotas', cot.homCuotas);

  if (cot.metodo) setMetodo(cot.metodo);

  // Limpiar extras existentes
  document.getElementById('lista-extras').innerHTML = '';
  document.getElementById('extras-empty').style.display = 'block';

  // Cargar extras
  if (cot.extras && cot.extras.length) {
    cot.extras.forEach(e => agregarPagoExtra(e.cuota, e.monto));
  }

  showScreen('plan');
  recalcularCuotas();
  toast('Cotización cargada', 'success');
}

function nuevaCotizacion() {
  window._cotizacionEditId = null;
  // Limpiar todos los campos
  ['cliente', 'proyecto', 'unidad', 'flujoMensual', 'dineroMano', 'inmueble',
   'precioUSD', 'fechaInicio', 'fechaFirma', 'fechaEntrega', 'notas',
   'extra-hom-monto', 'extra-hom-cuotas'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('lista-extras').innerHTML = '';
  document.getElementById('extras-empty').style.display = 'block';
  document.getElementById('reservaFija').value = '5000';
  aplicarPreset(10, 35, null);
  recalcular();
  toast('Nueva cotización', 'success');
}

// ════════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════════
function initPlan() {
  // Setear fecha de hoy en fecha de reserva
  const hoy = new Date().toISOString().split('T')[0];
  const fInicio = document.getElementById('fechaInicio');
  if (fInicio && !fInicio.value) {
    fInicio.value = hoy;
    const fFirma = document.getElementById('fechaFirma');
    if (fFirma && !fFirma.value) fFirma.value = firmaDefault(hoy);
  }
  recalcular();
}
