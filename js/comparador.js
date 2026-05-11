/* ════════════════════════════════════════════════════════════════
   J&V Tools — Comparador de Unidades
   Compara 2-3 unidades lado a lado para ayudar a decidir al cliente
   ════════════════════════════════════════════════════════════════ */

let unidadesComp = [
  { id: 1, proyecto: '', unidad: '', precio: 0, area: 0, hab: 0, banos: 0, parqueos: 1, mantenimiento: 0, financiamiento: 70, plazoAnos: 20, tasaBanco: 13.5 },
  { id: 2, proyecto: '', unidad: '', precio: 0, area: 0, hab: 0, banos: 0, parqueos: 1, mantenimiento: 0, financiamiento: 70, plazoAnos: 20, tasaBanco: 13.5 }
];

function comp_addUnidad() {
  if (unidadesComp.length >= 4) {
    return toast('Máximo 4 unidades para comparar', 'warning');
  }
  unidadesComp.push({
    id: Date.now(),
    proyecto: '', unidad: '', precio: 0, area: 0, hab: 0, banos: 0, parqueos: 1,
    mantenimiento: 0, financiamiento: 70, plazoAnos: 20, tasaBanco: 13.5
  });
  comp_render();
}

function comp_removeUnidad(id) {
  if (unidadesComp.length <= 1) return toast('Debes tener al menos 1 unidad', 'warning');
  unidadesComp = unidadesComp.filter(u => u.id !== id);
  comp_render();
}

function comp_updateField(id, field, value) {
  const u = unidadesComp.find(u => u.id === id);
  if (u) {
    u[field] = (typeof u[field] === 'number') ? (parseFloat(value) || 0) : value;
    comp_calcular();
  }
}

function comp_calcular() {
  unidadesComp.forEach(u => {
    const montoFinanciado = u.precio * u.financiamiento / 100;
    const inicial = u.precio - montoFinanciado;
    u._cuotaBanco = calcCuotaHipoteca(montoFinanciado, u.tasaBanco, u.plazoAnos);
    u._inicial = inicial;
    u._montoFin = montoFinanciado;
    u._totalPagar = u._cuotaBanco * u.plazoAnos * 12 + inicial;
    u._intereses = u._totalPagar - u.precio;
    u._precioPorM2 = u.area > 0 ? u.precio / u.area : 0;
    u._costoMensualTotal = u._cuotaBanco + u.mantenimiento;
  });

  // Determinar "ganador" en cada métrica (más bajo es mejor en precio/cuota, más alto en m²)
  const validas = unidadesComp.filter(u => u.precio > 0);
  if (validas.length === 0) return;

  const minPrecio = Math.min(...validas.map(u => u.precio));
  const minCuota = Math.min(...validas.map(u => u._cuotaBanco));
  const minPpm2 = Math.min(...validas.filter(u => u._precioPorM2 > 0).map(u => u._precioPorM2));
  const minMensual = Math.min(...validas.map(u => u._costoMensualTotal));

  // Renderizar tabla comparativa
  comp_renderResultado(validas, { minPrecio, minCuota, minPpm2, minMensual });
}

function comp_renderResultado(unidades, mins) {
  const tc = 60.75;
  const cont = document.getElementById('comp-result');
  if (!cont || unidades.length === 0) return;

  cont.innerHTML = `
    <div class="comp-grid">
      ${unidades.map((u, idx) => {
        const isWinnerPrecio = u.precio === mins.minPrecio;
        const isWinnerCuota = u._cuotaBanco === mins.minCuota;
        const isWinnerPpm2 = u._precioPorM2 === mins.minPpm2 && u._precioPorM2 > 0;
        const isWinnerMensual = u._costoMensualTotal === mins.minMensual;
        const totalWins = [isWinnerPrecio, isWinnerCuota, isWinnerPpm2, isWinnerMensual].filter(Boolean).length;
        const isOverallWinner = totalWins >= 2;

        return `
          <div class="comp-card ${isOverallWinner ? 'winner' : ''}">
            ${isOverallWinner ? '<div style="position:absolute;top:-10px;right:14px;background:var(--success);color:white;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:0.5px">⭐ MEJOR OPCIÓN</div>' : ''}
            <div class="comp-card-header">
              <div>
                <div class="comp-card-name">${escapeHtml(u.proyecto || 'Proyecto ' + (idx + 1))}</div>
                <div class="comp-card-project">${escapeHtml(u.unidad || 'Unidad sin nombre')}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:11px;color:var(--gray-500)">${u.hab} hab · ${u.banos} baños</div>
                <div style="font-size:11px;color:var(--gray-500)">${u.area} m² · ${u.parqueos}P</div>
              </div>
            </div>

            <div class="comp-card-row highlight">
              <span class="lbl">Precio</span>
              <span class="val ${isWinnerPrecio ? 'winner-cell' : ''}" style="${isWinnerPrecio ? 'color:var(--success)' : ''}">${fmtUSDInt(u.precio)}</span>
            </div>
            <div class="comp-card-row">
              <span class="lbl">USD/m²</span>
              <span class="val" style="${isWinnerPpm2 ? 'color:var(--success);font-weight:800' : ''}">${u._precioPorM2 > 0 ? fmtUSDInt(u._precioPorM2) : '—'}</span>
            </div>
            <div class="comp-card-row">
              <span class="lbl">Inicial (${100 - u.financiamiento}%)</span>
              <span class="val">${fmtUSDInt(u._inicial)}</span>
            </div>
            <div class="comp-card-row">
              <span class="lbl">A financiar</span>
              <span class="val">${fmtUSDInt(u._montoFin)}</span>
            </div>
            <div class="comp-card-row highlight">
              <span class="lbl">Cuota banco</span>
              <span class="val" style="${isWinnerCuota ? 'color:var(--success)' : ''}">${fmtUSDInt(u._cuotaBanco)}</span>
            </div>
            ${u.mantenimiento > 0 ? `
              <div class="comp-card-row">
                <span class="lbl">+ Mantenimiento</span>
                <span class="val">${fmtUSDInt(u.mantenimiento)}</span>
              </div>
              <div class="comp-card-row" style="padding-top:8px;border-top:1px dashed var(--borde)">
                <span class="lbl"><strong>Costo mensual total</strong></span>
                <span class="val" style="${isWinnerMensual ? 'color:var(--success)' : ''}"><strong>${fmtUSDInt(u._costoMensualTotal)}</strong></span>
              </div>
            ` : ''}
            <div class="comp-card-row" style="margin-top:6px;padding-top:8px;border-top:1px dashed var(--borde)">
              <span class="lbl">Intereses totales</span>
              <span class="val" style="color:var(--danger)">${fmtUSDInt(u._intereses)}</span>
            </div>
            <div class="comp-card-row">
              <span class="lbl">Total pagado</span>
              <span class="val">${fmtUSDInt(u._totalPagar)}</span>
            </div>

            <div class="comp-actions">
              <button class="btn btn-ghost" onclick="comp_removeUnidad(${u.id})">🗑 Quitar</button>
              <button class="btn btn-celeste" onclick="comp_usarEnPlan(${u.id})">📋 Usar en Plan</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function comp_usarEnPlan(id) {
  const u = unidadesComp.find(x => x.id === id);
  if (!u) return;
  // Cambiar a pantalla plan y prellenar campos
  showScreen('plan');
  setTimeout(() => {
    document.getElementById('proyecto').value = u.proyecto;
    document.getElementById('unidad').value = u.unidad;
    document.getElementById('precioUSD').value = u.precio.toLocaleString('en-US');
    document.getElementById('tasaBanco').value = u.tasaBanco;
    document.getElementById('anosBanco').value = u.plazoAnos;
    if (typeof recalcular === 'function') recalcular();
  }, 100);
}

function comp_render() {
  const cont = document.getElementById('comp-inputs');
  if (!cont) return;

  cont.innerHTML = unidadesComp.map((u, idx) => `
    <div class="card" style="position:relative">
      <div class="card-title">
        <span style="background:var(--celeste);color:white;width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px">${idx + 1}</span>
        Unidad ${idx + 1}
        ${unidadesComp.length > 1 ? `<button onclick="comp_removeUnidad(${u.id})" style="margin-left:auto;background:var(--danger-bg);color:var(--danger);border:none;width:26px;height:26px;border-radius:6px;font-size:14px;cursor:pointer">×</button>` : ''}
      </div>
      <div class="field-row">
        <div class="field">
          <label>Proyecto</label>
          <input type="text" placeholder="Ej. Terra Living" value="${escapeHtml(u.proyecto)}"
            oninput="comp_updateField(${u.id},'proyecto',this.value)">
        </div>
        <div class="field">
          <label>Unidad</label>
          <input type="text" placeholder="Ej. F3" value="${escapeHtml(u.unidad)}"
            oninput="comp_updateField(${u.id},'unidad',this.value)">
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Precio USD$</label>
          <div class="pw"><span class="pfx">$</span>
            <input type="number" placeholder="0" value="${u.precio || ''}"
              oninput="comp_updateField(${u.id},'precio',this.value)">
          </div>
        </div>
        <div class="field">
          <label>Área (m²)</label>
          <input type="number" placeholder="0" value="${u.area || ''}"
            oninput="comp_updateField(${u.id},'area',this.value)">
        </div>
      </div>
      <div class="field-row" style="grid-template-columns:1fr 1fr 1fr">
        <div class="field">
          <label>Hab.</label>
          <input type="number" min="0" value="${u.hab || ''}"
            oninput="comp_updateField(${u.id},'hab',this.value)">
        </div>
        <div class="field">
          <label>Baños</label>
          <input type="number" min="0" step="0.5" value="${u.banos || ''}"
            oninput="comp_updateField(${u.id},'banos',this.value)">
        </div>
        <div class="field">
          <label>Parq.</label>
          <input type="number" min="0" value="${u.parqueos || ''}"
            oninput="comp_updateField(${u.id},'parqueos',this.value)">
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Mantenimiento USD$/mes</label>
          <input type="number" placeholder="0" value="${u.mantenimiento || ''}"
            oninput="comp_updateField(${u.id},'mantenimiento',this.value)">
        </div>
        <div class="field">
          <label>% Financiar</label>
          <input type="number" min="0" max="100" value="${u.financiamiento || 70}"
            oninput="comp_updateField(${u.id},'financiamiento',this.value)">
        </div>
      </div>
      <div class="field-row">
        <div class="field">
          <label>Tasa Banco %</label>
          <input type="number" step="0.1" value="${u.tasaBanco || 13.5}"
            oninput="comp_updateField(${u.id},'tasaBanco',this.value)">
        </div>
        <div class="field">
          <label>Plazo (años)</label>
          <input type="number" value="${u.plazoAnos || 20}"
            oninput="comp_updateField(${u.id},'plazoAnos',this.value)">
        </div>
      </div>
    </div>
  `).join('');

  comp_calcular();
}

function initComparador() {
  comp_render();
}
