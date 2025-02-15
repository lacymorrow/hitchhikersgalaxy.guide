"use client"

import { AsciiRenderer, OrbitControls } from "@react-three/drei"
import { Canvas, useFrame } from "@react-three/fiber"
import { useRef } from "react"
import type { Mesh } from "three"

function RotatingCube() {
	const meshRef = useRef<Mesh>(null)

	useFrame((state, delta) => {
		if (meshRef.current) {
			meshRef.current.rotation.x += delta * 0.5
			meshRef.current.rotation.y += delta * 0.7
		}
	})

	return (
		<mesh ref={meshRef}>
			<boxGeometry args={[2, 2, 2]} />
			<meshStandardMaterial color="#4225F4" />
		</mesh>
	)
}

export function AsciiCube() {
	return (
		<div className="w-full h-screen bg-black">
			<Canvas camera={{ position: [0, 0, 5] }}>
				<ambientLight intensity={0.5} />
				<pointLight position={[10, 10, 10]} />
				<RotatingCube />
				<OrbitControls />
				<AsciiRenderer
					characters=" .:-+*=%@ "
					invert={true}
					fgColor="white"
					bgColor="black"
				/>
			</Canvas>
		</div>
	)
}

