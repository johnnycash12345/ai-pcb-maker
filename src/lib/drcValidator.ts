// Design Rule Check (DRC) - Validação automática de design de PCB

export interface DRCError {
  type: 'clearance' | 'routing' | 'power' | 'thermal' | 'signal_integrity';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: { x: number; y: number };
  components?: string[];
}

export interface DRCRules {
  minTraceWidth: number; // mm
  minClearance: number; // mm
  minViaDiameter: number; // mm
  maxCurrentPerTrace: number; // A
  maxBoardTemp: number; // °C
}

export const DEFAULT_DRC_RULES: DRCRules = {
  minTraceWidth: 0.15, // 6 mil
  minClearance: 0.15, // 6 mil
  minViaDiameter: 0.3,
  maxCurrentPerTrace: 1.0,
  maxBoardTemp: 85
};

interface Component {
  name: string;
  reference: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  signal: string;
}

interface PowerSpecs {
  voltage?: string;
  current_active?: string;
  current_sleep?: string;
}

export const validateDesign = (
  components: Component[],
  connections: Connection[],
  powerSpecs?: PowerSpecs,
  rules: DRCRules = DEFAULT_DRC_RULES
): DRCError[] => {
  const errors: DRCError[] = [];

  // 1. Verificar clearance entre componentes
  errors.push(...checkComponentClearance(components, rules.minClearance));

  // 2. Verificar conexões de alimentação
  errors.push(...checkPowerConnections(components, connections));

  // 3. Verificar integridade de sinal
  errors.push(...checkSignalIntegrity(connections));

  // 4. Verificar consumo de corrente
  if (powerSpecs) {
    errors.push(...checkPowerConsumption(powerSpecs, rules.maxCurrentPerTrace));
  }

  // 5. Verificar thermal
  errors.push(...checkThermalDesign(components, powerSpecs));

  return errors;
};

const checkComponentClearance = (components: Component[], minClearance: number): DRCError[] => {
  const errors: DRCError[] = [];
  const componentSize = 60; // pixels (estimated bounding box)
  const minDistancePixels = minClearance * 200; // Convert mm to pixels (approx scale)

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const comp1 = components[i];
      const comp2 = components[j];
      
      const distance = Math.sqrt(
        Math.pow(comp1.x - comp2.x, 2) + 
        Math.pow(comp1.y - comp2.y, 2)
      );

      if (distance < minDistancePixels) {
        errors.push({
          type: 'clearance',
          severity: 'error',
          message: `Clearance insuficiente entre ${comp1.reference} e ${comp2.reference} (${distance.toFixed(1)}px, mínimo ${minDistancePixels}px)`,
          components: [comp1.reference, comp2.reference],
          location: { 
            x: (comp1.x + comp2.x) / 2, 
            y: (comp1.y + comp2.y) / 2 
          }
        });
      }
    }
  }

  return errors;
};

const checkPowerConnections = (components: Component[], connections: Connection[]): DRCError[] => {
  const errors: DRCError[] = [];
  const powerSignals = connections.filter(c => 
    c.signal.includes('VCC') || 
    c.signal.includes('GND') || 
    c.signal.includes('3V3') ||
    c.signal.includes('5V')
  );

  // Verificar se todos os componentes têm conexões de alimentação
  components.forEach(comp => {
    const hasPowerConnection = powerSignals.some(
      conn => conn.from === comp.reference || conn.to === comp.reference
    );
    
    if (!hasPowerConnection && !comp.reference.startsWith('R') && !comp.reference.startsWith('C')) {
      errors.push({
        type: 'power',
        severity: 'error',
        message: `Componente ${comp.reference} sem conexão de alimentação`,
        components: [comp.reference],
        location: { x: comp.x, y: comp.y }
      });
    }
  });

  // Verificar se há conexões GND
  const hasGround = powerSignals.some(conn => conn.signal.includes('GND'));
  if (!hasGround && components.length > 0) {
    errors.push({
      type: 'power',
      severity: 'error',
      message: 'Nenhuma conexão GND encontrada no design',
    });
  }

  return errors;
};

const checkSignalIntegrity = (connections: Connection[]): DRCError[] => {
  const errors: DRCError[] = [];
  
  // Verificar sinais críticos (alta velocidade)
  const criticalSignals = ['SPI', 'I2C', 'UART', 'SCL', 'SDA', 'MOSI', 'MISO', 'SCK'];
  
  connections.forEach(conn => {
    const isCritical = criticalSignals.some(sig => 
      conn.signal.toUpperCase().includes(sig)
    );
    
    if (isCritical) {
      errors.push({
        type: 'signal_integrity',
        severity: 'warning',
        message: `Sinal de alta velocidade detectado (${conn.signal}): verifique roteamento e impedância`,
        components: [conn.from, conn.to]
      });
    }
  });

  // Verificar sinais duplicados
  const signalCounts = new Map<string, number>();
  connections.forEach(conn => {
    signalCounts.set(conn.signal, (signalCounts.get(conn.signal) || 0) + 1);
  });

  signalCounts.forEach((count, signal) => {
    if (count > 3) {
      errors.push({
        type: 'routing',
        severity: 'warning',
        message: `Sinal ${signal} com múltiplas conexões (${count}): considere usar net com nome único`,
      });
    }
  });

  return errors;
};

const checkPowerConsumption = (powerSpecs: PowerSpecs, maxCurrent: number): DRCError[] => {
  const errors: DRCError[] = [];
  
  if (powerSpecs.current_active) {
    const currentValue = parseFloat(powerSpecs.current_active);
    
    if (currentValue > maxCurrent * 1000) {
      errors.push({
        type: 'power',
        severity: 'warning',
        message: `Corrente ativa muito alta (${currentValue}mA): considere trilhas mais largas ou planos de cobre`,
      });
    }

    if (currentValue > 500) {
      errors.push({
        type: 'thermal',
        severity: 'info',
        message: `Consumo elevado detectado (${currentValue}mA): considere análise térmica detalhada`,
      });
    }
  }

  return errors;
};

const checkThermalDesign = (components: Component[], powerSpecs?: PowerSpecs): DRCError[] => {
  const errors: DRCError[] = [];
  
  // Verificar componentes de alta potência
  const powerComponents = components.filter(c => 
    c.name.includes('AMS1117') || 
    c.name.includes('VREG') ||
    c.reference.startsWith('U')
  );

  powerComponents.forEach(comp => {
    const nearbyComponents = components.filter(c => {
      if (c.reference === comp.reference) return false;
      const distance = Math.sqrt(
        Math.pow(comp.x - c.x, 2) + 
        Math.pow(comp.y - c.y, 2)
      );
      return distance < 100; // pixels
    });

    if (nearbyComponents.length > 3) {
      errors.push({
        type: 'thermal',
        severity: 'warning',
        message: `Componente ${comp.reference} com muitos componentes próximos: pode causar aquecimento`,
        components: [comp.reference],
        location: { x: comp.x, y: comp.y }
      });
    }
  });

  return errors;
};

export const getSeverityColor = (severity: DRCError['severity']) => {
  switch (severity) {
    case 'error': return 'text-destructive';
    case 'warning': return 'text-yellow-600';
    case 'info': return 'text-blue-600';
  }
};

export const getSeverityIcon = (severity: DRCError['severity']) => {
  switch (severity) {
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
  }
};