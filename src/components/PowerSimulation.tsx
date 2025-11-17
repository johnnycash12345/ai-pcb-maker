import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Battery, Zap, Clock, TrendingDown } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { ComponentSpec } from "@/lib/componentLibrary";
import { calculatePowerConsumption, getComponentById } from "@/lib/componentLibrary";

interface PowerSimulationProps {
  components?: any[];
  requirements?: any;
}

const PowerSimulation = ({ components = [], requirements }: PowerSimulationProps) => {
  // Extrair IDs dos componentes
  const componentIds = components.map(c => c.name || c.id).filter(Boolean);
  
  // Calcular consumo total
  const { activeTotal, sleepTotal } = calculatePowerConsumption(componentIds);
  
  // Dados de simulação de bateria
  const batteryCapacity = requirements?.battery_capacity || 2000; // mAh
  const activeDutyCycle = 0.05; // 5% ativo, 95% sleep
  
  // Cálculo de autonomia
  const averageCurrent = (activeTotal * activeDutyCycle) + (sleepTotal * (1 - activeDutyCycle));
  const batteryLifeHours = batteryCapacity / averageCurrent;
  const batteryLifeDays = batteryLifeHours / 24;
  
  // Dados para gráficos
  const powerBreakdown = componentIds.map(id => {
    const comp = getComponentById(id);
    return {
      name: comp?.name || id,
      active: comp?.currentActive || 0,
      sleep: comp?.currentSleep || 0,
    };
  }).filter(c => c.active > 0 || c.sleep > 0);
  
  const batteryDischargeData = Array.from({ length: 25 }, (_, i) => ({
    hour: i,
    charge: Math.max(0, 100 - (i / batteryLifeHours * 100)),
  }));
  
  const consumptionOverTime = [
    { time: '00:00', current: sleepTotal },
    { time: '04:00', current: sleepTotal },
    { time: '08:00', current: activeTotal },
    { time: '12:00', current: activeTotal },
    { time: '16:00', current: sleepTotal },
    { time: '20:00', current: activeTotal },
    { time: '23:59', current: sleepTotal },
  ];
  
  const pieData = [
    { name: 'Microcontrolador', value: 240, color: '#3b82f6' },
    { name: 'LoRa TX', value: 1200, color: '#ef4444' },
    { name: 'GPS', value: 45, color: '#10b981' },
    { name: 'Outros', value: 30, color: '#f59e0b' },
  ];
  
  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Consumo Ativo</h3>
          </div>
          <p className="text-3xl font-bold">{activeTotal.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">mA</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">Consumo Sleep</h3>
          </div>
          <p className="text-3xl font-bold">{sleepTotal.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">mA</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="h-5 w-5 text-blue-500" />
            <h3 className="font-medium">Autonomia</h3>
          </div>
          <p className="text-3xl font-bold">{batteryLifeDays.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">dias</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">Consumo Médio</h3>
          </div>
          <p className="text-3xl font-bold">{averageCurrent.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">mA</p>
        </Card>
      </div>
      
      {/* Gráfico de Descarga da Bateria */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Descarga da Bateria</h3>
          <p className="text-sm text-muted-foreground">
            Projeção de descarga com bateria de {batteryCapacity}mAh
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={batteryDischargeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              label={{ value: 'Horas', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Carga (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="charge" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Carga da Bateria"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Gráficos Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo por Componente */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Consumo por Componente</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={powerBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis label={{ value: 'Corrente (mA)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" fill="#3b82f6" name="Ativo (mA)" />
              <Bar dataKey="sleep" fill="#10b981" name="Sleep (mA)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Distribuição de Consumo */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição de Consumo Ativo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Consumo ao Longo do Tempo */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Perfil de Consumo Diário</h3>
          <p className="text-sm text-muted-foreground">
            Variação de consumo ao longo de um dia típico
          </p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={consumptionOverTime}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'Corrente (mA)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="stepAfter" 
              dataKey="current" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Corrente"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Recomendações */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recomendações de Otimização</h3>
        <div className="space-y-3">
          {averageCurrent > 100 && (
            <div className="flex items-start gap-3">
              <Badge variant="destructive">Alta</Badge>
              <div>
                <p className="font-medium">Consumo elevado detectado</p>
                <p className="text-sm text-muted-foreground">
                  Considere usar componentes de baixo consumo ou aumentar o tempo em modo sleep
                </p>
              </div>
            </div>
          )}
          
          {batteryLifeDays < 7 && (
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-orange-100">Média</Badge>
              <div>
                <p className="font-medium">Autonomia reduzida</p>
                <p className="text-sm text-muted-foreground">
                  Bateria de {batteryCapacity}mAh fornece apenas {batteryLifeDays.toFixed(1)} dias. 
                  Considere bateria maior ou otimizar duty cycle.
                </p>
              </div>
            </div>
          )}
          
          {activeTotal > 500 && (
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-blue-100">Info</Badge>
              <div>
                <p className="font-medium">Pico de consumo alto</p>
                <p className="text-sm text-muted-foreground">
                  Consumo ativo de {activeTotal}mA pode exigir fonte de alimentação robusta
                </p>
              </div>
            </div>
          )}
          
          {batteryLifeDays >= 7 && averageCurrent <= 100 && (
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="bg-green-100">Ótimo</Badge>
              <div>
                <p className="font-medium">Consumo otimizado</p>
                <p className="text-sm text-muted-foreground">
                  Projeto com excelente eficiência energética
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PowerSimulation;
