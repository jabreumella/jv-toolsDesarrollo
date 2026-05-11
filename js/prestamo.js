/* ════════════════════════════════════════════════════════════════
   J&V Tools — Calculadora de Préstamo
   Cuota mensual de hipoteca según monto, tasa, plazo
   ════════════════════════════════════════════════════════════════ */

const BANCOS_TASAS = {
  scotia:    { nombre: 'Scotiabank',   tasa: 13.50 },
  bhd:       { nombre: 'BHD',          tasa: 12.50 },
  popular:   { nombre: 'Popular',      tasa: 14.00 },
  reservas:  { nombre: 'Banreservas',  tasa: 13.00 },
  santacruz: { nombre: 'Santa Cruz',   tasa: 13.75 }
};

function aplicarBanco() {
  const banco = document.getElementById('p-banco').value;
  if (banco !== 'custom' && BANCOS_TASAS[banco]) {
    const tasa = BANCOS_TASAS[banco].tasa;
    document.getElementById('p-tasa').value = tasa;
    document.getElementById('p-tasa-lbl').textContent = tasa.toFixed(2);
  }
  calcPrestamo();
}

function calcPrestamo() {
  const precio = getN('p-precio');
  const pct = parseFloat(document.getElementById('p-pct').value) || 0;
  const tasa = parseFloat(document.getElementById('p-tasa').value) || 0;
  const plazo = parseInt(document.getElementById('p-plazo').value) || 20;
  const tc = parseFloat(document.getElementById('p-tc').value) || 61.50;

  const monto = precio * pct / 100;
  const inicial = precio - monto;
  const cuota = calcCuotaHipoteca(monto, tasa, plazo);
  const total = cuota * plazo * 12;
  const intereses = total - monto;
  const interesPct = monto > 0 ? (intereses / monto * 100) : 0;

  setText('p-monto', fmtUSDInt(monto));
  setText('p-monto-rd', fmtRD(monto * tc));
  setText('p-inicial', fmtUSDInt(inicial));
  setText('p-inicial-rd', fmtRD(inicial * tc));
  setText('p-cuota', fmtUSDInt(cuota));
  setText('p-cuota-rd', fmtRD(cuota * tc));
  setText('p-cuota-info', tasa.toFixed(2) + '% · ' + plazo + ' años · ' + (plazo * 12) + ' cuotas');
  setText('p-total', fmtUSDInt(total));
  setText('p-total-rd', fmtRD(total * tc));
  setText('p-intereses', fmtUSDInt(intereses));
  setText('p-intereses-pct', interesPct.toFixed(1) + '% sobre el capital');

  // Tabla comparativa
  const tbody = document.getElementById('p-comparativo');
  if (tbody) {
    tbody.innerHTML = '';
    Object.entries(BANCOS_TASAS).forEach(([key, info]) => {
      const c = calcCuotaHipoteca(monto, info.tasa, plazo);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${info.nombre}</strong></td>
        <td>${info.tasa.toFixed(2)}%</td>
        <td>${fmtUSDInt(c)}</td>
        <td>${fmtRD(c * tc)}</td>`;
      tbody.appendChild(tr);
    });
  }
}

function initPrestamo() {
  calcPrestamo();
}
