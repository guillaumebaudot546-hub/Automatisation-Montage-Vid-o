import { ThreeCanvas } from "@remotion/three";

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
  cameraZ?: number;
  fov?: number;
}

/**
 * Scene 3D (R3F via @remotion/three) au fond transparent.
 * Eclairage "studio" premium : key blanche + rim champagne + fill teal.
 */
export const ThreeStage: React.FC<Props> = ({
  width,
  height,
  children,
  cameraZ = 6,
  fov = 45,
}) => {
  return (
    <ThreeCanvas
      width={Math.round(width)}
      height={Math.round(height)}
      camera={{ position: [0, 0, cameraZ], fov }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.85} color="#B8C4D6" />
      {/* Key blanche */}
      <directionalLight position={[5, 6, 5]} intensity={2.8} color="#ffffff" />
      {/* Rim champagne (chaud) */}
      <pointLight position={[-5, 3, 4]} intensity={120} decay={2} color="#49B6C9" />
      {/* Fill teal (froid, marque) */}
      <pointLight position={[4, -3, -3]} intensity={70} decay={2} color="#49B6C9" />
      {children}
    </ThreeCanvas>
  );
};
