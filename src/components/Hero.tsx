import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Download } from "lucide-react";

interface HeroProps {
  onStartProject: () => void;
}

const Hero = ({ onStartProject }: HeroProps) => {
  return (
    <section className="relative py-12 sm:py-20 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-background to-background" />
      
      {/* Content */}
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium">Powered by AI</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up">
            Crie PCBs Profissionais
            <br />
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Conversando com IA
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Descreva seu projeto eletrônico em linguagem natural e receba esquemáticos,
            layouts de PCB e arquivos de fabricação prontos em minutos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              className="bg-gradient-hero text-white hover:opacity-90 shadow-glow-primary text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto transition-all hover:scale-105"
              onClick={onStartProject}
            >
              Começar Agora
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto transition-all hover:scale-105"
            >
              Ver Exemplo
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 pt-8 sm:pt-12 px-4">
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-gradient-card border border-border hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Geração Automática</h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Esquemáticos e layouts gerados por IA em segundos
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-gradient-card border border-border hover:border-secondary/50 transition-all hover:shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-secondary/10">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Validação DRC</h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Verificação automática de regras de design
              </p>
            </div>

            <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-xl bg-gradient-card border border-border hover:border-accent/50 transition-all hover:shadow-lg">
              <div className="p-2 sm:p-3 rounded-lg bg-accent/10">
                <Download className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base">Pronto para Fabricar</h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Arquivos Gerber e BOM prontos para produção
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
