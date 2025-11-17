import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { DRCError } from "@/lib/drcValidator";
import { validateDesign } from "@/lib/drcValidator";

type Component = {
  name: string;
  reference: string;
  value: string;
  x: number;
  y: number;
}

type Connection = {
  from: string;
  to: string;
  signal: string;
}

type PowerSpecs = {
  voltage?: string;
  current_active?: string;
  current_sleep?: string;
}

const getSeverityColor = (severity: DRCError['severity']) => {
  switch (severity) {
    case 'error': return 'text-red-600';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
  }
};

const getSeverityIcon = (severity: DRCError['severity']) => {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
  }
};

interface DRCValidatorProps {
  components?: Component[];
  connections?: Connection[];
  powerSpecs?: PowerSpecs;
}

const DRCValidator = ({ components = [], connections = [], powerSpecs }: DRCValidatorProps) => {
  const [errors, setErrors] = useState<DRCError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (components.length > 0) {
      runValidation();
    }
  }, [components, connections, powerSpecs]);

  const runValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      const validationErrors = validateDesign(components, connections, powerSpecs);
      setErrors(validationErrors);
      setIsValidating(false);
    }, 500);
  };

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const infoCount = errors.filter(e => e.severity === 'info').length;

  if (components.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Nenhum design disponível para validação. Gere um projeto primeiro.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Validação de Design (DRC)</h3>
            <p className="text-sm text-muted-foreground">
              Design Rule Check automático para detectar problemas
            </p>
          </div>
          <Button onClick={runValidation} disabled={isValidating} variant="outline">
            {isValidating ? "Validando..." : "Revalidar"}
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={errorCount > 0 ? "destructive" : "default"}>
              {errorCount} Erros
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={warningCount > 0 ? "secondary" : "outline"}>
              {warningCount} Avisos
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {infoCount} Informações
            </Badge>
          </div>
        </div>

        {errorCount === 0 && warningCount === 0 && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Design passou em todas as verificações críticas!
            </p>
          </div>
        )}
      </Card>

      {/* Errors List */}
      {errors.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium mb-4">Problemas Detectados</h4>
          <div className="space-y-3">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{getSeverityIcon(error.severity)}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {error.type}
                      </Badge>
                      <span className={`text-sm font-medium ${getSeverityColor(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{error.message}</p>
                    {error.components && error.components.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Componentes: {error.components.join(', ')}
                      </p>
                    )}
                    {error.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Localização: ({error.location.x.toFixed(1)}, {error.location.y.toFixed(1)})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rules Info */}
      <Card className="p-6">
        <h4 className="font-medium mb-3">Regras de Design Aplicadas</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• Clearance mínimo: 0.15mm (6 mil)</li>
          <li>• Largura mínima de trilha: 0.15mm (6 mil)</li>
          <li>• Diâmetro mínimo de via: 0.3mm</li>
          <li>• Corrente máxima por trilha: 1A</li>
          <li>• Temperatura máxima da placa: 85°C</li>
        </ul>
      </Card>
    </div>
  );
};

export default DRCValidator;