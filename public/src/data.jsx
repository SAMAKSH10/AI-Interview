// src/components/FogBackground.jsx
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import FOG from 'vanta/dist/vanta.fog.min'; // Import Vanta's fog effect
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported
import './components/custom.css'; // Import custom CSS if needed

const FogBackground = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = React.useState(null);

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(
        FOG({
          el: vantaRef.current,
          THREE: THREE, // Pass the Three.js instance
          mouseControls: true,
  touchControls: true,
  gyroControls: false,
  minHeight: 740.00,
  minWidth: 200.00,
  highlightColor: 0xd622e3,
  midtoneColor: 0xff0000,
  lowlightColor: 0xffc51c,
  baseColor: 0x60606,
  blurFactor: 0.46,
  speed: 1.00
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div className="relative w-screen h-screen bg-main-bg bg-cover bg-no-repeat" ref={vantaRef}>
      {/* Overlay for better visibility */}

      {/* Content to visualize */}
    </div>
  );
};

export default FogBackground;
