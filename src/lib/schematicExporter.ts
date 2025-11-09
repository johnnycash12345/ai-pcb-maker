import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Component {
  name: string;
  reference: string;
  value: string;
  footprint: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  signal: string;
}

export const exportSchematicToPDF = async (
  canvasElement: HTMLCanvasElement,
  projectName: string,
  components: Component[],
  connections: Connection[]
): Promise<void> => {
  try {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const imgWidth = 280;
    const imgHeight = 180;

    // Capturar o canvas como imagem
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');

    // Adicionar título
    pdf.setFontSize(20);
    pdf.text(`Esquemático PCB - ${projectName}`, 15, 15);

    // Adicionar data
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 15, 22);

    // Adicionar imagem do esquemático
    pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);

    // Nova página para componentes e conexões
    pdf.addPage();
    
    // Título da página de componentes
    pdf.setFontSize(16);
    pdf.text('Lista de Componentes', 15, 15);
    
    // Tabela de componentes
    pdf.setFontSize(10);
    let yPos = 25;
    pdf.text('Referência', 15, yPos);
    pdf.text('Nome', 50, yPos);
    pdf.text('Valor', 100, yPos);
    pdf.text('Footprint', 140, yPos);
    
    yPos += 5;
    pdf.line(15, yPos, 280, yPos);
    yPos += 5;
    
    components.forEach(comp => {
      if (yPos > 190) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(comp.reference, 15, yPos);
      pdf.text(comp.name, 50, yPos);
      pdf.text(comp.value || '-', 100, yPos);
      pdf.text(comp.footprint, 140, yPos);
      yPos += 6;
    });
    
    // Seção de conexões
    yPos += 10;
    if (yPos > 180) {
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.setFontSize(16);
    pdf.text('Lista de Conexões', 15, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.text('De', 15, yPos);
    pdf.text('Para', 80, yPos);
    pdf.text('Sinal', 145, yPos);
    
    yPos += 5;
    pdf.line(15, yPos, 280, yPos);
    yPos += 5;
    
    connections.forEach(conn => {
      if (yPos > 190) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(conn.from, 15, yPos);
      pdf.text(conn.to, 80, yPos);
      pdf.text(conn.signal, 145, yPos);
      yPos += 6;
    });

    // Adicionar informações do projeto
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Informações do Projeto', 15, 15);
    
    pdf.setFontSize(12);
    yPos = 30;
    pdf.text(`Total de Componentes: ${components.length}`, 15, yPos);
    yPos += 8;
    pdf.text(`Total de Conexões: ${connections.length}`, 15, yPos);
    yPos += 8;
    pdf.text(`Gerado por: PCB AI Designer`, 15, yPos);
    yPos += 8;
    pdf.text(`Website: https://pcb-ai-designer.lovable.app`, 15, yPos);

    // Salvar PDF
    pdf.save(`${projectName}_schematic.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Erro ao gerar PDF');
  }
};

export const exportSchematicToSVG = (
  canvasElement: HTMLCanvasElement,
  projectName: string,
  components: Component[],
  connections: Connection[]
): void => {
  try {
    const width = canvasElement.width;
    const height = canvasElement.height;
    
    // Criar SVG
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <title>${projectName} - Esquemático PCB</title>
  <desc>Gerado automaticamente por PCB AI Designer</desc>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <!-- Grid -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.5"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  
`;

    // Adicionar conexões
    const scale = 50;
    const offsetX = width / 2;
    const offsetY = height / 2;
    
    connections.forEach(conn => {
      const fromComp = components.find(c => c.reference === conn.from);
      const toComp = components.find(c => c.reference === conn.to);
      
      if (fromComp && toComp) {
        const x1 = offsetX + fromComp.x * scale;
        const y1 = offsetY + fromComp.y * scale;
        const x2 = offsetX + toComp.x * scale;
        const y2 = offsetY + toComp.y * scale;
        
        svg += `  <!-- Connection: ${conn.from} to ${conn.to} -->
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3b82f6" stroke-width="2"/>
  <text x="${(x1 + x2) / 2 + 5}" y="${(y1 + y2) / 2 - 5}" font-size="10" fill="#64748b">${conn.signal}</text>
`;
      }
    });
    
    // Adicionar componentes
    components.forEach(comp => {
      const x = offsetX + comp.x * scale;
      const y = offsetY + comp.y * scale;
      
      svg += `  <!-- Component: ${comp.reference} -->
  <rect x="${x - 30}" y="${y - 20}" width="60" height="40" fill="#f1f5f9" stroke="#3b82f6" stroke-width="2"/>
  <text x="${x}" y="${y - 5}" text-anchor="middle" font-weight="bold" font-size="12" fill="#0f172a">${comp.reference}</text>
  <text x="${x}" y="${y + 8}" text-anchor="middle" font-size="10" fill="#475569">${comp.value || comp.name}</text>
`;
    });
    
    // Adicionar legenda
    svg += `  <!-- Legend -->
  <text x="10" y="25" font-weight="bold" font-size="14" fill="#1e293b">Esquemático PCB</text>
  <text x="10" y="42" font-size="11" fill="#64748b">${components.length} componentes • ${connections.length} conexões</text>
  
</svg>`;

    // Download do SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_schematic.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating SVG:', error);
    throw new Error('Erro ao gerar SVG');
  }
};
