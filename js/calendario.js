/* ════════════════════════════════════════════════════════════════
   J&V Tools — Calendario de Pagos
   Genera archivo .ics importable a Google Calendar / Apple / Outlook
   ════════════════════════════════════════════════════════════════ */

let _calCotizaciones = [];
let _calSelectedId = null;

async function cal_loadCotizaciones() {
  if (typeof DB === 'undefined') return [];
  try {
    _calCotizaciones = await DB.getAll('cotizaciones');
    _calCotizaciones.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    return _calCotizaciones;
  } catch (e) {
    return [];
  }
}

async function cal_render() {
  const cont = document.getElementById('cal-cotizaciones');
  if (!cont) return;

  await cal_loadCotizaciones();

  if (_calCotizaciones.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-title">Aún no hay cotizaciones</div>
        <div class="empty-state-desc">Crea y guarda una cotización en el Plan de Pago para exportarla aquí</div>
      </div>`;
    return;
  }

  cont.innerHTML = _calCotizaciones.map(c => `
    <div class="history-item" onclick="cal_seleccionar(${c.id})" style="cursor:pointer ${_calSelectedId === c.id ? 'border-color:var(--celeste);box-shadow:var(--shadow-glow)' : ''}">
      <div class="history-item-avatar">${getIniciales(c.cliente)}</div>
      <div class="history-item-content">
        <div class="history-item-name">${escapeHtml(c.cliente)}</div>
        <div class="history-item-meta">${escapeHtml(c.proyecto)} · ${escapeHtml(c.unidad || '')}</div>
      </div>
      <div class="history-item-amount">
        <div class="amt">${fmtUSDInt(c.precio || 0)}</div>
        <div class="date">${c.fechaEntrega ? 'Entrega ' + fmtFechaCorta(c.fechaEntrega) : '—'}</div>
      </div>
    </div>
  `).join('');
}

function cal_seleccionar(id) {
  _calSelectedId = id;
  cal_render();
  const cot = _calCotizaciones.find(c => c.id === id);
  cal_mostrarPreview(cot);
}

function cal_generarCuotasParaCot(cot) {
  if (!cot.fechaFirma || !cot.fechaEntrega) return [];
  const fFirma = new Date(cot.fechaFirma + 'T12:00:00');
  const fEntr = new Date(cot.fechaEntrega + 'T12:00:00');
  const mesesPer = cot.metodo === 'Trimestral' ? 3 : 1;
  const primera = addMeses(fFirma, mesesPer);
  const limite = addMeses(fEntr, -1);

  const fechas = [];
  let i = 0;
  while (true) {
    const d = addMeses(primera, i * mesesPer);
    if (d > limite) break;
    fechas.push(d);
    i++;
  }
  if (fechas.length === 0) fechas.push(new Date(limite));

  // Calcular monto por cuota
  const montoPlan = (cot.precio || 0) * (cot.pctPlan || 0) / 100;

  // Sumar extras
  const extrasMap = new Map();
  if (cot.homMonto > 0 && cot.homCuotas) {
    cot.homCuotas.split(',').forEach(s => {
      const c = parseInt(s.trim());
      if (!isNaN(c)) extrasMap.set(c, (extrasMap.get(c) || 0) + cot.homMonto);
    });
  }
  if (cot.extras) {
    cot.extras.forEach(e => {
      if (e.cuota > 0 && e.monto > 0) {
        extrasMap.set(e.cuota, (extrasMap.get(e.cuota) || 0) + e.monto);
      }
    });
  }
  const totalExtras = Array.from(extrasMap.values()).reduce((a, b) => a + b, 0);
  const cuotaRegular = fechas.length > 0 ? (montoPlan - totalExtras) / fechas.length : 0;

  return fechas.map((fecha, idx) => {
    const extra = extrasMap.get(idx + 1) || 0;
    return {
      num: idx + 1,
      fecha,
      monto: cuotaRegular + extra,
      base: cuotaRegular,
      extra
    };
  });
}

function cal_mostrarPreview(cot) {
  const cont = document.getElementById('cal-preview');
  if (!cont || !cot) {
    cont.innerHTML = '';
    return;
  }

  const cuotas = cal_generarCuotasParaCot(cot);
  const reservaEvent = cot.fechaInicio
    ? { num: 'R', fecha: new Date(cot.fechaInicio + 'T12:00:00'), monto: cot.reservaFija || 0, tipo: 'Reserva' }
    : null;
  const firmaEvent = cot.fechaFirma
    ? { num: 'S', fecha: new Date(cot.fechaFirma + 'T12:00:00'), monto: (cot.precio * cot.pctInicial / 100) - (cot.reservaFija || 0), tipo: 'Separación' }
    : null;
  const entregaEvent = cot.fechaEntrega
    ? { num: 'E', fecha: new Date(cot.fechaEntrega + 'T12:00:00'), monto: cot.precio * cot.pctEntrega / 100, tipo: 'Contra Entrega' }
    : null;

  const allEvents = [reservaEvent, firmaEvent, ...cuotas.map(c => ({ ...c, tipo: 'Cuota' })), entregaEvent].filter(Boolean);

  cont.innerHTML = `
    <div class="card">
      <div class="card-title">📅 Vista previa · ${escapeHtml(cot.cliente)}</div>
      <div class="action-bar" style="justify-content:flex-start">
        <button class="btn btn-celeste" onclick="cal_descargarICS(${cot.id})">📥 Descargar .ics (Google/Apple)</button>
        <button class="btn btn-outline" onclick="cal_compartirWhatsapp(${cot.id})">💬 WhatsApp</button>
      </div>
      <div class="table-wrap" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Monto USD</th>
            </tr>
          </thead>
          <tbody>
            ${allEvents.map(ev => `
              <tr>
                <td><strong>${ev.num}</strong></td>
                <td>${fmtFecha(ev.fecha)}</td>
                <td><span class="tag t-${ev.tipo === 'Cuota' ? 'blue' : ev.tipo === 'Reserva' ? 'gold' : ev.tipo === 'Separación' ? 'green' : 'partial'}">${ev.tipo}</span></td>
                <td><strong>${fmtUSDInt(ev.monto)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="footnote" style="margin-top:14px">
        📌 Al descargar el archivo .ics, ábrelo desde Google Calendar (web), Calendar de Apple o Outlook para importar todos los eventos automáticamente.
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════════
//  GENERADOR DE ARCHIVO .ICS
// ════════════════════════════════════════════════════════════════
function cal_formatICSDate(date) {
  // Formato: YYYYMMDD (sin hora, evento de día completo)
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function cal_formatICSDateTime(date) {
  // Formato: YYYYMMDDTHHMMSSZ
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function cal_escaparTexto(s) {
  if (!s) return '';
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function cal_generarICS(cot) {
  const cuotas = cal_generarCuotasParaCot(cot);
  const events = [];

  const tc = cot.tasaCambio || 60.75;
  const cliente = cot.cliente || 'Cliente';
  const proyecto = cot.proyecto || '';
  const unidad = cot.unidad ? ' · ' + cot.unidad : '';
  const ahora = cal_formatICSDateTime(new Date());

  // Reserva
  if (cot.fechaInicio && cot.reservaFija) {
    events.push({
      uid: `jvtools-${cot.id}-reserva@mrhome.do`,
      date: new Date(cot.fechaInicio + 'T12:00:00'),
      title: `🟡 Reserva · ${cliente}${unidad}`,
      desc: `Pago de Reserva\\nProyecto: ${proyecto}${unidad}\\nMonto: ${fmtUSDInt(cot.reservaFija)} (${fmtRD(cot.reservaFija * tc)})\\n\\n${APP_CONFIG.team || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home'}`
    });
  }

  // Separación
  if (cot.fechaFirma) {
    const sep = (cot.precio * cot.pctInicial / 100) - (cot.reservaFija || 0);
    if (sep > 0) {
      events.push({
        uid: `jvtools-${cot.id}-separacion@mrhome.do`,
        date: new Date(cot.fechaFirma + 'T12:00:00'),
        title: `🟢 Separación · ${cliente}${unidad}`,
        desc: `Firma de contrato + pago Separación\\nProyecto: ${proyecto}${unidad}\\nMonto: ${fmtUSDInt(sep)} (${fmtRD(sep * tc)})\\n\\n${APP_CONFIG.team || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home'}`
      });
    }
  }

  // Cuotas
  cuotas.forEach(c => {
    events.push({
      uid: `jvtools-${cot.id}-cuota${c.num}@mrhome.do`,
      date: c.fecha,
      title: `🔵 Cuota ${c.num} · ${cliente}${unidad}`,
      desc: `Cuota N° ${c.num} de ${cuotas.length}\\nProyecto: ${proyecto}${unidad}\\nMonto: ${fmtUSDInt(c.monto)} (${fmtRD(c.monto * tc)})${c.extra > 0 ? '\\nIncluye pago extraordinario: ' + fmtUSDInt(c.extra) : ''}\\n\\n${APP_CONFIG.team || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home'}`
    });
  });

  // Contra entrega
  if (cot.fechaEntrega) {
    const entr = cot.precio * cot.pctEntrega / 100;
    events.push({
      uid: `jvtools-${cot.id}-entrega@mrhome.do`,
      date: new Date(cot.fechaEntrega + 'T12:00:00'),
      title: `🏠 Contra Entrega · ${cliente}${unidad}`,
      desc: `Pago Contra Entrega + Cierre con Banco\\nProyecto: ${proyecto}${unidad}\\nMonto: ${fmtUSDInt(entr)} (${fmtRD(entr * tc)})\\n\\n${APP_CONFIG.team || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home'}`
    });
  }

  // Construir VCALENDAR
  let ics = 'BEGIN:VCALENDAR\r\n';
  ics += 'VERSION:2.0\r\n';
  ics += 'PRODID:-//MR. Home//J&V Tools v' + APP_VERSION + '//ES\r\n';
  ics += 'CALSCALE:GREGORIAN\r\n';
  ics += 'METHOD:PUBLISH\r\n';
  ics += `X-WR-CALNAME:Plan de Pago - ${cal_escaparTexto(cliente)}\r\n`;
  ics += `X-WR-TIMEZONE:America/Santo_Domingo\r\n`;

  events.forEach(ev => {
    const dStart = cal_formatICSDate(ev.date);
    const dEnd = cal_formatICSDate(new Date(ev.date.getTime() + 24 * 60 * 60 * 1000));

    ics += 'BEGIN:VEVENT\r\n';
    ics += `UID:${ev.uid}\r\n`;
    ics += `DTSTAMP:${ahora}\r\n`;
    ics += `DTSTART;VALUE=DATE:${dStart}\r\n`;
    ics += `DTEND;VALUE=DATE:${dEnd}\r\n`;
    ics += `SUMMARY:${cal_escaparTexto(ev.title)}\r\n`;
    ics += `DESCRIPTION:${cal_escaparTexto(ev.desc)}\r\n`;
    ics += 'BEGIN:VALARM\r\n';
    ics += 'TRIGGER:-P3D\r\n';
    ics += 'ACTION:DISPLAY\r\n';
    ics += `DESCRIPTION:Recordatorio: ${cal_escaparTexto(ev.title)}\r\n`;
    ics += 'END:VALARM\r\n';
    ics += 'END:VEVENT\r\n';
  });

  ics += 'END:VCALENDAR\r\n';
  return ics;
}

async function cal_descargarICS(id) {
  const cot = _calCotizaciones.find(c => c.id === id) || await DB.get('cotizaciones', id);
  if (!cot) return toast('No encontrada', 'error');

  const ics = cal_generarICS(cot);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plan_${cot.cliente.replace(/[^a-z0-9]/gi, '_')}_${cot.proyecto.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Calendario descargado · Ábrelo para importar', 'success', 4500);
}

async function cal_compartirWhatsapp(id) {
  const cot = _calCotizaciones.find(c => c.id === id) || await DB.get('cotizaciones', id);
  if (!cot) return;

  const cuotas = cal_generarCuotasParaCot(cot);
  let msg = `🏠 *Plan de Pago - ${cot.cliente}*\n`;
  msg += `📍 ${cot.proyecto}${cot.unidad ? ' · ' + cot.unidad : ''}\n`;
  msg += `💰 ${fmtUSDInt(cot.precio)}\n\n`;
  msg += `📅 *Cronograma:*\n`;

  if (cot.fechaInicio) msg += `🟡 Reserva · ${fmtFechaCorta(cot.fechaInicio)} · ${fmtUSDInt(cot.reservaFija || 0)}\n`;
  if (cot.fechaFirma) {
    const sep = (cot.precio * cot.pctInicial / 100) - (cot.reservaFija || 0);
    if (sep > 0) msg += `🟢 Separación · ${fmtFechaCorta(cot.fechaFirma)} · ${fmtUSDInt(sep)}\n`;
  }
  cuotas.slice(0, 6).forEach(c => {
    msg += `🔵 Cuota ${c.num} · ${fmtFechaCorta(c.fecha)} · ${fmtUSDInt(c.monto)}\n`;
  });
  if (cuotas.length > 6) msg += `... +${cuotas.length - 6} cuotas más\n`;
  if (cot.fechaEntrega) {
    msg += `🏠 Contra Entrega · ${fmtFechaCorta(cot.fechaEntrega)} · ${fmtUSDInt(cot.precio * cot.pctEntrega / 100)}\n`;
  }

  msg += `\n_${APP_CONFIG.asesorNombre || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home Asesores'}_`;

  const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

function initCalendario() {
  cal_render();
}
