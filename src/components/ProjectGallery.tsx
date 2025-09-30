import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radio, Thermometer, Zap, ExternalLink, Cpu } from "lucide-react";

const exampleProjects = [
  {
    id: 1,
    name: "Meshtastic Long Range Node",
    description: "Nó de comunicação LoRa 1W com GPS integrado e alimentação USB-C",
    icon: Radio,
    color: "primary",
    specs: {
      dimensions: "50x30mm",
      layers: 2,
      components: 15,
      power: "240mA"
    },
    features: ["ESP32-WROOM-32U", "LoRa 1W (915MHz)", "GPS NEO-8M", "USB-C PD"]
  },
  {
    id: 2,
    name: "IoT Environmental Sensor",
    description: "Sensor ambiental com ESP32, DHT22 e conectividade WiFi/BLE",
    icon: Thermometer,
    color: "secondary",
    specs: {
      dimensions: "40x40mm",
      layers: 2,
      components: 12,
      power: "80mA"
    },
    features: ["ESP32-C3", "DHT22", "BME280", "Bateria Li-Ion"]
  },
  {
    id: 3,
    name: "Smart Solar Charger",
    description: "Carregador solar MPPT com monitoramento via WiFi e proteções",
    icon: Zap,
    color: "accent",
    specs: {
      dimensions: "60x45mm",
      layers: 2,
      components: 24,
      power: "2A"
    },
    features: ["MPPT Controller", "ESP8266", "LCD Display", "USB-C Output"]
  }
];

const ProjectGallery = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Projetos de Exemplo</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore projetos criados pela comunidade e use-os como ponto de partida
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {exampleProjects.map((project) => {
            const Icon = project.icon;
            return (
              <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow bg-gradient-card">
                <div className={`bg-${project.color}/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 text-${project.color}`} />
                </div>

                <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dimensões:</span>
                      <div className="font-medium">{project.specs.dimensions}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Camadas:</span>
                      <div className="font-medium">{project.specs.layers}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Componentes:</span>
                      <div className="font-medium">{project.specs.components}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Consumo:</span>
                      <div className="font-medium">{project.specs.power}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Principais componentes:</div>
                    <div className="flex flex-wrap gap-1">
                      {project.features.map((feature, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 rounded-full bg-muted"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Cpu className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            Ver Todos os Projetos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProjectGallery;
