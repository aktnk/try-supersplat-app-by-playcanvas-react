import * as pc from 'playcanvas'

export interface FlyCameraOptions {
  moveSpeed?: number // Units per second
  lookSpeed?: number // Degrees per pixel
  initialPitch?: number // Initial pitch angle in degrees
  initialYaw?: number // Initial yaw angle in degrees
}

export class FlyCamera {
  private app: pc.Application
  private camera: pc.Entity
  private moveSpeed: number
  private lookSpeed: number
  private pitch: number
  private yaw: number
  private pressedKeys: Set<string> = new Set()
  private isDragging: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0

  // Event handler references for cleanup
  private handleKeyDown: (e: KeyboardEvent) => void
  private handleKeyUp: (e: KeyboardEvent) => void
  private handleMouseDown: (e: MouseEvent) => void
  private handleMouseMove: (e: MouseEvent) => void
  private handleMouseUp: (e: MouseEvent) => void
  private handleMouseLeave: () => void
  private updateHandler: (dt: number) => void

  constructor(app: pc.Application, camera: pc.Entity, options: FlyCameraOptions = {}) {
    this.app = app
    this.camera = camera
    this.moveSpeed = options.moveSpeed ?? 0.1
    this.lookSpeed = options.lookSpeed ?? 0.3
    this.pitch = options.initialPitch ?? -14
    this.yaw = options.initialYaw ?? 45

    // Set initial camera rotation
    this.updateCameraRotation()

    // Create bound event handlers
    this.handleKeyDown = this.onKeyDown.bind(this)
    this.handleKeyUp = this.onKeyUp.bind(this)
    this.handleMouseDown = this.onMouseDown.bind(this)
    this.handleMouseMove = this.onMouseMove.bind(this)
    this.handleMouseUp = this.onMouseUp.bind(this)
    this.handleMouseLeave = this.onMouseLeave.bind(this)
    this.updateHandler = this.onUpdate.bind(this)

    this.setupEventListeners()
  }

  private setupEventListeners() {
    const canvas = this.app.graphicsDevice.canvas

    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('mousemove', this.handleMouseMove)
    canvas.addEventListener('mouseup', this.handleMouseUp)
    canvas.addEventListener('mouseleave', this.handleMouseLeave)

    // Update loop
    this.app.on('update', this.updateHandler)
  }

  private onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase()
    if (['w', 'a', 's', 'd', 'r', 'f'].includes(key)) {
      this.pressedKeys.add(key)
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    const key = e.key.toLowerCase()
    this.pressedKeys.delete(key)
  }

  private onMouseDown(e: MouseEvent) {
    if (e.button === 0) { // Left mouse button
      this.isDragging = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const deltaX = e.clientX - this.lastMouseX
      const deltaY = e.clientY - this.lastMouseY

      // Update yaw (horizontal rotation)
      this.yaw -= deltaX * this.lookSpeed

      // Update pitch (vertical rotation)
      this.pitch -= deltaY * this.lookSpeed

      // Clamp pitch to avoid gimbal lock
      this.pitch = Math.max(-89, Math.min(89, this.pitch))

      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY

      this.updateCameraRotation()
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.isDragging = false
    }
  }

  private onMouseLeave() {
    this.isDragging = false
  }

  private onUpdate(dt: number) {
    // Calculate movement vectors
    const forward = this.camera.forward.clone()
    const right = this.camera.right.clone()
    const up = new pc.Vec3(0, 1, 0) // World up vector

    // Get current position
    const position = this.camera.getPosition().clone()

    // Calculate movement based on pressed keys
    const moveAmount = this.moveSpeed * dt * 60 // Normalize to 60 FPS

    if (this.pressedKeys.has('w')) {
      position.add(forward.mulScalar(moveAmount))
    }
    if (this.pressedKeys.has('s')) {
      position.sub(forward.mulScalar(moveAmount))
    }
    if (this.pressedKeys.has('a')) {
      position.sub(right.mulScalar(moveAmount))
    }
    if (this.pressedKeys.has('d')) {
      position.add(right.mulScalar(moveAmount))
    }
    if (this.pressedKeys.has('r')) {
      position.add(up.mulScalar(moveAmount))
    }
    if (this.pressedKeys.has('f')) {
      position.sub(up.mulScalar(moveAmount))
    }

    // Update camera position
    this.camera.setPosition(position)
  }

  private updateCameraRotation() {
    // Set camera rotation using pitch and yaw
    this.camera.setEulerAngles(this.pitch, this.yaw, 0)
  }

  public destroy() {
    const canvas = this.app.graphicsDevice.canvas

    // Remove keyboard listeners
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)

    // Remove mouse listeners
    canvas.removeEventListener('mousedown', this.handleMouseDown)
    canvas.removeEventListener('mousemove', this.handleMouseMove)
    canvas.removeEventListener('mouseup', this.handleMouseUp)
    canvas.removeEventListener('mouseleave', this.handleMouseLeave)

    // Remove update listener
    this.app.off('update', this.updateHandler)

    // Clear pressed keys
    this.pressedKeys.clear()
  }
}
