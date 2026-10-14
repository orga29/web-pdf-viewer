import fs from 'fs';

function createSamplePdf() {
  const contentP1 = 'BT /F1 24 Tf 70 700 Td (PDF Viewer Sample Document) Tj /F1 14 Tf 0 -40 Td (Welcome to the React PDF Viewer!) Tj 0 -30 Td (Features:) Tj 0 -24 Td (- Page Navigation & Zooming) Tj 0 -24 Td (- Thumbnails & Outline Sidebar) Tj 0 -24 Td (- Drag and Drop Support) Tj 0 -24 Td (- Fullscreen & Page Rotation) Tj ET';
  const contentP2 = 'BT /F1 24 Tf 70 700 Td (Page 2: Keyboard Shortcuts) Tj /F1 14 Tf 0 -40 Td (Arrow Left / Right: Previous / Next Page) Tj 0 -24 Td (Ctrl + Plus / Minus: Zoom In / Zoom Out) Tj 0 -24 Td (Ctrl + 0: Fit to Width) Tj 0 -24 Td (R key: Rotate Page Clockwise) Tj 0 -24 Td (F key: Toggle Fullscreen) Tj ET';
  const contentP3 = 'BT /F1 24 Tf 70 700 Td (Page 3: Ready to use!) Tj /F1 14 Tf 0 -40 Td (You can drag and drop any PDF file here.) Tj 0 -30 Td (Enjoy reading your documents!) Tj ET';

  const fontObj = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  
  const catalogObjNum = 1;
  const pagesObjNum = 2;
  const fontObjNum = 3;
  const outlinesObjNum = 4;
  const outlineItem1Num = 5;
  const outlineItem2Num = 6;
  const p1Num = 7;
  const c1Num = 8;
  const p2Num = 9;
  const c2Num = 10;
  const p3Num = 11;
  const c3Num = 12;

  const catalog = `<< /Type /Catalog /Pages ${pagesObjNum} 0 R /Outlines ${outlinesObjNum} 0 R >>`;
  const outlines = `<< /Type /Outlines /First ${outlineItem1Num} 0 R /Last ${outlineItem2Num} 0 R /Count 2 >>`;
  const outline1 = `<< /Title (1. Introduction) /Parent ${outlinesObjNum} 0 R /Next ${outlineItem2Num} 0 R /Dest [${p1Num} 0 R /Fit] >>`;
  const outline2 = `<< /Title (2. Shortcuts) /Parent ${outlinesObjNum} 0 R /Prev ${outlineItem1Num} 0 R /Dest [${p2Num} 0 R /Fit] >>`;

  const pages = `<< /Type /Pages /Kids [${p1Num} 0 R ${p2Num} 0 R ${p3Num} 0 R] /Count 3 >>`;

  const p1 = `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${c1Num} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`;
  const c1 = `<< /Length ${contentP1.length} >>\nstream\n${contentP1}\nendstream`;

  const p2 = `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${c2Num} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`;
  const c2 = `<< /Length ${contentP2.length} >>\nstream\n${contentP2}\nendstream`;

  const p3 = `<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${c3Num} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`;
  const c3 = `<< /Length ${contentP3.length} >>\nstream\n${contentP3}\nendstream`;

  const objs = [
    catalog,
    pages,
    fontObj,
    outlines,
    outline1,
    outline2,
    p1,
    c1,
    p2,
    c2,
    p3,
    c3
  ];

  let pdf = '%PDF-1.4\n';
  const xref = [];
  xref.push('0000000000 65535 f \n');

  objs.forEach((obj, idx) => {
    const offset = Buffer.byteLength(pdf, 'utf-8');
    const padded = String(offset).padStart(10, '0');
    xref.push(`${padded} 00000 n \n`);
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${objs.length + 1}\n`;
  xref.forEach(x => { pdf += x; });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  fs.writeFileSync('public/sample.pdf', pdf, 'utf-8');
  console.log('Sample PDF successfully created at public/sample.pdf');
}

createSamplePdf();
