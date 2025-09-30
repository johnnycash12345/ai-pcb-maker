import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Box, MessageSquare, Sparkles } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import ProjectGallery from "@/components/ProjectGallery";
import Hero from "@/components/Hero";

const Index = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              PCB AI Designer
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Meus Projetos
            </Button>
            <Button variant="ghost" size="sm">
              Documentação
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-hero text-white hover:opacity-90 shadow-glow-primary"
              onClick={() => setShowChat(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>
      </nav>

      {showChat ? (
        <ChatInterface onClose={() => setShowChat(false)} />
      ) : (
        <>
          <Hero onStartProject={() => setShowChat(true)} />
          
          {/* Features */}
          <section className="py-20 container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border border-border bg-gradient-card">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chat com IA</h3>
                <p className="text-muted-foreground">
                  Descreva seu projeto em linguagem natural e deixe a IA criar o design completo
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-gradient-card">
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Geração Automática</h3>
                <p className="text-muted-foreground">
                  Esquemáticos, layouts, BOM e arquivos Gerber gerados automaticamente
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-gradient-card">
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Box className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pronto para Fabricação</h3>
                <p className="text-muted-foreground">
                  Arquivos validados e otimizados, prontos para enviar ao fabricante
                </p>
              </div>
            </div>
          </section>

          {/* Project Gallery */}
          <ProjectGallery />
        </>
      )}
    </div>
  );
};

export default Index;
