import { useCurrentFrame } from "remotion";

/**
 * Implant dentaire en zircone (Chapitre 3).
 * Corps fileté (anneaux empilés) + col + pilier. Matériau zircone blanc.
 * Rotation lente sur Y, légère oscillation.
 */
export const ImplantScrew: React.FC = () => {
  const frame = useCurrentFrame();
  const rotY = frame * 0.006;
  const tilt = Math.sin(frame / 110) * 0.10;

  // Anneaux de filetage : rayon décroissant vers le bas (forme conique)
  const threads = 14;
  const zirconia = {
    color: "#eaf1f8",
    metalness: 0.18,
    roughness: 0.16,
    emissive: "#1b3a6b",
    emissiveIntensity: 0.15,
  } as const;

  return (
    <group rotation={[tilt, rotY, 0]} position={[0, -0.2, 0]}>
      {/* Pilier prothétique (haut) */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.42, 0.55, 0.9, 48]} />
        <meshStandardMaterial {...zirconia} />
      </mesh>
      {/* Col lisse */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 48]} />
        <meshStandardMaterial {...zirconia} />
      </mesh>

      {/* Corps fileté */}
      {Array.from({ length: threads }).map((_, i) => {
        const t = i / (threads - 1);
        const y = 1.25 - t * 3.0;
        const r = 0.62 - t * 0.34; // conique
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[r, 0.12, 16, 48]} />
            <meshStandardMaterial {...zirconia} />
          </mesh>
        );
      })}
      {/* Âme centrale du corps */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.5, 0.18, 3.0, 48]} />
        <meshStandardMaterial {...zirconia} />
      </mesh>
      {/* Apex pointu */}
      <mesh position={[0, -1.9, 0]}>
        <coneGeometry args={[0.18, 0.5, 48]} />
        <meshStandardMaterial {...zirconia} />
      </mesh>
    </group>
  );
};
