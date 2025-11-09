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
    
    console.log('Usando Lovable AI com streaming...');

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

    // Chamar Lovable AI (Google Gemini) com streaming e tool calling
    console.log('Calling Lovable AI Gateway with streaming...');
    
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
        stream: true,
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
    
    console.log('Lovable AI streaming started');

    // Criar stream para processar resposta e extrair specs
    const reader = aiResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';
    let pcbSpecs: any = null;
    let finalProjectId = projectId;

    // Stream processor
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta;

                  // Acumular conteúdo
                  if (delta?.content) {
                    fullMessage += delta.content;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
                  }

                  // Extrair tool calls
                  if (delta?.tool_calls) {
                    const toolCall = delta.tool_calls[0];
                    if (toolCall?.function?.name === 'extract_pcb_specs' && toolCall?.function?.arguments) {
                      try {
                        pcbSpecs = JSON.parse(toolCall.function.arguments);
                        console.log('Extracted PCB specs:', pcbSpecs);
                      } catch (e) {
                        console.error('Error parsing tool call:', e);
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }

          // Após stream completo, salvar no banco
          if (!finalProjectId) {
            const projectData: any = {
              name: `Projeto ${new Date().toLocaleDateString()}`,
              description: message.substring(0, 100),
              type: pcbSpecs?.project_type || 'custom',
              status: pcbSpecs ? 'completed' : 'generating'
            };

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

            const { data: newProject } = await supabase
              .from('projects')
              .insert(projectData)
              .select()
              .single();

            if (newProject) {
              finalProjectId = newProject.id;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ projectId: finalProjectId })}\n\n`));
            }
          } else if (pcbSpecs) {
            await supabase
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
              .eq('id', finalProjectId);
          }

          // Salvar mensagens
          await supabase
            .from('chat_messages')
            .insert([
              { project_id: finalProjectId, role: 'user', content: message },
              { project_id: finalProjectId, role: 'assistant', content: fullMessage }
            ]);

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
    });

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
