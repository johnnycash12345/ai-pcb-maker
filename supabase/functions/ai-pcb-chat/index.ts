import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId } = await req.json();
    console.log('Received message:', message, 'for project:', projectId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }
    
    console.log('Usando Lovable AI...');

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar histórico de mensagens se houver projectId
    let messages: Array<{ role: string; content: string }> = [];
    if (projectId) {
      const { data: chatHistory } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (chatHistory) {
        messages = chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }
    }

    // Adicionar mensagem do usuário
    messages.push({
      role: 'user',
      content: message
    });

    // Chamar Lovable AI (Google Gemini) com tool calling para extração de requisitos
    console.log('Calling Lovable AI Gateway...');
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `Você é um assistente especializado em design de PCB (Placas de Circuito Impresso). 
            Sua função é ajudar usuários a criar projetos eletrônicos e extrair especificações técnicas.
            
            Quando o usuário descrever um projeto:
            1. Faça perguntas para entender os requisitos (potência, alimentação, interfaces, tamanho)
            2. Sugira componentes apropriados (microcontroladores, sensores, conectores)
            3. Forneça especificações técnicas detalhadas
            4. Estime consumo de energia e autonomia
            
            Quando houver informações suficientes, use a ferramenta extract_pcb_specs para estruturar os dados técnicos.
            Seja técnico mas acessível. Use exemplos práticos.` 
          },
          ...messages
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_pcb_specs",
              description: "Extrai especificações técnicas de PCB quando há informação suficiente da conversa",
              parameters: {
                type: "object",
                properties: {
                  project_type: {
                    type: "string",
                    description: "Tipo do projeto (meshtastic, iot_sensor, power_supply, custom)"
                  },
                  components: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do componente" },
                        reference: { type: "string", description: "Designador (U1, R1, etc)" },
                        value: { type: "string", description: "Valor do componente" },
                        footprint: { type: "string", description: "Footprint do componente" },
                        x: { type: "number", description: "Posição X no esquemático" },
                        y: { type: "number", description: "Posição Y no esquemático" }
                      }
                    }
                  },
                  connections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        from: { type: "string", description: "Componente origem" },
                        to: { type: "string", description: "Componente destino" },
                        signal: { type: "string", description: "Nome do sinal" }
                      }
                    }
                  },
                  power_specs: {
                    type: "object",
                    properties: {
                      voltage: { type: "string" },
                      current_active: { type: "string" },
                      current_sleep: { type: "string" }
                    }
                  },
                  board_size: {
                    type: "object",
                    properties: {
                      width: { type: "number" },
                      height: { type: "number" }
                    }
                  }
                },
                required: ["project_type", "components"],
                additionalProperties: false
              }
            }
          }
        ],
        stream: false,
      }),
    });

    console.log('Lovable AI response status:', aiResponse.status);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings → Workspace → Usage." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Lovable AI error: ${errorText}`);
    }
    
    console.log('Lovable AI call successful');

    const aiData = await aiResponse.json();
    const choice = aiData.choices[0];
    const assistantMessage = choice.message.content;
    
    // Verificar se há tool call com especificações extraídas
    let pcbSpecs = null;
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === 'extract_pcb_specs') {
        pcbSpecs = JSON.parse(toolCall.function.arguments);
        console.log('Extracted PCB specs:', pcbSpecs);
      }
    }

    // Criar ou atualizar projeto
    let finalProjectId = projectId;
    
    if (!projectId) {
      // Criar novo projeto
      const projectData: any = {
        name: `Projeto ${new Date().toLocaleDateString()}`,
        description: message.substring(0, 100),
        type: pcbSpecs?.project_type || 'custom',
        status: pcbSpecs ? 'completed' : 'generating'
      };
      
      // Adicionar dados técnicos se extraídos
      if (pcbSpecs) {
        projectData.components = pcbSpecs.components;
        projectData.requirements = {
          power_specs: pcbSpecs.power_specs,
          board_size: pcbSpecs.board_size
        };
        projectData.pcb_data = {
          connections: pcbSpecs.connections,
          schematic_generated: true
        };
      }

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw projectError;
      }
      
      finalProjectId = newProject.id;
      console.log('Created new project:', finalProjectId);
    } else if (pcbSpecs) {
      // Atualizar projeto existente com especificações
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          type: pcbSpecs.project_type,
          status: 'completed',
          components: pcbSpecs.components,
          requirements: {
            power_specs: pcbSpecs.power_specs,
            board_size: pcbSpecs.board_size
          },
          pcb_data: {
            connections: pcbSpecs.connections,
            schematic_generated: true
          }
        })
        .eq('id', projectId);
      
      if (updateError) {
        console.error('Error updating project:', updateError);
      }
    }

    // Salvar mensagens no banco
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          project_id: finalProjectId,
          role: 'user',
          content: message
        },
        {
          project_id: finalProjectId,
          role: 'assistant',
          content: assistantMessage
        }
      ]);

    if (messageError) {
      console.error('Error saving messages:', messageError);
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        projectId: finalProjectId
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-pcb-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
