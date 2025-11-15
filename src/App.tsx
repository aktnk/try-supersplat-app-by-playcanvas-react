import { GaussianSplatViewer } from './components/GaussianSplatViewer'
import './App.css'

function App() {
  return (
    <div className="app">
      <div className="header">
        <h1>3D Gaussian Splatting Viewer</h1>
        <p>Powered by PlayCanvas</p>
      </div>
      <GaussianSplatViewer />
    </div>
  )
}

export default App
