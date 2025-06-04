import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

interface CADViewerProps {
  modelPath: string
  width?: string | number
  height?: string | number
}

export default function CADViewer({ modelPath, width = '100%', height = '500px' }: CADViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 100

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    mountRef.current.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // Load Model (STL or GLB)
    const loader = modelPath.toLowerCase().endsWith('.glb') ? new GLTFLoader() : new STLLoader();

    loader.load(modelPath, (loadedObject) => {
      let model;
      if (loadedObject instanceof THREE.BufferGeometry) { // STLLoader result
        const material = new THREE.MeshNormalMaterial(); // Use NormalMaterial for STL simplicity
        model = new THREE.Mesh(loadedObject, material);
      } else { // GLTFLoader result
        model = loadedObject.scene; // GLTF has a scene
      }

      // Center the model
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      
      // Scale the model to fit the view (adjust scaling factor as needed)
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const cameraDistance = maxDim * 1.5; // Distance from camera to model
      camera.position.z = cameraDistance;
      
      scene.add(model)

      // Adjust camera to look at the centered model
      camera.lookAt(scene.position);
      controls.target.set(scene.position.x, scene.position.y, scene.position.z);
      controls.update();

      renderer.render(scene, camera)
    })

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      mountRef.current?.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [modelPath])

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width, 
        height,
        position: 'relative'
      }} 
    />
  )
} 