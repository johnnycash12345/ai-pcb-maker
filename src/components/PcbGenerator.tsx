import React from 'react';

import { renderToGerber, Resistor } from 'tscircuit';

const MyCircuit = () => {
  return (
    <Resistor
      name="R1"
      resistance="10k"
      footprint="0805"
      center={[1, 1]} 
    />
  );
};

const PcbGenerator = () => {
  const handleGenerate = async () => {
    const gerberData = await renderToGerber(<MyCircuit />);
    
    // Lógica para download dos arquivos Gerber
    for (const [filename, content] of Object.entries(gerberData)) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    alert('Arquivos Gerber gerados e download iniciado!');
  };

  return (
    <div>
      <button onClick={handleGenerate}>Gerar PCB</button>
    </div>
  );
};

export default PcbGenerator;
