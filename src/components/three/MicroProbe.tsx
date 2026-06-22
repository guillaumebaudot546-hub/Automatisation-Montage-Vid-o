import { useCurrentFrame } from "remotion";

/**
 * Micro-instrument de chirurgie (Chapitre 2) : manche cannelé en inox
 * + tige fine + lame/pointe courbée. Rotation lente, reflets spéculaires.
 */
export const MicroProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const rotY = frame * 0.0055;
  const tilt = 0.5 + Math.sin(frame / 120) * 0.09;

  const steel = {
    color: "#dbe3ee",
    metalness: 0.95,
    roughness: 0.18,
  } as const;
  const dark = {
    color: "#16243f",
    metalness: 0.8,
    roughness: 0.3,
  } as const;

  return (
    <group rotation={[0, rotY, tilt]}>
      {/* Manche cannelé (octogone via cylindre basse résolution) */}
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[0.34, 0.3, 2.2, 12]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Bagues du manche */}
      {[-2.3, -1.9, -1.5, -1.1, -0.7].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.33, 0.03, 12, 32]} />
          <meshStandardMaterial {...steel} />
        </mesh>
      ))}
      {/* Collerette */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 0.4, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Tige fine */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 2.2, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {/* Pointe courbée (lame) */}
      <mesh position={[0.12, 2.1, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.09, 0.6, 24]} />
        <meshStandardMaterial {...steel} />
      </mesh>
    </group>
  );
};
