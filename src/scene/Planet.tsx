import { WORLD_RADIUS } from '../config'

/**
 * The world. An icosahedron with flat shading rather than a sphere, so the
 * facets catch the light and give the surface some readable structure.
 */
export function Planet() {
  return (
    <mesh receiveShadow>
      <icosahedronGeometry args={[WORLD_RADIUS, 12]} />
      <meshStandardMaterial color="#4c9f5e" flatShading roughness={0.95} metalness={0} />
    </mesh>
  )
}
