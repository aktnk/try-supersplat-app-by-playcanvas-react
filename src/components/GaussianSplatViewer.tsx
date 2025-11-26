import { useEffect, useRef, useState } from 'react'
import * as pc from 'playcanvas'
import { OrbitCamera } from '../utils/OrbitCamera'
import { FlyCamera } from '../utils/FlyCamera'
import './GaussianSplatViewer.css'

type CameraMode = 'orbit' | 'fly'

export const GaussianSplatViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<pc.Application | null>(null)
  const cameraEntityRef = useRef<pc.Entity | null>(null)
  const orbitCameraRef = useRef<OrbitCamera | null>(null)
  const flyCameraRef = useRef<FlyCamera | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit')

  useEffect(() => {
    if (!canvasRef.current) return

    // Create PlayCanvas application
    const canvas = canvasRef.current
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      keyboard: new pc.Keyboard(window),
    })

    appRef.current = app

    // Set canvas to fill the window
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(pc.RESOLUTION_AUTO)

    // Ensure canvas is resized when window changes size
    const handleResize = () => app.resizeCanvas()
    window.addEventListener('resize', handleResize)

    // Create camera entity
    const camera = new pc.Entity('camera')
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.1, 0.1, 0.1),
    })
    camera.setPosition(0, 0, 5)
    app.root.addChild(camera)
    cameraEntityRef.current = camera

    // Create light entity
    const light = new pc.Entity('light')
    light.addComponent('light', {
      type: 'directional',
    })
    light.setEulerAngles(45, 45, 0)
    app.root.addChild(light)

    // Create orbit camera controller
    // Initial camera position similar to PlayCanvas React example: [4, 1, 4]
    // This translates to pitch ~14° and yaw ~45°
    orbitCameraRef.current = new OrbitCamera(app, camera, {
      distance: Math.sqrt(4*4 + 1*1 + 4*4), // ~5.74
      pitch: -14, // Looking slightly down
      yaw: 45,    // 45 degrees from Z axis
      mouseSpeed: 0.3,
      wheelSpeed: 0.01,
      panSpeed: 0.003,
      minDistance: 1,
      maxDistance: 100,
    })

    // Start the application
    app.start()

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize)
      orbitCameraRef.current?.destroy()
      flyCameraRef.current?.destroy()
      app.destroy()
    }
  }, [])

  // Camera mode switching logic
  useEffect(() => {
    if (!appRef.current || !cameraEntityRef.current) return

    const app = appRef.current
    const camera = cameraEntityRef.current

    if (cameraMode === 'fly') {
      // Switch to Fly mode
      if (orbitCameraRef.current) {
        orbitCameraRef.current.destroy()
        orbitCameraRef.current = null
      }

      if (!flyCameraRef.current) {
        flyCameraRef.current = new FlyCamera(app, camera, {
          moveSpeed: 0.1,
          lookSpeed: 0.3,
          initialPitch: -14,
          initialYaw: 45,
        })
      }
    } else {
      // Switch to Orbit mode
      if (flyCameraRef.current) {
        flyCameraRef.current.destroy()
        flyCameraRef.current = null
      }

      if (!orbitCameraRef.current) {
        orbitCameraRef.current = new OrbitCamera(app, camera, {
          distance: Math.sqrt(4*4 + 1*1 + 4*4), // ~5.74
          pitch: -14,
          yaw: 45,
          mouseSpeed: 0.3,
          wheelSpeed: 0.01,
          panSpeed: 0.003,
          minDistance: 1,
          maxDistance: 100,
        })
      }
    }
  }, [cameraMode])

  // Keyboard shortcut for camera mode switching (Tab key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        setCameraMode(prev => prev === 'orbit' ? 'fly' : 'orbit')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadGaussianSplatFile = async (url: string, filename: string) => {
    if (!appRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const app = appRef.current

      // Determine file extension
      const extension = filename.split('.').pop()?.toLowerCase()

      // Validate file format
      if (!extension || !['ply', 'sog', 'splat'].includes(extension)) {
        setError(`Unsupported file format: ${extension}`)
        setIsLoading(false)
        return
      }

      // Create gsplat asset
      const asset = new pc.Asset('model', 'gsplat', { url, filename })

      // Set up event handlers before loading
      asset.once('load', () => {
        try {
          // Create entity and add gsplat component
          const entity = new pc.Entity('gsplat')
          entity.addComponent('gsplat', {
            asset: asset,
          })
          app.root.addChild(entity)
          setIsLoading(false)
        } catch (err) {
          setError(`Failed to create entity: ${err instanceof Error ? err.message : String(err)}`)
          setIsLoading(false)
        }
      })

      asset.once('error', (err: string | Error) => {
        const errorMessage = err instanceof Error ? err.message : String(err)
        setError(`Failed to load file: ${errorMessage}`)
        setIsLoading(false)
      })

      // Add and load asset
      app.assets.add(asset)
      app.assets.load(asset)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      loadGaussianSplatFile(url, file.name)
    }
  }

  return (
    <div className="viewer-container">
      <div className="controls">
        <label htmlFor="file-input" className="file-label">
          Load 3DGS File
        </label>
        <input
          id="file-input"
          type="file"
          accept=".ply,.sog,.splat"
          onChange={handleFileSelect}
          className="file-input"
        />
        {isLoading && <span className="status">Loading...</span>}
        {error && <span className="error">{error}</span>}
      </div>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'monospace',
        userSelect: 'none',
        pointerEvents: 'none',
      }}>
        Camera: {cameraMode.toUpperCase()} (Tab to switch)
      </div>
      <canvas ref={canvasRef} className="playcanvas-canvas" />
    </div>
  )
}
