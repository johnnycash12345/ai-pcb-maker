import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectGenerationStatusProps {
  stage: 'analyzing' | 'extracting' | 'validating' | 'complete' | 'error';
  message?: string;
  componentsCount?: number;
  connectionsCount?: number;
}

const ProjectGenerationStatus = ({
  stage,
  message,
  componentsCount = 0,
  connectionsCount = 0
}: ProjectGenerationStatusProps) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
          title: 'Analisando requisitos',
          description: 'Identificando componentes e conexões necessárias...',
          color: 'text-primary'
        };
      case 'extracting':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-secondary" />,
          title: 'Extraindo especificações',
          description: 'Estruturando dados técnicos do PCB...',
          color: 'text-secondary'
        };
      case 'validating':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-accent" />,
          title: 'Validando design',
          description: 'Executando testes e verificações DRC...',
          color: 'text-accent'
        };
      case 'complete':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          title: 'Projeto gerado com sucesso!',
          description: 'Redirecionando para visualização...',
          color: 'text-green-500'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-destructive" />,
          title: 'Erro na geração',
          description: message || 'Ocorreu um erro. Tente novamente.',
          color: 'text-destructive'
        };
    }
  };

  const info = getStageInfo();

  return (
    <Card className="p-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {info.icon}
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={`font-semibold text-lg ${info.color}`}>
              {info.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {info.description}
            </p>
          </div>

          {(componentsCount > 0 || connectionsCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {componentsCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {componentsCount} componentes
                </Badge>
              )}
              {connectionsCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  {connectionsCount} conexões
                </Badge>
              )}
            </div>
          )}

          {stage !== 'error' && stage !== 'complete' && (
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-hero animate-pulse"
                  style={{
                    width: stage === 'analyzing' ? '33%' : stage === 'extracting' ? '66%' : '90%'
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {stage === 'analyzing' ? 'Etapa 1 de 3' : stage === 'extracting' ? 'Etapa 2 de 3' : 'Etapa 3 de 3'}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectGenerationStatus;