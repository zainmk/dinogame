import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { WORLD_RADIUS } from '../config'
import { TREES, type Tree } from '../data/world'
import { anyTangent, createSurfaceState, orientToSurface } from '../math/sphere'
import { useGame } from '../store'

/**
 * Trees. The velociraptor's fire burns them down, leaving a charred stump and
 * the coins that were up in the branches.
 *
 * Unlike boxes these are not solid — you run straight through them. Foliage you
 * can walk through is a normal game convention, and it keeps collision to one
 * kind of obstacle.
 */
export function Trees() {
  const burnt = useGame((s) => s.burntTrees)
  return (
    <>
      {TREES.map((tree) => (
        <Pine key={tree.id} tree={tree} burnt={burnt.has(tree.id)} />
      ))}
    </>
  )
}

function Pine({ tree, burnt }: { tree: Tree; burnt: boolean }) {
  const group = useRef<Group>(null)

  const surface = useMemo(
    () => createSurfaceState(tree.pos, anyTangent(tree.pos)),
    [tree.pos],
  )

  useFrame(() => {
    if (group.current) orientToSurface(group.current, surface, WORLD_RADIUS)
  })

  const trunk = burnt ? '#2e2622' : '#6b4a2c'

  return (
    <group ref={group} scale={tree.scale}>
      <mesh castShadow position={[0, burnt ? 0.42 : 0.55, 0]}>
        <cylinderGeometry args={[0.14, 0.19, burnt ? 0.84 : 1.1, 7]} />
        <meshStandardMaterial color={trunk} flatShading roughness={0.95} />
      </mesh>

      {burnt ? (
        // A couple of broken branches left behind, so the stump still reads as
        // "this was a tree" rather than as a post.
        <>
          <mesh castShadow position={[0.16, 0.78, 0.05]} rotation={[0.3, 0, -0.9]}>
            <cylinderGeometry args={[0.05, 0.07, 0.4, 5]} />
            <meshStandardMaterial color={trunk} flatShading />
          </mesh>
          <mesh castShadow position={[-0.14, 0.66, -0.08]} rotation={[-0.2, 0, 1.0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.32, 5]} />
            <meshStandardMaterial color={trunk} flatShading />
          </mesh>
        </>
      ) : (
        [0, 1, 2].map((i) => (
          <mesh key={i} castShadow position={[0, 1.15 + i * 0.45, 0]}>
            <coneGeometry args={[0.78 - i * 0.19, 0.78, 7]} />
            <meshStandardMaterial
              color={i === 2 ? '#3f8f52' : '#357a45'}
              flatShading
              roughness={0.9}
            />
          </mesh>
        ))
      )}
    </group>
  )
}
