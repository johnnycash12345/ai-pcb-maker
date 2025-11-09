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

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    if (!DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY não configurada");
    }
    
    // Limpar a chave de espaços em branco
    const cleanApiKey = DEEPSEEK_API_KEY.trim();
    
    if (!cleanApiKey.startsWith('sk-')) {
      console.error('AVISO: A chave API não começa com sk-. Isso pode indicar uma chave inválida.');
    }
    
    console.log('Tentando conectar à DeepSeek API...');

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

    // Chamar DeepSeek AI
    const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { 
            role: "system", 
            content: `Você é um assistente especializado em design de PCB (Placas de Circuito Impresso). 
            Sua função é ajudar usuários a criar projetos eletrônicos.
            
            Quando o usuário descrever um projeto:
            1. Faça perguntas para entender os requisitos (potência, alimentação, interfaces, tamanho)
            2. Sugira componentes apropriados (microcontroladores, sensores, conectores)
            3. Forneça especificações técnicas detalhadas
            4. Estime consumo de energia e autonomia
            
            Seja técnico mas acessível. Use exemplos práticos.` 
          },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de taxa excedido. Tente novamente em alguns instantes." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings -> Workspace -> Usage." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Criar ou atualizar projeto
    let finalProjectId = projectId;
    
    if (!projectId) {
      // Criar novo projeto
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `Projeto ${new Date().toLocaleDateString()}`,
          description: message.substring(0, 100),
          type: 'custom',
          status: 'generating'
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project:', projectError);
        throw projectError;
      }
      
      finalProjectId = newProject.id;
      console.log('Created new project:', finalProjectId);
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
