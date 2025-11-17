// Validação e testes automáticos para dados de PCB gerados

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

export interface ComponentData {
  name: string;
  reference: string;
  value?: string;
  footprint?: string;
  x?: number;
  y?: number;
}

export interface ConnectionData {
  from: string;
  to: string;
  signal: string;
}

export const validatePCBData = (
  components: ComponentData[],
  connections: ConnectionData[]
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    info: []
  };

  // 1. Validar componentes
  if (!components || components.length === 0) {
    result.errors.push('Nenhum componente foi gerado');
    result.isValid = false;
    return result;
  }

  result.info.push(`${components.length} componentes identificados`);

  // Verificar componentes duplicados
  const references = new Set<string>();
  components.forEach(comp => {
    if (!comp.reference) {
      result.errors.push(`Componente ${comp.name} sem referência designadora`);
      result.isValid = false;
    } else if (references.has(comp.reference)) {
      result.errors.push(`Referência duplicada: ${comp.reference}`);
      result.isValid = false;
    } else {
      references.add(comp.reference);
    }

    // Validar campos obrigatórios
    if (!comp.name) {
      result.errors.push(`Componente ${comp.reference} sem nome`);
      result.isValid = false;
    }
  });

  // 2. Validar conexões
  if (!connections || connections.length === 0) {
    result.warnings.push('Nenhuma conexão foi definida');
  } else {
    result.info.push(`${connections.length} conexões identificadas`);

    connections.forEach((conn, idx) => {
      if (!conn.from || !conn.to) {
        result.errors.push(`Conexão ${idx + 1} incompleta (falta origem ou destino)`);
        result.isValid = false;
      }

      if (!conn.signal) {
        result.warnings.push(`Conexão ${idx + 1} sem identificação de sinal`);
      }

      // Verificar se componentes existem
      const fromExists = components.some(c => c.reference === conn.from);
      const toExists = components.some(c => c.reference === conn.to);

      if (!fromExists) {
        result.errors.push(`Conexão referencia componente inexistente: ${conn.from}`);
        result.isValid = false;
      }
      if (!toExists) {
        result.errors.push(`Conexão referencia componente inexistente: ${conn.to}`);
        result.isValid = false;
      }
    });
  }

  // 3. Verificar componentes essenciais
  const hasController = components.some(c => 
    c.name.includes('ESP32') || 
    c.name.includes('MCU') || 
    c.name.includes('Arduino')
  );

  if (!hasController) {
    result.warnings.push('Nenhum microcontrolador identificado no projeto');
  }

  // 4. Verificar alimentação
  const hasPowerComponents = components.some(c => 
    c.name.includes('VCC') || 
    c.name.includes('GND') || 
    c.name.includes('USB') ||
    c.reference.startsWith('J') // Conectores
  );

  if (!hasPowerComponents) {
    result.warnings.push('Componentes de alimentação não identificados');
  }

  // 5. Verificar coordenadas para visualização
  const hasCoordinates = components.every(c => 
    typeof c.x === 'number' && typeof c.y === 'number'
  );

  if (!hasCoordinates) {
    result.warnings.push('Alguns componentes não possuem coordenadas para visualização');
  }

  return result;
};

export const generateDefaultCoordinates = (components: ComponentData[]): ComponentData[] => {
  // Gerar coordenadas em grid se não existirem
  return components.map((comp, idx) => {
    if (typeof comp.x !== 'number' || typeof comp.y !== 'number') {
      const cols = Math.ceil(Math.sqrt(components.length));
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      
      return {
        ...comp,
        x: col * 2 - cols,
        y: row * 2 - Math.ceil(components.length / cols)
      };
    }
    return comp;
  });
};

export const testPCBGeneration = (
  components: ComponentData[],
  connections: ConnectionData[]
): { passed: boolean; results: string[] } => {
  const results: string[] = [];
  let passed = true;

  // Teste 1: Componentes válidos
  if (components.length === 0) {
    results.push('❌ FALHOU: Nenhum componente gerado');
    passed = false;
  } else {
    results.push(`✅ PASSOU: ${components.length} componentes gerados`);
  }

  // Teste 2: Referências únicas
  const refs = new Set(components.map(c => c.reference));
  if (refs.size !== components.length) {
    results.push('❌ FALHOU: Referências duplicadas detectadas');
    passed = false;
  } else {
    results.push('✅ PASSOU: Todas as referências são únicas');
  }

  // Teste 3: Conexões válidas
  if (connections.length > 0) {
    const validConnections = connections.every(conn => {
      const fromExists = components.some(c => c.reference === conn.from);
      const toExists = components.some(c => c.reference === conn.to);
      return fromExists && toExists;
    });

    if (validConnections) {
      results.push(`✅ PASSOU: ${connections.length} conexões válidas`);
    } else {
      results.push('❌ FALHOU: Conexões referenciam componentes inexistentes');
      passed = false;
    }
  }

  // Teste 4: Dados estruturados
  const hasRequiredFields = components.every(c => c.name && c.reference);
  if (hasRequiredFields) {
    results.push('✅ PASSOU: Todos os componentes têm campos obrigatórios');
  } else {
    results.push('❌ FALHOU: Componentes faltando dados obrigatórios');
    passed = false;
  }

  return { passed, results };
};
