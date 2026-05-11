/* ════════════════════════════════════════════════════════════════
   J&V Tools — Generador de Ficha PDF
   PDF de 1 página optimizado para enviar por WhatsApp
   Usa jsPDF + autotable
   ════════════════════════════════════════════════════════════════ */

function generarFichaPDF(cot) {
  if (!cot) {
    // Si no se pasa cot, leer del formulario actual
    cot = pdf_leerFormulario();
    if (!cot) return toast('Completa los datos del cliente', 'warning');
  }

  if (typeof window.jspdf === 'undefined') {
    return toast('Librería PDF no cargada', 'error');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210, H = 297, M = 14;

  // Colores marca
  const NAVY = [28, 53, 94];
  const CELESTE = [0, 167, 225];
  const DORADO = [201, 168, 76];
  const GRAY = [100, 116, 139];

  // ── HEADER con gradiente simulado ──
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');

  // Acento dorado
  doc.setFillColor(...DORADO);
  doc.rect(0, 38, W, 1.5, 'F');

  // Logo placeholder (cuadro celeste)
  doc.setFillColor(...CELESTE);
  doc.roundedRect(M, 8, 22, 22, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('JV', M + 11, 21, { align: 'center' });

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAN DE PAGO', M + 28, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text(`${APP_CONFIG.team || 'J&V'} · ${APP_CONFIG.empresa || 'MR. Home'} · Asesores Inmobiliarios`, M + 28, 24);

  // Fecha
  doc.setFontSize(8);
  doc.setTextColor(150, 180, 220);
  doc.text(new Date().toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase(), W - M, 18, { align: 'right' });

  // ── DATOS DEL CLIENTE ──
  let y = 48;
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(cot.cliente || 'Cliente', M, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`${cot.proyecto || 'Proyecto'} · ${cot.unidad || 'Unidad'}`, M, y + 5);

  // Precio destacado a la derecha
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.text(fmtUSDInt(cot.precio || 0), W - M, y, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(fmtRD((cot.precio || 0) * (cot.tasaCambio || 60.75)), W - M, y + 5, { align: 'right' });

  y += 10;
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);

  y += 6;

  // ── KPIs CARDS (4 columnas) ──
  const kpis = [
    {
      lbl: 'INICIAL',
      val: fmtUSDInt((cot.precio || 0) * (cot.pctInicial || 0) / 100),
      pct: (cot.pctInicial || 0).toFixed(0) + '%',
      color: DORADO
    },
    {
      lbl: 'CUOTA ' + (cot.metodo || 'Mensual').toUpperCase(),
      val: pdf_calcCuotaRegular(cot),
      pct: (cot.pctPlan || 0).toFixed(0) + '% del precio',
      color: CELESTE
    },
    {
      lbl: 'CONTRA ENTREGA',
      val: fmtUSDInt((cot.precio || 0) * (cot.pctEntrega || 0) / 100),
      pct: (cot.pctEntrega || 0).toFixed(0) + '%',
      color: NAVY
    },
    {
      lbl: 'CUOTA BANCO',
      val: fmtUSDInt(calcCuotaHipoteca(
        (cot.precio || 0) * (cot.pctEntrega || 0) / 100,
        cot.tasaBanco || 14.6,
        cot.anosBanco || 20
      )),
      pct: (cot.tasaBanco || 14.6) + '% · ' + (cot.anosBanco || 20) + ' años',
      color: [22, 163, 74]
    }
  ];

  const cardW = (W - 2 * M - 6) / 4;
  kpis.forEach((k, idx) => {
    const x = M + idx * (cardW + 2);
    doc.setFillColor(...k.color);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(k.lbl, x + cardW / 2, y + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.text(k.val, x + cardW / 2, y + 13, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(k.pct, x + cardW / 2, y + 18, { align: 'center' });
  });

  y += 28;

  // ── TABLA SIMPLIFICADA ──
  const cuotas = pdf_generarCuotas(cot);
  const tableData = [];

  if (cot.fechaInicio && cot.reservaFija) {
    tableData.push(['R', fmtFechaCorta(cot.fechaInicio), 'Reserva', fmtUSDInt(cot.reservaFija)]);
  }
  if (cot.fechaFirma) {
    const sep = ((cot.precio || 0) * (cot.pctInicial || 0) / 100) - (cot.reservaFija || 0);
    if (sep > 0) tableData.push(['S', fmtFechaCorta(cot.fechaFirma), 'Separación', fmtUSDInt(sep)]);
  }
  cuotas.forEach(c => {
    tableData.push([c.num.toString(), fmtFechaCorta(c.fecha), 'Cuota ' + (cot.metodo === 'Trimestral' ? 'trim.' : 'mens.'), fmtUSDInt(c.monto)]);
  });
  if (cot.fechaEntrega) {
    tableData.push(['E', fmtFechaCorta(cot.fechaEntrega), 'Contra Entrega', fmtUSDInt((cot.precio || 0) * (cot.pctEntrega || 0) / 100)]);
  }

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: y,
      head: [['#', 'Fecha', 'Concepto', 'Monto USD']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: NAVY,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [50, 60, 80]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: M, right: M },
      styles: { lineColor: [220, 220, 230], lineWidth: 0.1 }
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Si pasa el límite de página, no agregar más
  if (y > H - 35) y = H - 35;

  // ── FOOTER (tarjeta del asesor) ──
  doc.setFillColor(...NAVY);
  doc.rect(0, H - 28, W, 28, 'F');
  doc.setFillColor(...CELESTE);
  doc.rect(0, H - 28, W, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_CONFIG.asesorNombre || 'Juan José', M, H - 19);
  if (APP_CONFIG.asesorPartner) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 230);
    doc.text(`& ${APP_CONFIG.asesorPartner}`, M, H - 14);
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text('Asesor Inmobiliario · ' + (APP_CONFIG.empresa || 'MR. Home'), M, H - 8);

  // Contacto a la derecha
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(APP_CONFIG.telefono || '', W - M, H - 19, { align: 'right' });
  doc.setTextColor(180, 200, 230);
  doc.text(APP_CONFIG.email || '', W - M, H - 14, { align: 'right' });

  // Tasa de cambio
  doc.setFontSize(7);
  doc.setTextColor(150, 170, 200);
  doc.text(`Cotización referencial · TC: RD$ ${(cot.tasaCambio || 60.75).toFixed(2)}/USD$ · ${new Date().toLocaleDateString('es-DO')}`, W / 2, H - 4, { align: 'center' });

  // Guardar
  const fname = `Plan_${(cot.cliente || 'cliente').replace(/[^a-z0-9]/gi, '_')}_${(cot.proyecto || '').replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(fname);
  toast('PDF generado · Listo para WhatsApp 📱', 'success');
}

function pdf_generarCuotas(cot) {
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

  const montoPlan = (cot.precio || 0) * (cot.pctPlan || 0) / 100;

  // Calcular extras
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

  return fechas.map((fecha, idx) => ({
    num: idx + 1,
    fecha,
    monto: cuotaRegular + (extrasMap.get(idx + 1) || 0)
  }));
}

function pdf_calcCuotaRegular(cot) {
  const cuotas = pdf_generarCuotas(cot);
  if (cuotas.length === 0) return '$0';
  // Promedio ignorando extras: cuota base
  const montoPlan = (cot.precio || 0) * (cot.pctPlan || 0) / 100;
  return fmtUSDInt(montoPlan / cuotas.length);
}

function pdf_leerFormulario() {
  const cliente = document.getElementById('cliente')?.value?.trim();
  if (!cliente) return null;

  return {
    cliente,
    proyecto: document.getElementById('proyecto').value.trim(),
    unidad: document.getElementById('unidad').value.trim(),
    precio: getN('precioUSD'),
    tasaCambio: parseFloat(document.getElementById('tasaCambio').value) || 60.75,
    fechaInicio: document.getElementById('fechaInicio').value,
    fechaFirma: document.getElementById('fechaFirma').value,
    fechaEntrega: document.getElementById('fechaEntrega').value,
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
}
