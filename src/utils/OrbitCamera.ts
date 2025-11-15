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

    this.setupEventListeners()
    this.updateCameraPosition()
  }

  private setupEventListeners() {
    const canvas = this.app.graphicsDevice.canvas

    // Mouse down
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 0) { // Left mouse button
        if (event.shiftKey) {
          this.isPanning = true
        } else {
          this.isDragging = true
        }
        this.lastMouseX = event.clientX
        this.lastMouseY = event.clientY
      }
    })

    // Mouse move
    canvas.addEventListener('mousemove', (event: MouseEvent) => {
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
    })

    // Mouse up
    canvas.addEventListener('mouseup', (event: MouseEvent) => {
      if (event.button === 0) {
        this.isDragging = false
        this.isPanning = false
      }
    })

    // Mouse leave
    canvas.addEventListener('mouseleave', () => {
      this.isDragging = false
      this.isPanning = false
    })

    // Mouse wheel
    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault()
      this.distance += event.deltaY * this.wheelSpeed
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))
      this.updateCameraPosition()
    })

    // Touch support for mobile
    let lastTouchDistance: number | null = null

    canvas.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length === 1) {
        this.isDragging = true
        this.lastMouseX = event.touches[0].clientX
        this.lastMouseY = event.touches[0].clientY
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX
        const dy = event.touches[0].clientY - event.touches[1].clientY
        lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
      }
    })

    canvas.addEventListener('touchmove', (event: TouchEvent) => {
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
      } else if (event.touches.length === 2 && lastTouchDistance !== null) {
        const dx = event.touches[0].clientX - event.touches[1].clientX
        const dy = event.touches[0].clientY - event.touches[1].clientY
        const newDistance = Math.sqrt(dx * dx + dy * dy)
        const delta = newDistance - lastTouchDistance

        this.distance -= delta * 0.01
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance))

        lastTouchDistance = newDistance
        this.updateCameraPosition()
      }
    })

    canvas.addEventListener('touchend', () => {
      this.isDragging = false
      lastTouchDistance = null
    })
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
}
