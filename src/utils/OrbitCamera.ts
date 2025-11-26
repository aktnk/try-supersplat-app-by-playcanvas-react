import * as pc from 'playcanvas'

interface OrbitCameraOptions {
  distance?: number
  pitch?: number
  yaw?: number
  mouseSpeed?: number
  wheelSpeed?: number
  panSpeed?: number
  minDistance?: number
  maxDistance?: number
  minPitch?: number
  maxPitch?: number
}

export class OrbitCamera {
  private app: pc.Application
  private camera: pc.Entity
  private target: pc.Vec3
  private distance: number
  private pitch: number
  private yaw: number
  private mouseSpeed: number
  private wheelSpeed: number
  private panSpeed: number
  private minDistance: number
  private maxDistance: number
  private minPitch: number
  private maxPitch: number
  private isDragging: boolean = false
  private isPanning: boolean = false
  private lastMouseX: number = 0
  private lastMouseY: number = 0
  private lastTouchDistance: number | null = null

  // Event handler references for cleanup
  private handleMouseDown: (event: MouseEvent) => void
  private handleMouseMove: (event: MouseEvent) => void
  private handleMouseUp: (event: MouseEvent) => void
  private handleMouseLeave: () => void
  private handleWheel: (event: WheelEvent) => void
  private handleTouchStart: (event: TouchEvent) => void
  private handleTouchMove: (event: TouchEvent) => void
  private handleTouchEnd: () => void

  constructor(app: pc.Application, camera: pc.Entity, options: OrbitCameraOptions = {}) {
    this.app = app
    this.camera = camera
    this.target = new pc.Vec3(0, 0, 0)
    this.distance = options.distance ?? 5
    this.pitch = options.pitch ?? 0
    this.yaw = options.yaw ?? 0
    this.mouseSpeed = options.mouseSpeed ?? 0.3
    this.wheelSpeed = options.wheelSpeed ?? 0.1
    this.panSpeed = options.panSpeed ?? 0.01
    this.minDistance = options.minDistance ?? 1
    this.maxDistance = options.maxDistance ?? 100
    this.minPitch = options.minPitch ?? -Infinity
    this.maxPitch = options.maxPitch ?? Infinity

    // Bind event handlers
    this.handleMouseDown = this.onMouseDown.bind(this)
    this.handleMouseMove = this.onMouseMove.bind(this)
    this.handleMouseUp = this.onMouseUp.bind(this)
    this.handleMouseLeave = this.onMouseLeave.bind(this)
    this.handleWheel = this.onWheel.bind(this)
    this.handleTouchStart = this.onTouchStart.bind(this)
    this.handleTouchMove = this.onTouchMove.bind(this)
    this.handleTouchEnd = this.onTouchEnd.bind(this)

    this.setupEventListeners()
    this.updateCameraPosition()
  }

  private setupEventListeners() {
    const canvas = this.app.graphicsDevice.canvas

    // Mouse events
    canvas.addEventListener('mousedown', this.handleMouseDown)
    canvas.addEventListener('mousemove', this.handleMouseMove)
    canvas.addEventListener('mouseup', this.handleMouseUp)
    canvas.addEventListener('mouseleave', this.handleMouseLeave)
    canvas.addEventListener('wheel', this.handleWheel)

    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart)
    canvas.addEventListener('touchmove', this.handleTouchMove)
    canvas.addEventListener('touchend', this.handleTouchEnd)
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button === 0) { // Left mouse button
      if (event.shiftKey) {
        this.isPanning = true
      } else {
        this.isDragging = true
      }
      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (this.isPanning) {
      // Pan mode (Shift + drag)
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY

      // Calculate pan direction based on camera orientation
      const pitchRad = this.pitch * pc.math.DEG_TO_RAD
      const yawRad = this.yaw * pc.math.DEG_TO_RAD

      // Right vector
      const rightX = Math.cos(yawRad)
      const rightZ = -Math.sin(yawRad)

      // Up vector (perpendicular to right and forward)
      const upX = -Math.sin(yawRad) * Math.sin(pitchRad)
      const upY = Math.cos(pitchRad)
      const upZ = -Math.cos(yawRad) * Math.sin(pitchRad)

      // Apply pan movement
      const panScale = this.panSpeed * this.distance
      this.target.x += rightX * deltaX * panScale - upX * deltaY * panScale
      this.target.y -= upY * deltaY * panScale
      this.target.z += rightZ * deltaX * panScale - upZ * deltaY * panScale

      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY

      this.updateCameraPosition()
    } else if (this.isDragging) {
      // Rotate mode (normal drag)
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY

      this.yaw -= deltaX * this.mouseSpeed
      this.pitch -= deltaY * this.mouseSpeed

      // Clamp pitch if limits are finite
      if (isFinite(this.minPitch) && isFinite(this.maxPitch)) {
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch))
      }

      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY

      this.updateCameraPosition()
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (event.button === 0) {
      this.isDragging = false
      this.isPanning = false
    }
  }

  private onMouseLeave() {
    this.isDragging = false
    this.isPanning = false
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    this.distance += event.deltaY * this.wheelSpeed
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))
    this.updateCameraPosition()
  }

  private onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isDragging = true
      this.lastMouseX = event.touches[0].clientX
      this.lastMouseY = event.touches[0].clientY
    } else if (event.touches.length === 2) {
      const dx = event.touches[0].clientX - event.touches[1].clientX
      const dy = event.touches[0].clientY - event.touches[1].clientY
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
    }
  }

  private onTouchMove(event: TouchEvent) {
    event.preventDefault()
    if (event.touches.length === 1 && this.isDragging) {
      const deltaX = event.touches[0].clientX - this.lastMouseX
      const deltaY = event.touches[0].clientY - this.lastMouseY

      this.yaw -= deltaX * this.mouseSpeed
      this.pitch -= deltaY * this.mouseSpeed

      // Clamp pitch if limits are finite
      if (isFinite(this.minPitch) && isFinite(this.maxPitch)) {
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch))
      }

      this.lastMouseX = event.touches[0].clientX
      this.lastMouseY = event.touches[0].clientY

      this.updateCameraPosition()
    } else if (event.touches.length === 2 && this.lastTouchDistance !== null) {
      const dx = event.touches[0].clientX - event.touches[1].clientX
      const dy = event.touches[0].clientY - event.touches[1].clientY
      const newDistance = Math.sqrt(dx * dx + dy * dy)
      const delta = newDistance - this.lastTouchDistance

      this.distance -= delta * 0.01
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))

      this.lastTouchDistance = newDistance
      this.updateCameraPosition()
    }
  }

  private onTouchEnd() {
    this.isDragging = false
    this.lastTouchDistance = null
  }

  private updateCameraPosition() {
    const pitchRad = this.pitch * pc.math.DEG_TO_RAD
    const yawRad = this.yaw * pc.math.DEG_TO_RAD

    // Calculate camera position using spherical coordinates
    const x = this.target.x + this.distance * Math.sin(yawRad) * Math.cos(pitchRad)
    const y = this.target.y + this.distance * Math.sin(pitchRad)
    const z = this.target.z + this.distance * Math.cos(yawRad) * Math.cos(pitchRad)

    this.camera.setPosition(x, y, z)

    // Calculate the correct up vector
    // The up vector is perpendicular to the view direction and points "up" in camera space
    // For orbit camera, we derive it from the spherical coordinates

    // Calculate the "right" vector (perpendicular to yaw rotation axis)
    const rightX = Math.cos(yawRad)
    const rightY = 0
    const rightZ = -Math.sin(yawRad)

    // Calculate the "forward" vector (from camera to target)
    const forwardX = this.target.x - x
    const forwardY = this.target.y - y
    const forwardZ = this.target.z - z

    // Up vector = forward × right (cross product)
    const upX = forwardY * rightZ - forwardZ * rightY
    const upY = forwardZ * rightX - forwardX * rightZ
    const upZ = forwardX * rightY - forwardY * rightX

    const up = new pc.Vec3(upX, upY, upZ).normalize()

    // Use the calculated up vector to avoid gimbal lock
    this.camera.lookAt(this.target, up)
  }

  public setTarget(target: pc.Vec3) {
    this.target.copy(target)
    this.updateCameraPosition()
  }

  public setDistance(distance: number) {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance))
    this.updateCameraPosition()
  }

  public reset() {
    this.pitch = 0
    this.yaw = 0
    this.distance = 5
    this.updateCameraPosition()
  }

  public destroy() {
    const canvas = this.app.graphicsDevice.canvas

    // Remove mouse event listeners
    canvas.removeEventListener('mousedown', this.handleMouseDown)
    canvas.removeEventListener('mousemove', this.handleMouseMove)
    canvas.removeEventListener('mouseup', this.handleMouseUp)
    canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    canvas.removeEventListener('wheel', this.handleWheel)

    // Remove touch event listeners
    canvas.removeEventListener('touchstart', this.handleTouchStart)
    canvas.removeEventListener('touchmove', this.handleTouchMove)
    canvas.removeEventListener('touchend', this.handleTouchEnd)
  }
}
