import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Sparkles, Loader2, CheckCircle2, Download, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const ChatInterface = ({ onClose }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! Sou seu assistente de design de PCB. Descreva o projeto eletrônico que você quer criar e eu vou gerar o design completo para você.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const examplePrompts = [
    "Nó Meshtastic de longo alcance com GPS",
    "Sensor IoT ESP32 com sensores de temperatura",
    "Carregador solar inteligente com MPPT"
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Entendi! Vou criar um projeto de ' + text.toLowerCase() + '. Algumas perguntas:\n\n• Qual potência de transmissão você precisa?\n• Precisa de GPS integrado?\n• Tipo de alimentação? (USB-C, bateria, solar)\n• Tamanho máximo da placa?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  const handleGenerateProject = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const systemMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: 'project_generated',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      setIsProcessing(false);
      toast.success("Projeto gerado com sucesso!");
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-background/80 backdrop-blur-lg">
          <div>
            <h2 className="text-lg font-semibold">Novo Projeto PCB</h2>
            <p className="text-sm text-muted-foreground">Descreva seu projeto e deixe a IA trabalhar</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.type === 'system' ? (
                      <ProjectGeneratedCard />
                    ) : (
                      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.type === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="text-xs font-medium text-primary">AI Assistant</span>
                            </div>
                          )}
                          <p className="whitespace-pre-line">{message.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm">Processando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Example Prompts */}
            {messages.length === 1 && (
              <div className="p-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">💡 Exemplos de projetos:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="max-w-3xl mx-auto flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                  placeholder="Descreva seu projeto eletrônico..."
                  disabled={isProcessing}
                />
                <Button 
                  onClick={() => handleSendMessage(input)}
                  disabled={isProcessing || !input.trim()}
                  className="bg-gradient-hero"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {messages.length > 2 && !messages.some(m => m.type === 'system') && (
                <div className="max-w-3xl mx-auto mt-4">
                  <Button 
                    onClick={handleGenerateProject}
                    disabled={isProcessing}
                    className="w-full bg-secondary hover:bg-secondary/90"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando Projeto...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Projeto Completo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectGeneratedCard = () => {
  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-card shadow-glow-primary">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">🎉 Projeto Gerado: "Meshtastic Long Range Node v1.0"</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">📊 Especificações:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Dimensões: 50x30mm (2 camadas)</li>
                <li>• Consumo: 240mA (ativo) / 2mA (sleep)</li>
                <li>• Alcance estimado: 15-20km (linha de visada)</li>
                <li>• Autonomia: 48h com bateria 2000mAh</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">📁 Arquivos Gerados:</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="h-3 w-3 mr-2" />
                  Esquemático (PDF)
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="h-3 w-3 mr-2" />
                  Layout PCB (PDF)
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="h-3 w-3 mr-2" />
                  Arquivos Gerber
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="h-3 w-3 mr-2" />
                  Lista de Materiais
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">💰 Cotações de Fabricação:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• JLCPCB: $12.50 (10 unidades)</li>
                <li>• PCBWay: $15.80 (10 unidades)</li>
                <li>• OSHPark: $18.20 (3 unidades)</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 bg-gradient-hero">
                <Package className="h-4 w-4 mr-2" />
                Baixar Projeto Completo
              </Button>
              <Button variant="outline" className="flex-1">
                Modificar Projeto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;
