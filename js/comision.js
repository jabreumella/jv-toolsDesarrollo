/* ════════════════════════════════════════════════════════════════
   J&V Tools — Calculadora de Comisión J&V
   Cálculo de comisión inmobiliaria con split del equipo
   ITBIS sobre servicios profesionales: 18% (Ley 11-92, RD)
   ISR sobre honorarios: 10% retención (cuando aplica)
   ════════════════════════════════════════════════════════════════ */

function comision_calcular() {
  const precio = getN('com-precio');
  const pctEmpresa = parseFloat(document.getElementById('com-pct-empresa').value) || 0;
  const splitJV = parseFloat(document.getElementById('com-split-jv').value) || 50;
  const aplicaITBIS = document.getElementById('com-itbis').checked;
  const aplicaISR = document.getElementById('com-isr').checked;
  const tc = parseFloat(document.getElementById('com-tc').value) || 60.75;

  // Comisión bruta total (la que cobra la empresa al cliente)
  const comBruta = precio * pctEmpresa / 100;

  // ITBIS (18%) — se cobra ADICIONAL al cliente, no se descuenta del asesor
  // En RD el ITBIS de servicios profesionales lo paga el cliente, no el asesor
  // pero algunas estructuras lo descuentan. Mostramos ambos casos.
  const itbis = aplicaITBIS ? comBruta * 0.18 : 0;

  // ISR retenido (10% de retención sobre honorarios pagados a personas físicas)
  const isrRetenido = aplicaISR ? comBruta * 0.10 : 0;

  // Comisión neta después de impuestos retenidos
  const comNeta = comBruta - isrRetenido;

  // Split J&V (el equipo recibe su parte después del corte de la empresa)
  // Asumiendo que el % que ingresaste ES lo que recibe el equipo total
  const totalEquipo = comNeta;
  const parteJuanJose = totalEquipo * splitJV / 100;
  const parteVictor = totalEquipo * (100 - splitJV) / 100;

  // Renderizar resultado
  const resEl = document.getElementById('com-result');
  if (!resEl) return;

  resEl.innerHTML = `
    <div style="font-size:11px;opacity:0.7;text-transform:uppercase;letter-spacing:0.6px;font-weight:600">Comisión total bruta</div>
    <div style="font-size:30px;font-weight:900;letter-spacing:-1px;margin-top:4px">${fmtUSDInt(comBruta)}</div>
    <div style="font-size:13px;opacity:0.6;margin-top:2px">${fmtRD(comBruta * tc)} · ${pctEmpresa}% sobre ${fmtUSDInt(precio)}</div>

    ${aplicaITBIS ? `
      <div style="margin-top:14px;padding:10px;background:rgba(255,255,255,0.05);border-radius:10px;font-size:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="opacity:0.7">ITBIS (18%) que paga el cliente:</span>
          <strong>${fmtUSDInt(itbis)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="opacity:0.7">Total a cobrar al cliente:</span>
          <strong style="color:var(--celeste-soft)">${fmtUSDInt(comBruta + itbis)}</strong>
        </div>
      </div>
    ` : ''}

    ${aplicaISR ? `
      <div style="margin-top:10px;padding:10px;background:rgba(220,38,38,0.15);border-radius:10px;font-size:12px;border:1px solid rgba(220,38,38,0.2)">
        <div style="display:flex;justify-content:space-between">
          <span style="opacity:0.85">ISR retenido (10%):</span>
          <strong>− ${fmtUSDInt(isrRetenido)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)">
          <span style="opacity:0.85">Neto recibido:</span>
          <strong>${fmtUSDInt(comNeta)}</strong>
        </div>
      </div>
    ` : ''}

    <div class="comision-split">
      <div class="comision-person">
        <div class="comision-person-name">${escapeHtml(APP_CONFIG.asesorNombre || 'Juan José')} (${splitJV}%)</div>
        <div class="comision-person-amount">${fmtUSDInt(parteJuanJose)}</div>
        <div class="comision-person-rd">${fmtRD(parteJuanJose * tc)}</div>
      </div>
      <div class="comision-person">
        <div class="comision-person-name">${escapeHtml(APP_CONFIG.asesorPartner || 'Víctor')} (${100 - splitJV}%)</div>
        <div class="comision-person-amount">${fmtUSDInt(parteVictor)}</div>
        <div class="comision-person-rd">${fmtRD(parteVictor * tc)}</div>
      </div>
    </div>
  `;
}

function comision_aplicarSplit(pct, btn) {
  document.getElementById('com-split-jv').value = pct;
  document.querySelectorAll('.com-split-preset').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  comision_calcular();
}

function initComision() {
  comision_calcular();
}
