import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatStatus = (status) => {
  if (status === 'berlangsung') return 'Berlangsung';
  if (status === 'akan_datang') return 'Akan Datang';
  if (status === 'berakhir') return 'Berakhir';
  return status || '-';
};

export function exportEventsReportPdf(events = [], filterInfo = {}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const printedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const periodLabel = filterInfo.periodLabel || 'Semua Periode';

<<<<<<< HEAD
  // Header Banner
  doc.setFillColor(79, 70, 229); // Indigo-600
=======
  doc.setFillColor(79, 70, 229);
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('EVENTORY — LAPORAN REKAPITULASI ACARA KAMPUS', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Periode Laporan: ${periodLabel}`, 14, 18);
  doc.text(`Dicetak pada: ${printedAt} WIB`, 14, 23.5);

<<<<<<< HEAD
  // Ringkasan Statistik
=======
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
  const totalEvents = events.length;
  const ongoingCount = events.filter((e) => e.status === 'berlangsung').length;
  const upcomingCount = events.filter((e) => e.status === 'akan_datang').length;
  const endedCount = events.filter((e) => e.status === 'berakhir').length;
  const totalParticipants = events.reduce(
    (sum, ev) => sum + (ev.participants_count || 0),
    0
  );
  const totalAttended = events.reduce(
    (sum, ev) => sum + (ev.attended_participants_count || 0),
    0
  );

  const stats = [
    { label: 'Total Acara', value: String(totalEvents) },
    { label: 'Berlangsung', value: String(ongoingCount) },
    { label: 'Akan Datang', value: String(upcomingCount) },
    { label: 'Selesai', value: String(endedCount) },
    { label: 'Total Pendaftar', value: String(totalParticipants) },
    { label: 'Sudah Absen', value: String(totalAttended) },
  ];

  const boxStartX = 14;
  const boxY = 33;
  const gap = 3.5;
  const boxWidth = (pageWidth - 28 - gap * (stats.length - 1)) / stats.length;
  const boxHeight = 18;

  stats.forEach((item, idx) => {
    const x = boxStartX + idx * (boxWidth + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(item.label, x + 3.5, boxY + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(item.value, x + 3.5, boxY + 14);
  });

<<<<<<< HEAD
  // Tabel Data Acara (Total lebar kolom = 269 mm untuk A4 Landscape)
=======
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
  const tableRows = events.map((ev, index) => [
    index + 1,
    ev.title || '-',
    (ev.type || '-').toUpperCase(),
    ev.location_or_link || '-',
    `${formatDateTime(ev.event_date)}\ns/d ${formatDateTime(ev.end_date)}`,
    formatStatus(ev.status),
    ev.has_certificate ? 'Aktif' : 'Tidak Ada',
    `${ev.participants_count || 0} Peserta`,
    `${ev.attended_participants_count || 0} Peserta`,
  ]);

  autoTable(doc, {
    startY: 56,
    head: [[
      'No',
      'Judul Acara',
      'Jenis',
      'Lokasi / Link',
      'Jadwal Pelaksanaan',
      'Status',
      'Sertifikat',
      'Pendaftar',
      'Sudah Absen',
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 48, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 19 },
      3: { cellWidth: 44 },
      4: { cellWidth: 46 },
      5: { halign: 'center', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 21 },
      7: { halign: 'right', cellWidth: 28 },
      8: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Eventory — Smart Campus Event Management Platform',
        14,
        pageHeight - 8
      );
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  const fileSuffix = filterInfo.fileSuffix || new Date().toISOString().slice(0, 10);
  doc.save(`Laporan-Acara-Eventory-${fileSuffix}.pdf`);
<<<<<<< HEAD
=======
}

// Export Daftar Hadir Peserta Per Acara (PDF)
export function exportEventParticipantsPdf(event, participants = []) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const printedAt = new Date().toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  doc.setFillColor(30, 27, 75); // Indigo-950
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DAFTAR HADIR & REKAP PESERTA KEGIATAN', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Acara: ${event?.title || '-'}`, 14, 18);
  doc.text(
    `Jadwal: ${formatDateTime(event?.event_date)} s/d ${formatDateTime(event?.end_date)} | Lokasi: ${event?.location_or_link || '-'}`,
    14,
    24
  );

  const attendedCount = participants.filter((p) => p.is_attended).length;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `Total Terdaftar: ${participants.length} Peserta   |   Hadir: ${attendedCount} Peserta   |   Belum Absen: ${participants.length - attendedCount} Peserta`,
    14,
    37
  );

  const rows = participants.map((p, idx) => [
    idx + 1,
    p.user?.name || '-',
    p.user?.nim || '-',
    p.user?.email || '-',
    p.ticket_code || '-',
    p.is_attended ? 'Hadir' : 'Belum Absen',
    p.attended_at ? `${formatDateTime(p.attended_at)} WIB` : '-',
    p.certificate_number || '-',
  ]);

  autoTable(doc, {
    startY: 42,
    head: [[
      'No',
      'Nama Lengkap',
      'NIM',
      'Email',
      'Kode Tiket',
      'Status',
      'Waktu Presensi',
      'Nomor Sertifikat',
    ]],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 48 },
      4: { cellWidth: 28 },
      5: { halign: 'center', cellWidth: 24 },
      6: { cellWidth: 40 },
      7: { cellWidth: 47 },
    },
    didDrawPage: () => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Dicetak pada: ${printedAt} WIB`, 14, pageHeight - 8);
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  const slug = (event?.title || 'Acara').replace(/[^a-zA-Z0-9-_]+/g, '-');
  doc.save(`Absensi-${slug}.pdf`);
}

// Export Daftar Hadir Peserta Per Acara (CSV / Excel)
export function exportEventParticipantsCsv(event, participants = []) {
  const headers = [
    'No',
    'Nama Lengkap',
    'NIM',
    'Email',
    'Kode Tiket',
    'Status Kehadiran',
    'Waktu Presensi',
    'Nomor Sertifikat',
  ];

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const lines = [
    headers.map(escapeCsv).join(','),
    ...participants.map((p, idx) =>
      [
        idx + 1,
        p.user?.name || '-',
        p.user?.nim || '-',
        p.user?.email || '-',
        p.ticket_code || '-',
        p.is_attended ? 'Hadir' : 'Belum Absen',
        p.attended_at ? formatDateTime(p.attended_at) : '-',
        p.certificate_number || '-',
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug = (event?.title || 'Acara').replace(/[^a-zA-Z0-9-_]+/g, '-');
  link.href = url;
  link.download = `Absensi-${slug}.csv`;
  link.click();
  URL.revokeObjectURL(url);
>>>>>>> 9fd11e5f81e1e95178b63d79b1f3f57a78435aa9
}