import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Biblioteca de componentes expandida
const COMPONENT_LIBRARY = {
  microcontrollers: {
    'ESP32-WROOM-32U': {
      name: 'ESP32-WROOM-32U',
      voltage: 3.3,
      currentActive: 240,
      currentSleep: 0.01,
      interfaces: ['WiFi', 'Bluetooth', 'UART', 'SPI', 'I2C'],
      pins: ['3V3', 'GND', 'EN', 'IO0-IO39', 'TX', 'RX'],
      price: 4.50,
      use_cases: ['IoT', 'WiFi', 'Bluetooth', 'Meshtastic']
    },
    'STM32F103': {
      name: 'STM32F103',
      voltage: 3.3,
      currentActive: 50,
      currentSleep: 2,
      interfaces: ['UART', 'SPI', 'I2C', 'USB'],
      pins: ['VDD', 'VSS', 'PA0-PA15', 'PB0-PB15'],
      price: 2.80,
      use_cases: ['industrial', 'control', 'motor']
    }
  },
  wireless: {
    'E22-900M30S': {
      name: 'E22-900M30S (LoRa 1W)',
      voltage: 3.3,
      currentActive: 1200,
      currentSleep: 2,
      power: '30dBm (1W)',
      frequency: '915MHz',
      interface: 'UART',
      pins: ['VCC', 'GND', 'TXD', 'RXD', 'M0', 'M1', 'AUX'],
      price: 12.80,
      use_cases: ['long_range', 'meshtastic', 'telemetry']
    },
    'nRF24L01': {
      name: 'nRF24L01+',
      voltage: 3.3,
      currentActive: 13.5,
      power: '0dBm',
      frequency: '2.4GHz',
      interface: 'SPI',
      pins: ['VCC', 'GND', 'CE', 'CSN', 'SCK', 'MOSI', 'MISO', 'IRQ'],
      price: 1.50,
      use_cases: ['short_range', 'low_power', 'sensors']
    }
  },
  sensors: {
    'BME280': {
      name: 'BME280',
      voltage: 3.3,
      currentActive: 0.7,
      measurements: ['temperature', 'humidity', 'pressure'],
      interface: 'I2C/SPI',
      pins: ['VCC', 'GND', 'SDA', 'SCL'],
      price: 3.20,
      use_cases: ['weather', 'environment', 'iot']
    },
    'MPU6050': {
      name: 'MPU6050',
      voltage: 3.3,
      currentActive: 3.8,
      measurements: ['accelerometer', 'gyroscope'],
      interface: 'I2C',
      pins: ['VCC', 'GND', 'SDA', 'SCL', 'INT'],
      price: 2.50,
      use_cases: ['motion', 'drone', 'robotics']
    }
  },
  gps: {
    'NEO-8M': {
      name: 'NEO-8M GPS',
      voltage: 3.3,
      currentActive: 45,
      interface: 'UART',
      pins: ['VCC', 'GND', 'TX', 'RX'],
      price: 8.50,
      use_cases: ['location', 'tracking', 'meshtastic']
    }
  },
  power: {
    'AMS1117-3.3': {
      name: 'AMS1117-3.3',
      voltage_out: 3.3,
      current_max: 1000,
      voltage_in: '4.5-15V',
      pins: ['VIN', 'VOUT', 'GND'],
      price: 0.30,
      use_cases: ['regulation', 'power_supply']
    },
    'TP4056': {
      name: 'TP4056',
      voltage_out: 4.2,
      current_max: 1000,
      type: 'Li-Ion charger',
      pins: ['VIN', 'BAT+', 'BAT-', 'GND'],
      price: 0.50,
      use_cases: ['battery', 'charging', 'portable']
    }
  },
  connectors: {
    'USB-C-16P': {
      name: 'USB Type-C',
      voltage: 5,
      pins: ['VBUS', 'GND', 'D+', 'D-', 'CC1', 'CC2'],
      price: 1.20,
      use_cases: ['power', 'data', 'charging']
    },
    'JST-PH-2P': {
      name: 'JST-PH 2 pinos',
      voltage: '3.3-12V',
      pins: ['VCC', 'GND'],
      price: 0.15,
      use_cases: ['battery', 'power']
    }
  }
};

serve(async (req) => {
  console.log('🚀 PCB AI Chat - Edge Function iniciada');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, projectId, action } = await req.json();
    console.log('📥 Recebido:', { message, projectId, action });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar histórico se houver projectId
    let conversationHistory: Array<{ role: string; content: string }> = [];
    let existingProject = null;
    
    if (projectId) {
      const { data: chatHistory } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      
      if (chatHistory) {
        conversationHistory = chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }

      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      existingProject = project;
    }

    // Sistema de prompts baseado em stages
    const systemPrompt = `Você é um assistente especializado em design de PCB (Placas de Circuito Impresso) com IA.

**SUA MISSÃO:** Guiar o usuário através de um processo estruturado de criação de PCB, desde a especificação até o protótipo funcional.

**BIBLIOTECA DE COMPONENTES DISPONÍVEL:**
${JSON.stringify(COMPONENT_LIBRARY, null, 2)}

**PROCESSO EM 5 ETAPAS:**

**ETAPA 1 - ANÁLISE DE REQUISITOS:**
Quando o usuário descrever um projeto, SEMPRE pergunte:
1. Qual a função principal do dispositivo?
2. Precisa de conectividade? (WiFi, LoRa, Bluetooth)
3. Quais sensores ou interfaces são necessários?
4. Como será alimentado? (USB, bateria, solar)
5. Tamanho máximo da placa?
6. Tem requisitos especiais? (à prova d'água, baixo consumo)

**ETAPA 2 - SUGESTÃO DE ESPECIFICAÇÕES:**
Com base nas respostas, sugira:
- Microcontrolador apropriado
- Módulos de comunicação necessários
- Sensores recomendados
- Sistema de alimentação
- Estimativa de consumo e autonomia
- Tamanho estimado da PCB

Pergunte: "Essas especificações atendem suas necessidades? Ou prefere que eu gere automaticamente?"

**ETAPA 3 - GERAÇÃO AUTOMÁTICA (se aprovado):**
Use a ferramenta \`generate_pcb_project\` para criar:
- Lista completa de componentes com referencias (R1, C1, U1, etc)
- Conexões entre componentes (pino a pino)
- Validações de compatibilidade
- Estimativas de consumo

**ETAPA 4 - VALIDAÇÃO DRC:**
Após gerar, valide:
- Todos os componentes têm alimentação?
- Todas as conexões fazem sentido?
- Há componentes de proteção (capacitores de bypass)?
- Consumo total está dentro do esperado?

**ETAPA 5 - ENTREGA:**
Confirme a criação do projeto e informe que está pronto para:
- Visualização 3D
- Download de esquemáticos
- Cotações de fabricação

**REGRAS IMPORTANTES:**
- Seja técnico mas acessível
- Explique escolhas de componentes
- Sugira melhorias quando relevante
- Sempre valide requisitos elétricos (tensão, corrente)
- Use exemplos práticos
- Nunca invente componentes - use apenas da biblioteca

**FORMATO DE RESPOSTA:**
Use markdown, listas e emojis para clareza. Seja conciso mas completo.`;

    // Adicionar mensagem do usuário ao histórico
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Processar ações especiais
    if (action === 'generate_auto') {
      conversationHistory.push({
        role: 'user',
        content: 'Sim, gere automaticamente o projeto completo com todas as especificações!'
      });
    }

    console.log('🤖 Chamando Lovable AI com streaming...');

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_pcb_project",
              description: "Gera um projeto completo de PCB com componentes, conexões e validações. Use quando o usuário aprovar as especificações.",
              parameters: {
                type: "object",
                properties: {
                  project_name: {
                    type: "string",
                    description: "Nome descritivo do projeto"
                  },
                  project_type: {
                    type: "string",
                    enum: ["meshtastic", "iot_sensor", "power_supply", "robotics", "custom"],
                    description: "Categoria do projeto"
                  },
                  description: {
                    type: "string",
                    description: "Descrição técnica do projeto"
                  },
                  components: {
                    type: "array",
                    description: "Lista de componentes com referências únicas",
                    items: {
                      type: "object",
                      properties: {
                        reference: {
                          type: "string",
                          description: "Referência única (ex: U1, R1, C1)"
                        },
                        name: {
                          type: "string",
                          description: "Nome do componente da biblioteca"
                        },
                        value: {
                          type: "string",
                          description: "Valor do componente (ex: 10kΩ, 100nF)"
                        },
                        footprint: {
                          type: "string",
                          description: "Footprint PCB (ex: SOT-223, 0805)"
                        },
                        x: {
                          type: "number",
                          description: "Posição X no esquemático"
                        },
                        y: {
                          type: "number",
                          description: "Posição Y no esquemático"
                        }
                      },
                      required: ["reference", "name", "value", "footprint"]
                    }
                  },
                  connections: {
                    type: "array",
                    description: "Conexões entre componentes (nets)",
                    items: {
                      type: "object",
                      properties: {
                        from: {
                          type: "string",
                          description: "Referência do componente origem (ex: U1)"
                        },
                        to: {
                          type: "string",
                          description: "Referência do componente destino (ex: R1)"
                        },
                        signal: {
                          type: "string",
                          description: "Nome do sinal (ex: VCC, GND, TX, RX)"
                        }
                      },
                      required: ["from", "to", "signal"]
                    }
                  },
                  power_analysis: {
                    type: "object",
                    properties: {
                      voltage: {
                        type: "number",
                        description: "Tensão de operação (V)"
                      },
                      current_active: {
                        type: "number",
                        description: "Corrente ativa total (mA)"
                      },
                      current_sleep: {
                        type: "number",
                        description: "Corrente em sleep (mA)"
                      },
                      battery_life_estimate: {
                        type: "string",
                        description: "Estimativa de autonomia"
                      }
                    }
                  },
                  board_specs: {
                    type: "object",
                    properties: {
                      width: {
                        type: "number",
                        description: "Largura da placa (mm)"
                      },
                      height: {
                        type: "number",
                        description: "Altura da placa (mm)"
                      },
                      layers: {
                        type: "number",
                        enum: [2, 4],
                        description: "Número de camadas"
                      }
                    }
                  }
                },
                required: ["project_name", "project_type", "description", "components", "connections", "power_analysis", "board_specs"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: "auto",
        stream: true,
        temperature: 0.8
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Erro da AI Gateway:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    // Stream a resposta
    const encoder = new TextEncoder();
    let fullResponse = '';
    let toolCallData = '';
    let isCollectingToolCall = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = aiResponse.body!.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                // Streaming de texto normal
                if (delta?.content) {
                  fullResponse += delta.content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    type: 'text', 
                    content: delta.content 
                  })}\n\n`));
                }

                // Tool call iniciando
                if (delta?.tool_calls) {
                  isCollectingToolCall = true;
                  const toolCall = delta.tool_calls[0];
                  if (toolCall?.function?.name) {
                    console.log('🔧 Tool call detectado:', toolCall.function.name);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'tool_start',
                      tool: toolCall.function.name
                    })}\n\n`));
                  }
                  if (toolCall?.function?.arguments) {
                    toolCallData += toolCall.function.arguments;
                  }
                }

                // Tool call completado
                if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                  console.log('✅ Tool call completo, processando...');
                  
                  try {
                    const toolArgs = JSON.parse(toolCallData);
                    console.log('📊 Args do tool:', JSON.stringify(toolArgs, null, 2));

                    // Criar projeto no banco
                    const newProject = {
                      name: toolArgs.project_name,
                      description: toolArgs.description,
                      type: toolArgs.project_type,
                      status: 'completed',
                      components: toolArgs.components,
                      requirements: {
                        power_analysis: toolArgs.power_analysis,
                        board_specs: toolArgs.board_specs
                      },
                      pcb_data: {
                        connections: toolArgs.connections,
                        width: toolArgs.board_specs?.width || 50,
                        height: toolArgs.board_specs?.height || 30,
                        layers: toolArgs.board_specs?.layers || 2
                      }
                    };

                    const { data: savedProject, error: projectError } = await supabase
                      .from('projects')
                      .insert(newProject)
                      .select()
                      .single();

                    if (projectError) {
                      console.error('❌ Erro ao salvar projeto:', projectError);
                      throw projectError;
                    }

                    console.log('✅ Projeto salvo:', savedProject.id);

                    // Salvar mensagens do chat
                    await supabase.from('chat_messages').insert([
                      {
                        project_id: savedProject.id,
                        role: 'user',
                        content: message
                      },
                      {
                        project_id: savedProject.id,
                        role: 'assistant',
                        content: fullResponse
                      }
                    ]);

                    // Enviar dados do projeto criado
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'project_created',
                      projectId: savedProject.id,
                      project: newProject
                    })}\n\n`));

                  } catch (e) {
                    console.error('❌ Erro ao processar tool call:', e);
                    const errorMsg = e instanceof Error ? e.message : 'Erro desconhecido';
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                      type: 'error',
                      error: 'Erro ao criar projeto: ' + errorMsg
                    })}\n\n`));
                  }
                }

              } catch (e) {
                console.error('❌ Erro ao parsear chunk SSE:', e);
              }
            }
          }

          // Salvar mensagens se não houve tool call
          if (!isCollectingToolCall && projectId) {
            await supabase.from('chat_messages').insert([
              { project_id: projectId, role: 'user', content: message },
              { project_id: projectId, role: 'assistant', content: fullResponse }
            ]);
          }

          controller.close();
        } catch (error) {
          console.error('❌ Erro no stream:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
