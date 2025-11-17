import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Component3D {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  type: 'chip' | 'resistor' | 'capacitor' | 'connector';
}

interface PcbViewer3DProps {
  components?: Component3D[];
  boardSize?: [number, number];
}

const PCBBoard = ({ size = [50, 30] }: { size?: [number, number] }) => {
  return (
    <mesh position={[0, 0, 0]} receiveShadow>
      <boxGeometry args={[size[0], size[1], 1.6]} />
      <meshStandardMaterial 
        color="#1e4620" 
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

const ElectronicComponent = ({ 
  component 
}: { 
  component: Component3D 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <mesh 
      ref={meshRef}
      position={component.position}
      castShadow
    >
      <boxGeometry args={component.size} />
      <meshStandardMaterial 
        color={component.color}
        roughness={0.4}
        metalness={0.6}
      />
    </mesh>
  );
};

const Trace = ({ 
  start, 
  end 
}: { 
  start: [number, number, number]; 
  end: [number, number, number] 
}) => {
  const points = [start, end];

  return (
    <Line
      points={points}
      color="#ffd700"
      lineWidth={2}
    />
  );
};

const PcbViewer3D = ({ 
  components = [
    {
      name: 'ESP32',
      position: [0, 0, 2],
      size: [15, 10, 3],
      color: '#2c3e50',
      type: 'chip'
    },
    {
      name: 'LoRa Module',
      position: [20, 0, 2],
      size: [12, 8, 2.5],
      color: '#34495e',
      type: 'chip'
    },
    {
      name: 'USB-C',
      position: [-20, -10, 2],
      size: [8, 6, 3],
      color: '#95a5a6',
      type: 'connector'
    },
    {
      name: 'R1',
      position: [-15, 8, 1.5],
      size: [3, 1.5, 1],
      color: '#e74c3c',
      type: 'resistor'
    },
    {
      name: 'C1',
      position: [15, -8, 1.5],
      size: [2, 2, 2.5],
      color: '#3498db',
      type: 'capacitor'
    }
  ],
  boardSize = [50, 30]
}: PcbViewer3DProps) => {
  return (
    <div className="w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-lg overflow-hidden border border-border bg-black/5 shadow-glow-primary">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[60, 60, 60]} />
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={30}
          maxDistance={150}
        />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, 10]} intensity={0.5} />
        
        {/* PCB Board */}
        <PCBBoard size={boardSize} />
        
        {/* Components */}
        {components.map((component, index) => (
          <ElectronicComponent key={index} component={component} />
        ))}
        
        {/* Traces (conexões) */}
        <Trace 
          start={[0, 0, 2]} 
          end={[20, 0, 2]} 
        />
        <Trace 
          start={[0, 0, 2]} 
          end={[-20, -10, 2]} 
        />
        
        {/* Grid */}
        <Grid
          args={[100, 100]}
          cellSize={5}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={200}
          fadeStrength={1}
          position={[0, 0, -1]}
        />
      </Canvas>
    </div>
  );
};

export default PcbViewer3D;
