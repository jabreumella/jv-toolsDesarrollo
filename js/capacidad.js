/* ════════════════════════════════════════════════════════════════
   J&V Tools — Capacidad de Pago
   Evalúa la capacidad financiera del cliente
   ════════════════════════════════════════════════════════════════ */

let _capActiveCell = null;

function cap_calcular() {
  const flujo = getN('cap-flujo');
  const dinero = getN('cap-dinero');
  const inmueble = getN('cap-inmueble');
  const otros = getN('cap-otros');

  const capInicial = dinero + inmueble + otros;
  const flujoMensual = flujo;

  // Capacidades a 12, 24, 36, 48 meses (al 50%, 40%, 30% de comprometimiento)
  const periodos = [12, 24, 36, 48];
  const ratios = { 50: 0.5, 40: 0.4, 30: 0.3 };

  // Tabla
  const tbody = document.getElementById('cap-tabla-body');
  if (tbody) {
    tbody.innerHTML = '';
    Object.entries(ratios).forEach(([pct, r]) => {
      const tr = document.createElement('tr');
      const cuotaMax = flujo * r;
      let row = `<td><strong>Al ${pct}%</strong> del flujo<br><span style="font-size:11px;color:var(--gray-500)">Cuota máx: ${fmtUSD(cuotaMax)}</span></td>`;
      periodos.forEach(p => {
        const totalAcum = cuotaMax * p + capInicial;
        row += `<td class="clickable" onclick="cap_seleccionar(this, ${cuotaMax}, ${p}, ${totalAcum})">${fmtUSD(totalAcum)}</td>`;
      });
      tr.innerHTML = row;
      tbody.appendChild(tr);
    });
  }

  // Métricas
  setText('cap-metric-12', fmtUSD(capInicial + flujo * 0.4 * 12));
  setText('cap-metric-24', fmtUSD(capInicial + flujo * 0.4 * 24));
  setText('cap-metric-36', fmtUSD(capInicial + flujo * 0.4 * 36));
  setText('cap-metric-48', fmtUSD(capInicial + flujo * 0.4 * 48));

  // Resumen
  setText('cap-cliente', document.getElementById('cap-nombre').value || '—');
  setText('cap-flujo-display', fmtUSD(flujo));
  setText('cap-inicial-display', fmtUSD(capInicial));
}

function cap_seleccionar(cell, cuota, meses, total) {
  document.querySelectorAll('#cap-tabla-body td').forEach(td => td.classList.remove('selected-cell'));
  cell.classList.add('selected-cell');
  _capActiveCell = cell;

  const panel = document.getElementById('cap-panel');
  if (panel) {
    panel.style.display = 'block';
    setText('cap-panel-cuota', fmtUSD(cuota));
    setText('cap-panel-meses', meses);
    setText('cap-panel-acum', fmtUSD(cuota * meses));
    setText('cap-panel-total', fmtUSD(total));
    setText('cap-panel-property', fmtUSD(total / 0.7)); // asumiendo 70% financiamiento
  }
}

function cap_cerrarPanel() {
  document.getElementById('cap-panel').style.display = 'none';
  document.querySelectorAll('#cap-tabla-body td').forEach(td => td.classList.remove('selected-cell'));
}

function initCap() {
  // Pre-llenar fecha actual
  const hoyEl = document.getElementById('cap-fecha');
  if (hoyEl && !hoyEl.value) {
    hoyEl.value = new Date().toISOString().split('T')[0];
  }
  cap_calcular();
}
