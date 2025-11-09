// Biblioteca de componentes eletrônicos com especificações técnicas completas

export interface ComponentSpec {
  id: string;
  name: string;
  category: 'microcontroller' | 'lora' | 'gps' | 'power' | 'connector' | 'passive';
  description: string;
  voltage: number;
  currentActive?: number;
  currentSleep?: number;
  interfaces?: string[];
  footprint: string;
  symbol: string;
  pins: ComponentPin[];
  price: number;
  supplier: string;
  datasheet?: string;
}

export interface ComponentPin {
  number: number;
  name: string;
  type: 'power' | 'ground' | 'io' | 'analog' | 'digital';
}

export const COMPONENT_LIBRARY: Record<string, ComponentSpec> = {
  'ESP32-WROOM-32U': {
    id: 'ESP32-WROOM-32U',
    name: 'ESP32-WROOM-32U',
    category: 'microcontroller',
    description: 'Microcontrolador WiFi/BLE com antena U.FL',
    voltage: 3.3,
    currentActive: 240,
    currentSleep: 0.01,
    interfaces: ['WiFi', 'Bluetooth', 'UART', 'SPI', 'I2C'],
    footprint: 'ESP32-WROOM-32U',
    symbol: 'MCU_ESP32',
    pins: [
      { number: 1, name: 'GND', type: 'ground' },
      { number: 2, name: '3V3', type: 'power' },
      { number: 3, name: 'EN', type: 'digital' },
      { number: 15, name: 'IO0', type: 'io' },
      { number: 25, name: 'TX', type: 'io' },
      { number: 26, name: 'RX', type: 'io' },
    ],
    price: 4.50,
    supplier: 'Espressif',
    datasheet: 'https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32_datasheet_en.pdf'
  },
  'E22-900M30S': {
    id: 'E22-900M30S',
    name: 'E22-900M30S (LoRa 1W)',
    category: 'lora',
    description: 'Módulo LoRa 1W (30dBm) 915MHz',
    voltage: 3.3,
    currentActive: 1200,
    currentSleep: 2,
    interfaces: ['UART'],
    footprint: 'E22-900M30S',
    symbol: 'RF_MODULE',
    pins: [
      { number: 1, name: 'M0', type: 'digital' },
      { number: 2, name: 'M1', type: 'digital' },
      { number: 3, name: 'RXD', type: 'io' },
      { number: 4, name: 'TXD', type: 'io' },
      { number: 5, name: 'AUX', type: 'io' },
      { number: 6, name: 'VCC', type: 'power' },
      { number: 7, name: 'GND', type: 'ground' },
    ],
    price: 12.80,
    supplier: 'Ebyte'
  },
  'NEO-8M': {
    id: 'NEO-8M',
    name: 'NEO-8M GPS',
    category: 'gps',
    description: 'Módulo GPS com alta sensibilidade',
    voltage: 3.3,
    currentActive: 45,
    interfaces: ['UART', 'I2C'],
    footprint: 'GPS_MODULE',
    symbol: 'GPS',
    pins: [
      { number: 1, name: 'VCC', type: 'power' },
      { number: 2, name: 'GND', type: 'ground' },
      { number: 3, name: 'TX', type: 'io' },
      { number: 4, name: 'RX', type: 'io' },
    ],
    price: 8.50,
    supplier: 'u-blox'
  },
  'AMS1117-3.3': {
    id: 'AMS1117-3.3',
    name: 'AMS1117-3.3',
    category: 'power',
    description: 'Regulador linear LDO 3.3V 1A',
    voltage: 3.3,
    footprint: 'SOT-223',
    symbol: 'VREG',
    pins: [
      { number: 1, name: 'GND', type: 'ground' },
      { number: 2, name: 'VOUT', type: 'power' },
      { number: 3, name: 'VIN', type: 'power' },
    ],
    price: 0.30,
    supplier: 'Generic'
  },
  'USB-C-16P': {
    id: 'USB-C-16P',
    name: 'Conector USB-C',
    category: 'connector',
    description: 'Conector USB Type-C 16 pinos',
    voltage: 5,
    footprint: 'USB_C_16P',
    symbol: 'USB_C',
    pins: [
      { number: 1, name: 'GND', type: 'ground' },
      { number: 2, name: 'VBUS', type: 'power' },
      { number: 3, name: 'D+', type: 'io' },
      { number: 4, name: 'D-', type: 'io' },
    ],
    price: 1.20,
    supplier: 'Generic'
  },
  'CAP-10uF': {
    id: 'CAP-10uF',
    name: 'Capacitor 10µF',
    category: 'passive',
    description: 'Capacitor cerâmico 10µF 16V',
    voltage: 16,
    footprint: '0805',
    symbol: 'C',
    pins: [
      { number: 1, name: '1', type: 'io' },
      { number: 2, name: '2', type: 'io' },
    ],
    price: 0.05,
    supplier: 'Generic'
  },
  'RES-10K': {
    id: 'RES-10K',
    name: 'Resistor 10kΩ',
    category: 'passive',
    description: 'Resistor 10kΩ 1% 0.125W',
    voltage: 50,
    footprint: '0805',
    symbol: 'R',
    pins: [
      { number: 1, name: '1', type: 'io' },
      { number: 2, name: '2', type: 'io' },
    ],
    price: 0.02,
    supplier: 'Generic'
  }
};

export const getComponentByCategory = (category: ComponentSpec['category']) => {
  return Object.values(COMPONENT_LIBRARY).filter(c => c.category === category);
};

export const getComponentById = (id: string) => {
  return COMPONENT_LIBRARY[id];
};

export const calculatePowerConsumption = (components: string[]) => {
  let activeTotal = 0;
  let sleepTotal = 0;
  
  components.forEach(compId => {
    const comp = COMPONENT_LIBRARY[compId];
    if (comp) {
      activeTotal += comp.currentActive || 0;
      sleepTotal += comp.currentSleep || 0;
    }
  });
  
  return { activeTotal, sleepTotal };
};