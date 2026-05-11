/* ════════════════════════════════════════════════════════════════
   J&V Tools — Análisis de Inversión
   TIR, VAN, payback, plusvalía proyectada
   Criterios RD: TIR > 12%, VAN > RD$100K, DSCR > 1.2x
   ════════════════════════════════════════════════════════════════ */

// Calcula TIR (Newton-Raphson)
function calcTIR(flujos, guess = 0.12) {
  let r = guess;
  for (let iter = 0; iter < 100; iter++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < flujos.length; t++) {
      const f = flujos[t];
      npv += f / Math.pow(1 + r, t);
      dnpv -= t * f / Math.pow(1 + r, t + 1);
    }
    if (Math.abs(npv) < 0.01) return r;
    if (Math.abs(dnpv) < 1e-10) break;
    const newR = r - npv / dnpv;
    if (Math.abs(newR - r) < 1e-7) return newR;
    r = newR;
    if (r < -0.99) r = -0.99;
    if (r > 10) return null;
  }
  return r;
}

// Calcula VAN (Valor Actual Neto)
function calcVAN(flujos, tasaDescuento) {
  return flujos.reduce((acc, f, t) => acc + f / Math.pow(1 + tasaDescuento, t), 0);
}

function inv_calcular() {
  const precio = getN('inv-precio');
  const inicialPct = parseFloat(document.getElementById('inv-inicial-pct').value) || 30;
  const tasaBanco = parseFloat(document.getElementById('inv-tasa-banco').value) || 13.5;
  const plazoBanco = parseInt(document.getElementById('inv-plazo-banco').value) || 20;
  const aniosEntrega = parseInt(document.getElementById('inv-anios-entrega').value) || 2;
  const plusvaliaAnual = parseFloat(document.getElementById('inv-plusvalia').value) || 5;
  const alquilerMensual = getN('inv-alquiler');
  const ocupacion = parseFloat(document.getElementById('inv-ocupacion').value) || 85;
  const incrementoAlquiler = parseFloat(document.getElementById('inv-incr-alquiler').value) || 4;
  const mantenimiento = getN('inv-mantenimiento');
  const ipi = getN('inv-ipi');
  const tasaDescuento = parseFloat(document.getElementById('inv-descuento').value) || 12;
  const horizonte = parseInt(document.getElementById('inv-horizonte').value) || 10;
  const tc = parseFloat(document.getElementById('inv-tc').value) || 60.75;

  if (precio <= 0) {
    document.getElementById('inv-result').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">Ingresa los datos del inmueble</div>
        <div class="empty-state-desc">El análisis aparecerá aquí</div>
      </div>`;
    return;
  }

  // Construir flujos de caja
  const inicial = precio * inicialPct / 100;
  const montoFinanciado = precio - inicial;
  const cuotaBanco = calcCuotaHipoteca(montoFinanciado, tasaBanco, plazoBanco);
  const pagoBancoAnual = cuotaBanco * 12;

  const flujos = [];
  const detalleAnos = [];

  // Año 0: pago inicial
  flujos.push(-inicial);
  detalleAnos.push({ ano: 0, ingresos: 0, gastos: 0, banco: 0, neto: -inicial, valor: precio });

  let valorActual = precio;
  let alquiler = alquilerMensual * 12 * (ocupacion / 100);

  for (let t = 1; t <= horizonte; t++) {
    let ingresos = 0;
    let gastos = (mantenimiento + ipi) * 12;
    let banco = 0;
    let valorVenta = 0;

    if (t < aniosEntrega) {
      // Aún en construcción - sin alquiler ni gastos op., pero sí cuotas del plan si las hay
      ingresos = 0;
      gastos = 0;
    } else {
      ingresos = alquiler;
      banco = pagoBancoAnual;
      // Incremento anual de alquiler
      alquiler = alquiler * (1 + incrementoAlquiler / 100);
    }

    // Plusvalía
    valorActual = valorActual * (1 + plusvaliaAnual / 100);

    let neto = ingresos - gastos - banco;

    // Año final: vender a valor de mercado (asumiendo saldo banco)
    if (t === horizonte) {
      const saldoRestante = calcSaldoBanco(montoFinanciado, tasaBanco, plazoBanco, t - aniosEntrega + 1);
      valorVenta = valorActual - saldoRestante;
      neto += valorVenta;
    }

    flujos.push(neto);
    detalleAnos.push({ ano: t, ingresos, gastos, banco, neto, valor: valorActual, valorVenta });
  }

  const tir = calcTIR(flujos);
  const van = calcVAN(flujos, tasaDescuento / 100);
  const valorFinal = valorActual;
  const gananciaTotal = flujos.reduce((s, f) => s + f, 0);

  // Payback simple: año cuando flujo acumulado se vuelve positivo
  let acum = 0, payback = null;
  for (let i = 0; i < flujos.length; i++) {
    acum += flujos[i];
    if (acum >= 0 && payback === null && i > 0) payback = i;
  }

  const cumpleTIR = tir != null && tir * 100 > 12;
  const cumpleVAN = van > 100000 / tc; // VAN > RD$100K convertido a USD
  const cumpleAmbas = cumpleTIR && cumpleVAN;

  // Render
  const result = document.getElementById('inv-result');
  result.innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,var(--navy-deep),var(--navy));color:white;border:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-size:11px;opacity:0.65;text-transform:uppercase;letter-spacing:0.6px;font-weight:600">Veredicto</div>
          <div style="font-size:18px;font-weight:800;margin-top:4px">
            ${cumpleAmbas ? '✅ Inversión recomendada' : (tir != null && tir * 100 > 8 ? '⚠️ Inversión moderada' : '❌ No recomendada')}
          </div>
        </div>
        <span class="pill" style="background:${cumpleAmbas ? 'var(--success)' : (tir != null && tir * 100 > 8 ? 'var(--warning)' : 'var(--danger)')};color:white;font-size:11px">
          ${cumpleAmbas ? 'CUMPLE CRITERIOS' : 'REVISAR'}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.08)">
          <div style="font-size:11px;opacity:0.6;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">TIR</div>
          <div style="font-size:28px;font-weight:900;color:${cumpleTIR ? 'var(--success)' : 'var(--celeste-soft)'};margin-top:4px;letter-spacing:-0.5px">
            ${tir != null ? (tir * 100).toFixed(2) + '%' : 'N/A'}
          </div>
          <div style="font-size:10px;opacity:0.55;margin-top:4px">Meta: > 12%</div>
        </div>
        <div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:14px;border:1px solid rgba(255,255,255,0.08)">
          <div style="font-size:11px;opacity:0.6;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">VAN</div>
          <div style="font-size:22px;font-weight:900;color:${cumpleVAN ? 'var(--success)' : 'var(--celeste-soft)'};margin-top:4px;letter-spacing:-0.5px">
            ${fmtUSDInt(van)}
          </div>
          <div style="font-size:10px;opacity:0.55;margin-top:4px">${fmtRD(van * tc)} · Tasa ${tasaDescuento}%</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">
        <div style="text-align:center">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;font-weight:600">Payback</div>
          <div style="font-size:18px;font-weight:800;margin-top:2px">${payback ? payback + ' años' : '> ' + horizonte + ' años'}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;font-weight:600">Valor año ${horizonte}</div>
          <div style="font-size:18px;font-weight:800;margin-top:2px;color:var(--dorado-soft)">${fmtUSDInt(valorFinal)}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;opacity:0.6;text-transform:uppercase;font-weight:600">Plusvalía</div>
          <div style="font-size:18px;font-weight:800;margin-top:2px;color:var(--dorado-soft)">+${fmtUSDInt(valorFinal - precio)}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 Flujo de caja proyectado</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>Ingresos</th>
              <th>Gastos op.</th>
              <th>Banco</th>
              <th>Flujo neto</th>
              <th>Valor inmueble</th>
            </tr>
          </thead>
          <tbody>
            ${detalleAnos.map(d => `
              <tr>
                <td><strong>${d.ano}</strong></td>
                <td style="color:var(--success)">${d.ingresos > 0 ? fmtUSDInt(d.ingresos) : '—'}</td>
                <td style="color:var(--danger)">${d.gastos > 0 ? '−' + fmtUSDInt(d.gastos) : '—'}</td>
                <td style="color:var(--danger)">${d.banco > 0 ? '−' + fmtUSDInt(d.banco) : '—'}</td>
                <td><strong style="color:${d.neto >= 0 ? 'var(--success)' : 'var(--danger)'}">${(d.neto >= 0 ? '' : '−') + fmtUSDInt(Math.abs(d.neto))}</strong></td>
                <td>${fmtUSDInt(d.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📋 Resumen ejecutivo</div>
      <div style="font-size:13px;line-height:1.8;color:var(--gray-700)">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)">
          <span>Inversión inicial:</span><strong>${fmtUSDInt(inicial)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)">
          <span>Monto a financiar:</span><strong>${fmtUSDInt(montoFinanciado)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)">
          <span>Cuota banco mensual:</span><strong>${fmtUSDInt(cuotaBanco)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)">
          <span>Alquiler bruto/mes (yr 1):</span><strong>${fmtUSDInt(alquilerMensual)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)">
          <span>Cashflow neto/mes (yr 1 post-entrega):</span>
          <strong style="color:${(alquilerMensual * ocupacion / 100) - cuotaBanco - mantenimiento - ipi >= 0 ? 'var(--success)' : 'var(--danger)'}">
            ${fmtUSDInt((alquilerMensual * ocupacion / 100) - cuotaBanco - mantenimiento - ipi)}
          </strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0">
          <span>Ganancia total proyectada:</span>
          <strong style="color:${gananciaTotal >= 0 ? 'var(--success)' : 'var(--danger)'};font-size:15px">${fmtUSDInt(gananciaTotal)}</strong>
        </div>
      </div>
    </div>
  `;
}

function calcSaldoBanco(capital, tasaA, plazoAnos, anosTranscurridos) {
  const r = tasaA / 100 / 12;
  const n = plazoAnos * 12;
  const k = anosTranscurridos * 12;
  if (r === 0) return Math.max(0, capital * (1 - k / n));
  if (k >= n) return 0;
  return capital * (Math.pow(1 + r, n) - Math.pow(1 + r, k)) / (Math.pow(1 + r, n) - 1);
}

function initInversion() {
  inv_calcular();
}
