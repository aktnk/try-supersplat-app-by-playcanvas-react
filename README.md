# 3D Gaussian Splatting Viewer

A web-based 3D Gaussian Splatting (3DGS) viewer built with PlayCanvas Engine and React.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🎨 **Multiple Format Support**: Load `.ply`, `.sog`, and `.splat` files
- 🎮 **Interactive Controls**: Orbit, pan, and zoom with mouse/touch
- ⚡ **High Performance**: Powered by PlayCanvas Engine
- 📱 **Touch Support**: Full mobile and tablet compatibility
- 🎯 **TypeScript**: Fully typed with strict mode enabled

## Demo

Load a 3DGS file and interact with it:
- **Rotate**: Left-click and drag
- **Pan**: Shift + left-click and drag
- **Zoom**: Mouse wheel or pinch gesture

## Quick Start

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd try-supersplat-by-playcanvas-react

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |

## Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| PLY | `.ply` | Industry standard, uncompressed, full precision |
| SOG | `.sog` | PlayCanvas compressed format (~15-20x smaller than PLY) |
| SPLAT | `.splat` | Alternative compressed format (import only) |

## Technology Stack

- **Framework**: React 19 with TypeScript
- **3D Engine**: PlayCanvas Engine 2.13+
- **Build Tool**: Vite 7
- **Language**: TypeScript (strict mode)

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   └── GaussianSplatViewer.tsx  # Main 3DGS viewer
│   ├── utils/              # Utility classes
│   │   └── OrbitCamera.ts  # Custom camera controller
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── *.css               # Component styles
├── public/                 # Static assets
├── index.html              # HTML template
└── vite.config.ts          # Vite configuration
```

## Camera Controls

### Mouse Controls
- **Orbit**: Left-click + drag
- **Pan**: Shift + left-click + drag
- **Zoom**: Mouse wheel

### Touch Controls
- **Orbit**: One finger drag
- **Zoom**: Two finger pinch
- **Pan**: (Not implemented yet)

### Control Sensitivity

Default sensitivity values can be adjusted in `GaussianSplatViewer.tsx`:

```typescript
{
  mouseSpeed: 0.3,    // Rotation sensitivity
  wheelSpeed: 0.01,   // Zoom sensitivity
  panSpeed: 0.003,    // Pan movement sensitivity
  minDistance: 1,     // Minimum zoom distance
  maxDistance: 100    // Maximum zoom distance
}
```

## Architecture

### GaussianSplatViewer Component

Main React component that:
- Initializes PlayCanvas application
- Manages camera and lighting setup
- Handles 3DGS file loading
- Provides UI controls

### OrbitCamera Utility

Custom camera controller featuring:
- Spherical coordinate-based positioning
- Gimbal lock prevention using cross product calculations
- Configurable sensitivity and constraints
- Event-driven architecture with automatic cleanup

## Development Notes

### Memory Management
- PlayCanvas application is properly destroyed on component unmount
- Canvas ref is checked for null before initialization
- Object URLs from file input are automatically managed by the browser

### Performance Considerations
- SOG format recommended for production (15-20x smaller than PLY)
- Canvas automatically resizes to fill window
- Touch events include passive flag for better scrolling performance

## Browser Support

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [PlayCanvas](https://playcanvas.com/) - 3D WebGL game engine
- [React](https://react.dev/) - JavaScript library for building user interfaces
- [Vite](https://vite.dev/) - Next generation frontend tooling

## References

- [PlayCanvas Gaussian Splatting Documentation](https://developer.playcanvas.com/user-manual/gaussian-splatting/)
- [PlayCanvas React Integration Guide](https://developer.playcanvas.com/user-manual/playcanvas-react/)
- [3D Gaussian Splatting](https://github.com/graphdeco-inria/gaussian-splatting)

## Troubleshooting

### Common Issues

**File fails to load**
- Ensure file format is `.ply`, `.sog`, or `.splat`
- Check browser console for detailed error messages

**Camera controls not working**
- Verify JavaScript is enabled
- Try refreshing the page
- Check for browser console errors

**Performance issues**
- Try using `.sog` format instead of `.ply`
- Reduce file size or complexity
- Close other browser tabs to free up memory
