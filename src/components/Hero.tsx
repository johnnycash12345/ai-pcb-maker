import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

interface HeroProps {
  onStartProject: () => void;
}

const Hero = ({ onStartProject }: HeroProps) => {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>

          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Design de PCB com
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Inteligência Artificial</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Descreva seu projeto eletrônico em linguagem natural e receba designs completos de PCB prontos para fabricação. Sem expertise necessária.
          </p>

          <div className="flex items-center gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-hero text-white hover:opacity-90 shadow-glow-primary"
              onClick={onStartProject}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Começar Novo Projeto
            </Button>
            <Button size="lg" variant="outline">
              Ver Exemplos
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary mb-1">1,200+</div>
              <div className="text-sm text-muted-foreground">Projetos Criados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-1">&lt; 2min</div>
              <div className="text-sm text-muted-foreground">Tempo Médio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
