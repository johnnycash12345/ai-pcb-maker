import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportSchematicToPDF, exportSchematicToSVG } from "@/lib/schematicExporter";
import { toast } from "sonner";

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

interface SchematicViewerProps {
  components?: Component[];
  connections?: Connection[];
  projectName?: string;
}

const SchematicViewer = ({ components = [], connections = [], projectName = "PCB Project" }: SchematicViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    try {
      toast.info('Gerando PDF...');
      await exportSchematicToPDF(canvasRef.current, projectName, components, connections);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  const handleExportSVG = () => {
    if (!canvasRef.current) return;
    try {
      toast.info('Gerando SVG...');
      exportSchematicToSVG(canvasRef.current, projectName, components, connections);
      toast.success('SVG exportado com sucesso!');
    } catch (error) {
      console.error('Error exporting SVG:', error);
      toast.error('Erro ao exportar SVG');
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up styling
    ctx.strokeStyle = '#3b82f6';
    ctx.fillStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.font = '12px monospace';

    // Draw grid background
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Scale and center coordinates
    const scale = 50;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    // Draw connections first (so they appear behind components)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    connections.forEach(conn => {
      const fromComp = components.find(c => c.reference === conn.from);
      const toComp = components.find(c => c.reference === conn.to);
      
      if (fromComp && toComp) {
        ctx.beginPath();
        ctx.moveTo(offsetX + fromComp.x * scale, offsetY + fromComp.y * scale);
        ctx.lineTo(offsetX + toComp.x * scale, offsetY + toComp.y * scale);
        ctx.stroke();
        
        // Draw signal label
        const midX = offsetX + (fromComp.x + toComp.x) * scale / 2;
        const midY = offsetY + (fromComp.y + toComp.y) * scale / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.fillText(conn.signal, midX + 5, midY - 5);
      }
    });

    // Draw components
    components.forEach(comp => {
      const x = offsetX + comp.x * scale;
      const y = offsetY + comp.y * scale;
      
      // Draw component box
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.fillRect(x - 30, y - 20, 60, 40);
      ctx.strokeRect(x - 30, y - 20, 60, 40);
      
      // Draw reference designator
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(comp.reference, x, y - 5);
      
      // Draw value
      ctx.font = '10px monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText(comp.value || comp.name, x, y + 8);
    });

    // Draw legend
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Esquemático PCB', 10, 25);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${components.length} componentes • ${connections.length} conexões`, 10, 42);

  }, [components, connections]);

  if (components.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhum esquemático disponível ainda. Continue a conversa para gerar o esquemático automático.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Esquemático</h3>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSVG}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">SVG</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportPDF}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden bg-white shadow-glow-secondary">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full touch-pan-x touch-pan-y"
          style={{ maxHeight: '70vh' }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Componentes</h4>
          <ul className="space-y-1 text-muted-foreground">
            {components.slice(0, 5).map((comp, i) => (
              <li key={i}>
                • {comp.reference}: {comp.name} ({comp.value})
              </li>
            ))}
            {components.length > 5 && (
              <li className="italic">... e mais {components.length - 5} componentes</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Conexões</h4>
          <ul className="space-y-1 text-muted-foreground">
            {connections.slice(0, 5).map((conn, i) => (
              <li key={i}>
                • {conn.from} → {conn.to} ({conn.signal})
              </li>
            ))}
            {connections.length > 5 && (
              <li className="italic">... e mais {connections.length - 5} conexões</li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default SchematicViewer;
