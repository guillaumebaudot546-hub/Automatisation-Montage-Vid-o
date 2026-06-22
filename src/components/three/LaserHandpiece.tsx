import { useCurrentFrame, interpolate } from "remotion";

/**
 * Pièce à main laser Erbium-Yag (Chapitre 1).
 * Corps métallique incliné + embout + faisceau lumineux cyan pulsé.
 */
export const LaserHandpiece: React.FC = () => {
  const frame = useCurrentFrame();
  const rotY = Math.sin(frame / 100) * 0.3 + 0.4;
  const float = Math.sin(frame / 60) * 0.1;

  // Pulsation du faisceau
  const beamPulse = 0.6 + ((Math.sin(frame / 8) + 1) / 2) * 0.4;
  const beamLen = interpolate(frame % 120, [0, 60, 120], [2.2, 2.8, 2.2]);

  const steel = {
    color: "#1c2b4d",
    metalness: 0.85,
    roughness: 0.28,
  } as const;
  const accent = {
    color: "#cdd9ee",
    metalness: 0.9,
    roughness: 0.2,
  } as const;

  return (
    <group rotation={[0.2, rotY, -0.5]} position={[0, float, 0]}>
      {/* Corps principal */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2.6, 48]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Bagues d'accent */}
      {[1.4, 0.9, 0.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.54, 0.54, 0.12, 48]} />
          <meshStandardMaterial {...accent} />
        </mesh>
      ))}
      {/* Cône de focalisation */}
      <mesh position={[0, -0.95, 0]}>
        <coneGeometry args={[0.5, 1.0, 48]} />
        <meshStandardMaterial {...accent} />
      </mesh>
      {/* Embout émetteur */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.3, 32]} />
        <meshStandardMaterial color="#0a1326" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Faisceau laser (émissif) */}
      <mesh position={[0, -1.6 - beamLen / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.09, beamLen, 24]} />
        <meshBasicMaterial
          color="#7de3ff"
          transparent
          opacity={beamPulse}
        />
      </mesh>
      {/* Halo du faisceau */}
      <mesh position={[0, -1.6 - beamLen / 2, 0]}>
        <cylinderGeometry args={[0.18, 0.32, beamLen, 24]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={beamPulse * 0.18} />
      </mesh>
      {/* Point d'impact lumineux */}
      <mesh position={[0, -1.6 - beamLen, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={beamPulse} />
      </mesh>
    </group>
  );
};
