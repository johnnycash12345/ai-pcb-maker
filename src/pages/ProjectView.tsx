import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, ArrowLeft, Download, MessageSquare, Box, FileText, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import PcbViewer3D from "@/components/PcbViewer3D";
import SchematicViewer from "@/components/SchematicViewer";
import DRCValidator from "@/components/DRCValidator";

interface Project {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  requirements: any;
  components: any;
  pcb_data: any;
  created_at: string;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProject();
      loadMessages();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Erro ao carregar projeto');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const generateGerberFiles = async () => {
    try {
      toast.info('Gerando arquivos Gerber...');
      
      // Gerar estrutura de arquivos Gerber
      const gerberFiles = {
        'project.gtl': '# Top Copper Layer\nG04 #@! TF.GenerationSoftware,PCB AI Designer*\n',
        'project.gbl': '# Bottom Copper Layer\nG04 #@! TF.GenerationSoftware,PCB AI Designer*\n',
        'project.gto': '# Top Silkscreen\nG04 #@! TF.GenerationSoftware,PCB AI Designer*\n',
        'project.gbs': '# Bottom Silkscreen\nG04 #@! TF.GenerationSoftware,PCB AI Designer*\n',
        'project.gko': '# Board Outline\nG04 #@! TF.GenerationSoftware,PCB AI Designer*\n',
        'project.drl': '# Drill File\nM48\nM72\n',
      };
      
      // Download dos arquivos
      for (const [filename, content] of Object.entries(gerberFiles)) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Arquivos Gerber gerados com sucesso!');
    } catch (error) {
      console.error('Error generating Gerber:', error);
      toast.error('Erro ao gerar arquivos Gerber');
    }
  };

  const downloadBOM = () => {
    const bomData = [
      ['Referência', 'Valor', 'Footprint', 'Quantidade', 'Fornecedor'],
      ['R1', '10kΩ', '0805', '1', 'Digi-Key'],
      ['C1', '100nF', '0805', '2', 'Digi-Key'],
      ['U1', 'ESP32', 'ESP32-WROOM-32', '1', 'Mouser'],
    ];

    const csvContent = bomData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'project'}_BOM.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('BOM baixado com sucesso!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Projeto não encontrado</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-lg z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-hero p-2 rounded-lg">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{project.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={downloadBOM}>
              <FileText className="h-4 w-4 mr-2" />
              BOM
            </Button>
            <Button onClick={generateGerberFiles} className="bg-gradient-hero">
              <Download className="h-4 w-4 mr-2" />
              Gerber
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="schematic" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="schematic">
              <Zap className="h-4 w-4 mr-2" />
              Esquemático
            </TabsTrigger>
            <TabsTrigger value="drc">
              <Shield className="h-4 w-4 mr-2" />
              Validação DRC
            </TabsTrigger>
            <TabsTrigger value="3d">
              <Box className="h-4 w-4 mr-2" />
              Visualização 3D
            </TabsTrigger>
            <TabsTrigger value="specs">
              <FileText className="h-4 w-4 mr-2" />
              Especificações
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Histórico do Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schematic" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Esquemático Automático</h2>
                  <p className="text-sm text-muted-foreground">
                    Gerado automaticamente baseado nas especificações do chat
                  </p>
                </div>
                <Button variant="outline" onClick={() => toast.info('Exportação em desenvolvimento')}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
              <SchematicViewer 
                components={project.components || []}
                connections={project.pcb_data?.connections || []}
              />
            </div>
          </TabsContent>

          <TabsContent value="drc" className="space-y-4">
            <DRCValidator
              components={project.components || []}
              connections={project.pcb_data?.connections || []}
              powerSpecs={project.requirements?.power_specs}
            />
          </TabsContent>

          <TabsContent value="3d" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Visualização 3D da PCB</h2>
              <PcbViewer3D />
              <p className="text-sm text-muted-foreground mt-4">
                Use o mouse para rotacionar, scroll para zoom. Visualização interativa da placa.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Especificações Técnicas</h2>
              {project.description && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Descrição</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Especificações</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Dimensões: 50x30mm (2 camadas)</li>
                    <li>• Consumo: 240mA (ativo) / 2mA (sleep)</li>
                    <li>• Alcance: 15-20km (linha de visada)</li>
                    <li>• Autonomia: 48h com bateria 2000mAh</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Componentes Principais</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• ESP32-WROOM-32U</li>
                    <li>• Módulo LoRa 1W (915MHz)</li>
                    <li>• GPS NEO-8M</li>
                    <li>• Conector USB-C</li>
                    <li>• Regulador 5V→3.3V</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Histórico da Conversa</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-muted mr-12'
                    }`}
                  >
                    <div className="text-xs font-medium mb-1 opacity-70">
                      {message.role === 'user' ? 'Você' : 'AI Assistant'}
                    </div>
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectView;
