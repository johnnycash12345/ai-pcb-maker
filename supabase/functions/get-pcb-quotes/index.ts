import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { width, height, layers, quantity } = await req.json();

    console.log('Fetching PCB quotes for:', { width, height, layers, quantity });

    // Simular cotações baseadas nos parâmetros
    // Em produção, isso faria chamadas reais às APIs dos fabricantes
    const boardArea = (width * height) / 10000; // em dm²
    const basePrice = boardArea * 5 * layers; // Preço base por área e camadas
    
    const quotes = [
      {
        manufacturer: 'JLCPCB',
        price: basePrice * 0.8 * (quantity / 10),
        quantity: quantity,
        leadTime: '3-5 dias',
        shipping: quantity < 20 ? 15.00 : 25.00,
        total: 0,
        url: 'https://jlcpcb.com',
        specs: {
          layers: layers,
          thickness: '1.6mm',
          color: 'Verde',
          finish: 'HASL'
        }
      },
      {
        manufacturer: 'PCBWay',
        price: basePrice * 1.0 * (quantity / 10),
        quantity: quantity,
        leadTime: '4-6 dias',
        shipping: quantity < 20 ? 12.00 : 20.00,
        total: 0,
        url: 'https://pcbway.com',
        specs: {
          layers: layers,
          thickness: '1.6mm',
          color: 'Verde',
          finish: 'ENIG'
        }
      },
      {
        manufacturer: 'OSHPark',
        price: basePrice * 1.2 * (Math.min(3, quantity) / 10),
        quantity: Math.min(3, quantity),
        leadTime: '10-12 dias',
        shipping: 0,
        total: 0,
        url: 'https://oshpark.com',
        specs: {
          layers: layers,
          thickness: '1.6mm',
          color: 'Roxo',
          finish: 'ENIG'
        }
      },
      {
        manufacturer: 'Seeed Studio',
        price: basePrice * 0.9 * (quantity / 10),
        quantity: quantity,
        leadTime: '5-7 dias',
        shipping: quantity < 20 ? 10.00 : 18.00,
        total: 0,
        url: 'https://seeedstudio.com',
        specs: {
          layers: layers,
          thickness: '1.6mm',
          color: 'Verde',
          finish: 'HASL'
        }
      }
    ];

    // Calcular total para cada cotação
    quotes.forEach(quote => {
      quote.total = quote.price + quote.shipping;
    });

    console.log('Generated quotes:', quotes);

    return new Response(
      JSON.stringify({ quotes }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in get-pcb-quotes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
