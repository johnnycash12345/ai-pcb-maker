import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, TrendingUp, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quote {
  manufacturer: string;
  price: number;
  quantity: number;
  leadTime: string;
  shipping: number;
  total: number;
  url?: string;
  specs: {
    layers: number;
    thickness: string;
    color: string;
    finish: string;
  };
}

interface QuoteComparisonProps {
  projectId?: string;
  boardSpecs?: {
    width: number;
    height: number;
    layers: number;
  };
}

const QuoteComparison = ({ projectId, boardSpecs = { width: 50, height: 30, layers: 2 } }: QuoteComparisonProps) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(10);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-pcb-quotes', {
        body: {
          width: boardSpecs.width,
          height: boardSpecs.height,
          layers: boardSpecs.layers,
          quantity: quantity,
        }
      });

      if (error) throw error;
      
      setQuotes(data.quotes || []);
      toast.success('Cotações atualizadas com sucesso!');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Erro ao buscar cotações. Usando dados de exemplo.');
      
      // Fallback com dados de exemplo
      setQuotes([
        {
          manufacturer: 'JLCPCB',
          price: 12.50,
          quantity: quantity,
          leadTime: '3-5 dias',
          shipping: 15.00,
          total: 27.50,
          url: 'https://jlcpcb.com',
          specs: {
            layers: boardSpecs.layers,
            thickness: '1.6mm',
            color: 'Verde',
            finish: 'HASL'
          }
        },
        {
          manufacturer: 'PCBWay',
          price: 15.80,
          quantity: quantity,
          leadTime: '4-6 dias',
          shipping: 12.00,
          total: 27.80,
          url: 'https://pcbway.com',
          specs: {
            layers: boardSpecs.layers,
            thickness: '1.6mm',
            color: 'Verde',
            finish: 'ENIG'
          }
        },
        {
          manufacturer: 'OSHPark',
          price: 18.20,
          quantity: Math.min(3, quantity),
          leadTime: '10-12 dias',
          shipping: 0,
          total: 18.20,
          url: 'https://oshpark.com',
          specs: {
            layers: boardSpecs.layers,
            thickness: '1.6mm',
            color: 'Roxo',
            finish: 'ENIG'
          }
        },
        {
          manufacturer: 'Seeed Studio',
          price: 14.90,
          quantity: quantity,
          leadTime: '5-7 dias',
          shipping: 10.00,
          total: 24.90,
          url: 'https://seeedstudio.com',
          specs: {
            layers: boardSpecs.layers,
            thickness: '1.6mm',
            color: 'Verde',
            finish: 'HASL'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [quantity]);

  const sortedQuotes = [...quotes].sort((a, b) => a.total - b.total);
  const cheapest = sortedQuotes[0];

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Cotações de Fabricação</h3>
            <p className="text-sm text-muted-foreground">
              Placa: {boardSpecs.width}x{boardSpecs.height}mm • {boardSpecs.layers} camadas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium mr-2">Quantidade:</label>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-border rounded-md px-3 py-2 bg-background"
              >
                <option value={5}>5 unidades</option>
                <option value={10}>10 unidades</option>
                <option value={25}>25 unidades</option>
                <option value={50}>50 unidades</option>
                <option value={100}>100 unidades</option>
              </select>
            </div>
            <Button onClick={fetchQuotes} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Atualizar
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards de Cotações */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Buscando cotações...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedQuotes.map((quote, index) => (
            <Card 
              key={quote.manufacturer} 
              className={`p-6 relative ${quote === cheapest ? 'ring-2 ring-primary' : ''}`}
            >
              {quote === cheapest && (
                <Badge className="absolute top-4 right-4 bg-primary">
                  Melhor Preço
                </Badge>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{quote.manufacturer}</h3>
                  <p className="text-sm text-muted-foreground">{quote.quantity} unidades</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    ${quote.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fabricação:</span>
                  <span className="font-medium">${quote.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete:</span>
                  <span className="font-medium">
                    {quote.shipping === 0 ? 'Grátis' : `$${quote.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className="font-medium">{quote.leadTime}</span>
                </div>
              </div>
              
              <div className="border-t border-border pt-4 mb-4">
                <p className="text-sm font-medium mb-2">Especificações:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>• {quote.specs.layers} camadas</div>
                  <div>• {quote.specs.thickness}</div>
                  <div>• {quote.specs.color}</div>
                  <div>• {quote.specs.finish}</div>
                </div>
              </div>
              
              {quote.url && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={quote.url} target="_blank" rel="noopener noreferrer">
                    Visitar Site
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Análise de Preços */}
      {quotes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Análise de Preços</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Melhor Preço Total</p>
              <p className="text-2xl font-bold text-green-600">
                ${sortedQuotes[0]?.total.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{sortedQuotes[0]?.manufacturer}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Preço Médio</p>
              <p className="text-2xl font-bold">
                ${(quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">média de {quotes.length} fornecedores</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Economia Máxima</p>
              <p className="text-2xl font-bold text-primary">
                ${(sortedQuotes[sortedQuotes.length - 1]?.total - sortedQuotes[0]?.total).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">vs. mais caro</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Dicas */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Dicas para Fabricação
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Pedidos maiores geralmente têm melhor custo por unidade</li>
              <li>• Acabamento HASL é mais econômico que ENIG</li>
              <li>• Verifique se o fabricante oferece montagem SMT</li>
              <li>• Considere o prazo de entrega para projetos urgentes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuoteComparison;
