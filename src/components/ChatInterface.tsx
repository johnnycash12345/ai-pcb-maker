import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Sparkles, Loader2, CheckCircle2, Download, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import ProjectGenerationStatus from "@/components/ProjectGenerationStatus";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'status';
  content: string;
  timestamp: Date;
  stage?: 'analyzing' | 'extracting' | 'validating' | 'complete' | 'error';
  metadata?: {
    componentsCount?: number;
    connectionsCount?: number;
    tool?: string;
  };
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const ChatInterface = ({ onClose }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `👋 Olá! Sou seu assistente de design de PCB com IA.

**Como funciona:**
1. Descreva seu projeto eletrônico (ex: "Quero criar um sensor IoT com ESP32")
2. Responda minhas perguntas sobre requisitos técnicos
3. Receba esquemáticos, validação DRC e cotações de fabricação

**Exemplos de projetos:**
• Nó Meshtastic de longo alcance com GPS
• Sensor IoT com WiFi e sensores ambientais
• Carregador solar com MPPT e monitoramento

Digite sua ideia abaixo ou clique em um dos exemplos! 🚀`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const examplePrompts = [
    "Nó Meshtastic de longo alcance com GPS",
    "Sensor IoT ESP32 com sensores de temperatura",
    "Carregador solar inteligente com MPPT"
  ];

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    console.log('🚀 Enviando mensagem:', text);
    console.log('📍 URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pcb-chat`);
    console.log('🆔 Project ID:', projectId);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Criar mensagem do assistente vazia para streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      console.log('📡 Fazendo requisição para edge function...');
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-pcb-chat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          projectId: projectId 
        }),
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Erro ao processar mensagem';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('❌ Erro da API:', errorData);
        } catch (e) {
          console.error('❌ Erro ao parsear resposta de erro:', e);
        }
        throw new Error(errorMessage);
      }

      // Processar stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        console.log('📖 Iniciando leitura do stream...');
        let hasReceivedData = false;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('✅ Stream finalizado');
            break;
          }

          hasReceivedData = true;
          const chunk = decoder.decode(value);
          console.log('📦 Chunk recebido:', chunk.substring(0, 100));
          
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                console.log('✨ Dados parseados:', parsed);
                
                // Streaming de texto
                if (parsed.type === 'text' && parsed.content) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: msg.content + parsed.content }
                      : msg
                  ));
                }

                // Tool call iniciado
                if (parsed.type === 'tool_start') {
                  console.log('🔧 Tool iniciado:', parsed.tool);
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.type !== 'status');
                    return [...filtered, {
                      id: `status-${Date.now()}`,
                      type: 'status' as const,
                      content: 'Gerando especificações técnicas...',
                      timestamp: new Date(),
                      stage: 'extracting' as const,
                      metadata: { tool: parsed.tool }
                    }];
                  });
                }

                // Projeto criado
                if (parsed.type === 'project_created') {
                  console.log('✅ Projeto criado:', parsed.projectId);
                  const newProjectId = parsed.projectId;
                  setProjectId(newProjectId);
                  
                  // Atualizar status para validação
                  setMessages(prev => {
                    const newMessages = [...prev];
                    let lastStatusIdx = -1;
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i].type === 'status') {
                        lastStatusIdx = i;
                        break;
                      }
                    }
                    
                    if (lastStatusIdx !== -1) {
                      newMessages[lastStatusIdx] = {
                        ...newMessages[lastStatusIdx],
                        content: 'Validando componentes e conexões...',
                        stage: 'validating',
                        metadata: {
                          componentsCount: parsed.project?.components?.length || 0,
                          connectionsCount: parsed.project?.pcb_data?.connections?.length || 0
                        }
                      };
                    }
                    return newMessages;
                  });

                  toast.success('Projeto gerado com sucesso!');
                  
                  // Após 1.5s, marcar como completo e redirecionar
                  setTimeout(() => {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      let lastStatusIdx = -1;
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].type === 'status') {
                          lastStatusIdx = i;
                          break;
                        }
                      }
                      
                      if (lastStatusIdx !== -1) {
                        newMessages[lastStatusIdx] = {
                          ...newMessages[lastStatusIdx],
                          stage: 'complete',
                          content: '✅ Projeto completo e validado!'
                        };
                      }
                      return newMessages;
                    });
                    
                    setTimeout(() => {
                      console.log('🔄 Redirecionando para projeto:', newProjectId);
                      window.location.href = `/project/${newProjectId}`;
                    }, 1000);
                  }, 1500);
                }

                // Erro
                if (parsed.type === 'error') {
                  console.error('❌ Erro:', parsed.error);
                  setMessages(prev => {
                    const newMessages = [...prev];
                    let lastStatusIdx = -1;
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i].type === 'status') {
                        lastStatusIdx = i;
                        break;
                      }
                    }
                    
                    if (lastStatusIdx !== -1) {
                      newMessages[lastStatusIdx] = {
                        ...newMessages[lastStatusIdx],
                        stage: 'error',
                        content: parsed.error
                      };
                    } else {
                      newMessages.push({
                        id: `status-${Date.now()}`,
                        type: 'status',
                        content: parsed.error,
                        timestamp: new Date(),
                        stage: 'error'
                      });
                    }
                    return newMessages;
                  });
                  toast.error(parsed.error);
                }
              } catch (e) {
                console.error('❌ Erro ao parsear dados do stream:', e, 'Dados:', data);
              }
            }
          }
        }
        
        if (!hasReceivedData) {
          console.warn('⚠️ Nenhum dado foi recebido do stream');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar mensagem';
      console.error('❌ Erro completo:', error);
      
      toast.error(errorMessage, {
        description: 'Verifique o console do navegador para mais detalhes',
        duration: 5000
      });
      
      // Atualizar mensagem do assistente com erro ao invés de remover
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: `❌ Erro: ${errorMessage}\n\nPor favor, tente novamente ou reformule sua pergunta.` }
          : msg
      ));
    } finally {
      setIsProcessing(false);
      console.log('✅ Processamento finalizado');
    }
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
                    {message.type === 'status' ? (
                      <ProjectGenerationStatus
                        stage={message.stage || 'analyzing'}
                        message={message.content}
                        componentsCount={message.metadata?.componentsCount}
                        connectionsCount={message.metadata?.connectionsCount}
                      />
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

export default ChatInterface;
