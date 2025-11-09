import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cpu } from "lucide-react";

const PcbGenerator = () => {
  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Visualização do Circuito</h3>
          <div className="border border-border rounded-lg p-8 bg-muted/30 min-h-[300px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Visualização de circuito será implementada aqui
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={() => alert('Funcionalidade de exportação em desenvolvimento')}
            className="bg-gradient-hero text-white"
          >
            Exportar Gerber
          </Button>
          <Button variant="outline">
            Ver Esquemático
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PcbGenerator;
