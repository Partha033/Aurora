import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Float, 
  MeshDistortMaterial, 
  OrbitControls, 
  Environment,
  ContactShadows,
  PerspectiveCamera
} from '@react-three/drei';

const Gemstone = () => {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.cos(t / 4) / 8;
      meshRef.current.rotation.y = Math.sin(t / 4) / 8;
      meshRef.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
    }
  });

  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[2, 0]} />
          <MeshDistortMaterial
            color="#c9a84c"
            speed={2}
            distort={0.3}
            radius={1}
            metalness={0.9}
            roughness={0.1}
            emissive="#c9a84c"
            emissiveIntensity={0.2}
          />
        </mesh>
      </Float>
      
      {/* Second inner geometric shape for depth */}
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.2} 
        />
      </mesh>
    </group>
  );
};

const JewelryCanvas = () => {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c9a84c" />
        
        <React.Suspense fallback={null}>
          <Gemstone />
          <Environment preset="city" />
          <ContactShadows 
            position={[0, -3.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4.5} 
          />
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};

export default JewelryCanvas;
